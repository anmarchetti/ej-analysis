import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import ChangeMonthButton, { IChangeMonthButtonProps } from './ChangeMonthButton';

expect.extend(toHaveNoViolations);

jest.mock('frontend/components/common/Button', () => ({ dataTid, onClick, className, children }) => (
    <button data-tid={dataTid} onClick={onClick} className={className}>
        {children}
    </button>
));

const createProps = (): IChangeMonthButtonProps => ({
    label: 'Change month',
    onClick: jest.fn(),
});
let mockProps;

describe('ChangeMonthButton', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should pass accessibility', async () => {
        const { container } = render(<ChangeMonthButton {...mockProps} />);

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('should render label', () => {
        render(<ChangeMonthButton {...mockProps} />);

        expect(screen.getByText(mockProps.label)).toBeInTheDocument();
    });

    it('should call onClick after click on button', async () => {
        render(<ChangeMonthButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mockProps.onClick).toHaveBeenCalled();
    });
});
