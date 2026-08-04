import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { axe, toHaveNoViolations } from 'jest-axe';

import Month, { IMonthProps } from './Month';

expect.extend(toHaveNoViolations);

let mockProps;
const createMockProps = (): IMonthProps => ({
    day: dayjs('2023-08-01'),
    onMonthClick: jest.fn(),
    isMonthSelected: false,
    isMonthDisabled: false,
    index: 0,
});

describe('Month', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render disabled months', () => {
        mockProps.isMonthDisabled = true;
        render(<Month {...mockProps} />);

        expect(screen.getByTestId('month')).toHaveClass('disabledMonth');
    });

    it('should render selected months', () => {
        mockProps.isMonthSelected = true;
        render(<Month {...mockProps} />);

        expect(screen.getByTestId('month')).toHaveClass('selectedMonth');
    });

    it('should call onMonthClick', () => {
        render(<Month {...mockProps} />);

        fireEvent.click(screen.getByTestId('month'));

        expect(mockProps.onMonthClick).toHaveBeenCalledWith(dayjs('2023-08-01'));
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<Month {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });

        it('should have aria-labelledby attribute referencing the correct span IDs', () => {
            mockProps.index = 5;
            const expectedYearId = `year-${mockProps.index}`;
            const expectedMonthId = `month-${mockProps.index}`;

            render(<Month {...mockProps} />);

            expect(screen.getByRole('button')).toHaveAttribute(
                'aria-labelledby',
                `${expectedYearId} ${expectedMonthId}`,
            );

            expect(screen.getByText('2023')).toHaveAttribute('id', expectedYearId);
            expect(screen.getByText('August')).toHaveAttribute('id', expectedMonthId);
        });
    });
});
