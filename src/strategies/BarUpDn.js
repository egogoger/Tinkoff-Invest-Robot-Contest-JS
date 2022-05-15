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
const { getOrCreateSandboxAccId, getSandboxOrders } = require("../services/SandboxService");
const { getSandboxPortfolio } = require("../services/SandboxService");
const { getCandles } = require('../services/MarketDataService');

class BarUpDnStrategy {
    orderSizePercent = 1;
    stopLossPercent = 30;
    comissionPercent = 1;
    slippage = 10;
    exchange = 'MOEX';
    timeframe = '1H';

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
        // const isMarketOpen = await isExchangeOpen(this.api, this.exchange);
        // if (!isMarketOpen) throw new Error('market is closed'); // todo: calculate time till open and setTimeout
        const accId = await getOrCreateSandboxAccId(this.api);
        // const portfolio = await getSandboxPortfolio(this.api, accId);
        await this.runSandboxStrategy(accId);
    }

    async runSandboxStrategy(accId) {
        const orders = await getSandboxOrders(this.api, accId);

        if (orders.length >= this.maxOrders) return; // todo: setTimeout or subscribe

        console.log(Object.keys(this.api));
        return;
        // get etfs
        // check each one for compatibility with strategy
        // place order
        const etfs = (await getAvailableETFs(this.api)).filter(etf => etf.exchange === this.exchange && etf.api_trade_available_flag);
        for await (const etf of etfs) {
            // TODO: check if opened order in last candle
            const lastCandle = await getCandles(this.api, etf.figi, from);
            if (true) {}
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
