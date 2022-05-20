/*
Стратегия BarUpDn

Правила:
    Длинной позиция
        1. Предыдущая свеча зелёная (цена открытия < цены закрытия)
        2. Цена открытия нынешней свечи > цены закрытия предыдущей
        3. Открываем длинную позицию по рыночной цене

    Короткая позиция
        1. Предыдущая свеча красная (цена открытия > цены закрытия)
        2. Цена открытия нынешней свечи < цены закрытия предыдущей
        3. Открываем короткую позицию по рыночной цене

    Закрытие позиции
        1. Закрываем с прибылью через N свеч
        2. Стоп лосс - 30%

    Money management:
        1. Размер одной сделки - 1% от капитала
        2. Максимальный убыток одной сделки - 30%
        3. Плечо - 0
        4. Комиссия - 0.1%
        5. Проскальзывание - 10 тиков
        6. На одном инструменте одна позиция
*/

// TODO: провести исследование на лучшую N в зависимости от акции, тренда, таймфрейма

const { getAccountId } = require('../services/UsersService');
const { isExchangeOpen, getAvailable } = require("../services/InstrumentsService");
const { getOrCreateSandboxAccId, getSandboxOrders, postSandboxOrder } = require("../services/SandboxService");
const { getSandboxPortfolio } = require("../services/SandboxService");
const { getCandles, getLastPrices, getLastNCandles} = require('../services/MarketDataService');
const {addDays, addMinutes, parse} = require('date-fns');
const { candleColor } = require('../utils/candles');
const { CandleIntervals, MinutesInCandles, OrderStatuses} = require('../types');
const bd = require('../bd/bd');

class BarUpDnStrategy {
    orderSizePercent = 1;
    stopLossPercent = 30;
    commissionPercent = 1;
    slippage = 10;
    exchange = 'MOEX';
    candleInterval = CandleIntervals.Hour;

    constructor(api, mode) {
        this.api = api;
        this.mode = mode;
        this.bd = new bd();

        switch (mode) {
            case 'SANDBOX':     this.runSandbox();      break;
            case 'BACKTEST':    this.runBackTest();     break;
            case 'LIVE':        this.runLive();         break;
        }
    }

    async runSandbox() {
        const isMarketOpen = await isExchangeOpen(this.api, this.exchange);
        if (!isMarketOpen) throw new Error('market is closed'); // todo: calculate time till open and setTimeout
        const accId = await getOrCreateSandboxAccId(this.api);
        await this.runSandboxStrategy(accId);
    }

    async runSandboxStrategy(accId) {
        const orders = await getSandboxOrders(this.api, accId);

        if (orders.length >= this.maxOrders) return; // todo: setTimeout or subscribe

        // const shares = (await getAvailable(this.api, 'Shares')).filter(share => share.exchange === this.exchange && share.api_trade_available_flag);
        const shares = [{
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
            real_exchange: 'REAL_EXCHANGE_MOEX'
        }];
        const lastCandles =
            (
                await Promise.all(
                    shares.map(
                        share => getLastNCandles(this.api, share.figi, 2, this.candleInterval)
                    )
                )
            )
            .filter(candles => candles.length === 2);
        const lotPrices = (await getLastPrices(this.api, shares.map(share => share.figi)))
                .map((lastPrice, index) => lastPrice.price * shares[index].lot);

        for (let i = 0; i < shares.length; i++) {
            const { figi, short_enabled_flag } = shares[i];
            const lotPrice = lotPrices[i];
            const prevCandle = lastCandles[i][0];
            const currCandle = lastCandles[i][1];
            const prevCandleColor = candleColor(prevCandle);

            let orderDirection;
            if (prevCandleColor === 'GREEN' && prevCandle.close < currCandle.open) {
                orderDirection = 'ORDER_DIRECTION_BUY';
                console.log('buy');
            } else if (prevCandleColor === 'RED' && prevCandle.close > currCandle.open && short_enabled_flag) {
                orderDirection = 'ORDER_DIRECTION_SELL';
                console.log('sell');
                continue; // TODO: think about shorts
            } else {
                console.log('skip');
                // continue;
            }

            const portfolio = await getSandboxPortfolio(this.api, accId);
            const capital = this.api.decimal2money(portfolio.total_amount_currencies).units;
            const orderSize = capital * this.orderSizePercent / 100
            const lots = Math.floor( orderSize/ lotPrice);

            if (lots === 0) {
                console.warn(`not enough money to buy lots:\n\torderSize: ${orderSize}\n\tlotPrice: ${lotPrice}\n`)
                continue;
            }

            // ------------------
            // Выставление заявки
            // ------------------
            orderDirection = 'ORDER_DIRECTION_BUY'; // todo: remove

            if (await this.tradeExists(figi, currCandle)) {
                console.warn(`trade for ${figi} at candle ${currCandle.time} already executed`);
                continue;
            }

            const order = await postSandboxOrder(
                this.api,
                {
                    figi,
                    quantity: lots,
                    direction: orderDirection,
                    account_id: accId,
                    order_type: 'ORDER_TYPE_MARKET',
                    order_id: `${figi}_${currCandle.time}_${orderDirection}`,
                });

            this.bd.saveOrderAndCandle(order.order_id, currCandle.time.toISOString());
        }
    }

    /**
     * Проверка, что ордера на этой свече нет и не было
     * @param figi
     * @param candle
     * @returns {Promise<boolean>}
     */
    async tradeExists(figi, candle) {
        const orderToCandle = this.bd.getOrdersToCandles().find(otc => otc.figi === figi && otc.candleTime === candle.time);

        if (!orderToCandle) return false;

        const orderState = await this.api.Sandbox.GetSandboxOrderState({ account_id: accId, order_id: orderToCandle.order_id });

        switch (orderState.execution_report_status) {
            case OrderStatuses.NEW: return true;
            case OrderStatuses.FILL: return true;
            case OrderStatuses.PARTIALLYFILL: return true;
            case OrderStatuses.CANCELLED: return false
            case OrderStatuses.REJECTED: return false;
            default: return false;
        }
    }

    async closeAllPositions() {
        // todo: NOW закрыть все позиции, кроме валютных
    }

    async runBackTest() {

    }

    async runLive() {
        const accId = await getAccountId(this.api);
        const isMarketOpen = await isExchangeOpen(this.api, this.exchange);

        if (isMarketOpen) {
            console.log('start');
        }
    }

    get maxOrders() {
        return 100 / this.orderSizePercent;
    }
};

module.exports = BarUpDnStrategy;
