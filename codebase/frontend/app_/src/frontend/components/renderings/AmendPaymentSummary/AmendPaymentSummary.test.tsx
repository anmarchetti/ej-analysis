import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { isTradeStore } from 'frontend/store/tradePortal';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import AmendPaymentSummary from './AmendPaymentSummary';

const createStores = () => ({
    amendPaymentStore: {
        amountToPay: 0.99,
        balanceAmount: 1,
        totalPrice: 2,
        isPaying: false,
        currency: CurrencyCode.GBP,
    },
    payStore: {
        usedCredit: 3,
    },
    layoutStore: { getPhrase: jest.fn(p => p) },
    marketStore: { formatMoney: jest.fn(a => `£${a}`), currency: CurrencyCode.GBP },
    amendSeatsStore: { newSelection: null },
    routerStore: { redirectToTradePortalFindBookingPage: jest.fn() },
});

const viewBookingFields = {
    AccommodationLabel: mockSitecoreField('AccommodationLabel'),
    BalanceLabel: mockSitecoreField('BalanceLabel'),
    CommissionLabel: mockSitecoreField('CommissionLabel'),
    DepositLabel: mockSitecoreField('DepositLabel'),
    FeesAndTaxesLabel: mockSitecoreField('FeesAndTaxesLabel'),
    PopupTitle: mockSitecoreField('PopupTitle'),
    TotalPriceLabel: mockSitecoreField('TotalPriceLabel'),
    VATOnCommissionLabel: mockSitecoreField('VATOnCommissionLabel'),
};
const createProps: any = () => ({
    fields: {
        ...viewBookingFields,
        ConfirmChangesLabel: mockSitecoreField('ConfirmChangesLabel'),
        ConfirmButtonLabel: mockSitecoreField('ConfirmButtonLabel'),
    },
    rendering: 'rendering',
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn(),
}));

const mockOverlaySpinner = jest.fn();

jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: props => {
        mockOverlaySpinner(props);

        return <div data-tid='overlay' />;
    },
}));

const mockAmendPaymentTotalBlockProps = jest.fn();
jest.mock('frontend/components/common/Amend/AmendPaymentTotalBlock/AmendPaymentTotalBlock', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockAmendPaymentTotalBlockProps(props);

        return <div data-tid='total-payable-amount'>{children}</div>;
    },
}));

const mockViewBookingLinkCostProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendPaymentSummary/components/AmendmentViewBookingCost/AmendmentViewBookingCost',
    () => ({
        __esModule: true,
        default: props => {
            mockViewBookingLinkCostProps(props);

            return <div data-tid='view-booking-link-cost' />;
        },
    }),
);

const mockAmendWrapperProps = jest.fn();
jest.mock('./components/AmendPaymentSummaryDetailsWrapper/AmendPaymentSummaryDetailsWrapper', () => ({
    __esModule: true,
    default: props => {
        mockAmendWrapperProps(props);

        return <div data-tid='amend-wrapper' />;
    },
}));

const mockPriceBreakdown = jest.fn();
jest.mock('frontend/components/common/PriceBreakdown/PriceBreakdown', () => ({
    __esModule: true,
    default: props => {
        mockPriceBreakdown(props);

        return <div data-tid='price-breakdown' />;
    },
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

describe('<AmendPaymentSummary />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render AmendPaymentSummary', () => {
        render(<AmendPaymentSummary {...mockProps} />);

        expect(screen.getByTestId('amend-wrapper')).toBeInTheDocument();
        expect(mockAmendWrapperProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            rendering: 'rendering',
        });

        expect(screen.getByTestId('total-payable-amount')).toBeInTheDocument();
        expect(mockAmendPaymentTotalBlockProps).toHaveBeenCalledWith({
            title: 'ConfirmChangesLabel',
            confirmLabel: 'ConfirmButtonLabel',
        });

        expect(screen.getByTestId('view-booking-link-cost')).toBeInTheDocument();
        expect(mockViewBookingLinkCostProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: mockProps.fields,
            }),
        );

        expect(screen.queryByTestId('overlay')).not.toBeInTheDocument();
    });

    it('should NOT render AmendPaymentSummary with NO fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<AmendPaymentSummary {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('redirectToTradePortalFindBookingPage', () => {
        beforeEach(() => {
            (isTradeStore as any).mockReturnValue(true);
            mockStores.routerStore.redirectToTradePortalFindBookingPage = jest.fn();
        });

        it('should not redirectToTradePortalFindBookingPage when newSelection exists', () => {
            mockStores.amendSeatsStore.newSelection = [] as any;
            render(<AmendPaymentSummary {...mockProps} />);

            expect(mockStores.routerStore.redirectToTradePortalFindBookingPage).not.toHaveBeenCalled();
        });

        it("should redirectToTradePortalFindBookingPage when newSelection doesn't exist", () => {
            mockStores.amendSeatsStore.newSelection = null;
            render(<AmendPaymentSummary {...mockProps} />);

            expect(mockStores.routerStore.redirectToTradePortalFindBookingPage).toHaveBeenCalled();
        });

        it('should render OverlaySpinner', () => {
            mockStores.amendPaymentStore.isPaying = true;

            render(<AmendPaymentSummary {...mockProps} />);

            expect(screen.getByTestId('overlay')).toBeInTheDocument();
            expect(mockOverlaySpinner).toHaveBeenCalledWith({
                header: 'Payment.Titles.SpinnerHeader',
                description: 'Payment.Titles.SpinnerDescription',
            });
        });

        it('should render PriceBreakdown component', () => {
            render(<AmendPaymentSummary {...mockProps} />);

            expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
            expect(mockPriceBreakdown).toHaveBeenCalledWith({
                fields: mockProps.fields,
                totalPrice: mockStores.amendPaymentStore.amountToPay,
                isTradePortal: true,
                priceBreakdownItems: [
                    {
                        breakdownTitle: mockProps.fields.SeatsChange?.value ?? '',
                        amount: mockStores.amendPaymentStore.amountToPay,
                        uniqueKey: 'change',
                    },
                ],
                currency: mockStores.marketStore.currency,
            });
        });
    });
});
