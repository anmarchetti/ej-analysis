import React from 'react';
import { render } from '@testing-library/react';

import AmendPaymentSummaryErrors from './AmendPaymentSummaryErrors';

const createStores = () => ({
    payStore: {
        isPaymentAllowed: true,
        paymentErrors: [{ descriptionKey: 'descriptionKey', messageKey: 'messageKey' }],
    },
    layoutStore: { getPhrase: jest.fn(p => p) },
    amendPaymentStore: { onPay: jest.fn(), canPay: true },
    routerStore: {},
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendPaymentSummaryErrors />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render error message when paymentError', () => {
        const { getByText } = render(<AmendPaymentSummaryErrors />);

        expect(getByText('messageKey')).toBeInTheDocument();
        expect(getByText('descriptionKey')).toBeInTheDocument();
    });

    it('should render error message when payment not allowed', () => {
        mockStores.payStore.isPaymentAllowed = false;
        mockStores.payStore.paymentErrors = [];
        const { getByText } = render(<AmendPaymentSummaryErrors />);

        expect(getByText('This site is not secure, you cannot proceed with payment')).toBeInTheDocument();
    });

    it('should NOT render errors when payment allowed and no errors', () => {
        mockStores.payStore.paymentErrors = [];
        const { container } = render(<AmendPaymentSummaryErrors />);

        const errors = container.getElementsByClassName('errors')[0];
        expect(errors).toBeEmptyDOMElement();
    });
});
