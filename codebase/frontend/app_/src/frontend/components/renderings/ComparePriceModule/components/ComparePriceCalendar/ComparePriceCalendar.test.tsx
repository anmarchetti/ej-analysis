import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Instance } from 'flatpickr/dist/types/instance';
import { axe, toHaveNoViolations } from 'jest-axe';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';

import { ComparePriceCalendar } from './ComparePriceCalendar';

expect.extend(toHaveNoViolations);

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Spinner', () => ({
    __esModule: true,
    Spinner: () => <div data-tid='spinner' />,
}));

const mockFlatPickerProps = jest.fn();
jest.mock('frontend/components/common/Calendar/components/FlatPickerDynamic', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/components/common/Calendar/components/FlatPickerDynamic'),
    DynamicFlatPicker: ({ onDayCreate, ...props }) => {
        mockFlatPickerProps(props);
        onDayCreate(undefined, undefined, undefined, mockDayElement);

        return <div data-tid='flat-picker-dynamic' onClick={props.onChange} />;
    },
}));

const mockDayElement = {
    classList: {
        add: jest.fn(),
        remove: jest.fn(),
    },
    dateObj: new Date('2021-01-01'),
    tabIndex: -1,
    appendChild: jest.fn(),
};

describe('<ComparePriceCalendar />', () => {
    const resetMocks = () => ({
        resetToInitial: jest.fn(),
        getSetting: jest.fn(),
        getPhrase: jest.fn(),
        holidayDuration: 2,
        activeDate: new Date(),
        changeActiveDate: jest.fn(),
        alternativeOffers: new Map<number, IAlternativeOffer>([
            [new Date().getTime(), {} as IOffer],
            [new Date().getTime(), {} as IOffer],
        ]),
        loadAlternativeOffersForCalendar: jest.fn(),
        bestPriceOffers: new Map<number, IAlternativeOffer>(),
        isMobileView: false,
        isLoadingAlternativeDates: false,
        priceGraphPopupVisible: false,
        selectedDate: new Date(),
        isResetingSelectedOffer: false,
        isExtrasPage: false,
        selectedOffer: {} as Nullable<IOfferWithoutAltBoards>,
        isBestValueEnabled: true,
        currency: CurrencyCode.GBP,
        formatMoney: jest.fn(a => `£${a}`),
        getCurrencySymbol: jest.fn(() => `£`),
        changesRequired: jest.fn(),
        totalPriceWithTouristTax: 100,
    });

    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createMockStores();
    });

    it('should standard render', () => {
        mockProps.alternativeOffers = new Map();
        const { container } = render(<ComparePriceCalendar {...mockProps} />);

        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
        expect(container.querySelector('.compare-price-calendar')).toBeInTheDocument();
    });

    it('should show Spinner', () => {
        mockProps.alternativeOffers = new Map();
        mockProps.isLoadingAlternativeDates = true;
        const { container } = render(<ComparePriceCalendar {...mockProps} />);

        expect(screen.getByTestId('spinner')).toBeInTheDocument();
        expect(container.querySelector('.compare-price-calendar__wrapper')).not.toBeInTheDocument();
        expect(screen.queryByTestId('flat-picker-dynamic')).not.toBeInTheDocument();
    });

    it('should show Spinner mobile', () => {
        mockProps.isLoadingAlternativeDates = true;
        mockProps.isMobileView = true;
        mockProps.alternativeOffers = new Map();
        render(<ComparePriceCalendar {...mockProps} />);

        expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should show Flatpickr', () => {
        render(<ComparePriceCalendar {...mockProps} />);

        expect(screen.getByTestId('flat-picker-dynamic')).toBeInTheDocument();
        expect(mockFlatPickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                calendarRef: { current: null },
                options: expect.objectContaining({
                    allowInput: false,
                    inline: true,
                    showMonths: 2,
                    animate: false,
                    disable: expect.any(Array),
                }),
                onChange: expect.any(Function),
                onMonthChange: expect.any(Function),
                onReady: expect.any(Function),
            }),
        );

        expect(mockDayElement.classList.remove).toHaveBeenCalledWith([
            'in-range',
            'arrival-date',
            'not-available',
            'available',
            'best-price',
        ]);

        expect(mockDayElement.tabIndex).toBe(-1);
    });

    it('should add tabIndex 0 on onDayCreate when date is available', () => {
        mockProps.alternativeOffers = new Map([
            [new Date('2021-01-01').getTime(), { price: 100, rooms: [{ isFreeForKids: false }] }],
        ]);

        const appendIcon = jest.spyOn(ComparePriceCalendar, 'appendIcon');

        render(<ComparePriceCalendar {...mockProps} />);

        expect(mockDayElement.tabIndex).toBe(0);
        expect(appendIcon).not.toHaveBeenCalled();
    });

    it('should add free-kids icon when offer contains isFreeForKids true option', () => {
        mockProps.alternativeOffers = new Map([
            [new Date('2021-01-01').getTime(), { price: 100, rooms: [{ isFreeForKids: true }] }],
        ]);
        mockProps.isFreeForKidsEnabled = true;

        const appendIcon = jest.spyOn(ComparePriceCalendar, 'appendIcon');

        render(<ComparePriceCalendar {...mockProps} />);

        expect(appendIcon).toHaveBeenCalledTimes(1);
    });

    it('should add class is spinner shown', () => {
        mockProps.isMobileView = true;
        mockProps.isLoadingAlternativeDates = true;
        const { container } = render(<ComparePriceCalendar {...mockProps} />);

        expect(container.querySelector('.d-none')).toBeInTheDocument();
    });

    it('should call changeActiveDate', async () => {
        render(<ComparePriceCalendar {...mockProps} />);

        await userEvent.click(screen.getByTestId('flat-picker-dynamic'));

        expect(mockProps.changeActiveDate).toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<ComparePriceCalendar {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });

    describe('updateMobileMonthHeights', () => {
        let rafSpy: jest.SpyInstance;

        beforeEach(() => {
            rafSpy = jest.spyOn(global, 'requestAnimationFrame').mockImplementation(cb => {
                cb(0);

                return 0;
            });
        });

        afterEach(() => {
            rafSpy.mockRestore();
        });

        it('should return early when not in mobile view', () => {
            mockProps.isMobileView = false;
            const component = new ComparePriceCalendar(mockProps);

            component['updateMobileMonthHeights']();

            expect(rafSpy).not.toHaveBeenCalled();
        });

        it('should return early when refMobileMonthsContainer is not set', () => {
            mockProps.isMobileView = true;
            const component = new ComparePriceCalendar(mockProps);

            Object.defineProperty(component['refMobileMonthsContainer'], 'current', {
                value: null,
                writable: true,
            });

            component['updateMobileMonthHeights']();

            expect(rafSpy).not.toHaveBeenCalled();
        });

        it('should call requestAnimationFrame when in mobile view and ref is set', () => {
            mockProps.isMobileView = true;
            const component = new ComparePriceCalendar(mockProps);

            Object.defineProperty(component['refMobileMonthsContainer'], 'current', {
                value: {
                    querySelectorAll: jest.fn().mockReturnValue([]),
                },
                writable: true,
            });

            component['updateMobileMonthHeights']();

            expect(rafSpy).toHaveBeenCalled();
        });

        it('should call scrollToMonth when scrollToMonthIndex is provided', () => {
            mockProps.isMobileView = true;
            const component = new ComparePriceCalendar(mockProps);

            Object.defineProperty(component['refMobileMonthsContainer'], 'current', {
                value: {
                    querySelectorAll: jest.fn().mockReturnValue([]),
                },
            });

            const scrollMock = jest.fn();
            Object.defineProperty(component, 'scrollToMonth', {
                value: scrollMock,
            });

            component['updateMobileMonthHeights'](1);

            expect(rafSpy).toHaveBeenCalled();
            expect(scrollMock).toHaveBeenCalledWith(1);
        });
    });

    describe('componentDidUpdate - isCheapest toggle handling', () => {
        it('should reset firstShownMonth when isCheapest changes from false to true (desktop)', () => {
            mockProps.isCheapest = false;
            mockProps.isMobileView = false;
            const activeDate = new Date('2024-05-15');
            mockProps.activeDate = activeDate;

            const component = new ComparePriceCalendar(mockProps);

            component['changeFirstShownMonth'](new Date('2024-06-01'));
            expect(component['firstShownMonth'].getTime()).toBe(new Date('2024-06-01').getTime());

            component.componentDidUpdate({ ...mockProps, isCheapest: false });
            mockProps.isCheapest = true;
            component.componentDidUpdate({ ...mockProps, isCheapest: false });

            expect(component['firstShownMonth'].getTime()).toBe(activeDate.getTime());
        });

        it('should reset firstShownMonth when isCheapest changes from true to false (desktop)', () => {
            mockProps.isCheapest = true;
            mockProps.isMobileView = false;
            const activeDate = new Date('2024-05-15');
            mockProps.activeDate = activeDate;

            const component = new ComparePriceCalendar(mockProps);

            component['changeFirstShownMonth'](new Date('2024-06-01'));
            expect(component['firstShownMonth'].getTime()).toBe(new Date('2024-06-01').getTime());

            mockProps.isCheapest = false;
            component.componentDidUpdate({ ...mockProps, isCheapest: true });

            expect(component['firstShownMonth'].getTime()).toBe(activeDate.getTime());
        });

        it('should reset firstShownMonth when isCheapest changes (mobile)', () => {
            mockProps.isCheapest = false;
            mockProps.isMobileView = true;
            const activeDate = new Date('2024-05-15');
            mockProps.activeDate = activeDate;

            const component = new ComparePriceCalendar(mockProps);

            component['changeFirstShownMonth'](new Date('2024-06-01'));
            expect(component['firstShownMonth'].getTime()).toBe(new Date('2024-06-01').getTime());

            mockProps.isCheapest = true;
            component.componentDidUpdate({ ...mockProps, isCheapest: false });

            const expectedDate = new Date('2024-04-15');
            expect(component['firstShownMonth'].getTime()).toBe(expectedDate.getTime());
        });

        it('should NOT reset firstShownMonth when isCheapest is unchanged', () => {
            mockProps.isCheapest = false;
            mockProps.isMobileView = false;
            const activeDate = new Date('2024-05-15');
            mockProps.activeDate = activeDate;

            const component = new ComparePriceCalendar(mockProps);

            const originalDate = new Date('2024-06-01');
            component['changeFirstShownMonth'](originalDate);
            expect(component['firstShownMonth'].getTime()).toBe(originalDate.getTime());

            component.componentDidUpdate({ ...mockProps, isCheapest: false });

            expect(component['firstShownMonth'].getTime()).toBe(originalDate.getTime());
        });

        it('should NOT reset firstShownMonth on first render when prevProps.isCheapest is undefined', () => {
            mockProps.isCheapest = true;
            mockProps.isMobileView = false;
            const activeDate = new Date('2024-05-15');
            mockProps.activeDate = activeDate;

            const component = new ComparePriceCalendar(mockProps);
            const originalDate = new Date('2024-06-01');
            component['changeFirstShownMonth'](originalDate);

            component.componentDidUpdate({ ...mockProps, isCheapest: undefined });

            expect(component['firstShownMonth'].getTime()).toBe(originalDate.getTime());
        });
    });

    describe('handleDataLoad', () => {
        it('should call loadAlternativeOffersForCalendar and changeFirstShownMonth with activeDate for desktop', async () => {
            mockProps.isMobileView = false;
            mockProps.activeDate = new Date('2024-05-15');
            mockProps.loadAlternativeOffersForCalendar = jest.fn().mockResolvedValue(undefined);

            const component = new ComparePriceCalendar(mockProps);

            const changeFirstShownMonthMock = jest.fn();
            Object.defineProperty(component, 'changeFirstShownMonth', {
                value: changeFirstShownMonthMock,
            });

            await component['handleDataLoad']();

            expect(mockProps.loadAlternativeOffersForCalendar).toHaveBeenCalled();
            expect(changeFirstShownMonthMock).toHaveBeenCalledWith(mockProps.activeDate);
        });

        it('should call loadAlternativeOffersForCalendar, getPreviousMonthDate, and changeFirstShownMonth for mobile', async () => {
            mockProps.isMobileView = true;
            mockProps.activeDate = new Date('2024-05-15');
            mockProps.loadAlternativeOffersForCalendar = jest.fn().mockResolvedValue(undefined);

            const component = new ComparePriceCalendar(mockProps);

            const changeFirstShownMonthMock = jest.fn();
            Object.defineProperty(component, 'changeFirstShownMonth', {
                value: changeFirstShownMonthMock,
            });

            await component['handleDataLoad']();

            expect(mockProps.loadAlternativeOffersForCalendar).toHaveBeenCalled();
            expect(changeFirstShownMonthMock).toHaveBeenCalled();
        });
    });

    describe('onReady', () => {
        let rafSpy: jest.SpyInstance;

        beforeEach(() => {
            rafSpy = jest.spyOn(global, 'requestAnimationFrame').mockImplementation(cb => {
                cb(0);

                return 0;
            });
        });

        afterEach(() => {
            rafSpy.mockRestore();
        });

        it('should wrap updateMobileMonthHeights call in RAF to ensure container is rendered', () => {
            mockProps.isMobileView = true;
            mockProps.activeDate = new Date('2024-05-15');

            const component = new ComparePriceCalendar(mockProps);
            const updateMobileMonthHeightsMock = jest.fn();
            Object.defineProperty(component, 'updateMobileMonthHeights', {
                value: updateMobileMonthHeightsMock,
            });

            const originalSetState = component.setState;
            component.setState = jest.fn((state, callback) => {
                component.state = { ...component.state, ...state };

                if (callback) {
                    callback();
                }
            });

            const mockInstance: Partial<Instance> = {
                jumpToDate: jest.fn(),
            };

            component['onReady']([], '', mockInstance as Instance);

            expect(rafSpy).toHaveBeenCalled();
            expect(updateMobileMonthHeightsMock).toHaveBeenCalledWith(1);

            component.setState = originalSetState;
        });

        it('should call jumpToDate with correct firstMonth on mobile', () => {
            mockProps.isMobileView = true;
            mockProps.activeDate = new Date('2024-05-15');

            const component = new ComparePriceCalendar(mockProps);
            const mockInstance: Partial<Instance> = {
                jumpToDate: jest.fn(),
            };

            component['onReady']([], '', mockInstance as Instance);

            expect(mockInstance.jumpToDate).toHaveBeenCalledWith(new Date('2024-04-01'));
        });

        it('should set isCalendarReady state to true', () => {
            mockProps.isMobileView = false;
            const component = new ComparePriceCalendar(mockProps);
            const setStateSpy = jest.spyOn(component, 'setState');

            const mockInstance: Partial<Instance> = {
                jumpToDate: jest.fn(),
            };

            component['onReady']([], '', mockInstance as Instance);

            expect(setStateSpy).toHaveBeenCalledWith({ isCalendarReady: true }, expect.any(Function));
        });

        it('should NOT call jumpToDate on desktop', () => {
            mockProps.isMobileView = false;
            mockProps.activeDate = new Date('2024-05-15');

            const component = new ComparePriceCalendar(mockProps);
            const mockInstance: Partial<Instance> = {
                jumpToDate: jest.fn(),
            };

            component['onReady']([], '', mockInstance as Instance);

            expect(mockInstance.jumpToDate).not.toHaveBeenCalled();
        });
    });
});
