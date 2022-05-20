const fs = require('fs');

const ORDERS_TO_CANDLES = 'orders_to_candles.json';

function existsOrCreateFile(fileName, defValue) {
    fs.stat(fileName, function (err, stat) {
        if (err) {
            if (err.code === 'ENOENT') {
                fs.writeFileSync(fileName, JSON.stringify(defValue));
                console.log(`${fileName} created`);
            } else {
                console.error('Some other error: ', err.code);
            }
        }
    });
}

class bd {
    constructor() {
        existsOrCreateFile(ORDERS_TO_CANDLES, []);
    }

    getOrdersToCandles() {
        let data;
        try {
            data = JSON.parse(fs.readFileSync(ORDERS_TO_CANDLES, 'utf8'));
        } catch (e) {
            console.error(e)
            data = [];
        }
        return data;
    }

    hasOrder(orderId, candleTime) {
        const ordersToCandles = this.getOrdersToCandles();
        return Boolean(ordersToCandles.find(orderToCandle => orderToCandle.orderId === orderId && orderToCandle.candleTime === candleTime));
    }

    saveOrderAndCandle(orderId, candleTime) {
        const ordersToCandles = JSON.parse(fs.readFileSync(ORDERS_TO_CANDLES, 'utf8'));
        ordersToCandles.push({ orderId, candleTime });
        debugger
        fs.writeFileSync(ORDERS_TO_CANDLES, JSON.stringify(ordersToCandles));
    }
}

module.exports = bd;
