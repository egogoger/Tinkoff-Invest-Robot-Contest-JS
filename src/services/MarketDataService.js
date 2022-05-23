const { CandleIntervals, MaximumMinutesForCandlesRequest } = require('../types');
const { addMinutes, differenceInMinutes, min: earliestDate } = require('date-fns');
const { log } = require('../utils/logger');

class MarketDataService {
    constructor(api) {
        this.api = api;
    }

    /**
     * Возвращает свечи за указанный период
     * @param {string} figi
     * @param {Date} from
     * @param {Date} to
     * @param {string} candleInterval
     * @returns {Promise<Candle[]>}
     */
    async getCandles(figi, from, to, candleInterval) {
        const intervals = this.breakIntoIntervals(from, to, MaximumMinutesForCandlesRequest[candleInterval]);
        return Promise.all(
            intervals.map(interval =>
                log(this.api.MarketData.GetCandles, 'api.MarketData.GetCandles', {
                    figi,
                    from: interval.from,
                    to: interval.to,
                    interval: candleInterval,
                }),
            ),
        ).then(results => results.map(res => res.candles).flat());
    }

    /**
     * Возращает объект с последними ценами
     * @param figi
     * @returns {Promise<*>}
     */
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
        const resultedTimePrior =
            totalTime < MaximumMinutesForCandlesRequest[candleInterval] ? totalTime : maxMinutesMap[candleInterval];

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

    /**
     * Разбивает длинный период времени на более мелкие,
     * каждый из которых не больше максимальной длительности интервала
     * @param {Date} from - левая граница интервала
     * @param {Date} to - правая граница интервала
     * @param {Number} maxMinutes - максимальная длительность интервала в минутах
     * @returns {[{from: Date, to: Date}]}
     */
    breakIntoIntervals(from, to, maxMinutes) {
        const interval = differenceInMinutes(to, from);

        if (interval < maxMinutes) return [{ from, to }];

        const totalIntervalsAmount = Math.ceil(interval / maxMinutes);
        const intervals = [];
        for (let i = 0; i < totalIntervalsAmount; i++) {
            const newFrom = addMinutes(from, i * maxMinutes);
            intervals.push({
                from: newFrom,
                to: earliestDate([addMinutes(newFrom, maxMinutes), to]),
            });
        }
        return intervals;
    }
}

module.exports = MarketDataService;
