require('dotenv/config');
const parseArgs = require('minimist');
const tinkoff_v2 = require('../libs/unofficial-tinkoff-invest-api_v2-lazy-sdk-NODEJS/tinkoff_v2');
const BarUpDownStrategy = require('./strategies/BarUpDn');

const strategiesMap = {
    BarUpDn: BarUpDownStrategy,
};

async function main() {
    Object.assign(process.env, parseArgs(process.argv.slice(2)));

    const { APP_NAME, TOKEN, MODE, strat } = process.env;
    const api = new tinkoff_v2({ token: TOKEN, appName: APP_NAME });

    strategiesMap[strat](api, MODE);
}

main();
