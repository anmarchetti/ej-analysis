import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';

import { monthHeaderProps } from 'frontend/__mocks__/datePicker';
import { IMonthHeaderProps } from 'models/data/IDataPicker';

import MonthPicker from './MonthPicker';

const mockReactDatePickerProps = jest.fn();
jest.mock('react-datepicker', () => props => {
    mockReactDatePickerProps(props);

    return (
        <div data-tid='react-datepicker'>
            <button onClick={() => props.onChange(new Date('2024-11-01'))} data-tid='change-month-year'>
                Change month/year
            </button>
            {props.customInput}
            {props.renderCustomHeader(props)}
        </div>
    );
});

jest.mock('frontend/components/common/YearSwitcher/YearSwitcher', () => () => (
    <div data-tid='month-year-picker-header' />
));

const mockChangeMonthButtonProps = jest.fn();
jest.mock('./components/ChangeMonthButton/ChangeMonthButton', () => props => {
    mockChangeMonthButtonProps(props);

    return <div data-tid='change-month-button'>{props.label}</div>;
});

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => mockUseMobileViewport,
}));

const createProps = (): IMonthHeaderProps => ({ ...monthHeaderProps });
let mockProps;

describe('MonthPicker', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockUseMobileViewport = false;
    });

    it('should render month-year picker with month name label and portal popup on mobile', () => {
        mockUseMobileViewport = true;
        render(<MonthPicker {...mockProps} />);

        expect(mockReactDatePickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                withPortal: true,
            }),
        );
        expect(mockChangeMonthButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                label: 'October 2024',
            }),
        );
    });

    it('should render month-year picker with changeMonthButtonLabel label and month name on desktop', () => {
        render(<MonthPicker {...mockProps} />);

        expect(mockReactDatePickerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                withPortal: false,
            }),
        );
        expect(mockChangeMonthButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                label: mockProps.changeMonthButtonLabel.value,
            }),
        );
    });

    it('should call changeMonth, changeYear and onChangeShownDates with selected month and second month when click on MonthYearPicker', async () => {
        render(<MonthPicker {...mockProps} />);

        await userEvent.click(screen.getByTestId('change-month-year'));

        const secondMonthAfterSelected = dayjs('2024-11-01').add(1, 'month');
        expect(mockProps.onChangeShownDates).toHaveBeenCalledWith(dayjs('2024-11-01'), secondMonthAfterSelected);
        expect(mockProps.changeMonth).toHaveBeenCalledWith(10);
        expect(mockProps.changeYear).toHaveBeenCalledWith(2024);
    });

    describe('view for one and two months', () => {
        it('should render portal centered at the bottom on one month view', () => {
            mockProps.isOneMonthView = true;
            render(<MonthPicker {...mockProps} />);

            expect(mockReactDatePickerProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    popperPlacement: 'bottom-center',
                }),
            );
        });

        it('should render portal at the bottom start on two month view', () => {
            render(<MonthPicker {...mockProps} />);

            expect(mockReactDatePickerProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    popperPlacement: 'bottom-start',
                }),
            );
        });
    });
});
