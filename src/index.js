const { parseArgs } = require("./utils/argsParser");
const { APP_NAME } = require('./constants');
const tinkoff_v2 = require('../libs/unofficial-tinkoff-invest-api_v2-lazy-sdk-NODEJS/tinkoff_v2');
const { getAccountId } = require("./services/UsersService");
const { nextWeek } = require("./utils/time");
const { isExchangeOpen } = require("./services/InstrumentsService");

async function main() {
    const { token, isSandbox } = parseArgs();
    const api = new tinkoff_v2({ token, appName: APP_NAME });
    const accId = await getAccountId(api);
    const isMarketOpen = await isExchangeOpen(api, 'MOEX');
    console.log(isMarketOpen);
};

main();
