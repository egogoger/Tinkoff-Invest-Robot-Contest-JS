const fs = require('fs');
const path = require('path');

const PATHS = {
    STORAGE: 'storage',
    BACKTEST: 'storage/backtest',
    LIVE: 'storage/live',
    SANDBOX: 'storage/sandbox',
    CANDLES: 'storage/candles',
};

class bd {
    constructor() {
        this.ensureStorageDirs();
    }

    ensureStorageDirs() {
        [PATHS.STORAGE, PATHS.BACKTEST, PATHS.LIVE, PATHS.SANDBOX, PATHS.CANDLES]
            .map(p => path.resolve(__dirname, p))
            .forEach(this.ensureDir);
    }

    ensureDir(path) {
        if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
    }

    getCachedCandles(fileName) {
        const pathToFile = path.resolve(__dirname, `${PATHS.CANDLES}/${fileName}.json`);

        if (!fs.existsSync(pathToFile)) return undefined;

        return JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
    }

    saveCandles(data, fileName) {
        this.save(data, `${PATHS.CANDLES}/${fileName}`);
    }

    saveBackTest(data, fileName) {
        this.save(data, `${PATHS.BACKTEST}/${fileName}`);
    }

    saveSandbox(data, fileName) {
        this.save(data, `${PATHS.SANDBOX}/${fileName}`);
    }

    saveLive(data, fileName) {
        this.save(data, `${PATHS.LIVE}/${fileName}`);
    }

    save(data, pathToFile) {
        const finalPath = path.resolve(__dirname, `${pathToFile}.json`);

        this.ensureDir(finalPath.slice(0, finalPath.lastIndexOf('/')));

        fs.writeFileSync(finalPath, JSON.stringify(data, null, 4));
    }
}

module.exports = bd;
