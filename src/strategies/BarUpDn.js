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
*/

// TODO: провести исследование на лучшую N в зависимости от акции, тренда, таймфрейма

const { getAccountId } = require('../services/UsersService');
const { isExchangeOpen, getAvailableETFs } = require("../services/InstrumentsService");
const { getOrCreateSandboxAccId, getSandboxOrders, postSandboxOrder } = require("../services/SandboxService");
const { getSandboxPortfolio } = require("../services/SandboxService");
const { getCandles, getLastPrices } = require('../services/MarketDataService');
const addDays = require('date-fns/addDays');
const { candleColor } = require('../utils/candles');

class BarUpDnStrategy {
    orderSizePercent = 1;
    stopLossPercent = 30;
    comissionPercent = 1;
    slippage = 10;
    exchange = 'MOEX';
    candleInterval = 'CANDLE_INTERVAL_15_MIN';

    constructor(api, mode) {
        this.api = api;
        this.mode = mode;

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

        const etfs = (await getAvailableETFs(this.api)).filter(etf => etf.exchange === this.exchange && etf.api_trade_available_flag);
        const lastCandles = (await Promise.all(etfs.map(etf => getCandles(this.api, etf.figi, addDays(new Date(), -1), new Date(), this.candleInterval))))
            .map(candles => candles.slice(-2))
            .filter(candles => candles.length === 2);
        for (const [figi, [prevCandle, currCandle]] of [etfs.map(etf => etf.figi), lastCandles]) {
            const prevCandleColor = candleColor(prevCandle);

            let orderDirection;
            if (prevCandleColor === 'GREEN' && prevCandle.close < currCandle.open) {
                orderDirection = 'ORDER_DIRECTION_BUY';
            } else if (prevCandleColor === 'RED' && prevCandle.close > currCandle.open) {
                orderDirection = 'ORDER_DIRECTION_SELL';
            } else {
                continue;
            }

            // todo: check if order is already open on that candle
            const orderId = `${currCandle.time}_${orderDirection}`; // Максимум одна позиция на одной свече
            const lots = 1; // TODO NOW: calculate lots amount
            console.log(await getLastPrices(this.api, [figi]));
            return;
            console.log(this.api.decimal2money((await getSandboxPortfolio(this.api, accId)).total_amount_currencies).units);
            await postSandboxOrder(
                this.api,
                {
                    figi,
                    quantity: lots,
                    /* price, */
                    direction: orderDirection,
                    account_id: accId,
                    order_type: 'ORDER_TYPE_MARKET',
                    order_id: orderId,
                });
        }
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
