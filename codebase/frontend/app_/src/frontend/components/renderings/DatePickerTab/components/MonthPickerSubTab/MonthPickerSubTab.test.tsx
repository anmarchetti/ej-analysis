import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import MonthPickerSubTab, { IMonthPickerSubTabProps } from './MonthPickerSubTab';
import { getFirstAvailableMonth } from './MonthPickerSubTab.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockDatejsDate = dayjs('2024-06-13');
const mockMonthPickerProps = jest.fn();
jest.mock('frontend/components/common/MonthPicker/MonthPicker', () => props => {
    mockMonthPickerProps(props);

    return (
        <button
            data-tid='month-picker'
            onClick={() => {
                props.onMonthClick(mockDatejsDate);
            }}
        />
    );
});

jest.mock('./MonthPickerSubTab.utils', () => ({
    getFirstAvailableMonth: jest.fn(() => mockDatejsDate),
}));

const createProps = (): IMonthPickerSubTabProps => ({
    MonthPickerSubtitle: mockSitecoreField('MonthPickerSubtitle'),
    MonthPickerTitle: mockSitecoreField('MonthPickerTitle'),
    selectedMonths: [],
    setSelectedMonths: jest.fn(),
});

let mockProps;
let mockStores;

describe('MonthPickerSubTab', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            inspireMeStore: {
                setAnswer: jest.fn(),
                availableQuizAnswers: {},
            },
        });
    });

    it('should render standard', () => {
        render(<MonthPickerSubTab {...mockProps} />);

        expect(screen.getByTestId('inspire-me-month-picker-title')).toHaveTextContent(mockProps.MonthPickerTitle.value);
        expect(screen.getByTestId('inspire-me-month-picker-subtitle')).toHaveTextContent(
            mockProps.MonthPickerSubtitle.value,
        );
        expect(screen.getByTestId('month-picker')).toBeInTheDocument();
    });

    it('should call month picker with start and end dates', () => {
        render(<MonthPickerSubTab {...mockProps} />);

        expect(getFirstAvailableMonth).toHaveBeenCalledWith([]);
        expect(mockMonthPickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                endDate: dayjs('2025-06-13'),
                startDate: mockDatejsDate,
            }),
        );
    });

    it('should call getFirstAvailableMonth with available months when it exist', () => {
        mockStores.inspireMeStore.availableQuizAnswers.availableMonths = [1, 2];
        render(<MonthPickerSubTab {...mockProps} />);
        expect(getFirstAvailableMonth).toHaveBeenCalledWith([1, 2]);
    });

    it('should add selected month to answer', async () => {
        render(<MonthPickerSubTab {...mockProps} />);

        await userEvent.click(screen.getByTestId('month-picker'));

        expect(mockProps.setSelectedMonths).toHaveBeenCalledWith([mockDatejsDate]);
        expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith({
            months: [mockDatejsDate],
        });
    });

    it('should remove selected month when it already selected and pass undefined to answer when no selected answers', async () => {
        mockProps.selectedMonths = [mockDatejsDate];
        render(<MonthPickerSubTab {...mockProps} />);

        await userEvent.click(screen.getByTestId('month-picker'));

        expect(mockProps.setSelectedMonths).toHaveBeenCalledWith([]);
        expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(null);
    });
});
