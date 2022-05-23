const log = async (func, funcName, ...args) => {
    console.log(`${funcName}(${JSON.stringify(args)})`);
    return Promise.resolve(func(...args)).catch(e => console.error(e));
};

module.exports = { log };
