const candleColor = (candle) => {
    if (candle.open > candle.close) return 'GREEN';
    if (candle.open < candle.close) return 'RED';
    return null;
};

module.exports = { candleColor };
