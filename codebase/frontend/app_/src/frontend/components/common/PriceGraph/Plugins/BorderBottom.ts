import { BarElement, ChartType, Plugin } from 'chart.js';

import PriceGraphSettings from 'frontend/components/common/PriceGraph/constants';
type TBorderBottomPluginOptions = {};

export const drawBottomBorder: Plugin<ChartType, TBorderBottomPluginOptions> = {
    id: 'drawBottomBorder',
    afterDatasetDraw: chart => {
        const { ctx, scales } = chart;

        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            const yAxis = meta.yAxisID ? scales[meta.yAxisID] : null;
            meta.data.forEach((bar: BarElement) => {
                const width = (bar as any).width;
                const x = bar.x - width / 2;
                const y = yAxis?.bottom ?? 0;
                ctx.save();

                ctx.strokeStyle = (dataset.borderColor as string) || PriceGraphSettings.colors.orange;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 1, y);
                ctx.lineTo(x + width - 1, y);
                ctx.stroke();
                ctx.restore();
            });
        });
    },
};
