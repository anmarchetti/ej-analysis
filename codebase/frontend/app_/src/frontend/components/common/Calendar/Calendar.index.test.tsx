import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { CalendarType } from './IDatePickerProps';
import Calendar, { ICalendarProps } from './index';

let mockProps: ICalendarProps;
let mockStores;

const mockCalendarDesktopProps = jest.fn();
jest.mock('./CalendarDesktop', () => ({
    __esModule: true,
    default: props => {
        mockCalendarDesktopProps(props);

        return <div data-tid='calendar-desktop' />;
    },
}));

const mockCalendarMobileProps = jest.fn();
jest.mock('./CalendarMobile', () => ({
    __esModule: true,
    default: props => {
        mockCalendarMobileProps(props);

        return <div data-tid='calendar-mobile' />;
    },
}));

const mockUseMobileViewport = jest.fn();
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport(),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('Calendar main', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            currentDates: [new Date('2024-12-11'), new Date('2024-12-12')],
            numberOfNights: 3,
            setDates: jest.fn(),
            calendarEnd: new Date('2025-11-11'),
            calendarStart: new Date('2024-11-11'),
            calendarType: CalendarType.Inline,
            clearDates: jest.fn(),
            confirmDates: jest.fn(),
            desktopCalendarEndDate: new Date('2025-11-12'),
            focusOnMount: false,
            isContinueDisabled: false,
            isDatePickerOpen: false,
            isSubmitLoading: false,
            onCloseClick: jest.fn(),
            onContinueClick: jest.fn(),
            onDayCreate: jest.fn(),
            overlayDisabledMonths: false,
            selectedDates: [new Date('2024-12-13'), new Date('2024-12-14')],
            selectedMonth: new Date('2024-11-01'),
            setPastHoliday: jest.fn(),
            setSelectedMonth: jest.fn(),
        };
    });

    it('should render component for desktop viewport', () => {
        render(<Calendar {...mockProps} />);

        expect(screen.getByTestId('calendar-desktop')).toBeInTheDocument();
        expect(mockCalendarDesktopProps).toHaveBeenCalledWith({
            refFpCalendar: { current: null },
            currentDates: [new Date('2024-12-11T00:00:00.000Z'), new Date('2024-12-12T00:00:00.000Z')],
            minDate: mockProps.calendarStart,
            maxDate: mockProps.desktopCalendarEndDate,
            numberOfNights: 3,
            nightsSelectedLabel: SitecoreDictionary.DatePickerLabelsSelectedNights,
            focusCalendar: expect.any(Function),
            setDates: mockProps.setDates,
            onDayCreate: mockProps.onDayCreate,
            monthOptions: [
                'Fri Nov 01 2024',
                'Sun Dec 01 2024',
                'Wed Jan 01 2025',
                'Sat Feb 01 2025',
                'Sat Mar 01 2025',
                'Tue Apr 01 2025',
                'Thu May 01 2025',
                'Sun Jun 01 2025',
                'Tue Jul 01 2025',
                'Fri Aug 01 2025',
                'Mon Sep 01 2025',
                'Wed Oct 01 2025',
                'Sat Nov 01 2025',
            ],
            calendarType: CalendarType.Inline,
            isContinueDisabled: false,
            isDatePickerOpen: false,
            clearDates: mockProps.clearDates,
            confirmDates: mockProps.confirmDates,
            onCloseClick: mockProps.onCloseClick,
            onContinueClick: mockProps.onContinueClick,
            setPastHoliday: mockProps.setPastHoliday,
            selectedMonth: new Date('2024-11-01T00:00:00.000Z'),
            setSelectedMonth: mockProps.setSelectedMonth,
            selectedDates: [new Date('2024-12-13T00:00:00.000Z'), new Date('2024-12-14T00:00:00.000Z')],
            overlayDisabledMonths: false,
            isSubmitLoading: false,
            focusOnMount: false,
        });
        expect(screen.queryByTestId('calendar-mobile')).not.toBeInTheDocument();
    });

    it('should render component for desktop viewport with max date if no desktopCalendarEndDate props has been provided', () => {
        mockProps.desktopCalendarEndDate = undefined;
        render(<Calendar {...mockProps} />);

        expect(screen.getByTestId('calendar-desktop')).toBeInTheDocument();
        expect(mockCalendarDesktopProps).toHaveBeenCalledWith(
            expect.objectContaining({
                maxDate: mockProps.calendarEnd,
            }),
        );
        expect(screen.queryByTestId('calendar-mobile')).not.toBeInTheDocument();
    });
});
