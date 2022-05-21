const { INITIAL_SANDBOX_EQUITY } = require('../constants');
const { log } = require('../utils/logger');

class SandboxService {
    api;
    accountId;

    constructor(api) {
        this.api = api;
    }

    async setup() {
        this.accountId = await this.getOrCreateSandboxAccId();
    }

    async getOrCreateSandboxAccId() {
        const accs = (await log(this.api.Sandbox.GetSandboxAccounts, 'api.Sandbox.GetSandboxAccounts', {})).accounts;

        // use only one account
        if (accs.length > 0) {
            for (let i = 1; i < accs.length; i++) {
                await log(this.api.Sandbox.CloseSandboxAccount, 'api.Sandbox.CloseSandboxAccount', {
                    account_id: accs[i].id,
                });
            }
            return accs[0].id;
        }

        const newAccId = (await api.Sandbox.OpenSandboxAccount({})).account_id;
        await log(this.api.Sandbox.SandboxPayIn, 'api.Sandbox.SandboxPayIn', {
            account_id: newAccId,
            amount: `${INITIAL_SANDBOX_EQUITY} rub`,
        });
        return newAccId;
    }

    async getSandboxPortfolio() {
        return await log(this.api.Sandbox.GetSandboxPortfolio, 'api.Sandbox.GetSandboxPortfolio', {
            account_id: this.accountId,
        });
    }

    async getSandboxOrders() {
        return (
            await log(this.api.Sandbox.GetSandboxOrders, 'api.Sandbox.GetSandboxOrders', { account_id: this.accountId })
        ).orders;
    }

    async postSandboxOrder({ figi, quantity, price, direction, order_type, order_id }) {
        return await log(this.api.Sandbox.PostSandboxOrder, 'api.Sandbox.PostSandboxOrder', {
            figi,
            quantity,
            price,
            direction,
            account_id: this.accountId,
            order_type,
            order_id,
        });
    }
}

module.exports = SandboxService;
