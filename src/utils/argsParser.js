require('dotenv/config');

const parseArgs = () => {
    if (!process.env.TOKEN) throw new Error('no token');

    return {
        token: process.env.TOKEN,
        mode: process.env.MODE || 'SANDBOX',
        liveAccountName: process.env.LIVE_ACCOUNT_NAME,
        strategy: process.env.STRATEGY,
    };
};

module.exports = { parseArgs };
