import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';

import { monthHeaderProps } from 'frontend/__mocks__/datePicker';
import { IMonthHeaderProps } from 'models/data/IDataPicker';

import MonthHeader from './MonthHeader';

jest.mock('./components/MonthPicker/MonthPicker', () => () => <div data-tid='month-picker' />);

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/components/common/Button', () => ({ dataTid, onClick, className }) => (
    <button data-tid={dataTid} onClick={onClick} className={className}>
        {dataTid}
    </button>
));

jest.mock(
    'frontend/components/common/DatePickerComponent/components/MonthHeader/components/MonthYearSelector/MonthYearSelector',
    () => () => <div data-tid='month-year-selector' />,
);

const createProps = (): IMonthHeaderProps => ({ ...monthHeaderProps });
let mockProps;

describe('HeaderWithModal', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockUseMobileViewport = false;
    });

    it('should render prev and next button, month-year picker on mobile', () => {
        mockUseMobileViewport = true;
        render(<MonthHeader {...mockProps} />);

        expect(screen.getByTestId('month-year-picker-prev-button')).toBeInTheDocument();
        expect(screen.queryByTestId('month-year-picker-current-month-label')).not.toBeInTheDocument();
        expect(screen.getByTestId('month-year-picker-next-button')).toBeInTheDocument();
        expect(screen.getByTestId('month-picker')).toBeInTheDocument();
        expect(screen.queryByTestId('month-year-selector')).not.toBeInTheDocument();
    });

    it('should render CRO variant on mobile', () => {
        mockUseMobileViewport = true;
        mockProps.IsCROVariant = '1';
        render(<MonthHeader {...mockProps} />);

        expect(screen.queryByTestId('month-picker')).not.toBeInTheDocument();
        expect(screen.getByTestId('month-year-selector')).toBeInTheDocument();
    });

    it('should render prev and next button, month name and month-year picker on desktop', () => {
        render(<MonthHeader {...mockProps} />);

        expect(screen.getByTestId('month-year-picker-prev-button')).toBeInTheDocument();
        expect(screen.getByTestId('month-year-picker-current-month-label')).toHaveTextContent('October 2024');
        expect(screen.getByTestId('month-year-picker-next-button')).toBeInTheDocument();
        expect(screen.getByTestId('month-picker')).toBeInTheDocument();
    });

    it('should call decreaseMonth when click on show prev month button', async () => {
        render(<MonthHeader {...mockProps} />);

        await userEvent.click(screen.getByTestId('month-year-picker-prev-button'));

        expect(mockProps.decreaseMonth).toHaveBeenCalled();
    });

    it('should call onChangeShownDates with next month and increaseMonth when click on show next month button', async () => {
        render(<MonthHeader {...mockProps} />);

        await userEvent.click(screen.getByTestId('month-year-picker-next-button'));

        expect(mockProps.onChangeShownDates).toHaveBeenCalledWith(dayjs('2024-11-01'));
        expect(mockProps.increaseMonth).toHaveBeenCalled();
    });

    describe('hiding next/prev buttons depends on count of showing months and customHeaderCount', () => {
        describe('when show one month', () => {
            beforeEach(() => {
                mockProps.isShowOneMonth = true;
            });

            it('should hide prev button when nextMonthButtonDisabled is true', () => {
                mockProps.nextMonthButtonDisabled = true;
                render(<MonthHeader {...mockProps} />);

                expect(screen.getByTestId('month-year-picker-next-button')).toHaveClass('hidden');
            });

            it('should hide next button when prevMonthButtonDisabled is true', () => {
                mockProps.prevtMonthButtonDisabled = true;
                render(<MonthHeader {...mockProps} />);

                expect(screen.getByTestId('month-year-picker-prev-button')).toHaveClass('hidden');
            });
        });

        describe('when show one month', () => {
            beforeEach(() => {
                mockProps.isShowOneMonth = false;
            });

            it('should hide prev button when customHeaderCount is 1 (to hide prev button on second month)', () => {
                mockProps.customHeaderCount = 1;
                render(<MonthHeader {...mockProps} />);

                expect(screen.getByTestId('month-year-picker-prev-button')).toHaveClass('hidden');
            });

            it('should hide prev button when prevMonthButtonDisabled is true', () => {
                mockProps.prevMonthButtonDisabled = true;
                render(<MonthHeader {...mockProps} />);

                expect(screen.getByTestId('month-year-picker-prev-button')).toHaveClass('hidden');
            });

            it('should hide next button when customHeaderCount is 0 (to hide next button on first month)', () => {
                mockProps.customHeaderCount = 0;
                render(<MonthHeader {...mockProps} />);

                expect(screen.getByTestId('month-year-picker-next-button')).toHaveClass('hidden');
            });

            it('should hide next button when nextMonthButtonDisabled is true', () => {
                mockProps.nextMonthButtonDisabled = true;
                render(<MonthHeader {...mockProps} />);

                expect(screen.getByTestId('month-year-picker-next-button')).toHaveClass('hidden');
            });
        });
    });
});
