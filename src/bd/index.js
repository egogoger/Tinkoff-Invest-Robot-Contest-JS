const fs = require('fs');
const path = require('path');

class bd {
    constructor() {
        this.ensureStorageDirs();
    }

    get PATHS() {
        return {
            STORAGE: 'storage',
            BACKTEST: 'storage/backtest',
            LIVE: 'storage/live',
            SANDBOX: 'storage/sandbox',
            CANDLES: 'storage/candles',
        };
    }

    ensureStorageDirs() {
        [this.PATHS.STORAGE, this.PATHS.BACKTEST, this.PATHS.LIVE, this.PATHS.SANDBOX, this.PATHS.CANDLES]
            .map(p => path.resolve(__dirname, p))
            .forEach(this.ensureDir);
    }

    ensureDir(path) {
        if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
    }

    /**
     * Сохраняет в базу значение data
     * @param data
     * @param {string} dir
     * @param {string} fileName
     */
    save(data, dir, fileName) {
        const finalPath = path.resolve(__dirname, `${dir}/`, `${fileName}.json`);

        this.ensureDir(finalPath.slice(0, finalPath.lastIndexOf('/')));

        fs.writeFileSync(finalPath, JSON.stringify(data, null, 4));
    }

    /**
     * Достает из базы данные по пути
     * @param {string} dir
     * @param {string} fileName
     * @return {Object | undefined}
     */
    get(dir, fileName) {
        const finalPath = path.resolve(__dirname, `${dir}/`, `${fileName}.json`);

        if (!fs.existsSync(finalPath)) {
            console.log(finalPath, 'does not exist yet');
            return;
        }

        return JSON.parse(fs.readFileSync(finalPath, 'utf8'));
    }
}

module.exports = bd;
