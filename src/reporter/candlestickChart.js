/**
 * window: {
 *     LightweightCharts: Object,
 *     candles: [],
 *     equity: [],
 *     timeFormatter: Function,
 * }
 */

(() => {
    const chart = LightweightCharts.createChart('candles', {
        timeScale: {
            timeVisible: true,
            borderColor: '#D1D4DC',
            tickMarkFormatter: timeFormatter,
        },
        rightPriceScale: {
            borderColor: '#D1D4DC',
        },
        layout: {
            backgroundColor: '#ffffff',
            textColor: '#000',
        },
        grid: {
            horzLines: {
                color: '#F0F3FA',
            },
            vertLines: {
                color: '#F0F3FA',
            },
        },
    });

    const series = chart.addCandlestickSeries({
        upColor: 'rgb(38,166,154)',
        downColor: 'rgb(255,82,82)',
        wickUpColor: 'rgb(38,166,154)',
        wickDownColor: 'rgb(255,82,82)',
        borderVisible: false,
    });

    series.setData(
        candles.map(candle => ({
            ...candle,
            time: new Date(candle.time).getTime(),
        })),
    );

    const precision = String(candles[0].close).split('.')[1].length;

    series.applyOptions({
        priceFormat: {
            type: 'price',
            precision,
            minMove: Number(`0.${'0'.repeat(precision - 1)}1`),
        },
    });

    const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
            top: 0.8,
            bottom: 0,
        },
    });

    volumeSeries.setData(
        candles.map(candle => ({
            time: new Date(candle.time).getTime(),
            value: candle.volume,
            color: candle.close > candle.open ? 'rgba(0, 150, 136, 0.5)' : 'rgba(255,82,82, 0.5)',
        })),
    );

    const markers = [];
    for (let i = 0; i < orders.length; i++) {
        const { entry, close } = orders[i];

        markers.push({
            time: new Date(entry.candleTime).getTime(),
            position: 'belowBar',
            color: '#2196F3',
            shape: 'arrowUp',
            text: `#${i + 1}`,
        });
        markers.push({
            time: new Date(close.candleTime).getTime(),
            position: 'aboveBar',
            color: '#e91e63',
            shape: 'arrowDown',
            text: `#${i + 1}`,
        });
    }
    series.setMarkers(markers);

    chart.timeScale().fitContent();
})();
