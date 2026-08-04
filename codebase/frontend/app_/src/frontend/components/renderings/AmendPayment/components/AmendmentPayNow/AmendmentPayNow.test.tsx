import React from 'react';
import { render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';

import AmendmentPayNow from './AmendmentPayNow';

const createProps = () => ({
    fields: {
        TotalCost: mockSitecoreField('TotalCost'),
        ConfirmChangesLabel: mockSitecoreField('ConfirmChangesLabel'),
        ConfirmRefund: mockSitecoreField('ConfirmRefund'),
        RefundCreditsTitle: mockSitecoreField('RefundCreditsTitle'),
        DueBalanceLessBlockDaysTitle: mockSitecoreField('DueBalanceLessBlockDaysTitle'),
        PaidBalanceLessBlockDaysTitle: mockSitecoreField('PaidBalanceLessBlockDaysTitle'),
        DueBalanceLessBlockDaysDescription: mockSitecoreField('DueBalanceLessBlockDaysDescription'),
        PaidBalanceLessBlockDaysDescription: mockSitecoreField('PaidBalanceLessBlockDaysDescription'),
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAmendPayNowHeaderProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPayment/components/AmendmentPayNow/AmendPayNowHeader/AmendPayNowHeader',
    () => ({
        __esModule: true,
        default: props => {
            mockAmendPayNowHeaderProps(props);

            return <div data-tid='amend-pay-now-header' />;
        },
    }),
);

const mockAmendPayNowPricesProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPayment/components/AmendmentPayNow/AmendmentPayNowPrices/AmendmentPayNowPrices',
    () => ({
        __esModule: true,
        default: props => {
            mockAmendPayNowPricesProps(props);

            return <div data-tid='amend-pay-now-prices' />;
        },
    }),
);

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: { replaceTokens: jest.fn(string => string) },
}));

describe('<AmendmentPayNow />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            payStore: {
                setAmount: jest.fn(),
            },
            amendPaymentStore: {
                balanceAmount: 1000,
                totalPrice: 500,
                booking: {
                    ...mockBooking,
                    paymentInfo: {
                        allowPayOutstandingBalanceDays: 28,
                    },
                },
            },
        });
    });

    it('should call setAmount with balanceAmount + totalPrice on mount', () => {
        render(<AmendmentPayNow {...mockProps} />);

        expect(mockStores.payStore.setAmount).toHaveBeenCalledWith(1500);
    });

    describe('balance due', () => {
        it('should render AmendPayNowHeader with correct props when there is a balance', () => {
            render(<AmendmentPayNow {...mockProps} />);

            expect(screen.getByTestId('amend-pay-now-header')).toBeInTheDocument();
            expect(mockAmendPayNowHeaderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.DueBalanceLessBlockDaysTitle.value,
                    description: mockProps.fields.DueBalanceLessBlockDaysDescription.value,
                    withIcon: true,
                    className: 'hasBalanceHeader',
                }),
            );
            expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(
                mockProps.fields.DueBalanceLessBlockDaysDescription.value,
                {
                    [Tokens.Amount]:
                        mockStores.amendPaymentStore.booking?.paymentInfo.allowPayOutstandingBalanceDays.toString(),
                },
            );
        });

        it('should render AmendPayNowPrices', () => {
            render(<AmendmentPayNow {...mockProps} />);

            expect(screen.getByTestId('amend-pay-now-prices')).toBeInTheDocument();
            expect(mockAmendPayNowPricesProps).toHaveBeenCalledWith({ fields: mockProps.fields });
        });
    });

    it('should render AmendPayNowHeader with correct props when there is no balance, and not render AmendPayNowPrices', () => {
        mockStores.amendPaymentStore.balanceAmount = 0;
        render(<AmendmentPayNow {...mockProps} />);

        expect(screen.getByTestId('amend-pay-now-header')).toBeInTheDocument();
        expect(mockAmendPayNowHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.PaidBalanceLessBlockDaysTitle.value,
                description: mockProps.fields.PaidBalanceLessBlockDaysDescription.value,
                withIcon: false,
                className: 'noBalanceHeader',
            }),
        );
        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(
            mockProps.fields.PaidBalanceLessBlockDaysDescription.value,
            {
                [Tokens.Amount]:
                    mockStores.amendPaymentStore.booking?.paymentInfo.allowPayOutstandingBalanceDays.toString(),
            },
        );
        expect(screen.queryByTestId('amend-pay-now-prices')).not.toBeInTheDocument();
    });
});
