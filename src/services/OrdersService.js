const { log } = require('../utils/logger');

class OrdersService {
    constructor(api, accountId) {
        this.api = api;
        this.accountId = accountId;
    }

    async postOrder({ figi, quantity, price, direction, order_type, order_id }) {
        return await log(this.api.Orders.PostOrder, 'api.Orders.PostOrder', {
            figi,
            quantity,
            price,
            direction,
            account_id: this.accountId,
            order_type,
            order_id,
        });
    }

    /**
     * @param {string} orderId
     * @return {Promise<OrderState>}
     */
    async getOrderState(orderId) {
        return await log(this.api.Orders.GetOrderState, 'api.OrdersService.GetOrderState', {
            account_id: this.accountId,
            order_id: orderId,
        });
    }
}

module.exports = OrdersService;
