const SandboxService = require('../../services/SandboxService');
const BarUpDnStrategy = require('./Base');

class BarUpDnSandbox extends BarUpDnStrategy {
    constructor(api) {
        super(api);
        this.SandboxService = new SandboxService(api);
    }

    async start() {
        const isMarketOpen = await this.InstrumentsService.isExchangeOpen(this.exchange);

        if (!isMarketOpen) throw new Error('market is closed');

        await this.SandboxService.setup();

        await this.run();
    }

    async run() {
        const orders = await this.SandboxService.getSandboxOrders();

        if (orders.length >= this.maxOrders) return; // todo: setTimeout or subscribe

        const shares = (await this.InstrumentsService.getAvailable('Shares')).filter(share => share.exchange === this.exchange && share.api_trade_available_flag);
        const lastCandles = (
            await Promise.all(
                shares.map(share => this.MarketDataService.getLastNCandles(share.figi, 2, this.candleInterval)),
            )
        ).filter(candles => candles.length === 2);
        const lotPrices = (await this.MarketDataService.getLastPrices(shares.map(share => share.figi))).map(
            (lastPrice, index) => lastPrice.price * shares[index].lot,
        );

        for (let i = 0; i < shares.length; i++) {
            const { figi } = shares[i];
            const lotPrice = lotPrices[i];
            const prevCandle = lastCandles[i][0];
            const currCandle = lastCandles[i][1];

            let orderDirection = this.getOrderDirectionFromCandles(prevCandle, currCandle);
            if (orderDirection !== 'ORDER_DIRECTION_BUY') continue;

            const portfolio = await this.SandboxService.getSandboxPortfolio();
            const capital = this.api.decimal2money(portfolio.total_amount_currencies).units;
            const orderSize = (capital * this.orderSizePercent) / 100;
            const lots = Math.floor(orderSize / lotPrice);

            if (lots === 0) {
                console.warn(`not enough money to buy lots:\n\torderSize: ${orderSize}\n\tlotPrice: ${lotPrice}\n`);
                continue;
            }

            if (
                await this.tradeExists(
                    figi,
                    currCandle,
                    this.api.Sandbox.GetSandboxOrderState,
                    'api.Sandbox.GetSandboxOrderState',
                    this.SandboxService.accountId,
                )
            ) {
                console.warn(`trade for ${figi} at candle ${currCandle.time} already executed`);
                continue;
            }

            const order = await this.SandboxService.postSandboxOrder({
                figi,
                quantity: lots,
                direction: orderDirection,
                order_type: 'ORDER_TYPE_MARKET',
                order_id: `${figi}_${currCandle.time}_${orderDirection}`,
            });

            this.bd.save({
                order_id: order.order_id,
                candleTime: currCandle.time.toISOString()
            }, this.bd.PATHS.CANDLES, 'orders_to_candles');
        }
    }
}

module.exports = BarUpDnSandbox;
