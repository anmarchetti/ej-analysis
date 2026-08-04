import React from 'react';
import { render, screen } from '@testing-library/react';

import CalendarWrapper, { TCalendarWrapperProps } from './CalendarWrapper';

jest.mock('frontend/components/renderings/ContactUs/store/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/ContactUs/store/createStore'),
    __esModule: true,
    useContactUsStore: jest.fn().mockReturnValue({
        isDatePickerOpen: true,
        currentDates: [],
        numberOfNights: 0,
        clearDates: jest.fn(),
        setDates: jest.fn(),
        closeDatePicker: jest.fn(),
        confirmDates: jest.fn(),
        setPastHoliday: jest.fn(),
    }),
}));

const mockCalendar = jest.fn();

jest.mock('frontend/components/common/Calendar', () => ({
    __esModule: true,
    default: props => {
        mockCalendar(props);

        return <div data-tid='calendar' />;
    },
}));

const createProps = (): TCalendarWrapperProps => ({
    monthLimit: 1,
});

let mockProps;

describe('CalendarWrapper', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render correctly with monthLimit', () => {
        render(<CalendarWrapper {...mockProps} />);
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
        expect(mockCalendar).toHaveBeenCalledWith(
            expect.objectContaining({
                isDatePickerOpen: true,
                currentDates: [],
                numberOfNights: 0,
                calendarEnd: expect.any(Date),
            }),
        );
    });

    it('should render correctly with unset monthLimit', () => {
        mockProps.monthLimit = undefined;
        render(<CalendarWrapper {...mockProps} />);
        expect(screen.getByTestId('calendar')).toBeInTheDocument();
        expect(mockCalendar).toHaveBeenCalledWith(
            expect.objectContaining({
                isDatePickerOpen: true,
                currentDates: [],
                numberOfNights: 0,
                calendarEnd: undefined,
            }),
        );
    });
});
