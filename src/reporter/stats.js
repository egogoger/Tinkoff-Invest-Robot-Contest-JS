(() => {
    const average = arr => arr.reduce((sum, curr) => sum + curr, 0) / arr.length;
    const percentage = (part, total) => ((part / total) * 100).toFixed(2);

    const calculateBuyAndHoldReturn = (firstPrice, lastPrice, capital) => {
        const lots = Math.floor(capital / firstPrice);

        const totalReturns = lots * (lastPrice - firstPrice);

        return { value: totalReturns, percent: percentage(totalReturns, capital) };
    };

    const tableTag = document.querySelector('#stats-table tbody');
    if (!tableTag) return;
    tableTag.innerHTML = '';

    const statsMap = {
        netProfit: {
            title: 'Чистая прибыль',
            value: 0,
            percent: 0,
        },
        grossProfit: {
            title: 'Валовая прибыль',
            value: 0,
            percent: 0,
        },
        grossLoss: {
            title: 'Валовый убыток',
            value: 0,
            percent: 0,
        },
        buyHoldReturn: {
            title: 'Прибыльность стратегии Buy & Hold',
            value: 0,
            percent: 0,
        },
        winningTrades: {
            title: 'Прибыльных сделок',
            value: 0,
        },
        losingTrades: {
            title: 'Убыточных сделок',
            value: 0,
        },
        avgWinningTrade: {
            title: 'Средняя прибыль сделки',
            percent: 0,
        },
        avgLosingTrade: {
            title: 'Средний убыток сделки',
            percent: 0,
        },
        avgWinLoseRatio: {
            title: 'Отношение средней прибыли к среднему убытку',
            value: 1,
        },
        largestWinningTrade: {
            title: 'Самая прибыльная сделка',
            value: 0,
            percent: 0,
        },
        largestLosingTrade: {
            title: 'Самая убыточная сделка',
            value: 0,
            percent: 0,
        },
    };

    const initialCapital = equity[0].value;
    const resultingCapital = equity[equity.length - 1].value;

    statsMap.buyHoldReturn = {
        ...statsMap.buyHoldReturn,
        ...calculateBuyAndHoldReturn(candles[0].open, candles[candles.length - 1].close, initialCapital),
    };

    statsMap.netProfit.value = resultingCapital - initialCapital;
    statsMap.netProfit.percent = percentage(statsMap.netProfit.value, initialCapital);

    const sizesToDiffs = orders.map(({ entry, close }) => {
        const entrySize = entry.quantity * entry.price;
        const closeSize = close.quantity * close.price;

        const diff = closeSize - entrySize;

        if (diff > 0) {
            statsMap.grossProfit.value += diff;
            statsMap.grossProfit.percent = percentage(diff, initialCapital);

            statsMap.winningTrades.value++;

            if (diff > statsMap.largestWinningTrade.value) {
                statsMap.largestWinningTrade.value = diff;
                statsMap.largestWinningTrade.percent = percentage(diff, entrySize);
            }
        } else {
            const diffAbs = Math.abs(diff);

            statsMap.losingTrades.value++;

            statsMap.grossLoss.value += diffAbs;
            statsMap.grossLoss.percent = percentage(diffAbs, initialCapital);

            if (diffAbs > statsMap.largestLosingTrade.value) {
                statsMap.largestLosingTrade.value = diffAbs;
                statsMap.largestLosingTrade.percent = percentage(diffAbs, entrySize);
            }
        }

        return percentage(diff, entrySize);
    });

    statsMap.avgWinningTrade.percent = average(sizesToDiffs.map(Number).filter(per => per > 0)).toFixed(2);
    statsMap.avgLosingTrade.percent = average(sizesToDiffs.map(Number).filter(per => per < 0)).toFixed(2);
    statsMap.avgWinLoseRatio.value = Math.abs(
        statsMap.avgWinningTrade.percent / statsMap.avgLosingTrade.percent,
    ).toFixed(4);

    Object.values(statsMap).forEach(stat => {
        const value = stat.value ? Number(stat.value).toFixed(2).replace('.00', '') : undefined;
        const per = stat.percent ? stat.percent + '%' : '';

        tableTag.innerHTML += `<tr><td>${stat.title}</td><td>${[value, per].filter(Boolean).join('</br>')}</td></tr>`;
    });
})();
