import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';

import PaymentOptionPrice, { IPaymentOptionPriceProps } from './PaymentOptionPrice';

const createProps = (): IPaymentOptionPriceProps => ({
    description: 'description',
    price: 10,
    isTotal: true,
    currency: CurrencyCode.GBP,
});

let mockProps = createProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PaymentOptionPrice />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('renders component', () => {
        render(<PaymentOptionPrice {...mockProps} />);

        expect(screen.getByTestId('amend-payment-option')).toHaveClass('description');
        expect(screen.getByTestId('amend-payment-option-label')).toHaveTextContent(mockProps.description);
        expect(screen.getByTestId('amend-payment-option-price')).toHaveTextContent('£10');
    });

    it('renders 0 when price is NOT provided and add total class when isTotal is true', () => {
        mockProps = { description: 'description', isTotal: true };
        render(<PaymentOptionPrice {...mockProps} />);

        expect(screen.getByTestId('amend-payment-option-price')).toHaveTextContent('£0');
        expect(screen.getByTestId('amend-payment-option')).toHaveClass('description total');
    });
});
