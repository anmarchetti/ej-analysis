import React from 'react';
import { render } from '@testing-library/react';

import { mockBarChartData, mockChartPlugins, mockDataSets } from 'frontend/__mocks__';

import BarChart from './BarChart';

const createStores = () => ({
    appStore: {
        isScreenExtraLarge: false,
    },
    priceGraphStore: {
        isMobileView: false,
    },
    layoutStore: {
        getPhrase: jest.fn(p => p),
        getSetting: jest.fn(),
    },
});

const mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let lastBarProps: any = null;

const mockBarChartPlugins = jest.fn();
const mockBarChartDataSets = jest.fn();

jest.mock('react-chartjs-2', () => ({
    __esModule: true,
    Bar: props => {
        lastBarProps = props;
        mockBarChartPlugins(props.plugins);
        mockBarChartDataSets(props.data.datasets);

        return <div data-tid='bar' />;
    },
}));

describe('<BarChart />', () => {
    const resetMocks = () => ({
        barChartRef: {
            current: {
                setActiveElements: jest.fn(),
            },
        } as any,
        changeActiveDate: jest.fn(),
        data: mockBarChartData,
        holidayDuration: 2,
        getPriceTick: a => `£${a}`,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        lastBarProps = null;
    });

    it('should call changeActiveDate', () => {
        render(<BarChart {...mocks} />);
        lastBarProps.options.onClick({}, [{ index: 0 }]);
        expect(mocks.changeActiveDate).toHaveBeenCalledWith(0);
    });

    it('should NOT call changeActiveDate', () => {
        render(<BarChart {...mocks} />);
        lastBarProps.options.onClick({}, []);
        expect(mocks.changeActiveDate).toHaveBeenCalledTimes(0);
    });

    it('should render correctly', () => {
        const { getByTestId } = render(<BarChart {...mocks} />);
        expect(mockBarChartPlugins).toHaveBeenCalledWith(mockChartPlugins);
        expect(mockBarChartDataSets).toHaveBeenCalledWith(mockDataSets);
        expect(getByTestId('bar')).toBeInTheDocument();
    });
});
