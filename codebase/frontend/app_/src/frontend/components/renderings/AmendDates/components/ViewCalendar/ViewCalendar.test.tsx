import React from 'react';
import { render, screen } from '@testing-library/react';

import AmendDatesStore from 'frontend/store/holidays/amend/amendDates/AmendDatesStore';
import ViewCalendar from 'frontend/components/renderings/AmendDates/components/ViewCalendar/ViewCalendar';

const createMockStores = () => ({
    layoutStore: {
        getPhrase: p => p,
    },
    amendDatesStore: {
        startAmendDatesPage: jest.fn(),
        isError: false,
        selectedDates: [new Date('2023-05-11T12:10:00.000Z'), new Date('2023-05-13T12:10:00.000Z')],
        isInitialDataLoading: false,
    } as Partial<AmendDatesStore>,
    routerStore: {
        redirectToAmendDatesSummaryPage: jest.fn(),
    },
});

jest.mock('frontend/components/renderings/AmendDates/components/CalendarSkeleton/CalendarSkeleton', () => ({
    __esModule: true,
    default: () => <div>CalendarSkeleton</div>,
}));

const mockCalendarProps = jest.fn();
jest.mock('frontend/components/common/Calendar', () => ({
    __esModule: true,
    default: props => {
        mockCalendarProps(props);

        return <div data-tid='calendar' />;
    },
    CalendarType: {},
}));

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ViewCalendar />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('should render Calendar component with appropriate props', () => {
        mockStores.amendDatesStore.availableDates = ['2024-12-11', '2024-12-12'];
        mockStores.amendDatesStore.calendarEndDate = new Date('2025-12-11');
        render(<ViewCalendar />);

        expect(screen.getByTestId('calendar')).toBeInTheDocument();
        expect(mockCalendarProps).toHaveBeenCalledWith({
            calendarType: 'inline',
            selectedMonth: undefined,
            setSelectedMonth: undefined,
            currentDates: [new Date('2023-05-11T12:10:00.000Z'), new Date('2023-05-13T12:10:00.000Z')],
            numberOfNights: undefined,
            setDates: undefined,
            calendarStart: undefined,
            calendarEnd: new Date('2025-12-11T00:00:00.000Z'),
            desktopCalendarEndDate: new Date('2025-11-11T00:00:00.000Z'),
            selectedDates: [new Date('2023-05-11T12:10:00.000Z'), new Date('2023-05-13T12:10:00.000Z')],
            onDayCreate: undefined,
            overlayDisabledMonths: true,
            onContinueClick: undefined,
            isContinueDisabled: true,
            isSubmitLoading: undefined,
            focusOnMount: true,
        });
    });

    it('Render skeleton by default', () => {
        render(<ViewCalendar />);

        expect(screen.getByText('CalendarSkeleton')).toBeInTheDocument();
    });

    it('Render skeleton if loading is in progress', () => {
        mockStores.amendDatesStore.isInitialDataLoading = true;
        render(<ViewCalendar />);

        expect(screen.getByText('CalendarSkeleton')).toBeInTheDocument();
    });

    it('returns null when isError is true', () => {
        mockStores.amendDatesStore.isError = true;

        render(<ViewCalendar />);
        expect(screen.getByText('ViewBooking.ErrorMessages.TryAgainLater')).toBeInTheDocument();
    });

    it('renders Calendar when unavailableDates is set', () => {
        mockStores.amendDatesStore.selectedDates = undefined;
        mockStores.amendDatesStore.availableDates = ['date1', 'date2'];

        render(<ViewCalendar />);

        expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
});
