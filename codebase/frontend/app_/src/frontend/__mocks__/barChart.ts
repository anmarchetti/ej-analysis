import { Plugin } from 'chart.js';

import PriceGraphSettings from 'frontend/components/common/PriceGraph/constants';

export const mockChartPlugins: Plugin<'bar', AnyObject>[] = [
    { afterDatasetDraw: expect.any(Function), id: 'holidayDuration' },
    {
        afterDatasetUpdate: expect.any(Function),
        afterDatasetsDraw: expect.any(Function),
        afterEvent: expect.any(Function),
        afterUpdate: expect.any(Function),
        beforeEvent: expect.any(Function),
        beforeInit: expect.any(Function),
        beforeUpdate: expect.any(Function),
        defaults: {
            align: 'center',
            anchor: 'center',
            backgroundColor: null,
            borderColor: null,
            borderRadius: 0,
            borderWidth: 0,
            clamp: false,
            clip: false,
            color: undefined,
            display: true,
            font: { family: undefined, lineHeight: 1.2, size: undefined, style: undefined, weight: null },
            formatter: expect.any(Function),
            labels: undefined,
            listeners: {},
            offset: 4,
            opacity: 1,
            padding: { bottom: 4, left: 4, right: 4, top: 4 },
            rotation: 0,
            textAlign: 'start',
            textShadowBlur: 0,
            textShadowColor: undefined,
            textStrokeColor: undefined,
            textStrokeWidth: 0,
        },
        id: 'datalabels',
    },
    { afterDatasetDraw: expect.any(Function), id: 'drawBottomBorder' },
];

export const mockBarChartData = [
    {
        y: 10,
        price: 10,
        isStartDate: false,
        isEndDate: false,
        date: '2020-02-08T00:00:00',
    },
];

export const mockDataSets = [
    {
        categoryPercentage: 1,
        barPercentage: 0.9,
        minBarLength: 0,
        label: 'Dates',
        backgroundColor: expect.any(Function),
        borderColor: PriceGraphSettings.colors.orange,
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: PriceGraphSettings.colors.darkOrange,
        hoverBorderColor: PriceGraphSettings.colors.darkOrange,
        data: mockBarChartData,
        parsing: { xAxisKey: 'y' },
        barThickness: 'flex',
    },
];
