const getCandles = async (api, figi, from, to, interval) => {
    return (await api.MarketData.GetCandles({ figi, from, to, interval })).candles;
};

const getLastPrices = async (api, figi) => {
    return (await api.MarketData.GetLastPrices({ figi })).last_prices;
};

module.exports = { getCandles, getLastPrices };
