const fs = require('fs');
const path = require('path');

const ORDERS_TO_CANDLES = 'orders_to_candles.json';

class bd {
    constructor() {
        this.ensureFile(ORDERS_TO_CANDLES, []);
    }

    getOrdersToCandles() {
        let data;
        try {
            data = JSON.parse(fs.readFileSync(ORDERS_TO_CANDLES, 'utf8'));
        } catch (e) {
            console.error(e);
            data = [];
        }
        return data;
    }

    hasOrder(orderId, candleTime) {
        const ordersToCandles = this.getOrdersToCandles();
        return Boolean(
            ordersToCandles.find(
                orderToCandle => orderToCandle.orderId === orderId && orderToCandle.candleTime === candleTime,
            ),
        );
    }

    saveOrderAndCandle(orderId, candleTime) {
        const ordersToCandles = JSON.parse(fs.readFileSync(ORDERS_TO_CANDLES, 'utf8'));
        ordersToCandles.push({ orderId, candleTime });
        fs.writeFileSync(ORDERS_TO_CANDLES, JSON.stringify(ordersToCandles, null, 4));
    }

    ensureFile(fileName, defValue) {
        fs.stat(fileName, function (err, stat) {
            if (err) {
                if (err.code === 'ENOENT') {
                    fs.writeFileSync(fileName, JSON.stringify(defValue, null, 4));
                    console.log(`${fileName} created`);
                } else {
                    console.error('Some other error: ', err.code);
                }
            }
        });
    }

    getCachedCandles(fileName) {
        const pathToFile = path.resolve(__dirname, `${fileName}.json`);

        if (!fs.existsSync(pathToFile)) return undefined;

        return JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
    }

    save(data, fileName) {
        fs.writeFileSync(path.resolve(__dirname, `${fileName}.json`), JSON.stringify(data, null, 4));
    }
}

module.exports = bd;
