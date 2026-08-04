import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';

import PaymentBaseOptions, { IPaymentBaseOptionProps } from './PaymentBaseOption';

const createProps = (): IPaymentBaseOptionProps => ({
    onChange: jest.fn(),
    isSelected: false,
    disabled: false,
    title: 'title',
    priceDescription: 'priceDescription',
    checkboxId: 'check',
    price: 10,
    children: <p data-tid='children'>children</p>,
    className: 'class',
    currency: CurrencyCode.GBP,
});

let mockProps = createProps();

const mockPaymentMethodCardProps = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/PaymentMethodCard', () => ({
    __esModule: true,
    default: props => {
        mockPaymentMethodCardProps(props);

        return <div data-tid='payment-method-card'>{props.children}</div>;
    },
}));

const mockPaymentOptionPriceProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPayment/components/PaymentOptions/PaymentOptionPrice/PaymentOptionPrice',
    () => ({
        __esModule: true,
        default: props => {
            mockPaymentOptionPriceProps(props);

            return <div data-tid='payment-option-price' />;
        },
    }),
);

describe('<PaymentBaseOption />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('renders PaymentMethodCard', () => {
        render(<PaymentBaseOptions {...mockProps} />);

        expect(mockPaymentMethodCardProps).toHaveBeenCalledWith({
            checkboxId: mockProps.checkboxId,
            title: mockProps.title,
            isSelected: mockProps.isSelected,
            onSelect: mockProps.onChange,
            className: `card ${mockProps.className}`,
            notSelectable: mockProps.disabled,
            children: expect.anything(),
        });

        expect(mockPaymentOptionPriceProps).toHaveBeenCalledWith({
            description: mockProps.priceDescription,
            price: mockProps.price,
            isTotal: true,
            currency: mockProps.currency,
        });

        expect(screen.getByTestId('children')).toBeInTheDocument();
    });

    it('does NOT render PaymentOptionPrice when priceDescription NOT provided', () => {
        mockProps.priceDescription = undefined;
        render(<PaymentBaseOptions {...mockProps} />);

        expect(mockPaymentOptionPriceProps).not.toHaveBeenCalled();
    });

    it('does NOT render PaymentOptionPrice when price NOT provided', () => {
        mockProps.price = undefined;
        render(<PaymentBaseOptions {...mockProps} />);

        expect(mockPaymentOptionPriceProps).not.toHaveBeenCalled();
    });
});
