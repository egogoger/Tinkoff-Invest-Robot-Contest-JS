const { CandleIntervals, OrderStatuses } = require('../../types');
const bd = require('../../bd');
const StrategyBase = require('../StrategyBase');
const { log } = require('../../utils/logger');
const { getCandleColor } = require('../../utils/candles');

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

    /**
     * Возвращает направление ордера
     * @param {Candle} prevCandle
     * @param {Candle} currCandle
     * @returns {'ORDER_DIRECTION_BUY' | 'ORDER_DIRECTION_SELL' | undefined}
     */
    getOrderDirectionFromCandles(prevCandle, currCandle) {
        const prevCandleColor = getCandleColor(prevCandle);

        if (prevCandleColor === 'GREEN' && prevCandle.close < currCandle.open) {
            return 'ORDER_DIRECTION_BUY';
        }

        if (prevCandleColor === 'RED' && prevCandle.close > currCandle.open) {
            return 'ORDER_DIRECTION_SELL';
        }

        return undefined;
    }

    get maxOrders() {
        return 100 / this.orderSizePercent;
    }
}

module.exports = BarUpDnStrategy;
