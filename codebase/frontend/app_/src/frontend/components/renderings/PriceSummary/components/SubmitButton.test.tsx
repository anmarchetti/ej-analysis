import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SubmitButton } from './SubmitButton';

jest.mock('frontend/components/common/Button', () =>
    jest.fn(({ children, onClick }) => (
        <button data-tid='continue-button' onClick={onClick}>
            {children}
        </button>
    )),
);

describe('SubmitButton', () => {
    it('should render the Button', () => {
        render(<SubmitButton onClick={() => jest.fn()} text='Test' />);

        expect(screen.getByTestId('continue-button')).toBeInTheDocument();
    });

    it('should call onClick when the button is clicked', async () => {
        const mockOnClick = jest.fn();
        render(<SubmitButton onClick={mockOnClick} text='Test' />);

        const buttonElement = screen.getByTestId('continue-button');
        userEvent.click(buttonElement);

        await waitFor(() => {
            expect(mockOnClick).toHaveBeenCalledTimes(1);
        });
    });
});
