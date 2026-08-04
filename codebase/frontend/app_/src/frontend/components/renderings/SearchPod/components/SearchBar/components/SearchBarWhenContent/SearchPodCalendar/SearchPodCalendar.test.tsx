import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';

import { createMockStores } from 'frontend/__mocks__';
import { UNAVAILABLE_OVERLAY_CLASS } from 'frontend/components/common/Calendar/components/calendar.utils';
import useReactDataPickerFocus from 'frontend/components/renderings/SearchPod/hooks/useReactDataPickerFocus';

import SearchPodCalendar from './SearchPodCalendar';

import styles from './SearchPodCalendar.module.scss';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockMonthDiff = 7;
jest.mock('frontend/utils/date.utils', () => ({
    getCountOfNightLabel: (count: number) => `${count} nights`,
    getMonthsDifference: () => mockMonthDiff,
}));

let mockIsMobile = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => mockIsMobile,
}));

const mockIsDateAvailable = jest.fn();
jest.mock('frontend/utils/dateAvailability.utils', () => ({
    __esModule: true,
    isDateAvailable: date => mockIsDateAvailable(date),
}));

const mockReactDatepickerProps = jest.fn();
jest.mock('react-datepicker', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        default: forwardRef((props, ref: any) => {
            mockReactDatepickerProps(props);

            return (
                <div data-tid='react-datepicker' className='react-datepicker-sp-calendar' ref={ref}>
                    <div
                        data-tid='change-month-to-current-month'
                        onClick={() => props.onMonthChange(new Date('2025-06-01'))}
                    />
                    <div
                        data-tid='change-month-to-future-month'
                        onClick={() => props.onMonthChange(new Date('2025-10-01'))}
                    />
                    <div data-tid='react-datepicker-change-from' onClick={() => props.onChange([new Date(), null])} />
                    <div
                        data-tid='react-datepicker-change-from-to-as-same-date'
                        onClick={() => props.onChange([new Date(), new Date()])}
                    />
                    <div>{props.renderDayContents('23', new Date('2025-12-23'))}</div>
                    <div
                        data-tid='react-datepicker-change-from-to'
                        onClick={() => props.onChange([new Date('2025-08-12'), new Date('2025-08-13')])}
                    />
                    <div className='react-datepicker__month-container'>
                        <div className='react-datepicker__month'>{props.renderCustomHeader()}</div>
                    </div>
                </div>
            );
        }),
    };
});

jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/components/YearDropdown',
    () => () => <div data-tid='year-dropdown' />,
);

jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/components/SPMonthHeader',
    () => () =>
        (
            <>
                <div data-tid='sp-month-header' className='react-datepicker-month-name'>
                    July 2025
                </div>
                <div data-tid='sp-month-header' className='react-datepicker-month-name'>
                    November 2025
                </div>
            </>
        ),
);

jest.mock('frontend/components/renderings/SearchPod/hooks/useReactDataPickerFocus');

jest.mock('frontend/components/common/FlyingPlaneAnimation/FlyingPlaneAnimation', () => () => (
    <div data-tid='flying-plane-animation' />
));

const mockedFlexibilityValue = 1;
jest.mock('frontend/components/common/Pills/FlexibilityPills/FlexibilityPills', () => ({ onChange }) => (
    <div data-tid='flexibility-pills' onClick={() => onChange(mockedFlexibilityValue)} />
));

const mockGetFirstDisplayedMonthOnDesktop = new Date('2025-06-01');
jest.mock(
    'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/SearchPodCalendar.utils',
    () => ({
        ...jest.requireActual(
            'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarWhenContent/SearchPodCalendar/SearchPodCalendar.utils',
        ),
        getFirstDisplayedMonthOnDesktop: () => mockGetFirstDisplayedMonthOnDesktop,
    }),
);

let mockStores;

describe('SearchPodCalendar', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-06-01')); // June 01, 2025
        dayjs.locale('en-gb');
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        mockIsDateAvailable.mockReturnValue(true);

        mockStores = createMockStores({
            searchStore: {
                searchWhen: {
                    lastAvailableDate: new Date('2025-12-31'),
                    isAvailableDatesLoading: false,
                    availableDates: [
                        { in: true, out: false, date: new Date('2025-06-01') }, // excluded as it is MIN_DAYS_AHEAD
                        { in: false, out: true, date: new Date('2025-06-02') }, // excluded as it is MIN_DAYS_AHEAD
                        { in: false, out: true, date: new Date('2025-06-03') },
                        { in: true, out: false, date: new Date('2025-06-04') },
                    ],
                    from: new Date('2025-06-03'),
                    to: new Date('2025-06-04'),
                    onChangeFlexible: jest.fn(),
                    flexDays: 0,
                    selectedNumberOfNights: 1,
                    onChangeDates: jest.fn(),
                    changeDateAvailabilityInterval: jest.fn(),
                    updateAvailableDates: jest.fn(),
                },
            },
            trackingStore: {
                searchPod: {
                    trackWhenDropdownSelection: jest.fn(),
                    trackWhenFlexibilityChange: jest.fn(),
                },
            },
        });
        mockIsMobile = true;
    });

    it('should render calendar with all main blocks on mobile', () => {
        const { container } = render(<SearchPodCalendar />);

        expect(screen.getByTestId('search-pod-calendar-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('react-datepicker')).toBeInTheDocument();
        expect(screen.getByTestId('year-dropdown')).toBeInTheDocument();
        expect(screen.getAllByTestId('sp-month-header').length).toBe(2);
        expect(screen.getByTestId('flexibility-pills')).toBeInTheDocument();
        expect(screen.getByTestId('date-picker-day')).toBeInTheDocument();
        expect(useReactDataPickerFocus).toHaveBeenCalled();
        expect(mockReactDatepickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                inline: true,
                monthsShown: mockMonthDiff,
                selectsRange: true,
                selectsDisabledDaysInRange: true,
                onChange: expect.any(Function),
                startDate: mockStores.searchStore.searchWhen.from,
                endDate: mockStores.searchStore.searchWhen.to,
                minDate: new Date('2025-06-03'),
                maxDate: mockStores.searchStore.searchWhen.lastAvailableDate,
                openToDate: new Date('2025-06-03'),
                filterDate: expect.any(Function),
            }),
        );
        expect(mockIsDateAvailable).toHaveBeenCalledWith(expect.any(Date));

        // week names
        const weekNamesDiv = container.querySelector(`.${styles.weekNames}`);
        const weekNames = Array.from(weekNamesDiv!.querySelectorAll('span')).map(el => el.textContent);

        expect(weekNames).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
    });

    it('should render calendar with all main blocks on desktop', () => {
        mockIsMobile = false;
        render(<SearchPodCalendar />);

        expect(screen.getByTestId('react-datepicker')).toBeInTheDocument();
        expect(screen.getAllByTestId('sp-month-header').length).toBe(2);
        expect(screen.getByTestId('flexibility-pills')).toBeInTheDocument();
        expect(screen.getByTestId('nights-selected-label')).toHaveTextContent('1 nights');
        expect(useReactDataPickerFocus).toHaveBeenCalled();
        expect(mockReactDatepickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                monthsShown: 2,
                openToDate: mockGetFirstDisplayedMonthOnDesktop,
            }),
        );
    });

    it('should pass empty string when only from is selected (0 nights)', () => {
        mockIsMobile = false;
        mockStores.searchStore.searchWhen.selectedNumberOfNights = 0;

        render(<SearchPodCalendar />);
        expect(screen.getByTestId('nights-selected-label')).toHaveTextContent('');
    });

    describe('onChange', () => {
        it('should call onChangeDates, updateAvailableDates and trackWhenDropdownSelection when date range is selected', () => {
            render(<SearchPodCalendar />);

            fireEvent.click(screen.getByTestId('react-datepicker-change-from-to'));

            expect(mockStores.searchStore.searchWhen.onChangeDates).toHaveBeenCalledWith([
                new Date('2025-08-12'),
                new Date('2025-08-13'),
            ]);
            expect(mockStores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalledWith(false);
            expect(mockStores.trackingStore.searchPod.trackWhenDropdownSelection).toHaveBeenCalled();
        });

        it('should not call onChangeDates and updateAvailableDates when from and to are the same', () => {
            render(<SearchPodCalendar />);

            fireEvent.click(screen.getByTestId('react-datepicker-change-from-to-as-same-date'));

            expect(mockStores.searchStore.searchWhen.onChangeDates).not.toHaveBeenCalled();
            expect(mockStores.searchStore.searchWhen.updateAvailableDates).not.toHaveBeenCalled();
        });

        it('should call onChangeDates and updateAvailableDates with only from date if to is null', () => {
            render(<SearchPodCalendar />);

            fireEvent.click(screen.getByTestId('react-datepicker-change-from'));

            expect(mockStores.searchStore.searchWhen.onChangeDates).toHaveBeenCalledWith([new Date()]);
            expect(mockStores.searchStore.searchWhen.updateAvailableDates).toHaveBeenCalledWith(false);
        });
    });

    it('should scroll to selected month on mobile', () => {
        mockStores.searchStore.searchWhen.from = new Date('2025-11-15');
        mockStores.searchStore.searchWhen.to = new Date('2025-11-20');
        render(<SearchPodCalendar />);

        const datePicker = screen.getByTestId('react-datepicker');
        datePicker.scrollTo = jest.fn();
        jest.runAllTimers();

        expect(datePicker.scrollTo).toHaveBeenCalled();
    });

    describe('Unavailable months overlay', () => {
        it('should show unavailable months overlay if availableDates present', () => {
            mockStores.searchStore.searchWhen.from = null;
            mockStores.searchStore.searchWhen.availableDates = [
                { in: false, out: false, date: new Date('2025-07-01') },
                { in: false, out: false, date: new Date('2025-07-02') },
            ];
            const { container } = render(<SearchPodCalendar />);

            expect(container.querySelector(`.${UNAVAILABLE_OVERLAY_CLASS}`)).toBeInTheDocument();
        });

        it('should add unavailable months overlay for last month added by date picker when there is no availableDates', () => {
            mockIsMobile = false;
            mockStores.searchStore.searchWhen.availableDates = [];
            mockStores.searchStore.searchWhen.lastAvailableDate = new Date('2025-06-30');

            const { container } = render(<SearchPodCalendar />);

            expect(container.querySelector(`.${UNAVAILABLE_OVERLAY_CLASS}`)).toBeInTheDocument();
        });

        it('should not add unavailable months overlay for last month when there is no availableDates on mobile', () => {
            mockStores.searchStore.searchWhen.availableDates = [];
            mockStores.searchStore.searchWhen.lastAvailableDate = new Date('2025-06-30');

            const { container } = render(<SearchPodCalendar />);

            expect(container.querySelector(`.${UNAVAILABLE_OVERLAY_CLASS}`)).not.toBeInTheDocument();
        });
    });

    describe('Loader', () => {
        it('should render loading animation on mobile when isAvailableDatesLoading is true', () => {
            mockStores.searchStore.searchWhen.isAvailableDatesLoading = true;
            render(<SearchPodCalendar />);
            expect(screen.getByTestId('flying-plane-animation')).toBeInTheDocument();
        });

        it('should NOT show loading animation on desktop when isAvailableDatesLoading is true but availability for displayed months are loaded', () => {
            mockIsMobile = false;
            mockStores.searchStore.searchWhen.isAvailableDatesLoading = true;
            mockStores.searchStore.searchWhen.availableDates = [{ in: true, out: false, date: new Date('2025-07-01') }];

            render(<SearchPodCalendar />);

            expect(screen.queryByTestId('flying-plane-animation')).not.toBeInTheDocument();
        });

        it('should show loading animation on desktop when isAvailableDatesLoading is true and availability for displayed months are not loaded', () => {
            mockIsMobile = false;
            mockStores.searchStore.searchWhen.isAvailableDatesLoading = true;
            mockStores.searchStore.searchWhen.availableDates = [{ in: true, out: false, date: new Date('2025-04-01') }];

            render(<SearchPodCalendar />);

            expect(screen.queryByTestId('flying-plane-animation')).toBeInTheDocument();
        });
    });

    describe('changeDateAvailabilityInterval', () => {
        it('should call changeDateAvailabilityInterval on month change', () => {
            render(<SearchPodCalendar />);

            fireEvent.click(screen.getByTestId('change-month-to-future-month'));

            expect(mockStores.searchStore.searchWhen.changeDateAvailabilityInterval).toHaveBeenCalledWith(
                new Date('2025-08-28T00:00:00.000Z'),
                new Date('2026-01-03T00:00:00.000Z'),
            );
        });

        it('should set startDate to now if the calculated startDate is less than the current date', () => {
            render(<SearchPodCalendar />);

            fireEvent.click(screen.getByTestId('change-month-to-current-month'));

            expect(mockStores.searchStore.searchWhen.changeDateAvailabilityInterval).toHaveBeenCalledWith(
                new Date('2025-06-01T00:00:00.000Z'),
                new Date('2025-09-03T00:00:00.000Z'),
            );
        });
    });

    it('should call onChangeFlexible and trackWhenFlexibilityChange when flexibility pill is changed', () => {
        render(<SearchPodCalendar />);

        fireEvent.click(screen.getByTestId('flexibility-pills'));

        expect(mockStores.searchStore.searchWhen.onChangeFlexible).toHaveBeenCalledWith(mockedFlexibilityValue);
        expect(mockStores.trackingStore.searchPod.trackWhenFlexibilityChange).toHaveBeenCalledWith();
    });
});
