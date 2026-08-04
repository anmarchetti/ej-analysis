import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import YearSwitcher from './YearSwitcher';

expect.extend(toHaveNoViolations);

jest.mock('frontend/components/common/Button', () => ({ dataTid, onClick, className, disabled }) => (
    <button data-tid={dataTid} onClick={onClick} className={className} disabled={disabled}>
        {dataTid}
    </button>
));

const createProps = () => ({
    monthDate: new Date('2024-10-08'),
    decreaseYear: jest.fn(),
    increaseYear: jest.fn(),
    prevYearButtonDisabled: false,
    nextYearButtonDisabled: false,
});
let mockProps;

describe('YearSwitcher', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should pass accessibility', async () => {
        const { container } = render(<YearSwitcher {...mockProps} />);

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('should render year label', () => {
        render(<YearSwitcher {...mockProps} />);

        expect(screen.getByTestId('year-switcher-current-year-label')).toHaveTextContent('2024');
    });

    it('should call decreaseYear when click on prev year button', async () => {
        render(<YearSwitcher {...mockProps} />);

        await userEvent.click(screen.getByTestId('year-switcher-prev-year'));

        expect(mockProps.decreaseYear).toHaveBeenCalled();
    });

    it('should call increaseYear when click on next year button', async () => {
        render(<YearSwitcher {...mockProps} />);

        await userEvent.click(screen.getByTestId('year-switcher-next-year'));

        expect(mockProps.increaseYear).toHaveBeenCalled();
    });

    it('should disable prev button when prevYearButtonDisabled true', () => {
        mockProps.prevYearButtonDisabled = true;
        render(<YearSwitcher {...mockProps} />);

        expect(screen.getByTestId('year-switcher-prev-year')).toBeDisabled();
    });

    it('should disable next button when nextYearButtonDisabled true', () => {
        mockProps.nextYearButtonDisabled = true;
        render(<YearSwitcher {...mockProps} />);

        expect(screen.getByTestId('year-switcher-next-year')).toBeDisabled();
    });
});
