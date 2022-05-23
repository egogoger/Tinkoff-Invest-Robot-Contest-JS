const BarUpDnStrategy = require('./Base');
const { getRandomFloatInRange } = require('../../utils/math');
const { differenceInMinutes } = require('date-fns');
const { inverseOrderDirection } = require('../../utils/order');
const { createReport } = require('../../reporter');

// Поскольку мы уже знаем закрытую свечу, то цена позиции определяется как rand(low, high)
class BarUpDnBackTest extends BarUpDnStrategy {
    fromDateKey = '2022-03-22';
    toDateKey = '2022-05-20';
    ticker = 'VTBR'; // https://www.tinkoff.ru/invest/stocks/VTBR/
    capital = 100000;
    maxOrderDuration = 60 * 12;

    equity = [];
    openOrders = [];
    closedOrders = [];

    constructor(api) {
        super(api);
        this.timeOfRun = new Date();
    }

    async start() {
        await this.loadInstrument();

        const candles = await this.loadCandles();

        return createReport('Отчёты', this.cachedCandlesFileName, 'BACKTEST__BarUpDn__2022-05-22T15:19:02.242Z');

        this.logEquity(candles[0]);

        for (let i = 1; i < candles.length - 1; i++) {
            const prevCandle = candles[i - 1];
            const currCandle = candles[i];

            this.closeOrders(currCandle);

            const orderDirection = this.getOrderDirectionFromCandles(prevCandle, currCandle);
            if (orderDirection !== 'ORDER_DIRECTION_BUY') continue;

            const lotPrice = getRandomFloatInRange(currCandle.low, currCandle.high);

            const lots = this.getAmountOfLots(lotPrice);
            if (lots === 0) {
                console.warn('not enough money to buy lots');
                continue;
            }

            const order = {
                figi: this.figi,
                quantity: lots,
                direction: orderDirection,
                price: lotPrice,
                order_type: 'ORDER_TYPE_MARKET',
                order_id: `${this.figi}_${currCandle.time}_${orderDirection}`,
                candleTime: currCandle.time,
            };

            this.executeOrder(order);

            this.logEquity(currCandle);
        }

        const lastCandle = candles[candles.length - 1];

        this.closeAllOrders(lastCandle);

        this.logEquity(lastCandle);

        this.saveResults();

        createReport('Отчёты', this.cachedCandlesFileName, this.statsFileName);
    }

    async loadInstrument() {
        const share = await this.InstrumentsService.getShare(this.ticker);
        this.figi = share.figi;
    }

    async loadCandles() {
        let candles = this.bd.getCachedCandles(this.cachedCandlesFileName);
        console.log(candles ? `${candles.length} candles in db` : 'candles not in db');

        if (!candles || candles.length === 0) {
            candles = await this.MarketDataService.getCandles(
                this.figi,
                new Date(this.fromDateKey),
                new Date(this.toDateKey),
                this.candleInterval,
            );
            console.log(`loaded ${candles.length} candles`);
            this.bd.save(candles, this.cachedCandlesFileName);
        }

        return candles;
    }

    getAmountOfLots(lotPrice) {
        const orderSize = (this.capital * this.orderSizePercent) / 100;
        return Math.floor(orderSize / lotPrice);
    }

    executeOrder(order) {
        this.openOrders.push(order);
        this.capital -= order.quantity * order.price;
    }

    closeOrders(currCandle) {
        const openOrderIDsToDelete = [];

        this.openOrders
            .filter(
                openOrder =>
                    differenceInMinutes(new Date(currCandle.time), new Date(openOrder.candleTime)) >=
                    this.maxOrderDuration,
            )
            .forEach(openOrder => {
                this.closeOrder(currCandle, openOrder);
                openOrderIDsToDelete.push(openOrder.order_id);
            });

        this.openOrders = this.openOrders.filter(order => !openOrderIDsToDelete.includes(order.order_id));
    }

    /**
     * Закрывает позицию, увеличивает баланс, пушит ордер в closedOrder
     * @param {Candle} currCandle
     * @param openOrder
     */
    closeOrder(currCandle, openOrder) {
        const lotPrice = getRandomFloatInRange(currCandle.low, currCandle.high);
        const orderPrice = lotPrice * openOrder.quantity;

        this.capital += orderPrice;

        const closeOrder = {
            figi: openOrder.figi,
            quantity: openOrder.quantity,
            direction: inverseOrderDirection(openOrder.direction),
            price: lotPrice,
            order_type: 'ORDER_TYPE_MARKET',
            order_id: openOrder.order_id,
            candleTime: currCandle.time,
        };

        this.closedOrders.push({
            id: openOrder.order_id,
            entry: openOrder,
            close: closeOrder,
        });
    }

    saveResults() {
        this.bd.save(
            {
                figi: this.figi,
                ticker: this.ticker,
                orders: this.closedOrders,
                equity: this.equity,
            },
            this.statsFileName,
        );
    }

    closeAllOrders(lastCandle) {
        this.openOrders.forEach(openOrder => this.closeOrder(lastCandle, openOrder));
        this.openOrders = [];
    }

    logEquity(candle) {
        this.equity.push({
            time: candle.time,
            value: this.capital,
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
