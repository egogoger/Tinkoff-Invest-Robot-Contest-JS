const { CandleIntervals } = require('../types');
const { addMinutes } = require('date-fns');
const { log } = require('../utils/logger');

class MarketDataService {
    constructor(api) {
        this.api = api;
    }

    async getCandles(figi, from, to, interval) {
        return (await log(this.api.MarketData.GetCandles, 'api.MarketData.GetCandles', { figi, from, to, interval }))
            .candles;
    }

    async getLastPrices(figi) {
        return (await log(this.api.MarketData.GetLastPrices, 'api.MarketData.GetLastPrices', { figi })).last_prices;
    }

    /**
     * Возвращает последние N свеч
     * @param figi
     * @param {Number} amount
     * @param {CandleIntervals} candleInterval
     * @returns {Promise<void>}
     */
    async getLastNCandles(figi, amount, candleInterval) {
        if (candleInterval === CandleIntervals.Unspecified) throw new Error('candle interval is unspecified');

        const multiplierMap = {
            [CandleIntervals.Min1]: 1,
            [CandleIntervals.Min5]: 5,
            [CandleIntervals.Min15]: 15,
            [CandleIntervals.Hour]: 60,
            [CandleIntervals.Day]: 24 * 60,
        };

        /** @see https://tinkoff.github.io/investAPI/load_history */
        const maxMinutesMap = {
            [CandleIntervals.Min1]: 24 * 60,
            [CandleIntervals.Min5]: 24 * 60,
            [CandleIntervals.Min15]: 24 * 60,
            [CandleIntervals.Hour]: 7 * 24 * 60,
            [CandleIntervals.Day]: 365 * 24 * 60,
        };

        // запрошенное время
        const totalMinutesToRequest = amount * multiplierMap[candleInterval];
        // минимальное время работы биржи
        const minWorkingHours = 8;
        // минимальное количество сессий в запрошенном времени
        const minSessionsInRequest = Math.floor(totalMinutesToRequest / 60 / minWorkingHours) + 1;
        // сколько добавить из-за закрытого рынка
        const addedTimeDueToClosedMarket = minSessionsInRequest * 24 * 60;
        // суммарное запрашиваемое время
        const totalTime = totalMinutesToRequest + addedTimeDueToClosedMarket;
        // проверка на максимум
        const resultedTimePrior = totalTime < maxMinutesMap[candleInterval] ? totalTime : maxMinutesMap[candleInterval];

        const to = new Date();
        const from = addMinutes(to, -1 * resultedTimePrior);

        return (
            await log(this.api.MarketData.GetCandles, 'api.MarketData.GetCandles', {
                figi,
                from,
                to,
                interval: candleInterval,
            })
        ).candles.slice(-1 * amount);
    }
}

module.exports = MarketDataService;
