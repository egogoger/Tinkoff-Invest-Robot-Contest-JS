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

const BarUpDnSandbox = require('./Sandbox');
const BarUpDnBackTest = require('./Backtest');
const BarUpDnLive = require('./Live');

async function run(api, mode) {
    switch (mode) {
        case 'SANDBOX': {
            return new BarUpDnSandbox(api).start();
        }
        case 'BACKTEST': {
            return new BarUpDnBackTest(api).start();
        }
        case 'LIVE': {
            return new BarUpDnLive(api).start();
        }
    }
}

module.exports = run;
