import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import MonthPicker from './MonthPicker';

const mockMonths = [new Date('2023-11-01'), new Date('2023-12-01'), new Date('2024-01-01')].map(date =>
    date.toDateString(),
);

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(v => v),
    },
    amendDatesStore: {
        selectedMonth: new Date('2023-11-01'),
        setSelectedMonth: jest.fn(),
        availableMonths: mockMonths,
    },
    appStore: {
        isScreenLessMedium: true,
    },
});

const createMockProps = () => ({
    monthOptions: [...mockMonths, new Date('2024-02-01').toDateString()],
});

let mockStores = createStores();
let mockProps = createMockProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<MonthPicker />', () => {
    const openMonthPicker = () => {
        fireEvent.click(screen.getByRole('button', { name: 'DatePicker.Buttons.SelectMonth' }));
    };

    beforeEach(() => {
        mockStores = createStores();
        mockProps = createMockProps();
    });

    it('Should render', () => {
        const { container } = render(<MonthPicker {...mockProps} />);

        expect(screen.getByRole('button', { name: 'DatePicker.Buttons.SelectMonth' })).toBeInTheDocument();

        openMonthPicker();
        expect(screen.getByTestId('month-picker-year-input')).toBeInTheDocument();
        expect(container.querySelector('.active')).toContainElement(screen.getByRole('button', { name: 'Nov' }));
        expect(screen.getByRole('button', { name: 'Dec' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Globals.Buttons.Apply' })).toBeInTheDocument();
        expect(screen.getByTestId('month-picker-overlay')).toBeInTheDocument();
    });

    it('Should close dropdown on apply button click', () => {
        render(<MonthPicker {...mockProps} />);

        openMonthPicker();

        const applyButton = screen.getByRole('button', { name: 'Globals.Buttons.Apply' });
        fireEvent.click(applyButton);

        expect(screen.queryByTestId('month-picker-year-input')).not.toBeInTheDocument();
    });

    it('Close dropdown on outside click', () => {
        render(<MonthPicker {...mockProps} />);

        openMonthPicker();

        fireEvent.mouseDown(document.body);

        expect(screen.queryByTestId('month-picker-year-input')).not.toBeInTheDocument();
        expect(screen.queryByTestId('month-picker-overlay')).not.toBeInTheDocument();
    });

    it('Close dropdown on toggle button click', () => {
        const { container } = render(<MonthPicker {...mockProps} />);

        openMonthPicker();

        fireEvent.click(screen.getByRole('button', { name: 'Dec' }));

        fireEvent.click(screen.getByTestId('month-picker-button'));

        expect(screen.queryByTestId('month-picker-year-input')).not.toBeInTheDocument();

        openMonthPicker();

        // Make sure active month resets to selected month if we close dropwon without applying
        expect(container.querySelector('.active')).not.toContainElement(screen.getByRole('button', { name: 'Dec' }));
    });

    it('Should set month to active on click', () => {
        const { container } = render(<MonthPicker {...mockProps} />);

        openMonthPicker();

        const decButton = screen.getByRole('button', { name: 'Dec' });
        fireEvent.click(decButton);

        expect(container.querySelector('.active')).toContainElement(decButton);
    });

    it('Should increment year on next button click and decrement year on back button, and Feb should be unavailable', () => {
        const { container } = render(<MonthPicker {...mockProps} />);

        openMonthPicker();

        fireEvent.click(screen.getByTestId('month-picker-year-increment'));

        expect(screen.getByTestId('month-picker-year-input')).toHaveTextContent('2024');

        const febButton = screen.getByRole('button', { name: 'Feb' });
        expect(container.querySelector('.unavailable')).toContainElement(febButton);

        fireEvent.click(screen.getByTestId('month-picker-year-decrement'));
        expect(screen.getByTestId('month-picker-year-input')).toHaveTextContent('2023');
    });
});
