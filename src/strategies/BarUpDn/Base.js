const { CandleIntervals, OrderStatuses } = require('../../types');
const bd = require('../../bd/bd');
const StrategyBase = require('../StrategyBase');
const { log } = require('../../utils/logger');

class BarUpDnStrategy extends StrategyBase {
    orderSizePercent = 1;
    stopLossPercent = 30;
    commissionPercent = 1;
    slippage = 10;
    exchange = 'MOEX';
    candleInterval = CandleIntervals.Hour;

    constructor(api) {
        super(api);
        this.bd = new bd();
    }

    /**
     * Проверка, что ордера на этой свече нет и не было
     * @param figi
     * @param candle
     * @param {Promise} orderStateApiCall
     * @returns {Promise<boolean>}
     */
    async tradeExists(figi, candle, orderStateApiCall, apiCallName, accId) {
        const orderToCandle = this.bd
            .getOrdersToCandles()
            .find(otc => otc.figi === figi && otc.candleTime === candle.time);

        if (!orderToCandle) return false;

        const orderState = await log(orderStateApiCall, apiCallName, {
            account_id: accId,
            order_id: orderToCandle.order_id,
        });

        switch (orderState.execution_report_status) {
            case OrderStatuses.NEW:
            case OrderStatuses.FILL:
            case OrderStatuses.PARTIALLYFILL:
                return true;
            case OrderStatuses.CANCELLED:
            case OrderStatuses.REJECTED:
            default:
                return false;
        }
    }

    async runBackTest() {}

    async runLive() {
        const accId = await this.UsersService.getAccountId();
        const isMarketOpen = await this.InstrumentsService.isExchangeOpen(this.exchange);

        if (isMarketOpen) {
            console.log('start');
        }
    }

    get maxOrders() {
        return 100 / this.orderSizePercent;
    }
}

module.exports = BarUpDnStrategy;
