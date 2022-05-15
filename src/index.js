const { parseArgs } = require("./utils/argsParser");
const { APP_NAME } = require('./constants');
const tinkoff_v2 = require('../libs/unofficial-tinkoff-invest-api_v2-lazy-sdk-NODEJS/tinkoff_v2');
const BarUpDnStrategy = require('./strategies/BarUpDn');

const strategiesMap = {
    BarUpDn: BarUpDnStrategy,
};

async function main() {
    const { token, mode, strategy } = parseArgs();
    const api = new tinkoff_v2({ token, appName: APP_NAME });
    new strategiesMap[strategy](api, mode);
};

main();
