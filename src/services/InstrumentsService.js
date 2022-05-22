const { endOfDay } = require('date-fns');
const { log } = require('../utils/logger');

class InstrumentsService {
    constructor(api) {
        this.api = api;
    }

    async isExchangeOpen(exchangeName) {
        const exchange = (
            await log(this.api.Instruments.TradingSchedules, 'api.Instruments.TradingSchedules', {
                to: endOfDay(new Date()),
                from: new Date(),
            })
        ).exchanges.find(exs => exs.exchange === exchangeName);

        if (!exchange) throw new Error('exchange not found');

        return Boolean(exchange.days[0].is_trading_day);
    }

    /**
     * Возвращает доступные инструменты для торговли
     * @param {'Etfs' | 'Shares' | 'Bonds'} name
     * @returns {Promise<*>}
     */
    async getAvailable(name) {
        return (
            await log(this.api.Instruments[name], `api.Instruments.${name}`, {
                instrument_status: 'INSTRUMENT_STATUS_BASE',
            })
        ).instruments;
    }

    async getShare(ticker) {
        return (await this.getAvailable('Shares')).find(share => share.ticker === ticker);
    }
}

module.exports = InstrumentsService;
