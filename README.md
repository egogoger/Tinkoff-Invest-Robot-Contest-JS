# Tinkoff-Invest-Robot-Contest-JS
Пример торговой системы, работающей на [API Тинькофф Инвестиций](https://tinkoff.github.io/investAPI/) для [Tinkoff Invest Robot Contest](https://github.com/Tinkoff/invest-robot-contest)

В качестве коннектора используется [Неофициальный SDK для Tinkoff Invest APIv2 для nodejs](https://github.com/betslus1/unofficial-tinkoff-invest-api_v2-lazy-sdk-NODEJS)

# Возможности
- Торговля в боевом режиме
- Торговля в тестовом режиме (песочница)
- Тестирование на исторических данных (BackTest)
- Анализ работы алгоритма

# Сборка
```
npm install
```

# BackTest
## Запуск
```
npm run backtest -- --strat BarUpDn --ticker VTBR --from 2021-11-22 --to 2022-01-20
```
- `strat` - название стратегии
- `ticker` - тикер торгового инструмента
- `from`, `to` - временные границы для тестирования
> Более детально стратегия настраивается в коде `src/strategies/{NAME}/BackTest.js`

## Результаты
По окончанию тестирования в корне проекта генерируется html-файл с отчётом. В нём можно на "живом" графике отследить все сделки, а так же проанализировать основные показатели торговой стратегии

[Пример отчёта](https://htmlpreview.github.io/?https://github.com/egogoger/Tinkoff-Invest-Robot-Contest-JS/blob/master/examples/BarUpDn/report.html)
![backtest report example](examples/BarUpDn/report.png)

# Песочница
// 

# Боевой режим
// todo
