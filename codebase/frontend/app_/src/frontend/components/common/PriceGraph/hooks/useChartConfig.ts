import { useEffect, useState } from 'react';

import { IPriceGraphBarConfig } from 'models/data/IPriceGraphBarConfig';
import PriceGraphSettings from 'frontend/components/common/PriceGraph/constants';

export default function useChartConfig(data: IPriceGraphBarConfig[]) {
    const [chartConfig, setChartConfig] = useState({
        dataSet: data,
        min: 0,
        stepSize: PriceGraphSettings.priceAxis.stepSize,
    });

    useEffect(() => {
        let axisMin = 0;
        let axisStep = 0.1;

        const prices = data.map(el => el.price).filter(p => p > 0);

        if (prices.length > 0) {
            const max = Math.max(...prices);
            const min = Math.min(...prices);

            // The min should be 10% lower than the smallest price (EJH-10989).
            axisMin = min * 0.9;

            // Adjust the axis min if the bars are too short and labels cut.
            // The shortest bar should be at least 14% from highest bar.
            const allowedMin = (min - 0.14 * max) / 0.86;
            axisMin = Math.min(axisMin, allowedMin > 0 ? allowedMin : 0);

            // Round min to the nearest 10
            axisMin = Math.round(axisMin / 10) * 10;

            axisStep = (max - axisMin) / PriceGraphSettings.priceAxis.ticksCount;
            // If step > 10, round it to the nearest 10, else to the nearest integer
            // (e.g. 114 -> 110, 4.3 -> 4)
            axisStep = axisStep > 10 ? Math.round(axisStep / 10) * 10 : Math.round(axisStep);

            // Fix for Chart.js issue (https://github.com/chartjs/Chart.js/issues/7203).
            // If min % stepSize !== 0, the lib draws the first tick interval shorter than others.
            axisMin = axisMin && axisStep ? axisMin - (axisMin % axisStep) : 0;
        }

        // ChartDataLabels plugin doesn't show the labels if values are less than axis MIN.
        // To show such labels, need set "y" as axisMin.
        const normalizedData = data.map(el => ({ ...el, y: el.price >= axisMin ? el.price : axisMin }));

        setChartConfig({
            dataSet: normalizedData,
            min: axisMin,
            stepSize: axisStep,
        });
    }, [data]);

    return chartConfig;
}
