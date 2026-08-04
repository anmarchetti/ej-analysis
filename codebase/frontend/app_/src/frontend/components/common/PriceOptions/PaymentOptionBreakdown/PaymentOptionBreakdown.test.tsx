import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';

import PaymentOptionBreakdown, { IRefundBreakdownProps } from './PaymentOptionBreakdown';

const createProps = (): IRefundBreakdownProps => ({
    label: 'label and another one',
    value: 10,
    className: 'additional-classname',
    dataTid: 'option-payment-tid',
    currency: CurrencyCode.GBP,
});

const createStores = () => createMockStores();

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PaymentOptionBreakdown />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('renders with passed props', () => {
        render(<PaymentOptionBreakdown {...mockProps} />);

        expect(screen.getByTestId('option-payment-tid')).toHaveClass('container additional-classname');
        expect(screen.getByTestId('option-payment-tid-label')).toHaveTextContent('label and another one');
        expect(screen.getByTestId('option-payment-tid-price')).toHaveTextContent('£10');
        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(mockProps.value, {
            currency: mockProps.currency,
        });
    });

    it('renders 0 when no value', () => {
        mockProps = { label: 'label' };
        render(<PaymentOptionBreakdown {...mockProps} />);

        expect(screen.getByText('£0')).toBeInTheDocument();
    });
});
