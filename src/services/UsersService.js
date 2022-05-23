const { log } = require('../utils/logger');

class UsersService {
    constructor(api) {
        this.api = api;
    }

    /**
     * Возвращает account_id
     * @param {string} accName
     * @return {Promise<string>}
     */
    async getAccountId(accName) {
        const accounts = (await log(this.api.Users.GetAccounts, 'api.Users.GetAccounts', {})).accounts;
        const acc = accName ? accounts.find(a => a.name === accName) : UsersService.availableAccounts(accounts)[0];
        if (!acc) throw new Error('no account');
        if (!UsersService.isAvailableAcc(acc)) throw new Error('not available account');
        return acc.id;
    }

    static availableAccounts(accounts) {
        return accounts.filter(UsersService.isAvailableAcc);
    }

    static isAvailableAcc(account) {
        return account.status === 'ACCOUNT_STATUS_OPEN' && account.access_level === 'ACCOUNT_ACCESS_LEVEL_FULL_ACCESS';
    }
}

module.exports = UsersService;
