/**
 * window: {
 *     LightweightCharts: Object,
 *     candles: [],
 *     equity: [],
 *     timeFormatter: Function,
 * }
 */

(() => {
    const chart = LightweightCharts.createChart('equity-curve', {
        timeScale: {
            fixLeftEdge: true,
            fixRightEdge: true,
            lockVisibleTimeRangeOnResize: true,
            tickMarkFormatter: timeFormatter,
        },
        localization: {
            priceFormatter: price => `${price.toFixed(price >= 1000 ? 0 : 2)}₽`,
        },
    });

    const areaSeries = chart.addAreaSeries({
        topColor: 'rgba(5, 70, 204, 0.56)',
        bottomColor: 'rgba(5, 70, 204, 0.04)',
        lineColor: 'rgba(5, 70, 204, 1)',
        lineWidth: 2,
    });

    areaSeries.setData(
        series.map(s => ({
            time: new Date(s.time).getTime(),
            value: s.equity,
        })),
    );

    chart.timeScale().fitContent();
})();
