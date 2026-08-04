import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';

import { monthHeaderProps } from 'frontend/__mocks__/datePicker';
import { IMonthHeaderProps } from 'models/data/IDataPicker';

import MonthYearSelector from './MonthYearSelector';
import * as utils from './MonthYearSelector.utils';

const mockReactSelectProps = jest.fn();
jest.mock('react-select', () => props => {
    mockReactSelectProps(props);
    const { id, value, onChange, isOptionDisabled } = props;
    isOptionDisabled?.({ value: 2025, label: '2025' });

    return (
        <div
            data-tid={id}
            onClick={() =>
                onChange(id === 'month-selector' ? { value: 0, label: 'January' } : { value: 2025, label: '2025' })
            }
        >
            {value.label}
        </div>
    );
});

const createProps = (): IMonthHeaderProps => ({ ...monthHeaderProps });
let mockProps;

describe('MonthYearSelector', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render month abd year picker with selected current month and year by default', () => {
        render(<MonthYearSelector {...mockProps} />);

        expect(screen.getByTestId('month-selector')).toHaveTextContent('October');
        expect(screen.getByTestId('year-selector')).toHaveTextContent('2024');
    });

    it('should change month', async () => {
        render(<MonthYearSelector {...mockProps} />);

        await userEvent.click(screen.getByTestId('month-selector'));

        expect(screen.getByTestId('month-selector')).toHaveTextContent('January');
        expect(mockProps.changeMonth).toHaveBeenCalledWith(0);
        expect(mockProps.onChangeShownDates).toHaveBeenCalledWith(dayjs('2024-01-01'), dayjs('2024-02-01'));
    });

    it('should change year', async () => {
        render(<MonthYearSelector {...mockProps} />);

        await userEvent.click(screen.getByTestId('year-selector'));

        expect(screen.getByTestId('year-selector')).toHaveTextContent('2025');
        expect(mockProps.changeYear).toHaveBeenCalledWith(2025);
        expect(mockProps.onChangeShownDates).toHaveBeenCalledWith(dayjs('2025-10-01'), dayjs('2025-11-01'));
    });

    it('should change both year and month when current month will be not available after year change', async () => {
        mockProps = { ...mockProps, maxDate: new Date('2025-05-08') };
        render(<MonthYearSelector {...mockProps} />);

        await userEvent.click(screen.getByTestId('year-selector'));

        expect(screen.getByTestId('year-selector')).toHaveTextContent('2025');
        expect(screen.getByTestId('month-selector')).toHaveTextContent('May');
        expect(mockProps.changeYear).toHaveBeenCalledWith(2025);
        expect(mockProps.onChangeShownDates).toHaveBeenCalledWith(dayjs('2025-05-01'), dayjs('2025-06-01'));
        expect(mockProps.changeMonth).toHaveBeenCalledWith(4);
    });

    it('should call isOptionDisabled', () => {
        const spyOnIsOptionDisabled = jest.spyOn(utils, 'isOptionDisabled');
        render(<MonthYearSelector {...mockProps} />);

        expect(spyOnIsOptionDisabled).toHaveBeenCalledWith(
            { label: '2025', value: 2025 },
            { label: 2024, value: 2024 },
            mockProps.minDate,
            mockProps.maxDate,
        );
    });
});
