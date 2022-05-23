const fs = require('fs');
const path = require('path');

const createReport = (title, candlesFileName, statsFileName) => {
    let template = fs.readFileSync(path.resolve(__dirname, 'reportTemplate.html'), 'utf8');

    const candles = fs.readFileSync(path.resolve(__dirname, `../bd/storage/backtest/${candlesFileName}.json`), 'utf8');
    const stats = fs.readFileSync(path.resolve(__dirname, `../bd/storage/backtest/${statsFileName}.json`), 'utf8');

    const map = {
        TITLE: title,
        CANDLES: candles,
        STATS: stats,
    };

    for (const [key, value] of Object.entries(map)) {
        template = template.replace(`{{${key}}}`, value);
    }

    fs.writeFileSync(path.resolve(__dirname, 'report.html'), template);
};

module.exports = { createReport };
