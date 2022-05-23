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
     * @param {'Shares' | 'Etfs' | 'Bonds' | 'Currencies' | 'Futures'} name
     * @returns {Promise<[]>}
     */
    async getAvailable(name) {
        return log(this.api.Instruments[name], `api.Instruments.${name}`, {
            instrument_status: 'INSTRUMENT_STATUS_BASE',
        }).then(res => res.instruments);
    }

    /**
     * Возвращает идентификатор figi для заданного тикера
     * @param {string} ticker
     * @return {Promise<Share | Etf | Currency | Bond | Future | undefined>}
     */
    async getInstrument(ticker) {
        for (const method of ['Shares', 'Etfs', 'Currencies', 'Bonds', 'Futures']) {
            let instrument;
            try {
                const instruments = await this.getAvailable(method);
                instrument = instruments.find(instr => instr.ticker === ticker);
            } catch (e) {
                console.log(e);
            }

            if (instrument) return instrument;
        }
    }
}

module.exports = InstrumentsService;
