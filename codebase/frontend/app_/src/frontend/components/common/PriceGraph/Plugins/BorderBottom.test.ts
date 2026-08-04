import PriceGraphSettings from 'frontend/components/common/PriceGraph/constants';

import { drawBottomBorder } from './BorderBottom';

const mockCtx = {
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    strokeStyle: '',
    lineWidth: 0,
};

const mockChart = {
    ctx: mockCtx,
    data: {
        datasets: [
            {
                borderColor: '',
                data: [10, 20],
            },
        ],
    },
    getDatasetMeta: jest.fn().mockReturnValue({
        data: [
            { x: 10, width: 20 },
            { x: 30, width: 20 },
        ],
        yAxisID: 'y-axis-0',
    }),
    scales: {
        'y-axis-0': {
            bottom: 50,
        },
    },
} as any;

const mockArgs = {} as any;
const mockOptions = {} as any;

describe('drawBottomBorder plugin', () => {
    it('should draw bottom border for each bar', () => {
        if (drawBottomBorder && drawBottomBorder.afterDatasetDraw) {
            drawBottomBorder.afterDatasetDraw(mockChart, mockArgs, mockOptions);
        }

        expect(mockCtx.save).toHaveBeenCalledTimes(2);
        expect(mockCtx.beginPath).toHaveBeenCalledTimes(2);
        expect(mockCtx.moveTo).toHaveBeenCalledWith(1, 50);
        expect(mockCtx.lineTo).toHaveBeenCalledWith(20 - 1, 50);
        expect(mockCtx.moveTo).toHaveBeenCalledWith(20 + 1, 50);
        expect(mockCtx.lineTo).toHaveBeenCalledWith(20 + 20 - 1, 50);
        expect(mockCtx.strokeStyle).toBe(PriceGraphSettings.colors.orange);
        expect(mockCtx.lineWidth).toBe(1);
        expect(mockCtx.stroke).toHaveBeenCalledTimes(2);
        expect(mockCtx.restore).toHaveBeenCalledTimes(2);
    });

    it('should use dataset borderColor if provided', () => {
        mockChart.data.datasets[0].borderColor = '#fff';

        if (drawBottomBorder && drawBottomBorder.afterDatasetDraw) {
            drawBottomBorder.afterDatasetDraw(mockChart, mockArgs, mockOptions);
        }

        expect(mockCtx.strokeStyle).toBe('#fff');
    });
});
