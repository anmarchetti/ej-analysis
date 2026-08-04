import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendPaymentTermsAndConditions from './AmendPaymentTermsAndConditions';

const createProps = () => ({ fields: {} });

const createStores = () => ({
    amendPaymentStore: { confirmPolicy: false, shouldConfirmPolicy: false, togglePolicy: jest.fn() },
    payStore: { transferErrors: [] as any },
    bookingStore: { isTransfersHidden: false },
    layoutStore: { getPhrase: jest.fn(p => p) },
    routerStore: {},
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/Payment/components/TermsAndConditions', () => ({ children }) => (
    <div data-tid='terms-and-conditions'>{children}</div>
));

describe('<AmendPaymentTermsAndConditions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render TermsAndConditions', () => {
        const { getByTestId } = render(<AmendPaymentTermsAndConditions {...mockProps} />);

        expect(getByTestId('terms-and-conditions')).toBeInTheDocument();
    });

    it('should render ErrorMessage when transferErrors provided', () => {
        mockStores.payStore.transferErrors = ['error1', 'error2'];
        const { getByText } = render(<AmendPaymentTermsAndConditions {...mockProps} />);

        expect(getByText(SitecoreDictionary.PaymentFailureMessagesNoTransferOption)).toBeInTheDocument();
    });

    it('should render ErrorMessage when transfer is hidden', () => {
        mockStores.bookingStore.isTransfersHidden = true;
        const { getByText } = render(<AmendPaymentTermsAndConditions {...mockProps} />);

        expect(getByText(SitecoreDictionary.PaymentFailureMessagesNoTransferOption)).toBeInTheDocument();
    });

    it('should NOT render ErrorMessage when transfer is NOT hidden and transferErrors NOT provided', () => {
        const { queryByText } = render(<AmendPaymentTermsAndConditions {...mockProps} />);

        expect(queryByText(SitecoreDictionary.PaymentFailureMessagesNoTransferOption)).not.toBeInTheDocument();
    });
});
