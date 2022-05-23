const { parseArgs } = require('./utils/argsParser');
const { APP_NAME } = require('./constants');
const tinkoff_v2 = require('../libs/unofficial-tinkoff-invest-api_v2-lazy-sdk-NODEJS/tinkoff_v2');
const BarUpDownStrategy = require('./strategies/BarUpDn');

const strategiesMap = {
    BarUpDn: BarUpDownStrategy,
};

async function main() {
    const { token, mode, strategy } = parseArgs();
    const api = new tinkoff_v2({ token, appName: APP_NAME });
    strategiesMap[strategy](api, mode);
    setInterval(() => {}, 1 << 30);
}

main();
