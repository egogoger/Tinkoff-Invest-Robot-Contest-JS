const { INITIAL_SANDBOX_EQUITY } = require("../constants");

const getOrCreateSandboxAccId = async (api) => {
    const accs = (await api.Sandbox.GetSandboxAccounts({})).accounts;

    // use only one account
    if (accs.length > 0) {
        for (let i = 1; i < accs.length; i++) {
            await api.Sandbox.CloseSandboxAccount({ account_id: accs[i].id });
        }
        return accs[0].id;
    }

    const newAccId = (await api.Sandbox.OpenSandboxAccount({})).account_id;
    await api.Sandbox.SandboxPayIn({ account_id: newAccId, amount: `${INITIAL_SANDBOX_EQUITY} rub`});
    return newAccId;
};

const getSandboxPortfolio = async (api, accountId) => {
    return await api.Sandbox.GetSandboxPortfolio({ account_id: accountId });
};

const getSandboxOrders = async (api, accountId) => {
    return (await api.Sandbox.GetSandboxOrders({ account_id: accountId })).orders;
};

module.exports = { getOrCreateSandboxAccId, getSandboxPortfolio, getSandboxOrders };
