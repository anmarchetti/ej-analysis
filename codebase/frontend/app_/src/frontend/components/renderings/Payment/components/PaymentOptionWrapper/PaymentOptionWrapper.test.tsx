import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PaymentOptionWrapper from 'frontend/components/renderings/Payment/components/PaymentOptionWrapper/PaymentOptionWrapper';

describe('<PaymentOptionWrapper />', () => {
    it('should render children and applies data-tid', () => {
        render(
            <PaymentOptionWrapper onSelect={jest.fn()} dataTid='test-payment-type' clickable={true} variant='applePay'>
                <span>Test Payment</span>
            </PaymentOptionWrapper>,
        );

        expect(screen.getByTestId('test-payment-type')).toBeInTheDocument();
        expect(screen.getByText('Test Payment')).toBeInTheDocument();
    });

    it('should call onSelect when clickable and clicked', async () => {
        const onSelect = jest.fn();

        render(
            <PaymentOptionWrapper
                onSelect={onSelect}
                clickable={true}
                variant='creditCard'
                dataTid='apple-pay-payment-type'
            >
                <span>Clickable Payment</span>
            </PaymentOptionWrapper>,
        );

        await userEvent.click(screen.getByTestId('clickable-apple-pay-payment-type'));
        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('should not render button when not clickable', () => {
        render(
            <PaymentOptionWrapper onSelect={jest.fn()} clickable={false} variant='creditCard'>
                <span>Non-clickable Payment</span>
            </PaymentOptionWrapper>,
        );

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.getByText('Non-clickable Payment')).toBeInTheDocument();
    });
});
