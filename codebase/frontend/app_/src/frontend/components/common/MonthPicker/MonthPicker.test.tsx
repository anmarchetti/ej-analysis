import React from 'react';
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';

import MonthPicker, { IMonthPickerProps } from './MonthPicker';

jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='carousel'>{children}</div>,
}));

const mockMonthProps = jest.fn();
jest.mock('./components/Month', () => ({
    __esModule: true,
    default: props => {
        mockMonthProps(props);

        return <div data-tid='month'>{props.day.format('MMMM YYYY')}</div>;
    },
}));

let mockProps;
const createMockProps = (): IMonthPickerProps => ({
    endDate: dayjs('2024-06-13'),
    onMonthClick: jest.fn(),
    selectedMonths: [],
    startDate: dayjs('2023-06-13'),
    availableMonths: [],
});

describe('MonthPicker', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render months', () => {
        const COUNT_OF_MONTHS = 12;
        render(<MonthPicker {...mockProps} />);

        const months = screen.getAllByTestId('month');

        expect(months.length).toBe(COUNT_OF_MONTHS);
        expect(months[0]).toHaveTextContent('June 2023');
        expect(months[months.length - 1]).toHaveTextContent('May 2024');
    });

    it('should render disabled months that do not included to availableMonths', () => {
        const COUNT_OF_MONTHS = 2;
        mockProps.availableMonths = [6];
        mockProps.endDate = dayjs('2023-08-01');
        render(<MonthPicker {...mockProps} />);

        const months = screen.getAllByTestId('month');
        expect(months.length).toBe(COUNT_OF_MONTHS);
        expect(mockMonthProps).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                isMonthDisabled: false,
            }),
        );
        expect(mockMonthProps).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                isMonthDisabled: true,
            }),
        );
    });
});
