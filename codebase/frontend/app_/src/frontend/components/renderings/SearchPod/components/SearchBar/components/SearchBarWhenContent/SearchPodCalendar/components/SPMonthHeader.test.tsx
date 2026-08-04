import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import SPMonthHeader from './SPMonthHeader';

global.requestAnimationFrame = callback => {
    callback(0);

    return 1;
};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, onKeyDown, dataTid }) => (
        <button onClick={onClick} onKeyDown={onKeyDown} data-tid={dataTid}>
            {children}
        </button>
    ),
}));

let mockStores;
let mockProps;

const datePickerWrapper = document.createElement('div');
const day = document.createElement('button');
day.setAttribute('class', 'react-datepicker__day');
datePickerWrapper.appendChild(day);
document.body.appendChild(datePickerWrapper);

const createMockProps = () => ({
    monthDate: new Date('2023-10-01'),
    decreaseMonth: jest.fn(),
    increaseMonth: jest.fn(),
    prevMonthButtonDisabled: false,
    nextMonthButtonDisabled: false,
    customHeaderCount: 0,
    datePickerWrapper: { current: datePickerWrapper },
});

describe('SPMonthHeader', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createMockProps();
    });

    it('should render month label with year', () => {
        render(<SPMonthHeader {...mockProps} />);

        expect(screen.getByTestId('month-label')).toHaveTextContent('October 2023');
    });

    it('should render prev button for even header and call decreaseMonth when click on it', () => {
        render(<SPMonthHeader {...mockProps} />);

        expect(screen.getByTestId('sp-month-prev-button')).not.toBeDisabled();
        expect(screen.queryByTestId('sp-month-next-button')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId('sp-month-prev-button'));

        expect(mockProps.decreaseMonth).toHaveBeenCalled();
    });

    it('should render next button for odd header and call increaseMonth when click on it', () => {
        mockProps.customHeaderCount = 1;
        render(<SPMonthHeader {...mockProps} />);

        expect(screen.queryByTestId('sp-month-prev-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('sp-month-next-button')).not.toBeDisabled();

        fireEvent.click(screen.getByTestId('sp-month-next-button'));

        expect(mockProps.increaseMonth).toHaveBeenCalled();
    });

    it('should hide prev button when prevMonthButtonDisabled is true', () => {
        mockProps.prevMonthButtonDisabled = true;
        render(<SPMonthHeader {...mockProps} />);

        expect(screen.queryByTestId('sp-month-prev-button')).not.toBeInTheDocument();
    });

    it('should hide next button when nextMonthButtonDisabled is true', () => {
        mockProps.customHeaderCount = 1;
        mockProps.nextMonthButtonDisabled = true;
        render(<SPMonthHeader {...mockProps} />);

        expect(screen.queryByTestId('sp-month-next-button')).not.toBeInTheDocument();
    });

    describe('keyboard navigation', () => {
        it('should set focus on first available day when click on show last month', async () => {
            jest.spyOn(document.body, 'contains').mockImplementation(() => false);
            render(<SPMonthHeader {...mockProps} />);

            const prevButton = screen.getByTestId('sp-month-prev-button');
            prevButton.focus();
            await userEvent.keyboard('{Enter}');

            expect(mockProps.decreaseMonth).toHaveBeenCalled();
            expect(day).toHaveFocus();
        });

        it('should keep focus on button when click on next or prev month', async () => {
            jest.spyOn(document.body, 'contains').mockImplementation(() => true);
            render(<SPMonthHeader {...mockProps} />);

            const prevButton = screen.getByTestId('sp-month-prev-button');
            prevButton.focus();
            await userEvent.keyboard('{Enter}');

            expect(mockProps.decreaseMonth).toHaveBeenCalled();
            expect(prevButton).toHaveFocus();
        });
    });
});
