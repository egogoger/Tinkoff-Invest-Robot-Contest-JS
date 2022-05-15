const endOfDay = require('date-fns/endOfDay')

const isExchangeOpen = async (api, exchangeName) => {
    const exchanges = (await api.Instruments.TradingSchedules({ to: endOfDay(new Date()), from: new Date() })).exchanges;
    const exchange = exchanges.find(exs => exs.exchange === exchangeName);
    if (!exchange) throw new Error('exchange not found');
    return Boolean(exchange.days[0].is_trading_day);
};

const getAvailableETFs = async (api) => {
    return (await api.Instruments.Etfs({ instrument_status: 'INSTRUMENT_STATUS_BASE' })).instruments;
};

module.exports = { isExchangeOpen, getAvailableETFs };
