const isAvailableAcc = account => account.status === 'ACCOUNT_STATUS_OPEN' && account.access_level === 'ACCOUNT_ACCESS_LEVEL_FULL_ACCESS'

const availableAccounts = (accounts) => {
    return accounts.filter(isAvailableAcc);
}; 

const getAccountId = async (api, accName) => {
    const accounts = (await api.Users.GetAccounts({})).accounts;
    const acc = accName ? accounts.find(a => a.name === accName) : availableAccounts(accounts)[0];
    if (!acc) throw new Error('no account');
    if (!isAvailableAcc(acc)) throw new Error('not available account');
    return acc.id;
};

module.exports = { getAccountId };
