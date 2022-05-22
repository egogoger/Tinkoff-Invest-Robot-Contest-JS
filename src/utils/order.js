const inverseOrderDirection = orderDirection =>
    orderDirection === 'ORDER_DIRECTION_BUY' ? 'ORDER_DIRECTION_SELL' : 'ORDER_DIRECTION_BUY';

module.exports = { inverseOrderDirection };
