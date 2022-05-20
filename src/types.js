const CandleIntervals = {
    Unspecified: 'CANDLE_INTERVAL_UNSPECIFIED',
    Min1: 'CANDLE_INTERVAL_1_MIN',
    Min5: 'CANDLE_INTERVAL_5_MIN',
    Min15: 'CANDLE_INTERVAL_15_MIN',
    Hour: 'CANDLE_INTERVAL_HOUR',
    Day: 'CANDLE_INTERVAL_DAY',
};

const MinutesInCandles = {
    [CandleIntervals.Min1]: 1,
    [CandleIntervals.Min5]: 5,
    [CandleIntervals.Min15]: 15,
    [CandleIntervals.Hour]: 60,
    [CandleIntervals.Day]: 24 * 60,
};

const OrderStatuses = {
    UNSPECIFIED: 'EXECUTION_REPORT_STATUS_UNSPECIFIED',
    FILL: 'EXECUTION_REPORT_STATUS_FILL',
    REJECTED: 'EXECUTION_REPORT_STATUS_REJECTED',
    CANCELLED: 'EXECUTION_REPORT_STATUS_CANCELLED',
    NEW: 'EXECUTION_REPORT_STATUS_NEW',
    PARTIALLYFILL: 'EXECUTION_REPORT_STATUS_PARTIALLYFILL',
};

module.exports = { CandleIntervals, MinutesInCandles, OrderStatuses };
