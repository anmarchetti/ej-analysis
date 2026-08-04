import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockMonthItem } from 'frontend/__mocks__/monthsAvailability';

import MonthOption, { IMonthOptionProps } from './MonthOptionOld';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockProps;
let mockStores;

const createMockProps = (): IMonthOptionProps => ({
    isVisible: true,
    month: { ...mockMonthItem },
    onMonthChange: jest.fn(),
});

describe('MonthOption', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            searchStore: {
                searchWhen: {
                    from: null,
                },
            },
        });
    });

    it('should render month label and input', () => {
        render(<MonthOption {...mockProps} />);

        expect(screen.getByTestId('month-option')).toBeInTheDocument();
        expect(screen.getByTestId('July-2025-label')).toBeInTheDocument();
        expect(screen.getByTestId('July-2025-input')).toBeInTheDocument();
    });

    it('should render disabled month if availability is false', () => {
        mockProps.month.availability = false;
        render(<MonthOption {...mockProps} />);

        const input = screen.getByTestId('July-2025-input');

        expect(input).toHaveProperty('disabled', true);
        expect(input).toHaveAttribute('aria-disabled', 'true');
    });

    it('should render disabled month if availability is undefined', () => {
        mockProps.month.availability = undefined;
        render(<MonthOption {...mockProps} />);

        const input = screen.getByTestId('July-2025-input');

        expect(input).toHaveProperty('disabled', true);
        expect(input).toHaveAttribute('aria-disabled', 'true');
    });

    it('should render selected month', () => {
        mockStores.searchStore.searchWhen.from = new Date('2025-07-01');
        render(<MonthOption {...mockProps} />);

        const input = screen.getByTestId('July-2025-input');

        expect(input).toHaveProperty('checked', true);
        expect(input).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByTestId('July-2025-label')).toHaveClass('selectedMonthLabel');
    });

    it('should call onMonthChange when selected', () => {
        render(<MonthOption {...mockProps} />);

        fireEvent.click(screen.getByTestId('July-2025-input'));

        expect(mockProps.onMonthChange).toHaveBeenCalledWith(mockProps.month);
    });

    it('should set aria-hidden when not visible', () => {
        mockProps.isVisible = false;
        render(<MonthOption {...mockProps} />);

        expect(screen.getByTestId('July-2025-input')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should set correct accessibility attributes', () => {
        render(<MonthOption {...mockProps} />);

        const input = screen.getByTestId('July-2025-input');

        expect(input).toHaveAttribute('aria-checked', 'false');
        expect(input).toHaveAttribute('aria-disabled', 'false');
        expect(input).toHaveAttribute('aria-label', 'July 2025');
        expect(input).toHaveAttribute('aria-hidden', 'false');
    });
});
