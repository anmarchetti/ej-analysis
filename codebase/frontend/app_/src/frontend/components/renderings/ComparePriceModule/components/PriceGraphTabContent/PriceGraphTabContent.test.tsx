import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PriceGraphTabContent, { IPriceGraphTabContentProps, PriceGraphTabTitle } from './PriceGraphTabContent';

const mockPriceGraphComponent = jest.fn();
jest.mock('frontend/components/common/PriceGraph', () => ({
    __esModule: true,
    default: props => {
        mockPriceGraphComponent(props);

        return <div data-tid='price-graph' />;
    },
}));

jest.mock(
    'frontend/components/renderings/ComparePriceModule/components/ComparePriceTouristTax/ComparePriceTouristTax',
    () => ({
        __esModule: true,
        default: ({ label }) => <div data-tid='tourist-tax'>{label}</div>,
    }),
);

const mockComparePriceModuleToggle = jest.fn();
jest.mock(
    'frontend/components/renderings/ComparePriceModule/components/ComparePriceModuleToggle/ComparePriceModuleToggle',
    () => ({
        __esModule: true,
        default: props => {
            mockComparePriceModuleToggle(props);

            return <div data-tid='compare-price-module-toggle' />;
        },
    }),
);

const createProps = (): IPriceGraphTabContentProps => ({
    holidayDurationLabel: 'holidayDurationLabel',
    selectedDate: new Date(),
    changeActiveDate: jest.fn(),
    middleDate: new Date(),
    isDisplayed: true,
    touristTaxLabel: 'touristTaxLabel',
    toggleProps: {
        cheapestRoomLabel: 'Cheapest Room',
        isEnabled: true,
        keepRoomLabel: 'Keep Room',
        onReload: jest.fn(),
        selectedDate: new Date(),
        setActiveDate: jest.fn(),
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));

let props;
let mockStores;

describe('<PriceGraphTabContent />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render content when isDisplayed is true', () => {
        render(<PriceGraphTabContent {...props} />);

        expect(screen.getByText(props.holidayDurationLabel)).toBeInTheDocument();
        expect(screen.getByTestId('price-graph')).toBeInTheDocument();
        expect(screen.getByTestId('tourist-tax')).toHaveTextContent('touristTaxLabel');

        expect(mockPriceGraphComponent).toHaveBeenCalledWith({
            changeActiveDate: expect.any(Function),
            middleDate: new Date(),
            selectedDate: new Date(),
        });
    });

    it('should NOT render content when isDisplayed is false', () => {
        props.isDisplayed = false;

        render(<PriceGraphTabContent {...props} />);

        expect(screen.getByText(props.holidayDurationLabel)).toBeInTheDocument();
        expect(screen.queryByTestId('price-graph')).not.toBeInTheDocument();

        expect(mockPriceGraphComponent).not.toHaveBeenCalled();
    });
});

describe('<PriceGraphTabTitle />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('should be rendered', () => {
        const { container } = render(<PriceGraphTabTitle />);

        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.ComparePriceModuleGraphView)).toBeInTheDocument();
    });
});
