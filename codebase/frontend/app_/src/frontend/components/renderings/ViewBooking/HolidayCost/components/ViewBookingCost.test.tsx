import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { TrailingZeroDisplay } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { gaClickShowPriceBreakdown } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import ViewBookingCost from './ViewBookingCost';

const createProps = () => ({
    departureDate: '2021-05-08',
    paymentInfo: {
        currency: 'GBP',
        totalPrice: 1000,
        pricePP: 500,
        depositPrice: 120,
        balanceDueAmount: 0,
        balanceDueDate: '2021-04-03',
        paymentHistory: [
            {
                amount: 1000,
                paymentDate: '2021-01-21',
                isCredit: false,
            },
        ],
    },
    priceBreakdown: [
        { code: 'Holiday', name: 'Holiday', amount: 1000 },
        { code: 'Promotions', name: 'Promotions', amount: 100 },
    ],
    rendering: {},
    payBalance: jest.fn(),
    isLoggedInUserLead: false,
    isBookingCanceled: false,
});
const createStores = () =>
    createMockStores({
        marketStore: {
            formatMoneyToIntegerAndDecimalWithTypes: jest.fn(() => [{}, {}, {}]),
        },
        layoutStore: {
            daysBeforeDepartureToShowReminder: 28,
        },
    });

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/ChevronDown', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-chevron-down' />,
}));

jest.mock('frontend/components/icons-new/ChevronUp', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-chevron-up' />,
}));

const mockFormattedMoneyProps = jest.fn();
jest.mock('frontend/components/common/FormattedMoney/FormattedMoney', () => ({
    __esModule: true,
    default: props => {
        mockFormattedMoneyProps(props);

        return <div data-tid='formatted-money' />;
    },
    MIN_FRACTION_DIGITS: 2,
}));

const mockPushTrackingEvent = jest.fn();
jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

describe('<ViewBookingCost />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('Should render collapsed view', () => {
        render(<ViewBookingCost {...props} />);

        const toggle = screen.queryByTestId('view-booking-cost-toggle');

        expect(screen.getByTestId('view-booking-cost-details')).toHaveAttribute('hidden');
        expect(toggle).toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                expanded: false,
            }),
        ).toBeInTheDocument();
        expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
        expect(toggle).toHaveTextContent(SitecoreDictionary.PaymentButtonsViewDetails);
        expect(mockFormattedMoneyProps).toHaveBeenCalledWith({
            amount: 1000,
            options: { currency: props.paymentInfo.currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger },
            className: 'price-big__subtext',
        });
        expect(
            screen.queryByText(SitecoreDictionary.FlightPlusHotelPaymentReceiptPaymentBreakdown),
        ).not.toBeInTheDocument();
    });

    it('should render VAT label when isFlightAndHotelPackage is true', () => {
        mockStores.viewBookingStore = { isFlightAndHotelPackage: true };
        render(<ViewBookingCost {...props} />);

        expect(screen.getByText(SitecoreDictionary.FlightPlusHotelPaymentReceiptPaymentBreakdown)).toBeInTheDocument();
    });

    it('should render expanded view when chevron is clicked', () => {
        render(<ViewBookingCost {...props} />);
        const toggle = screen.getByTestId('view-booking-cost-toggle');

        fireEvent.click(toggle);

        expect(screen.getByTestId('icon-chevron-up')).toBeInTheDocument();
        expect(toggle).toHaveTextContent(SitecoreDictionary.PaymentButtonsHideDetails);
        expect(screen.getByTestId('view-booking-cost-details')).not.toHaveAttribute('hidden');
    });

    it('should call pushTrackingEvent when chevron is clicked', () => {
        render(<ViewBookingCost {...props} />);
        const toggle = screen.getByTestId('view-booking-cost-toggle');

        fireEvent.click(toggle);

        expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickShowPriceBreakdown(props.paymentInfo.currency));
    });

    it('Should render collapsed view on mobile', () => {
        mockStores.appStore.isScreenMedium = false;
        render(<ViewBookingCost {...props} />);
        const toggle = screen.queryByTestId('view-booking-cost-toggle');

        expect(screen.getByTestId('view-booking-cost-details')).toHaveAttribute('hidden');
        expect(toggle).toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                expanded: false,
            }),
        ).toBeInTheDocument();
        expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
        expect(toggle).toHaveTextContent(SitecoreDictionary.PaymentButtonsViewDetails);
        expect(mockFormattedMoneyProps).toHaveBeenCalledWith({
            amount: 1000,
            options: { currency: props.paymentInfo.currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger },
            className: 'price-big__subtext',
        });
    });

    it('Should render existing Remaining Balance', () => {
        props.showRemainingBalance = true;
        render(<ViewBookingCost {...props} />);

        expect(screen.queryByTestId('view-booking-cost')).toBeInTheDocument();
        expect(screen.queryByTestId('view-booking-cost-remaining-balance')).toBeInTheDocument();
    });

    it('Should render existing Remaining Balance on mobile', () => {
        props.showRemainingBalance = true;
        mockStores.appStore.isScreenMedium = false;
        render(<ViewBookingCost {...props} />);

        expect(screen.queryByTestId('view-booking-cost')).toBeInTheDocument();
        expect(screen.queryByTestId('view-booking-cost-remaining-balance')).toBeInTheDocument();
    });

    it('should render total block with data-tid', () => {
        render(<ViewBookingCost {...props} />);

        expect(screen.getByTestId('view-booking-cost-total-block')).toBeInTheDocument();
    });

    it('should apply titleClassName to title', () => {
        render(<ViewBookingCost {...props} titleClassName='custom-title' />);

        const title = screen.getByText(SitecoreDictionary.BookingPaymentLabelsHolidayCost);
        expect(title).toHaveClass('custom-title');
    });

    it('should render BookingCost title when isFlightAndHotelPackage is true', () => {
        mockStores.viewBookingStore = { isFlightAndHotelPackage: true };
        render(<ViewBookingCost {...props} />);

        expect(screen.getByText(SitecoreDictionary.BookingPaymentLabelsBookingCost)).toBeInTheDocument();
    });

    it('should render HolidayCost title when isFlightAndHotelPackage is false', () => {
        mockStores.viewBookingStore = { isFlightAndHotelPackage: false };
        render(<ViewBookingCost {...props} />);

        expect(screen.getByText(SitecoreDictionary.BookingPaymentLabelsHolidayCost)).toBeInTheDocument();
    });

    it('should render TotalBookingCost label in details when isFlightAndHotelPackage is true', () => {
        mockStores.viewBookingStore = { isFlightAndHotelPackage: true };
        render(<ViewBookingCost {...props} />);

        expect(screen.getByTestId('breakdown-label-total')).toHaveTextContent(
            SitecoreDictionary.BookingPaymentLabelsTotalBookingCost,
        );
    });

    it('should render TotalCost label in details when isFlightAndHotelPackage is false', () => {
        mockStores.viewBookingStore = { isFlightAndHotelPackage: false };
        render(<ViewBookingCost {...props} />);

        expect(screen.getByTestId('breakdown-label-total')).toHaveTextContent(
            SitecoreDictionary.BookingPaymentLabelsTotalCost,
        );
    });

    it('should render BookingCost labels when viewBookingStore.isFlightAndHotelPackage is false but bookingStore.isFlightAndHotelPackage is true', () => {
        mockStores.viewBookingStore = { isFlightAndHotelPackage: false };
        mockStores.bookingStore = { isFlightAndHotelPackage: true };
        render(<ViewBookingCost {...props} />);

        expect(screen.getByText(SitecoreDictionary.BookingPaymentLabelsBookingCost)).toBeInTheDocument();
        expect(screen.getByTestId('breakdown-label-total')).toHaveTextContent(
            SitecoreDictionary.BookingPaymentLabelsTotalBookingCost,
        );
    });

    it('should pass subtitleClassName to RemainingBalance', () => {
        props.showRemainingBalance = true;
        render(<ViewBookingCost {...props} subtitleClassName='custom-subtitle' />);

        const subtitle = screen.getByTestId('remaining-balance-subtitle');
        expect(subtitle).toHaveClass('custom-subtitle');
    });
});
