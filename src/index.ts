import { parseArgs } from "./utils/argsParser";
import { APP_NAME } from './constants';
import tinkoff_v2 from './../libs/unofficial-tinkoff-invest-api_v2-lazy-sdk-NODEJS/tinkoff_v2';
import UsersService from "./services/UsersService";

async function main() {
    try {
        const { token, isSandbox } = parseArgs();
        const client = new tinkoff_v2({ token, appName: APP_NAME });
        const usersService = new UsersService(client, isSandbox);
    } catch (e) {
        throw e;
    }
};

main();
