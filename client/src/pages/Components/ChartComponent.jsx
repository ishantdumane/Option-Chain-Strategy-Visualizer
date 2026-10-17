import React, { useEffect, useRef, useState } from 'react';
import { AreaSeries, CandlestickSeries, BarSeries, BaselineSeries, HistogramSeries, createChart } from 'lightweight-charts';
import { createSeriesMarkers } from "lightweight-charts";
import axios from "axios";

export default function ChartComponent(props) {
    const {expiry, data, interval, tradingSymbol, handleIntervalChange} = props;
    const chartContainerRef = useRef();

    useEffect(
        () => {
            const handleResize = () => {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
            };

            const chartOptions = { 
            layout: { textColor: 'black', background: { type: 'solid', color: 'white' } },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false, // set to true if needed
            }, };
            const chart = createChart(chartContainerRef.current, chartOptions);

            const candlestickSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
                wickUpColor: '#26a69a', wickDownColor: '#ef5350'
            });

            const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume', // put it on a separate scale
            });

            chart.priceScale('volume').applyOptions({
            scaleMargins: {
                top: 0.85,
                bottom: 0,
            },
            borderVisible: false,
            });

            chart.applyOptions({
            crosshair: {
                mode: 0
            }
            });

            const candles = data.data.candles.slice().reverse(); // non-mutating safe reversal
            const offsetMillis = 5.5 * 60 * 60 * 1000;

            candlestickSeries.setData(
                candles.map((candle) => {
                    return ({
                        time: Math.floor((new Date(candle[0]).getTime() + offsetMillis) / 1000),
                        open: candle[1],
                        high: candle[2],
                        low: candle[3],
                        close: candle[4]
                    })
                })
            );


            // Series markers implication
            const markers = []

            if (candles.length !== 0) {

                axios.post("http://localhost:3000/api/run-strategy", {
                    expiry, candles
                }).then((response) => {
                    let position = 0;
                    response.data.markersData.map((signal) => {
                        markers.push(position?{
                            time: Math.floor((new Date(signal[0]).getTime() + offsetMillis) / 1000),
                            position: 'aboveBar',
                            color: '#e91e63',
                            shape: 'arrowDown',
                            text: 'Sell @ ' + signal[1]
                        }:{
                            time: Math.floor((new Date(signal[0]).getTime() + offsetMillis) / 1000),
                            position: 'belowBar',
                            color: '#2196F3',
                            shape: 'arrowUp',
                            text: 'Buy @ ' + signal[1]
                        });
                        position = !position;
                    });
                    console.log(markers);
                    createSeriesMarkers(candlestickSeries, markers);
                }).catch((err) => {
                    console.log(err);
                });

            }


            // Adding volume series 
            volumeSeries.setData(
                candles.map(candle => ({
                    time: Math.floor((new Date(candle[0]).getTime() + offsetMillis) / 1000),
                    value: candle[5],
                    color: candle[1] > candle[4] ? 'rgba(239, 83, 80, 0.5)' : 'rgba(38, 166, 154, 0.5)', // red if close < open, green otherwise
                }))
            );


            const symbolName = tradingSymbol;

            const container = chartContainerRef.current;

            const intervalSelector = document.createElement('select');
            intervalSelector.style = `
                position: absolute;
                left: 12px;
                top: 12px;
                z-index: 2;
                font-size: 14px;
                font-family: sans-serif;
                padding: 2px 6px;
            `;
            
            const intervals = [
                {symbol: "1m", value: "1minute"},
                {symbol: "3m", value: "3minute"},
                {symbol: "5m", value: "5minute"},
                {symbol: "15m", value: "15minute"},
                {symbol: "30m", value: "30minute"},
                {symbol: "1D", value: "day"},
            ]
            intervals.forEach((interval) => {
                const option = document.createElement('option');
                option.value = interval.value;
                option.textContent = interval.symbol;
                intervalSelector.appendChild(option);
            });
            intervalSelector.value = interval;
            
            // Optional: Handle interval change
            intervalSelector.addEventListener('change', (e) => {
                const selectedInterval = e.target.value;
                handleIntervalChange(selectedInterval);
                // You can call a prop callback or trigger a state update here
            });

            container.appendChild(intervalSelector);

            // 📍 Now add the legend below the interval
            const legend = document.createElement('div');
            legend.style = `
                position: absolute;
                left: 12px;
                top: 44px; /* Moved below the select */
                z-index: 1;
                font-size: 14px;
                font-family: sans-serif;
                line-height: 18px;
                font-weight: 300;
            `;
            container.appendChild(legend);

            const firstRow = document.createElement('div');
            firstRow.style.color = 'black';
            legend.appendChild(firstRow);

            chart.subscribeCrosshairMove(param => {
                let openPrice = '';
                let highPrice = '';
                let lowPrice = '';
                let closePrice = '';
                let volumeAmount = '';

                if (param.time) {
                    const dataCandle = param.seriesData.get(candlestickSeries);
                    const dataVolume = param.seriesData.get(volumeSeries);
                    const open = dataCandle.open;
                    const high = dataCandle.high;
                    const low = dataCandle.low;
                    const close = dataCandle.close;
                    const volume = dataVolume.value;

                    openPrice = open.toFixed(2);
                    highPrice = high.toFixed(2);
                    lowPrice = low.toFixed(2);
                    closePrice = close.toFixed(2);
                    volumeAmount = volume.toFixed(2);
                }
                firstRow.innerHTML = `${symbolName} <br> <strong>O${openPrice}</strong>&nbsp;&nbsp;&nbsp;<strong>H${highPrice}</strong>&nbsp;&nbsp;&nbsp;<strong>L${lowPrice}</strong>&nbsp;&nbsp;&nbsp;<strong>C${closePrice}</strong> <br> <strong>V${volumeAmount}</strong>`;
            });

            chart.timeScale().fitContent();

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                chart.remove();
            };
        },
        [data]
    );

    return (
        <div
            ref={chartContainerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
            }}
        />
    );
};
