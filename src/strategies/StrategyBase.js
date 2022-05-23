const InstrumentsService = require('../services/InstrumentsService');
const MarketDataService = require('../services/MarketDataService');
const UsersService = require('../services/UsersService');

class StrategyBase {
    constructor(api) {
        this.api = api;

        this.InstrumentsService = new InstrumentsService(api);
        this.MarketDataService = new MarketDataService(api);
        this.UsersService = new UsersService(api);
    }

    /**
     * Возвращает список инструментов доступных для торговли,
     * отсортированный по минимальной цене покупки
     * @param {'Etfs' | 'Shares' | 'Bonds'} type
     * @returns {Promise<{
     *     figi: string,
     *     ticker: string,
     *     minLots: number,
     *     price: number,
     *     totalPrice: number,
     * }[]>}
     */
    async getLotPricesSorted(type) {
        const etfs = (await this.InstrumentsService.getAvailable(type)).filter(
            etf => etf.api_trade_available_flag && etf.buy_available_flag && etf.sell_available_flag,
        );
        return (await this.MarketDataService.getLastPrices(etfs.map(etf => etf.figi)))
            .map((lastPrice, index) => ({
                figi: etfs[index].figi,
                ticker: etfs[index].ticker,
                minLots: etfs[index].lot,
                price: lastPrice.price,
                totalPrice: lastPrice.price * etfs[index].lot,
            }))
            .sort(({ totalPrice: lotPrice1 }, { totalPrice: lotPrice2 }) => lotPrice1 - lotPrice2);
    }
}

module.exports = StrategyBase;
