import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IBookingInfo } from 'models/data/IBookingInfo';

import TradePortalViewBookingCost from './TradePortalViewBookingCost';

jest.mock('next/dynamic', () => () => {
    const DynamicComponent = () => null;
    DynamicComponent.displayName = 'DynamicFeesPopupComponent';
    DynamicComponent.preload = jest.fn();

    return DynamicComponent;
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children }) => <button data-tid='toggle-popup-button'>{children}</button>,
}));

const mockPriceBreakdownComponent = jest.fn();

jest.mock('frontend/components/renderings/ViewBooking/HolidayCost/components/PriceBreakdown', () => ({
    __esModule: true,
    default: ({ priceBreakdown, currency, rowClassName }) => {
        mockPriceBreakdownComponent({ priceBreakdown, currency, rowClassName });

        return <div data-testid='price-breakdown' />;
    },
}));

const bookingMock = {
    bookingReference: '111',
    priceBreakdown: [
        { amount: 800, code: 'Holidays', name: 'Holidays', quantity: 1 },
        { amount: 80, code: 'Adults', name: 'Children', quantity: 1 },
        { amount: -20, code: 'Discount', name: 'ExtraDiscount', quantity: 1 },
    ],
    extraPriceBreakdown: [
        { amount: 800, code: 'Holidays', name: 'Holidays', quantity: 1 },
        { amount: -20, code: 'Discount', name: 'ExtraDiscount', quantity: 1 },
        { amount: 70, code: 'Promotions', name: 'Promotion', quantity: 1 },
        { amount: 80, code: 'Adults', name: 'Children', quantity: 1 },
    ],
    package: { accom: { startDate: '2021-01-01' } },
    guests: [
        { lastName: 'Lead', isLead: true },
        { lastName: 'Guest', isLead: false },
    ],
    refund: {
        credit: {
            isEligible: true,
            credit: 2100,
        },
        refund: {
            isEligible: true,
            credit: 100,
            cash: 2000,
        },
    },
    paymentInfo: { totalPrice: 100, pricePP: 100 },
} as IBookingInfo;

const createProps = () => ({
    fields: {
        AccommodationLabel: { value: 'AccommodationLabel' },
        BalanceLabel: { value: 'BalanceLabel' },
        CommissionLabel: { value: 'CommissionLabel' },
        DepositLabel: { value: 'DepositLabel' },
        FlightTaxLabel: { value: 'FlightTaxLabel' },
        PackagePriceLabel: { value: 'PackagePriceLabel' },
        PopupTitle: { value: 'PopupTitle' },
        TotalPriceLabel: { value: 'TotalPriceLabel' },
        VATOnCommissionLabel: { value: 'VATOnCommissionLabel' },
        FeesAndTaxesLabel: { value: 'FeesAndTaxesLabel' },
    },
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            booking: bookingMock,
            totalAccomodationDiscount: undefined,
        },
        viewBookingStore: {
            booking: bookingMock,
            totalAccomodationDiscount: undefined,
        },
        trackingStore: {
            trackEventWithParams: jest.fn(),
        },
        marketStore: {
            formatMoneyToIntegerAndDecimal: jest.fn(() => ['', '']),
        },
    });

let props;
let mockStores;

describe('<TradePortalViewBookingCost />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('Should NOT render when fields are empty', () => {
        props.fields = null;
        const { container } = render(<TradePortalViewBookingCost {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render standard', () => {
        render(<TradePortalViewBookingCost {...props} />);

        expect(screen.getByText('BookingPayment.Labels.HolidayCost')).toBeInTheDocument();
        expect(mockPriceBreakdownComponent).toHaveBeenCalled();
    });

    it('should render with data-tid attributes', () => {
        render(<TradePortalViewBookingCost {...props} />);

        expect(screen.getByTestId('trade-portal-view-booking-cost')).toBeInTheDocument();
        expect(screen.getByTestId('trade-portal-view-booking-cost-title')).toBeInTheDocument();
    });

    it('should apply containerClassName to root element', () => {
        render(<TradePortalViewBookingCost {...props} containerClassName='custom-container' />);

        expect(screen.getByTestId('trade-portal-view-booking-cost')).toHaveClass('custom-container');
    });

    it('should apply titleClassName to title element', () => {
        render(<TradePortalViewBookingCost {...props} titleClassName='custom-title' />);

        expect(screen.getByTestId('trade-portal-view-booking-cost-title')).toHaveClass('custom-title');
    });

    it('should pass rowClassName to PriceBreakdown', () => {
        render(<TradePortalViewBookingCost {...props} />);

        expect(mockPriceBreakdownComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                rowClassName: expect.any(String),
            }),
        );
    });

    it('Should render FeesAndTaxesLabel when such field is defined', () => {
        const { container } = render(<TradePortalViewBookingCost {...props} />);

        expect(container.querySelector('.fees-popup-link')).toBeInTheDocument();
        expect(screen.getByTestId('toggle-popup-button')).toHaveTextContent(props.fields.FeesAndTaxesLabel.value);
    });

    it('Should NOT render FeesAndTaxesLabel when such field is not defined', () => {
        props.fields.FeesAndTaxesLabel.value = null;
        const { container } = render(<TradePortalViewBookingCost {...props} />);

        expect(container.querySelector('.fees-popup-link')).not.toBeInTheDocument();
    });

    it('Should render pricePP block when pricePP is not equal with totalPrice', () => {
        mockStores.bookingStore.booking.paymentInfo = {
            totalPrice: 1000,
            pricePP: 500,
        };
        render(<TradePortalViewBookingCost {...props} />);

        expect(screen.getByTestId('breakdown-label-pp')).toBeInTheDocument();
    });

    it('Should NOT render pricePP block when pricePP is equal with totalPrice', () => {
        mockStores.bookingStore.booking.paymentInfo = {
            totalPrice: 500,
            pricePP: 500,
        };
        render(<TradePortalViewBookingCost {...props} />);

        expect(screen.queryByTestId('breakdown-label-pp')).not.toBeInTheDocument();
    });

    describe('extra price breakdown', () => {
        it('should correctly sort and display ', async () => {
            render(<TradePortalViewBookingCost {...props} />);

            expect(mockPriceBreakdownComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    priceBreakdown: [
                        { amount: 800, code: 'Holidays', name: 'Holidays', quantity: 1 },
                        { amount: 80, code: 'Adults', name: 'Children', quantity: 1 },
                        { amount: 70, code: 'Promotions', name: 'Promotion', quantity: 1 },
                        { amount: -20, code: 'Discount', name: 'ExtraDiscount', quantity: 1 },
                    ],
                }),
            );
        });

        it('should use priceBreakdown as a fallback value', async () => {
            mockStores.bookingStore.booking.extraPriceBreakdown = undefined;

            render(<TradePortalViewBookingCost {...props} />);

            expect(mockPriceBreakdownComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    priceBreakdown: [
                        { amount: 800, code: 'Holidays', name: 'Holidays', quantity: 1 },
                        { amount: 80, code: 'Adults', name: 'Children', quantity: 1 },
                        { amount: -20, code: 'Discount', name: 'ExtraDiscount', quantity: 1 },
                    ],
                }),
            );
        });
    });
});
