import { IPriceGraphBarConfig } from 'models/data/IPriceGraphBarConfig';
import PriceGraphSettings from 'frontend/components/common/PriceGraph/constants';

import HolidayDurationPlugin from './chart-plugins';

const X_LABEL_OFFSET = 45;
const X_PRICE_OFFSET = 10;
const Y_PRICE_OFFSET = 20;

export const drawHolidayDuration: (typeof HolidayDurationPlugin)['afterDatasetDraw'] = (chart, args, options) => {
    const { index, meta } = args;
    const { holidayDuration, icons, labels, getPriceTick } = options;
    const { ctx: canvasCtx, scales } = chart;
    const data = chart.data.datasets?.[index]?.data as unknown as Nullable<IPriceGraphBarConfig[]>;
    const xAxis = meta.xAxisID ? scales[meta.xAxisID] : null;
    const yAxis = meta.yAxisID ? scales[meta.yAxisID] : null;

    if (!holidayDuration || !data || !canvasCtx || !xAxis || !yAxis) {
        return;
    }

    const metaData = meta.data;
    const activeIdx = metaData.findIndex(item => item.active);
    const startDateIdx = data.findIndex(item => item.isStartDate);
    const endDateIdx = data.findIndex(item => item.isEndDate);

    /**
     * Draw the dots representing the holiday duration.
     * They should be under the items from the start to end dates and move on hover (i.e. from active to active+duration).
     */
    const drawHolidayDuration = (dataIdx: number, circleCenterX: number, circleCenterY: number) => {
        const startIdx = activeIdx !== -1 ? activeIdx : startDateIdx;
        const endIdx = activeIdx !== -1 ? activeIdx + holidayDuration : endDateIdx;

        if (
            (startIdx >= 0 && endIdx >= 0 && dataIdx >= startIdx && dataIdx <= endIdx) ||
            (startIdx >= 0 && endIdx < 0 && dataIdx >= startIdx) ||
            (endIdx >= 0 && startIdx < 0 && dataIdx <= endIdx)
        ) {
            const radius =
                dataIdx === startIdx || dataIdx === endIdx
                    ? PriceGraphSettings.durationEndDotRadius
                    : PriceGraphSettings.durationDotRadius;

            canvasCtx.beginPath();
            canvasCtx.arc(circleCenterX, circleCenterY, radius, 0, 2 * Math.PI);
            canvasCtx.fillStyle = PriceGraphSettings.colors.orange;
            canvasCtx.fill();
        }
    };

    const drawCurrentHolidayPrice = (price: number, x: number, y: number, idx: number, length: number) => {
        canvasCtx.font = `11px ${PriceGraphSettings.fontFamily}`;
        canvasCtx.fillStyle = PriceGraphSettings.colors.durationLabel;
        canvasCtx.textAlign = 'center';

        /** EJH-9702 Fix for case when first or last date is selected and current price label partially hidden */
        const xText = idx === 0 ? x + X_LABEL_OFFSET : idx === length - 1 ? x - X_LABEL_OFFSET : x;
        canvasCtx.font = `14px ${PriceGraphSettings.fontFamily}`;
        canvasCtx.fillText(labels.currentPrice || '', xText, y);

        canvasCtx.font = `bold 16px ${PriceGraphSettings.fontFamily}`;
        canvasCtx.fillStyle = PriceGraphSettings.colors.orange;
        canvasCtx.textAlign = 'center';

        const xPrice = idx === 0 ? x + X_PRICE_OFFSET : idx === length - 1 ? x - X_PRICE_OFFSET : x;
        canvasCtx.fillText(getPriceTick(price), xPrice, y + Y_PRICE_OFFSET);
    };

    const drawIcon = (
        image: HTMLImageElement | null,
        x: number,
        y: number,
        size: number = PriceGraphSettings.iconSize,
    ) => {
        if (image) {
            canvasCtx.drawImage(image, x, y, size, size);
        }
    };

    metaData.forEach((point, i, metaItems) => {
        const x = point.x;
        const y = point.y;
        const price = data[i].price;

        drawHolidayDuration(i, x, yAxis.bottom + 10);

        const flightDateCoords = {
            x: x - PriceGraphSettings.iconSize / 2,
            y: price ? y - 25 : y - 100,
        };

        if (startDateIdx === i) {
            drawIcon(icons.departure, flightDateCoords.x, flightDateCoords.y);
            price && drawCurrentHolidayPrice(price, x, yAxis.bottom + 30, i, metaItems.length);
        }

        if (endDateIdx === i) {
            drawIcon(icons.arrival, flightDateCoords.x, flightDateCoords.y);
        }

        if (!price) {
            const size = PriceGraphSettings.iconSize + 2;
            drawIcon(icons.noFlight, x - size / 2, y - 70, size);
        }
    });
};

const holidayDurationPlugin: typeof HolidayDurationPlugin = {
    id: 'holidayDuration',
    afterDatasetDraw: drawHolidayDuration,
};

export default holidayDurationPlugin;
