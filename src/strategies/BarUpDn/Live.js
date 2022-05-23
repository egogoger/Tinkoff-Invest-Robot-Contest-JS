const OrdersService = require('../../services/OrdersService');
const BarUpDnStrategy = require('./Base');
const { log } = require('../../utils/logger');

class BarUpDnLive extends BarUpDnStrategy {
    trades = {};
    tradeDuration = 10 * 1000;
    pollStatusDelay = 2 * 1000;

    figi = 'BBG00V9V16J8';
    ticker = 'VTBG';

    constructor(api) {
        super(api);

        this.timeOfRun = new Date().toISOString();

        this.trade = this.trade.bind(this);
        this.closeTrade = this.closeTrade.bind(this);
        this.checkIfOrderIsFilled = this.checkIfOrderIsFilled.bind(this);
        this.logSuccessfulTrade = this.logSuccessfulTrade.bind(this);
    }

    async start() {
        const isMarketOpen = await this.InstrumentsService.isExchangeOpen(this.exchange);

        if (!isMarketOpen) throw new Error('market is closed'); // todo: calculate time till open and setTimeout

        await this.setup();

        await this.run();
    }

    async setup() {
        this.accountId = await this.UsersService.getAccountId(process.env.LIVE_ACCOUNT_NAME);

        this.OrdersService = new OrdersService(this.api, this.accountId);
    }

    async run() {
        this.trades = this.bd.get(this.bd.PATHS.LIVE, this.statsFileName) || {};

        this.stillOpenTrades.map((trade, i) => {
            setTimeout(() => this.closeTrade(trade.id), 3000 * (i + 1));
        });

        for (let i = 0; i < 50; i++) {
            setTimeout(this.trade, 5000 * (i + 1));
        }
    }

    saveStats() {
        this.bd.save(this.trades, this.bd.PATHS.LIVE, this.statsFileName);
    }

    async trade() {
        console.log('trade', new Date().toISOString());
        const tradeId = `${this.ticker}__${new Date().toISOString()}`;

        const order = await this.OrdersService.postOrder({
            figi: this.figi,
            quantity: 1,
            direction: 'ORDER_DIRECTION_BUY',
            order_type: 'ORDER_TYPE_MARKET',
            order_id: `${tradeId}_B`,
        });

        if (!order) return;

        setTimeout(() => this.checkIfOrderIsFilled(tradeId, order.order_id), this.pollStatusDelay);
    }

    /**
     * Проверяет, исполнилась ли заявка
     * Если исполнилась, то
     * @param tradeId
     * @param orderId
     * @return {Promise<void>}
     */
    async checkIfOrderIsFilled(tradeId, orderId) {
        console.log('checkIfOrderIsFilled', new Date().toISOString());
        const orderState = await this.OrdersService.getOrderState(orderId);
        const status = orderState.execution_report_status;

        if (status === 'EXECUTION_REPORT_STATUS_FILL') {
            if (orderState.direction === 'ORDER_DIRECTION_BUY') {
                await log(this.logSuccessfulTrade, 'logSuccessfulTrade', tradeId, orderState, 'entry');
                setTimeout(() => this.closeTrade(tradeId), this.tradeDuration);
            } else {
                await log(this.logSuccessfulTrade, 'logSuccessfulTrade', tradeId, orderState, 'exit');
            }
        } else if (status === 'EXECUTION_REPORT_STATUS_NEW' || status === 'EXECUTION_REPORT_STATUS_PARTIALLYFILL') {
            console.log('checking again');
            setTimeout(() => this.checkIfOrderIsFilled(tradeId, orderId), this.pollStatusDelay);
        }
    }

    /**
     * Сохраняет успешный вход в позицию
     * @param {string} tradeId
     * @param {OrderState} orderState
     * @param {'entry' | 'exit'} type
     * @return {void}
     */
    logSuccessfulTrade(tradeId, orderState, type) {
        if (type === 'entry') {
            this.trades[tradeId] = { id: tradeId };
        }

        this.trades[tradeId][type] = {
            figi: this.figi,
            quantity: orderState.quantity,
            direction: orderState.direction,
            price: orderState.average_position_price,
            order_type: orderState.order_type,
            order_id: orderState.order_id,
            commission: orderState.executed_commission,
            order_date: orderState.order_date,
        };

        this.saveStats();
    }

    async closeTrade(tradeId) {
        console.log('closeTrade', new Date().toISOString());
        const order = await this.OrdersService.postOrder({
            figi: this.figi,
            quantity: 1,
            direction: 'ORDER_DIRECTION_SELL',
            order_type: 'ORDER_TYPE_MARKET',
            order_id: `${tradeId}__SELL`,
        });

        setTimeout(() => this.checkIfOrderIsFilled(tradeId, order.order_id), this.pollStatusDelay);
    }

    get statsFileName() {
        return `${this.ticker}__${this.figi}__TRADES__BarUpDn__${this.timeOfRun}`;
    }

    get stillOpenTrades() {
        return Object.values(this.trades).filter(trade => !trade.exit);
    }
}

module.exports = BarUpDnLive;
