import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { CardInfo } from 'models/data/payment/CardInfo';
import { PaymentType } from 'models/enum/PaymentType';
import PaymentOptions from 'frontend/components/renderings/Payment/components/PaymentOptions';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

describe('<PaymentOptions />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            paymentTypeStore: {
                paymentTypes: [],
                selectedPaymentType: PaymentType.Card,
                preferredPaymentType: PaymentType.Card,
            },
            payStore: {
                cardInfo: new CardInfo(),
                toggleFocusPaymentBlock: jest.fn(),
            },
        });
    });

    it('should show the Apple Pay payment type when Apple Pay is available', () => {
        mockStores.paymentTypeStore.paymentTypes = [PaymentType.ApplePay];

        render(<PaymentOptions fields={undefined} />);

        expect(screen.getByText('Payment.Labels.ApplePay')).toBeInTheDocument();
        expect(screen.getByTestId('apple-pay-logo')).toBeInTheDocument();
    });

    it('should NOT show the Apple Pay payment type when Apple Pay is not available', () => {
        mockStores.paymentTypeStore.paymentTypes = [];

        render(<PaymentOptions fields={undefined} />);

        expect(screen.queryByText('Payment.Labels.ApplePay')).not.toBeInTheDocument();
        expect(screen.queryByTestId('apple-pay-logo')).not.toBeInTheDocument();
    });

    it('should always show the card payment option', () => {
        mockStores.paymentTypeStore.paymentTypes = [];
        render(<PaymentOptions fields={undefined} />);

        expect(screen.getByText('Payment.Labels.NameOnCard')).toBeInTheDocument();
        expect(screen.getByText('Payment.Labels.CardNumber')).toBeInTheDocument();
        expect(screen.getByText('Payment.Labels.ExpirationDate')).toBeInTheDocument();
        expect(screen.getByText('Payment.Labels.CVV')).toBeInTheDocument();
        expect(screen.getByTestId('card-logos')).toBeInTheDocument();
    });

    it('should render Apple Pay first when it is the preferred payment type', () => {
        mockStores.paymentTypeStore.paymentTypes = [PaymentType.Card, PaymentType.ApplePay];
        mockStores.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
        mockStores.paymentTypeStore.preferredPaymentType = PaymentType.ApplePay;

        render(<PaymentOptions fields={undefined} />);

        const applePayElement = screen.getByText('Payment.Labels.ApplePay');
        const cardFormElement = screen.getByText('Payment.Labels.NameOnCard');

        expect(
            applePayElement.compareDocumentPosition(cardFormElement) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it('should render Apple Pay after card form when Apple Pay is not the preferred payment type', () => {
        mockStores.paymentTypeStore.paymentTypes = [PaymentType.Card, PaymentType.ApplePay];
        mockStores.paymentTypeStore.selectedPaymentType = PaymentType.Card;
        mockStores.paymentTypeStore.preferredPaymentType = PaymentType.Card; // or any other type

        render(<PaymentOptions fields={undefined} />);

        const applePayElement = screen.getByText('Payment.Labels.ApplePay');
        const cardFormElement = screen.getByText('Payment.Labels.NameOnCard');

        expect(
            cardFormElement.compareDocumentPosition(applePayElement) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });
});
