const getCandles = async (api, figi, from, to, interval) => {
    return console.log(Object.keys(api));
    // return (await api.MarketData.GetCandles({ figi, from, to, interval })).candles;
};

module.exports = { getCandles };
