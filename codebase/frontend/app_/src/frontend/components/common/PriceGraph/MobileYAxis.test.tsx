import React from 'react';
import { render, screen } from '@testing-library/react';

import { IPriceGraphBarConfig } from 'models/data/IPriceGraphBarConfig';

import PriceGraphSettings from './constants';
import MobileYAxis from './MobileYAxis';

const mockBar = jest.fn();
jest.mock('react-chartjs-2', () => {
    const originalModule = jest.requireActual('react-chartjs-2');

    return {
        ...originalModule,
        Bar: jest.fn(props => {
            mockBar(props);

            return <canvas data-tid='mock-bar-chart' />;
        }),
    };
});

const mockUseChartConfig = jest.fn(() => ({ min: 0, stepSize: 10 }));
jest.mock('./hooks/useChartConfig', () => ({
    __esModule: true,
    default: () => mockUseChartConfig(),
}));

interface IMobileYAxisTestProps {
    data: IPriceGraphBarConfig[];
    getPriceTick: jest.Mock;
}

describe('<MobileYAxis />', () => {
    let props: IMobileYAxisTestProps;

    const resetMocks = (): IMobileYAxisTestProps => ({
        data: [
            { y: 10, date: '01.01.2025', isStartDate: true, isEndDate: false, price: 1 },
            { y: 20, date: '02.01.2025', isStartDate: false, isEndDate: true, price: 2 },
        ],
        getPriceTick: jest.fn(tick => `Formatted ${tick}`),
    });

    props = resetMocks();

    beforeEach(() => {
        props = resetMocks();
    });

    it('should render the Bar chart', () => {
        render(<MobileYAxis {...props} />);

        expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
    });

    it('should pass the correct data and options to the Bar component', () => {
        const mockMin = 5;
        const mockStepSize = 15;
        mockUseChartConfig.mockReturnValue({ min: mockMin, stepSize: mockStepSize });

        render(<MobileYAxis {...props} />);

        expect(mockBar).toHaveBeenCalledTimes(1);

        const barProps = mockBar.mock.calls[0][0];

        expect(barProps.data.datasets[0].data).toEqual(props.data);
        expect(barProps.data.datasets[0].label).toEqual('Dates');

        const { options } = barProps;
        expect(options.scales.y.min).toBe(mockMin);
        expect(options.scales.y.ticks.stepSize).toBe(mockStepSize);
        expect(options.scales.y.ticks.callback).toBe(props.getPriceTick);

        expect(options.layout.padding).toEqual({ top: 30, bottom: 60, right: 0, left: 0 });
        expect(options.maintainAspectRatio).toBe(false);
        expect(options.responsive).toBe(true);
        expect(options.scales.x.display).toBe(false);
        expect(options.scales.y.beginAtZero).toBe(false);
        expect(options.scales.y.stacked).toBe(true);
        expect(options.scales.y.border.display).toBe(false);
        expect(options.scales.y.grid.display).toBe(false);
        expect(options.scales.y.offset).toBe(false);
        expect(options.scales.y.ticks.autoSkip).toBe(false);

        expect(options.scales.y.ticks.color).toBe(PriceGraphSettings.colors.tickLabel);
        expect(options.scales.y.ticks.font.family).toBe(PriceGraphSettings.fontFamily);
        expect(options.scales.y.ticks.font.size).toBe(12);
    });

    it('should use the getPriceTick callback for y-axis ticks', () => {
        const mockMin = 0;
        const mockStepSize = 10;
        mockUseChartConfig.mockReturnValue({ min: mockMin, stepSize: mockStepSize });

        render(<MobileYAxis {...props} />);

        const barProps = mockBar.mock.calls[0][0];
        expect(barProps.options.scales.y.ticks.callback).toBe(props.getPriceTick);

        if (barProps.options.scales.y.ticks.callback) {
            barProps.options.scales.y.ticks.callback(20, 0, []);
        }

        expect(props.getPriceTick).toHaveBeenCalledWith(20, 0, []);
    });
});
