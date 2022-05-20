const {CandleIntervals} = require('../types');
const {addMinutes} = require('date-fns');

const getCandles = async (api, figi, from, to, interval) => {
    return (await api.MarketData.GetCandles({ figi, from, to, interval })).candles;
};

const getLastPrices = async (api, figi) => {
    return (await api.MarketData.GetLastPrices({ figi })).last_prices;
};

/**
 *
 * @param api
 * @param figi
 * @param {Number} amount
 * @param {CandleIntervals} candleInterval
 * @returns {Promise<void>}
 */
const getLastNCandles = async (api, figi, amount, candleInterval) => {
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

    console.log(`getLastNCandles:\n\tfigi: ${figi}\n\tinterval: ${candleInterval}\n\tfrom: ${from.toISOString()}\n\tto: ${to.toISOString()}`);
    return (await api.MarketData.GetCandles({ figi, from, to, interval: candleInterval })).candles.slice(-1 * amount);
};

module.exports = { getCandles, getLastPrices, getLastNCandles };
