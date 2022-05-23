const fs = require('fs');
const path = require('path');

const injectJS = template => {
    const files = ['candlestickChart.js', 'equityCurve.js', 'stats.js'];

    for (const file of files) {
        const script = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
        template = template.replace(` src="${file}">`, `>\n${script}`);
    }

    return template;
};

const createReport = (candlesFileName, statsFileName) => {
    let template = fs.readFileSync(path.resolve(__dirname, 'reportTemplate.html'), 'utf8');

    const candles = fs.readFileSync(path.resolve(__dirname, `../bd/${candlesFileName}.json`), 'utf8');
    const stats = fs.readFileSync(path.resolve(__dirname, `../bd/${statsFileName}.json`), 'utf8');

    const map = {
        CANDLES: candles,
        STATS: stats,
        TICKER: process.env.ticker,
    };

    for (const [key, value] of Object.entries(map)) {
        template = template.replace(`{{${key}}}`, value);
    }

    template = injectJS(template);

    fs.writeFileSync('report.html', template);
};

module.exports = { createReport };
