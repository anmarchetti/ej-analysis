import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RefundSummary from './RefundSummary';

const createProps = () => ({
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
    description: { value: 'description' },
    isDisabled: false,
    isLoading: false,
    onConfirmClick: jest.fn(),
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    routerStore: {},
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

describe('<RefundSummary />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render refund-summary__breakdown container when isCreditOnlyRefund', () => {
        mockProps.isCreditOnlyRefund = true;
        const { container } = render(<RefundSummary {...mockProps} />);

        expect(container.getElementsByClassName('refund-summary__breakdown').length).toBe(0);
    });

    it('should render 2 refund-summary__breakdown containers when NOT isCreditOnlyRefund', () => {
        const { container } = render(<RefundSummary {...mockProps} />);

        expect(container.getElementsByClassName('refund-summary__breakdown').length).toBe(2);
    });

    it('should render CreditConfirmRefundSummaryCashBreakdown and refund cash when NOT isCreditOnlyRefund', () => {
        const { getByText } = render(<RefundSummary {...mockProps} />);

        expect(getByText(SitecoreDictionary.CreditConfirmRefundSummaryCashBreakdown)).toBeInTheDocument();
        expect(getByText('£3')).toBeInTheDocument();
    });

    it('should render CreditConfirmRefundSummaryCreditBreakdown and refund credit when NOT isCreditOnlyRefund', () => {
        const { getByText } = render(<RefundSummary {...mockProps} />);

        expect(getByText(SitecoreDictionary.CreditConfirmRefundSummaryCreditBreakdown)).toBeInTheDocument();
        expect(getByText('£2')).toBeInTheDocument();
    });

    it('should render CreditConfirmRefundSummaryTotalCredit with credit when isCreditOnlyRefund', () => {
        mockProps.isCreditOnlyRefund = true;
        const { getByText } = render(<RefundSummary {...mockProps} />);

        expect(getByText(SitecoreDictionary.CreditConfirmRefundSummaryTotalCredit)).toBeInTheDocument();
        expect(getByText('£1')).toBeInTheDocument();
    });

    it('should render CreditConfirmRefundSummaryTotalRefund with total amout of money when NOT isCreditOnlyRefund', () => {
        const { getByText } = render(<RefundSummary {...mockProps} />);

        expect(getByText(SitecoreDictionary.CreditConfirmRefundSummaryTotalRefund)).toBeInTheDocument();
        expect(getByText('£5')).toBeInTheDocument();
    });

    it('should render description', () => {
        const { getByText } = render(<RefundSummary {...mockProps} />);

        expect(getByText('description')).toBeInTheDocument();
    });

    it('should NOT render description when no description value provided', () => {
        mockProps.description = null;
        const { queryByText } = render(<RefundSummary {...mockProps} />);

        expect(queryByText('description')).not.toBeInTheDocument();
    });

    it('should render confirm button', () => {
        const { getByRole } = render(<RefundSummary {...mockProps} />);

        expect(getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsConfirm);
    });

    it('should call onConfirmClick after clicking button', async () => {
        const { getByRole } = render(<RefundSummary {...mockProps} />);

        await userEvent.click(getByRole('button'));
        expect(mockProps.onConfirmClick).toHaveBeenCalled();
    });
});
