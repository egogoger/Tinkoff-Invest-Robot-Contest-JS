import 'dotenv/config';

export const parseArgs = () => {
    if (!process.env.TOKEN) throw new Error('no token');

    return {
        token: process.env.TOKEN,
        isSandbox: process.env.IS_SANDBOX?.toLowerCase() === 'true',
    };
};
