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
}

module.exports = StrategyBase;
