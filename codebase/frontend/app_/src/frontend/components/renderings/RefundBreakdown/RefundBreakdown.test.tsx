import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores, mockBooking } from 'frontend/__mocks__';

import { refundBreakdownFields } from './__mocks__/refundBreakdownFields.mock';
import RefundBreakdown, { TRefundBreakdownProps } from './RefundBreakdown';

const createProps = (): TRefundBreakdownProps => ({
    fields: refundBreakdownFields,
    params: {},
    rendering: undefined,
});

let mockProps = createProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPriceBreakdownProps = jest.fn();
jest.mock('frontend/components/common/PriceBreakdown/PriceBreakdown', () => ({
    __esModule: true,
    default: props => {
        mockPriceBreakdownProps(props);

        return <div data-tid='price-breakdown' />;
    },
}));

describe('RefundBreakdown', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            viewBookingStore: {
                booking: {
                    ...mockBooking,
                    cancelledBookingSummary: {
                        cashRefundAmount: 200,
                        creditRefundAmount: 100,
                        currency: CurrencyCode.GBP,
                        totalRefundAmount: 300,
                    },
                },
            },
        });
    });

    it('should NOT render component when fields are NOT provided', () => {
        delete mockProps.fields;

        const { container } = render(<RefundBreakdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when booking is empty', () => {
        mockStores.viewBookingStore.booking = undefined;

        const { container } = render(<RefundBreakdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when cancellation refund summary is empty', () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancelledBookingSummary: undefined,
        };

        const { container } = render(<RefundBreakdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when user is NOT logged in as a lead passenger', () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            isLoggedInAsLeadPassenger: false,
        };

        const { container } = render(<RefundBreakdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render component when booking is made by an external agency and opened on B2C website', () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            isExternalAgency: true,
        };
        mockStores.layoutStore.isTradePortal = false;

        const { container } = render(<RefundBreakdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component when user is NOT logged in as a lead passenger but it is a trade portal', () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            isLoggedInAsLeadPassenger: false,
            cancelledBookingSummary: {
                cashRefundAmount: 200,
                creditRefundAmount: 100,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 300,
            },
        };
        mockStores.layoutStore.isTradePortal = true;

        render(<RefundBreakdown {...mockProps} />);

        expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
    });

    it('should render refund breakdown component with credit and cash refunds', () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancelledBookingSummary: {
                cashRefundAmount: 200,
                creditRefundAmount: 100,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 300,
            },
        };
        render(<RefundBreakdown {...mockProps} />);

        expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            totalPrice: 300,
            fields: mockProps.fields,
            priceBreakdownItems: [
                {
                    amount: 100,
                    breakdownTitle: mockProps.fields?.CreditRefundLabel.value,
                    className: 'itemBreakdown',
                    uniqueKey: 'creditRefund',
                },
                {
                    amount: 200,
                    breakdownTitle: mockProps.fields?.OriginalMethodRefundLabel.value,
                    className: 'itemBreakdown',
                    uniqueKey: 'cashRefund',
                },
            ],
            totalPriceLabelField: mockProps.fields?.RefundAmount,
            priceBreakdownTitle: mockProps.fields?.PriceBreakdownTitle,
            currency: mockStores.viewBookingStore.booking.paymentInfo.currency,
            containerClassName: 'breakdownContainer',
            titleClassName: 'title',
            showStickyDesignOnMobile: false,
        });
    });

    it('should render refund breakdown component with credit refund only when cash refund is 0', () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancelledBookingSummary: {
                cashRefundAmount: 0,
                creditRefundAmount: 100,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 100,
            },
        };
        render(<RefundBreakdown {...mockProps} />);

        expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            totalPrice: 100,
            fields: mockProps.fields,
            priceBreakdownItems: [
                {
                    amount: 100,
                    breakdownTitle: mockProps.fields?.CreditRefundLabel.value,
                    className: 'itemBreakdown',
                    uniqueKey: 'creditRefund',
                },
            ],
            totalPriceLabelField: mockProps.fields?.RefundAmount,
            priceBreakdownTitle: mockProps.fields?.PriceBreakdownTitle,
            currency: mockStores.viewBookingStore.booking.paymentInfo.currency,
            containerClassName: 'breakdownContainer',
            titleClassName: 'title',
            showStickyDesignOnMobile: false,
        });
    });

    it('should render refund breakdown component with cash refund only when credit refund is 0', () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancelledBookingSummary: {
                cashRefundAmount: 200,
                creditRefundAmount: 0,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 200,
            },
        };
        render(<RefundBreakdown {...mockProps} />);

        expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            totalPrice: 200,
            fields: mockProps.fields,
            priceBreakdownItems: [
                {
                    amount: 200,
                    breakdownTitle: mockProps.fields?.OriginalMethodRefundLabel.value,
                    className: 'itemBreakdown',
                    uniqueKey: 'cashRefund',
                },
            ],
            totalPriceLabelField: mockProps.fields?.RefundAmount,
            priceBreakdownTitle: mockProps.fields?.PriceBreakdownTitle,
            currency: mockStores.viewBookingStore.booking.paymentInfo.currency,
            containerClassName: 'breakdownContainer',
            titleClassName: 'title',
            showStickyDesignOnMobile: false,
        });
    });

    it('should render refund breakdown component with no price breakdown items when both refunds are 0', () => {
        mockStores.viewBookingStore.booking = {
            ...mockBooking,
            cancelledBookingSummary: {
                cashRefundAmount: 0,
                creditRefundAmount: 0,
                currency: CurrencyCode.GBP,
                totalRefundAmount: 0,
            },
        };
        render(<RefundBreakdown {...mockProps} />);
        expect(screen.getByTestId('price-breakdown')).toBeInTheDocument();
        expect(mockPriceBreakdownProps).toHaveBeenCalledWith({
            totalPrice: 0,
            fields: mockProps.fields,
            priceBreakdownItems: [],
            totalPriceLabelField: mockProps.fields?.RefundAmount,
            priceBreakdownTitle: mockProps.fields?.PriceBreakdownTitle,
            currency: mockStores.viewBookingStore.booking.paymentInfo.currency,
            containerClassName: 'breakdownContainer',
            titleClassName: 'title noPadding',
            showStickyDesignOnMobile: false,
        });
    });
});
