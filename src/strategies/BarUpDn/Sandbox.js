const SandboxService = require('../../services/SandboxService');
const BarUpDnStrategy = require('./Base');
const { candleColor } = require('../../utils/candles');
const { log } = require('../../utils/logger');

class BarUpDnSandbox extends BarUpDnStrategy {
    constructor(api) {
        super(api);
        this.SandboxService = new SandboxService(api);
    }

    async start() {
        const isMarketOpen = await this.InstrumentsService.isExchangeOpen(this.exchange);

        // if (!isMarketOpen) throw new Error('market is closed'); // todo: calculate time till open and setTimeout

        await this.SandboxService.setup();

        await this.run();
    }

    async run() {
        const orders = await this.SandboxService.getSandboxOrders();

        if (orders.length >= this.maxOrders) return; // todo: setTimeout or subscribe

        // const shares = (await getAvailable(this.api, 'Shares')).filter(share => share.exchange === this.exchange && share.api_trade_available_flag);
        const shares = [
            {
                figi: 'BBG000MZL2S9',
                ticker: 'PMSBP',
                class_code: 'TQBR',
                isin: 'RU000A0ET156',
                lot: 2,
                currency: 'rub',
                klong: null,
                kshort: null,
                dlong: null,
                dshort: null,
                dlong_min: null,
                dshort_min: null,
                short_enabled_flag: false,
                name: 'Пермэнергосбыт - акции привилегированные',
                exchange: 'MOEX',
                ipo_date: '2005-06-21T00:00:00.000Z',
                issue_size: 11353500,
                country_of_risk: 'RU',
                country_of_risk_name: 'Российская Федерация',
                sector: 'utilities',
                issue_size_plan: 11353500,
                nominal: '3.25 rub',
                trading_status: 'SECURITY_TRADING_STATUS_BREAK_IN_TRADING',
                otc_flag: false,
                buy_available_flag: true,
                sell_available_flag: true,
                div_yield_flag: true,
                share_type: 'SHARE_TYPE_PREFERRED',
                min_price_increment: 0.2,
                api_trade_available_flag: true,
                uid: '',
                real_exchange: 'REAL_EXCHANGE_MOEX',
            },
        ];
        const lastCandles = (
            await Promise.all(
                shares.map(share => this.MarketDataService.getLastNCandles(share.figi, 2, this.candleInterval)),
            )
        ).filter(candles => candles.length === 2);
        const lotPrices = (await this.MarketDataService.getLastPrices(shares.map(share => share.figi))).map(
            (lastPrice, index) => lastPrice.price * shares[index].lot,
        );

        for (let i = 0; i < shares.length; i++) {
            const { figi, short_enabled_flag } = shares[i];
            const lotPrice = lotPrices[i];
            const prevCandle = lastCandles[i][0];
            const currCandle = lastCandles[i][1];

            // todo: short_enabled_flag
            let orderDirection = this.getOrderDirectionFromCandles(prevCandle, currCandle);

            const portfolio = await this.SandboxService.getSandboxPortfolio();
            const capital = this.api.decimal2money(portfolio.total_amount_currencies).units;
            const orderSize = (capital * this.orderSizePercent) / 100;
            const lots = Math.floor(orderSize / lotPrice);

            if (lots === 0) {
                console.warn(`not enough money to buy lots:\n\torderSize: ${orderSize}\n\tlotPrice: ${lotPrice}\n`);
                continue;
            }

            // ------------------
            // Выставление заявки
            // ------------------
            orderDirection = 'ORDER_DIRECTION_BUY'; // todo: remove

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

            this.bd.saveOrderAndCandle(order.order_id, currCandle.time.toISOString());
        }
    }
}

module.exports = BarUpDnSandbox;
