const { BarUpDnStrategy } = require('./Base');

class BarUpDnBackTest extends BarUpDnStrategy {
    from = '2022-03-22';
    to = '2022-05-20';
    ticker = 'VTBR'; // https://www.tinkoff.ru/invest/stocks/VTBR/

    constructor(api) {
        super(api);
    }

    async start() {
        // Настройка:
        // настроить таймфрейм
        // выбрать инструмент
        //
        // Цикл работы:
        // загружаем все свечи в этом таймфрейме
        // пишем алгоритм, принимающий одну свечу
        // скармливаем ему по одной свече
        // смотрим метрики
        //
        // Внутри функции:
        // Делаем стандартную проверку
        // Считаем, что все ордера исполняются сразу
        // Сохраняем их локально
        //
        // Дополнительно:
        // Сохраняем локально загруженные исторические свечи
    }

    async loadCandles() {
        const share = await this.InstrumentsService.getShare(this.ticker);
        return console.log(share);
        const candles = await this.MarketDataService.getCandles();
    }
}

module.exports = BarUpDnBackTest;
