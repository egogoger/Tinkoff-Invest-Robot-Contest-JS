const BarUpDnStrategy = require('./Base');
const { getRandomFloatInRange } = require('../../utils/math');
const { differenceInMinutes } = require('date-fns');
const { inverseOrderDirection } = require('../../utils/order');

// Поскольку мы уже знаем закрытую свечу, то цена позиции определяется как rand(low, high)
class BarUpDnBackTest extends BarUpDnStrategy {
    fromDateKey = '2022-03-22';
    toDateKey = '2022-05-20';
    ticker = 'VTBR'; // https://www.tinkoff.ru/invest/stocks/VTBR/
    capital = 100000;
    openOrders = [];
    closedOrders = [];
    maxOrderDuration = 60 * 12;

    constructor(api) {
        super(api);
    }

    async start() {
        const { figi } = await this.InstrumentsService.getShare(this.ticker);
        const candlesFileName = this.bd.getFileNameForCachedCandles({
            figi: figi,
            ticker: this.ticker,
            from: this.fromDateKey,
            to: this.toDateKey,
            candleInterval: this.candleInterval,
        });
        const candles = await this.loadCandles(candlesFileName, figi);

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
                figi,
                quantity: lots,
                direction: orderDirection,
                price: lotPrice,
                order_type: 'ORDER_TYPE_MARKET',
                order_id: `${figi}_${currCandle.time}_${orderDirection}`,
                candleTime: currCandle.time,
            };

            this.executeOrder(order);
        }

        this.closeAllOrders(candles.slice(-1)[0]);

        this.saveResults(candlesFileName);
    }

    async loadCandles(candlesFileName, figi) {
        let candles = this.bd.getCachedCandles(candlesFileName);
        console.log(candles ? `${candles.length} candles in db` : 'candles not in db');

        if (!candles || candles.length === 0) {
            candles = await this.MarketDataService.getCandles(
                figi,
                new Date(this.fromDateKey),
                new Date(this.toDateKey),
                this.candleInterval,
            );
            console.log(`loaded ${candles.length} candles`);
            this.bd.save(candles, candlesFileName);
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

    saveResults(cachedCandlesFileName) {
        this.bd.save(this.closedOrders, `BACKTEST__${cachedCandlesFileName}__${new Date().toISOString()}`);
    }

    closeAllOrders(lastCandle) {
        this.openOrders.forEach(openOrder => this.closeOrder(lastCandle, openOrder));
        this.openOrders = [];
    }
}

module.exports = BarUpDnBackTest;
