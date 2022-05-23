const BarUpDnStrategy = require('./Base');
const { getRandomFloatInRange } = require('../../utils/math');
const { differenceInMinutes } = require('date-fns');
const { inverseOrderDirection } = require('../../utils/order');
const { createReport } = require('../../reporter');

class BarUpDnBackTest extends BarUpDnStrategy {
    fromDateKey = '2021-11-22';
    toDateKey = '2022-01-20';
    ticker = 'VTBR';
    capital = 100000;
    maxOrderDuration = 60 * 12;

    series = [];
    openTrades = [];
    closedTrades = [];

    async start() {
        this.timeOfRun = new Date();

        await this.loadInstrument();

        const candles = await this.loadCandles();

        this.logCandle(candles[0]);

        for (let i = 1; i < candles.length - 1; i++) {
            const prevCandle = candles[i - 1];
            const currCandle = candles[i];

            this.closeTrades(currCandle);

            const orderDirection = this.getOrderDirectionFromCandles(prevCandle, currCandle);
            if (orderDirection !== 'ORDER_DIRECTION_BUY') continue;

            const lotPrice = getRandomFloatInRange(currCandle.low, currCandle.high);

            const lots = this.getAmountOfLots(lotPrice);
            if (lots === 0) {
                console.warn('not enough money to buy lots');
                continue;
            }

            const orderSize = lots * lotPrice;

            const order = {
                figi: this.figi,
                quantity: lots,
                direction: orderDirection,
                commission: orderSize * this.commissionPercent,
                price: lotPrice,
                order_type: 'ORDER_TYPE_MARKET',
                order_id: `${this.figi}_${currCandle.time}_${orderDirection}`,
                candleTime: currCandle.time,
            };

            this.executeOrder(order);

            this.logCandle(currCandle);
        }

        const lastCandle = candles[candles.length - 1];

        this.closeAllTrades(lastCandle);

        this.logCandle(lastCandle);

        this.saveResults();

        createReport(
            'Отчёты',
            `${this.bd.PATHS.CANDLES}/${this.cachedCandlesFileName}`,
            `${this.bd.PATHS.BACKTEST}/${this.statsFileName}`,
        );
    }

    async loadInstrument() {
        console.log('BackTest.loadInstrument');
        const instrument = await this.InstrumentsService.getInstrument(this.ticker);
        this.figi = instrument.figi;
    }

    async loadCandles() {
        console.log('BackTest.loadCandles');
        let candles = this.bd.get(this.bd.PATHS.CANDLES, this.cachedCandlesFileName);

        if (candles && candles.length > 0) {
            console.log('Getting candles from local storage');
        } else {
            candles = await this.MarketDataService.getCandles(
                this.figi,
                new Date(this.fromDateKey),
                new Date(this.toDateKey),
                this.candleInterval,
            );
            console.log(`Getting ${candles.length} candles from API`);
            this.bd.save(candles, this.bd.PATHS.CANDLES, this.cachedCandlesFileName);
        }

        return candles;
    }

    getAmountOfLots(lotPrice) {
        const orderSize = (this.capital * this.orderSizePercent) / 100;
        return Math.floor(orderSize / lotPrice);
    }

    executeOrder(order) {
        console.log('BackTest.executeOrder', order.order_id);
        this.openTrades.push(order);
        this.capital -= order.quantity * order.price - order.commission;
    }

    closeTrades(currCandle) {
        const openOrderIDsToDelete = [];

        this.openTrades
            .filter(
                openOrder =>
                    differenceInMinutes(new Date(currCandle.time), new Date(openOrder.candleTime)) >=
                    this.maxOrderDuration,
            )
            .forEach(openOrder => {
                this.closeTrade(currCandle, openOrder);
                openOrderIDsToDelete.push(openOrder.order_id);
            });

        this.openTrades = this.openTrades.filter(order => !openOrderIDsToDelete.includes(order.order_id));
    }

    /**
     * Закрывает позицию, увеличивает баланс, пушит ордер в closedOrder
     * @param {Candle} currCandle
     * @param openOrder
     */
    closeTrade(currCandle, openOrder) {
        const lotPrice = getRandomFloatInRange(currCandle.low, currCandle.high);
        const orderPrice = lotPrice * openOrder.quantity;

        this.capital += orderPrice;

        const exitOrder = {
            figi: openOrder.figi,
            quantity: openOrder.quantity,
            direction: inverseOrderDirection(openOrder.direction),
            price: lotPrice,
            order_type: 'ORDER_TYPE_MARKET',
            order_id: openOrder.order_id,
            candleTime: currCandle.time,
        };

        this.closedTrades.push({
            id: openOrder.order_id,
            entry: openOrder,
            exit: exitOrder,
        });
    }

    saveResults() {
        console.log('BackTest.saveResults');
        this.bd.save(
            {
                figi: this.figi,
                ticker: this.ticker,
                trades: this.closedTrades,
                series: this.series,
            },
            this.bd.PATHS.BACKTEST,
            this.statsFileName,
        );
    }

    closeAllTrades(lastCandle) {
        this.openTrades.forEach(openTrade => this.closeTrade(lastCandle, openTrade));
        this.openTrades = [];
    }

    logCandle(candle) {
        this.series.push({
            time: candle.time,
            equity: this.capital,
        });
    }

    get statsFileName() {
        return `BACKTEST__BarUpDn__${this.timeOfRun.toISOString()}`;
    }

    get cachedCandlesFileName() {
        return `${this.figi}__${this.ticker}__${this.fromDateKey}__${this.toDateKey}__${this.candleInterval}`;
    }
}

module.exports = BarUpDnBackTest;
