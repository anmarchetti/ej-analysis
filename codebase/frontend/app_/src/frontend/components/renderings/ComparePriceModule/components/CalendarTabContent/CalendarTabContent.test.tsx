import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ComparePriceCalendar, { CalendarTabTitle, ICalendarTabContentProps } from './CalendarTabContent';

const mockComparePriceCalendarComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/ComparePriceModule/components/ComparePriceCalendar/ComparePriceCalendar',
    () => ({
        __esModule: true,
        default: props => {
            mockComparePriceCalendarComponent(props);

            return <div data-tid='compare-price-calendar' />;
        },
    }),
);

const mockWeekdaysComponent = jest.fn();
jest.mock('frontend/components/common/Weekdays/Weekdays', () => ({
    __esModule: true,
    default: props => {
        mockWeekdaysComponent(props);

        return <div data-tid='weekdays' />;
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

const createProps = (): ICalendarTabContentProps => ({
    getPhrase: jest.fn(p => p),
    holidayDurationLabel: 'holidayDurationLabel',
    selectedDate: new Date('2024-01-01'),
    setActiveDate: jest.fn(),
    isDisplayed: true,
    isMobileView: false,
    activeDate: new Date('2024-01-01'),
    holidayDuration: 6,
    isResetingSelectedOffer: false,
    isPromoDisplayed: true,
    changesLabel: 'changesLabel',
    freeForKidsLabel: 'freeForKidsLabel',
    isFreeForKidsDisplayed: true,
    touristTaxLabel: 'touristTaxLabel',
    toggleProps: {
        cheapestRoomLabel: 'Cheapest Room',
        isEnabled: true,
        keepRoomLabel: 'Keep Room',
        onReload: jest.fn(),
        selectedDate: new Date('2024-01-01'),
        setActiveDate: jest.fn(),
    },
    isCheapest: false,
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));

let props: ICalendarTabContentProps;
let mockStores;

describe('<CalendarTabContent />', () => {
    beforeEach(() => {
        props = createProps();
    });

    describe('Desktop View (isMobileView=false)', () => {
        beforeEach(() => {
            props.isMobileView = false;
        });

        it('should render TouristTax component before legend', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByTestId('tourist-tax')).toBeInTheDocument();
            expect(screen.getByTestId('tourist-tax')).toHaveTextContent('touristTaxLabel');
        });

        it('should render Toggle component inside legendWrapper', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByTestId('compare-price-module-toggle')).toBeInTheDocument();
        });

        it('should NOT render Weekdays component', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(screen.queryByTestId('weekdays')).not.toBeInTheDocument();
            expect(mockWeekdaysComponent).not.toHaveBeenCalled();
        });

        it('should render all desktop components', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByText(props.holidayDurationLabel)).toBeInTheDocument();
            expect(screen.getByTestId('tourist-tax')).toBeInTheDocument();
            expect(screen.getByTestId('compare-price-module-toggle')).toBeInTheDocument();
            expect(screen.getByText(props.changesLabel)).toBeInTheDocument();
            expect(screen.getByText(SitecoreDictionary.ComparePriceModuleBestValue)).toBeInTheDocument();
            expect(screen.getByText(props.freeForKidsLabel)).toBeInTheDocument();
            expect(screen.getByTestId('compare-price-calendar')).toBeInTheDocument();
        });

        it('should pass correct props to ComparePriceModuleToggle', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(mockComparePriceModuleToggle).toHaveBeenCalledWith({
                cheapestRoomLabel: 'Cheapest Room',
                isEnabled: true,
                keepRoomLabel: 'Keep Room',
                onReload: expect.any(Function),
                selectedDate: new Date('2024-01-01'),
                setActiveDate: expect.any(Function),
            });
        });
    });

    describe('Mobile View (isMobileView=true)', () => {
        beforeEach(() => {
            props.isMobileView = true;
        });

        it('should render Weekdays component', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByTestId('weekdays')).toBeInTheDocument();
        });

        it('should render TouristTax component after legend', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByTestId('tourist-tax')).toBeInTheDocument();
            expect(screen.getByTestId('tourist-tax')).toHaveTextContent('touristTaxLabel');
        });

        it('should render Toggle component after TouristTax', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByTestId('compare-price-module-toggle')).toBeInTheDocument();
        });

        it('should pass correct props to Weekdays component', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(mockWeekdaysComponent).toHaveBeenCalledWith({
                className: 'weekdays',
                weekStart: 1,
            });
        });

        it('should render all mobile components', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByText(props.holidayDurationLabel)).toBeInTheDocument();
            expect(screen.getByTestId('weekdays')).toBeInTheDocument();
            expect(screen.getByTestId('tourist-tax')).toBeInTheDocument();
            expect(screen.getByTestId('compare-price-module-toggle')).toBeInTheDocument();
            expect(screen.getByText(props.changesLabel)).toBeInTheDocument();
            expect(screen.getByText(SitecoreDictionary.ComparePriceModuleBestValue)).toBeInTheDocument();
            expect(screen.getByText(props.freeForKidsLabel)).toBeInTheDocument();
            expect(screen.getByTestId('compare-price-calendar')).toBeInTheDocument();
        });

        it('should pass correct props to ComparePriceModuleToggle', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(mockComparePriceModuleToggle).toHaveBeenCalledWith({
                cheapestRoomLabel: 'Cheapest Room',
                isEnabled: true,
                keepRoomLabel: 'Keep Room',
                onReload: expect.any(Function),
                selectedDate: new Date('2024-01-01'),
                setActiveDate: expect.any(Function),
            });
        });
    });

    describe('Conditional Rendering', () => {
        it('should NOT render calendar when isDisplayed is false', () => {
            props.isDisplayed = false;

            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByText(props.holidayDurationLabel)).toBeInTheDocument();
            expect(screen.queryByTestId('compare-price-calendar')).not.toBeInTheDocument();
            expect(mockComparePriceCalendarComponent).not.toHaveBeenCalled();
        });

        it('should NOT render promo legend when isPromoDisplayed is false', () => {
            props.isPromoDisplayed = false;

            render(<ComparePriceCalendar {...props} />);

            expect(screen.queryByText(SitecoreDictionary.ComparePriceModuleBestValue)).not.toBeInTheDocument();
            expect(screen.queryByTestId('compare-prices-best-value-icon')).not.toBeInTheDocument();
        });

        it('should NOT render freeForKids legend when isFreeForKidsDisplayed is false', () => {
            props.isFreeForKidsDisplayed = false;

            render(<ComparePriceCalendar {...props} />);

            expect(screen.queryByText(props.freeForKidsLabel)).not.toBeInTheDocument();
            expect(screen.queryByTestId('compare-prices-free-for-kids-icon')).not.toBeInTheDocument();
        });

        it('should NOT render changes icon when isCheapest is true', () => {
            props.isCheapest = true;

            render(<ComparePriceCalendar {...props} />);

            expect(screen.queryByText(props.changesLabel)).not.toBeInTheDocument();
            expect(screen.queryByTestId('compare-prices-changes-icon')).not.toBeInTheDocument();
        });

        it('should render changes icon when isCheapest is undefined', () => {
            props.isCheapest = undefined;

            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByText(props.changesLabel)).toBeInTheDocument();
            expect(screen.getByTestId('compare-prices-changes-icon')).toBeInTheDocument();
        });

        it('should render changes icon when isCheapest is false', () => {
            props.isCheapest = false;

            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByText(props.changesLabel)).toBeInTheDocument();
            expect(screen.getByTestId('compare-prices-changes-icon')).toBeInTheDocument();
        });
    });

    describe('Props Verification', () => {
        it('should pass correct props to ComparePriceCalendar', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(mockComparePriceCalendarComponent).toHaveBeenCalledWith({
                activeDate: props.activeDate,
                holidayDuration: props.holidayDuration,
                selectedDate: props.selectedDate,
                changeActiveDate: expect.any(Function),
                isBestValueEnabled: true,
                isResetingSelectedOffer: props.isResetingSelectedOffer,
                weekdaysContainerClass: 'weekdays',
                isFreeForKidsEnabled: true,
                isCheapest: false,
            });
        });

        it('should pass isCheapest=true to ComparePriceCalendar when isCheapest is true', () => {
            props.isCheapest = true;

            render(<ComparePriceCalendar {...props} />);

            expect(mockComparePriceCalendarComponent).toHaveBeenCalledWith({
                activeDate: props.activeDate,
                holidayDuration: props.holidayDuration,
                selectedDate: props.selectedDate,
                changeActiveDate: expect.any(Function),
                isBestValueEnabled: true,
                isResetingSelectedOffer: props.isResetingSelectedOffer,
                weekdaysContainerClass: 'weekdays',
                isFreeForKidsEnabled: true,
                isCheapest: true,
            });
        });

        it('should pass isCheapest=undefined to ComparePriceCalendar when isCheapest is undefined', () => {
            props.isCheapest = undefined;

            render(<ComparePriceCalendar {...props} />);

            expect(mockComparePriceCalendarComponent).toHaveBeenCalledWith({
                activeDate: props.activeDate,
                holidayDuration: props.holidayDuration,
                selectedDate: props.selectedDate,
                changeActiveDate: expect.any(Function),
                isBestValueEnabled: true,
                isResetingSelectedOffer: props.isResetingSelectedOffer,
                weekdaysContainerClass: 'weekdays',
                isFreeForKidsEnabled: true,
                isCheapest: undefined,
            });
        });

        it('should pass correct props to ComparePriceModuleToggle', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(mockComparePriceModuleToggle).toHaveBeenCalledWith(props.toggleProps);
        });

        it('should render ComparePriceTouristTax with correct label', () => {
            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByTestId('tourist-tax')).toHaveTextContent('touristTaxLabel');
        });

        it('should render ComparePriceTouristTax with undefined label', () => {
            props.touristTaxLabel = undefined;

            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByTestId('tourist-tax')).toBeInTheDocument();
        });
    });

    describe('Legend Icons and Labels', () => {
        it('should render all legend icons when all flags are true and isCheapest is false', () => {
            props.isCheapest = false;
            props.isPromoDisplayed = true;
            props.isFreeForKidsDisplayed = true;

            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByTestId('compare-prices-changes-icon')).toBeInTheDocument();
            expect(screen.getByTestId('compare-prices-best-value-icon')).toBeInTheDocument();
            expect(screen.getByTestId('compare-prices-free-for-kids-icon')).toBeInTheDocument();
        });

        it('should only render promo and freeForKids icons when isCheapest is true', () => {
            props.isCheapest = true;
            props.isPromoDisplayed = true;
            props.isFreeForKidsDisplayed = true;

            render(<ComparePriceCalendar {...props} />);

            expect(screen.queryByTestId('compare-prices-changes-icon')).not.toBeInTheDocument();
            expect(screen.getByTestId('compare-prices-best-value-icon')).toBeInTheDocument();
            expect(screen.getByTestId('compare-prices-free-for-kids-icon')).toBeInTheDocument();
        });

        it('should render correct label text for all legends', () => {
            props.isCheapest = false;

            render(<ComparePriceCalendar {...props} />);

            expect(screen.getByTestId('compare-prices-changes-label')).toHaveTextContent('changesLabel');
            expect(screen.getByTestId('compare-prices-best-value-label')).toHaveTextContent(
                SitecoreDictionary.ComparePriceModuleBestValue,
            );
            expect(screen.getByTestId('compare-prices-free-for-kids-label')).toHaveTextContent('freeForKidsLabel');
        });
    });
});

describe('<CalendarTabTitle />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('should be rendered', () => {
        const { container } = render(<CalendarTabTitle />);

        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.ComparePriceModuleCalendarView)).toBeInTheDocument();
    });
});
