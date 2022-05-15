require('dotenv/config');

const parseArgs = () => {
    if (!process.env.TOKEN) throw new Error('no token');

    return {
        token: process.env.TOKEN,
        isSandbox: process.env.IS_SANDBOX?.toLowerCase() === 'true',
        accountName: process.env.ACCOUNT_NAME,
    };
};

module.exports = { parseArgs };
