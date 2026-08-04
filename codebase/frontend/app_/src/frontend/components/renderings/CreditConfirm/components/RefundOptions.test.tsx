import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RefundOptions from './RefundOptions';

const createProps = () => ({
    fields: {
        IsCreditSelected: { value: false },
        CreditCardDescription: { value: 'CreditCardDescription {creditAmount}' },
        RefundCardDescription: { value: 'RefundCardDescription {cashAmount} {creditAmount}' },
        RefundPopupInfo: { value: 'RefundPopupInfo' },
    },
    refund: {
        credit: {
            isEligible: false,
            credit: 1,
        },
        refund: {
            isEligible: false,
            credit: 2,
            cash: 3,
        },
    },
    isCreditOnlyRefund: false,
    onChangeRefundType: jest.fn(),
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), isEditMode: false },
    routerStore: { redirectTo: jest.fn() },
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
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

jest.mock('frontend/components/renderings/Payment/components/PaymentMethodCard', () => ({ children }) => (
    <div data-tid='payment-method-card'>{children}</div>
));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

describe('<RefundOptions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render subtitle heading', () => {
        const { getByRole } = render(<RefundOptions {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent(SitecoreDictionary.CreditConfirmRefundCardsTitle);
    });

    it('should render 2 PaymentMethodCard components', () => {
        const { getAllByTestId } = render(<RefundOptions {...mockProps} />);

        expect(getAllByTestId('payment-method-card').length).toBe(2);
    });

    it('should render creditField with token replaced', () => {
        const { getByText, getAllByText } = render(<RefundOptions {...mockProps} />);

        expect(getByText('CreditCardDescription')).toBeInTheDocument();
        expect(getAllByText('£1').length).toBe(3);
    });

    it('should render creditField without token replaced when is Edit mode', () => {
        mockStores.layoutStore.isEditMode = true;
        const { getByText, getAllByText } = render(<RefundOptions {...mockProps} />);

        expect(getByText('CreditCardDescription {creditAmount}')).toBeInTheDocument();
        expect(getAllByText('£1').length).toBe(2);
    });

    it('should NOT render creditField when is Edit mode no CreditCardDescription value', () => {
        mockProps.fields.CreditCardDescription = null;
        const { container } = render(<RefundOptions {...mockProps} />);

        expect(container.getElementsByClassName('credit-description').length).toBe(0);
    });

    it('should render 2 breakdowns with CreditConfirmRefundCardsCreditRefundAmount', () => {
        const { getAllByText } = render(<RefundOptions {...mockProps} />);

        expect(getAllByText(SitecoreDictionary.CreditConfirmRefundCardsCreditRefundAmount).length).toBe(2);
    });

    it('should render 2 breakdowns with CreditConfirmRefundCardsTotal', () => {
        const { getAllByText } = render(<RefundOptions {...mockProps} />);

        expect(getAllByText(SitecoreDictionary.CreditConfirmRefundCardsTotal).length).toBe(2);
    });

    it('should render breakdown with CreditConfirmRefundCardsCashRefundAmount', () => {
        const { getByText } = render(<RefundOptions {...mockProps} />);

        expect(getByText(SitecoreDictionary.CreditConfirmRefundCardsCashRefundAmount)).toBeInTheDocument();
    });

    it('should render refundField with tokens replaced', () => {
        const { getByText, getAllByText } = render(<RefundOptions {...mockProps} />);

        expect(getByText('RefundCardDescription')).toBeInTheDocument();
        expect(getAllByText('£2').length).toBe(2);
        expect(getAllByText('£3').length).toBe(2);
    });

    it('should render refundField without token replaced when is Edit mode', () => {
        mockStores.layoutStore.isEditMode = true;
        const { getByText, getAllByText } = render(<RefundOptions {...mockProps} />);

        expect(getByText('RefundCardDescription {cashAmount} {creditAmount}')).toBeInTheDocument();
        expect(getAllByText('£3').length).toBe(1);
        expect(getAllByText('£2').length).toBe(1);
    });

    it('should NOT render refundField when no RefundCardDescription value', () => {
        mockProps.fields.RefundCardDescription = null;
        const { container } = render(<RefundOptions {...mockProps} />);

        expect(container.getElementsByClassName('refund-description').length).toBe(0);
    });

    it('should NOT render popup when RefundCardDescription value does NOT have href and user clicks RefundCardDescription', async () => {
        const { queryByTestId, getByText } = render(<RefundOptions {...mockProps} />);

        await userEvent.click(getByText('RefundCardDescription'));
        expect(queryByTestId('popup')).not.toBeInTheDocument();
    });

    it('should NOT render popup when RefundCardDescription value has href different then #refund-info-popup and user clicks RefundCardDescription', async () => {
        mockProps.fields.RefundCardDescription.value = '<a href="test">RefundCardDescription</a>';
        const { queryByTestId, getByText } = render(<RefundOptions {...mockProps} />);

        await userEvent.click(getByText('RefundCardDescription'));
        expect(queryByTestId('popup')).not.toBeInTheDocument();
    });

    it('should render popup when RefundCardDescription value has href equal to #refund-info-popup and user clicks RefundCardDescription', async () => {
        mockProps.fields.RefundCardDescription.value = '<a href="#refund-info-popup">RefundCardDescription</a>';
        const { getByTestId, getByText } = render(<RefundOptions {...mockProps} />);

        await userEvent.click(getByText('RefundCardDescription'));
        expect(getByTestId('popup')).toBeInTheDocument();
    });

    it('should render refund popup info in popup', async () => {
        mockProps.fields.RefundCardDescription.value = '<a href="#refund-info-popup">RefundCardDescription</a>';
        const { getByText } = render(<RefundOptions {...mockProps} />);

        await userEvent.click(getByText('RefundCardDescription'));
        expect(getByText('RefundPopupInfo')).toBeInTheDocument();
    });

    it('should NOT render refund popup info in popup when refund popup info NOT provided', async () => {
        mockProps.fields.RefundCardDescription.value = '<a href="#refund-info-popup">RefundCardDescription</a>';
        mockProps.fields.RefundPopupInfo = null;
        const { getByText, queryByText } = render(<RefundOptions {...mockProps} />);

        await userEvent.click(getByText('RefundCardDescription'));
        expect(queryByText('RefundPopupInfo')).not.toBeInTheDocument();
    });
});
