import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SignDisplay, TrailingZeroDisplay } from 'code/currency';
import { createMockStores, mockBooking, mockLuggageListFields } from 'frontend/__mocks__';
import { cabinBagsMock } from 'frontend/__mocks__/extraLuggage';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockTouristTaxErrorFields, mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import * as taxUtils from 'frontend/utils/touristTax.utils';
import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { gaClickViewDetailsParams } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import BookingDetails from './BookingDetails';

jest.mock('next/dynamic', () => () => {
    const DynamicComponent = () => null;

    return DynamicComponent;
});

const mockPushTrackingEvent = jest.fn();

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking', () => ({
    usePaymentTracking: () => ({
        pushTrackingEvent: mockPushTrackingEvent,
    }),
}));

const createProps = () => ({
    offer: { accom: {}, extraLuggageInfo: { items: [] } as IExtraLuggageInfo } as Nullable<IOfferWithoutAltBoards>,
    paymentInfo: null as Nullable<IPaymentInfo>,
    priceBreakdown: null as Nullable<IPriceBreakdownItem[]>,
    luggageConfig: mockLuggageListFields,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isTradePortal: false,
            isTouristTaxEnabled: false,
            isHolidayPackageCostHighlighted: false,
        },
        bookingStore: {
            selectedOffer: { accom: {}, extraLuggageInfo: { items: [] } as IExtraLuggageInfo } as Nullable<
                Partial<IOfferWithoutAltBoards>
            >,
            transfer: null,
            packageInfo: null,
            paymentInfo: null as Nullable<Partial<IPaymentInfo>>,
            priceBreakdown: null as Nullable<IPriceBreakdownItem[]>,
            tradeAgentPriceBreakdown: null,
        },
        trackingStore: {
            trackEventWithParams: jest.fn(),
        },
    });

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockBookingDetailsExpanded = jest.fn();
jest.mock('frontend/components/renderings/Payment/components/BookingDetailsExpanded/BookingDetailsExpanded', () => ({
    __esModule: true,
    default: props => {
        mockBookingDetailsExpanded(props);

        return (
            <div data-tid='booking-details-expanded' onClick={props.onToggle}>
                BookingDetailsExpanded
            </div>
        );
    },
}));

jest.mock('frontend/components/renderings/Payment/components/BookingDetailsCollapsed/BookingDetailsCollapsed', () => ({
    __esModule: true,
    default: () => <div>BookingDetailsCollapsed</div>,
}));

const mockTouristTaxPriceTooltipComponent = jest.fn();
jest.mock('frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip', () => ({
    __esModule: true,
    TouristTaxPriceTooltip: ({ children, ...props }) => {
        mockTouristTaxPriceTooltipComponent(props);

        return <div data-tid='tourist-tax-price-tooltip'>{children}</div>;
    },
}));

jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: (props: any) => (
        <div data-tid='rich-text-dictionary' data-dictionary-key={props.dictionaryKey} className={props.className}>
            {props.dictionaryKey}
        </div>
    ),
}));

const mockLuxuryWrapper = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: props => {
        mockLuxuryWrapper(props);

        return <div data-tid='luxury-wrapper'>{props.children}</div>;
    },
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

jest.mock('frontend/components/common/FlightPlusHotelDiscountPrice', () => ({
    __esModule: true,
    default: () => <div data-tid='flight-plus-hotel-discount' />,
}));

describe('BookingDetails', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
        mockPushTrackingEvent.mockClear();
    });

    it(`shouldn't render component if there is no offer passed`, () => {
        mockStores.bookingStore.selectedOffer = null;
        const { container } = render(<BookingDetails {...props} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render payment-booking__total', () => {
        mockStores.bookingStore.paymentInfo = { totalPrice: 1, pricePP: 0.5 };
        render(<BookingDetails {...props} />);

        expect(screen.getByText(SitecoreDictionary.PaymentLabelsTotalPrice)).toBeInTheDocument();
        expect(mockFormattedMoneyProps).toHaveBeenCalledWith({
            amount: mockStores.bookingStore.paymentInfo.totalPrice,
            className: 'price-big__subtext',
            options: {
                currency: mockStores.bookingStore.paymentInfo.currency,
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                signDisplay: SignDisplay.AUTO,
            },
        });
    });

    it('should render payment-booking__list and price-value when we have priceBreakdown', () => {
        mockStores.bookingStore.priceBreakdown = [{ name: 'name', amount: 1, code: 'Adults', quantity: 1 }];
        render(<BookingDetails {...props} />);

        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('£1')).toBeInTheDocument();
    });

    it('should render payment-booking__list and text-red when we have priceBreakdown with amount < 0', () => {
        mockStores.bookingStore.priceBreakdown = [{ name: 'name', amount: -1, code: 'Adults', quantity: 1 }];
        render(<BookingDetails {...props} />);

        expect(screen.getByText('£-1')).toHaveClass('priceValueLarge');
    });

    it('should render payment-booking__list with FreeForKids', () => {
        mockStores.bookingStore.selectedOffer.accom = {
            unit: [{ isFreeForKids: true, code: 'Kids' }],
        };
        mockStores.bookingStore.priceBreakdown = [{ name: 'Kids', code: 'Kids', amount: 0, quantity: 2 }];
        render(<BookingDetails {...props} />);

        expect(screen.getByText('Kids')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.BoardTypesButtonsIncluded)).toBeInTheDocument();
    });

    it('should call pushTrackingEvent with gaClickViewDetailsParams when details are toggled open', async () => {
        render(<BookingDetails {...props} />);
        const toggleButton = screen.getByTestId('booking-details-expanded');

        await userEvent.click(toggleButton);

        expect(mockPushTrackingEvent).toHaveBeenCalledWith(gaClickViewDetailsParams);
    });

    it('should render sorted priceBreakdownValue when areDetailsShown is true', () => {
        mockStores.layoutStore.isTradePortal = true;
        mockStores.bookingStore.priceBreakdown = [
            { name: 'Promo', amount: 50, code: 'Promotions', quantity: 1 },
            { name: 'Adults', amount: 100, code: 'Adults', quantity: 1 },
            { name: 'Discount', amount: -10, code: 'Discount', quantity: 1 },
        ];

        render(<BookingDetails {...props} />);

        const items = screen.getAllByTestId('breakdown-item');
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveTextContent('Promo');
        expect(items[1]).toHaveTextContent('Adults');
        expect(items[2]).toHaveTextContent('Discount');
    });

    describe('BookingDetailsExpanded', () => {
        it('should render price breakdown with extraPriceBreakdown from booking when present', () => {
            mockStores.layoutStore.isTradePortal = true;
            props.booking = mockBooking;

            render(<BookingDetails {...props} />);

            const items = screen.getAllByTestId('breakdown-item');
            expect(items).toHaveLength(3);
            expect(items[0]).toHaveTextContent('Promo');
            expect(items[1]).toHaveTextContent('Adults');
            expect(items[2]).toHaveTextContent('Discount');
            expect(screen.getByTestId('booking-details-price-section')).toBeInTheDocument();
            expect(screen.getByTestId('price-value-total')).toBeInTheDocument();
        });

        it('should render price breakdown with extraPriceBreakdown object from booking when present', () => {
            mockStores.layoutStore.isTradePortal = true;
            props.booking = {
                ...mockBooking,
                extraPriceBreakdown: [
                    {
                        name: 'Extras',
                        amount: 20,
                        code: 'Extras',
                        quantity: 1,
                        subcategories: { name: 'Promo', amount: 50, code: 'Promotions', quantity: 1 },
                    },
                ],
            };

            render(<BookingDetails {...props} />);

            const items = screen.getAllByTestId('breakdown-item');
            expect(items).toHaveLength(1);
            expect(items[0]).toHaveTextContent('Promo');
        });

        it('should render BookingDetailsExpanded with extraLuggageInfo from booking', () => {
            props.booking = mockBooking;

            render(<BookingDetails {...props} />);

            expect(screen.getByTestId('booking-details-expanded')).toBeInTheDocument();
            expect(mockBookingDetailsExpanded).toHaveBeenCalledWith(
                expect.objectContaining({
                    extraLuggageItems: props.booking.extraLuggageInfo.items,
                }),
            );
        });

        it('should render BookingDetailsExpanded with extraLuggageInfo from offer when no booking', () => {
            props.booking = undefined;
            mockStores.bookingStore.selectedOffer = { ...mockedOffer, extraLuggageInfo: cabinBagsMock };

            render(<BookingDetails {...props} />);

            expect(screen.getByTestId('booking-details-expanded')).toBeInTheDocument();
            expect(mockBookingDetailsExpanded).toHaveBeenCalledWith(
                expect.objectContaining({
                    extraLuggageItems: mockStores.bookingStore.selectedOffer.extraLuggageInfo.items,
                }),
            );
        });
    });

    it('should render BookingDetails with luxury wrapper when isLuxuryPackage is true for offer', () => {
        mockStores.bookingStore.isLuxuryPackage = true;

        render(<BookingDetails {...props} />);

        expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
        expect(mockLuxuryWrapper).toHaveBeenCalledWith({
            label: SitecoreDictionary.GlobalsLabelsLuxuryCollection,
            children: expect.anything(),
        });
    });

    it('should render BookingDetails with luxury wrapper when isLuxuryPackage is true for booking', () => {
        mockStores.bookingStore.isLuxuryPackage = false;
        props.booking = {
            ...mockBooking,
            promoCollections: ['lux'],
        };

        render(<BookingDetails {...props} />);

        expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
        expect(mockLuxuryWrapper).toHaveBeenCalledWith({
            label: SitecoreDictionary.GlobalsLabelsLuxuryCollection,
            children: expect.anything(),
        });
    });

    describe('TouristTaxPriceTooltip', () => {
        const mockGetTouristTaxFieldsFromOffer = jest
            .spyOn(taxUtils, 'getTouristTaxFieldsFromOffer')
            .mockReturnValue(mockTouristTaxFields);

        beforeEach(() => {
            mockStores.bookingStore.paymentInfo = { totalPrice: 1, pricePP: 0.5 };
            mockStores.layoutStore.isTouristTaxEnabled = true;
        });

        it('should render TouristTaxPriceTooltip when isTouristTaxEnabled, disableTouristTax is false and touristTax is valid', () => {
            render(<BookingDetails {...props} />);

            expect(screen.getByTestId('tourist-tax-price-tooltip')).toBeInTheDocument();
            expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
                touristTax: mockTouristTaxFields.touristTax,
                taxesAndFees: mockTouristTaxFields.taxesAndFees,
            });
        });

        it('should NOT render TouristTaxPriceTooltip when payment info is null', () => {
            mockStores.bookingStore.paymentInfo = null;

            render(<BookingDetails {...props} />);

            expect(screen.queryByTestId('tourist-tax-price-tooltip')).not.toBeInTheDocument();
        });

        it('should NOT render TouristTaxPriceTooltip when isTouristTaxEnabled is false', () => {
            mockStores.layoutStore.isTouristTaxEnabled = false;

            render(<BookingDetails {...props} />);

            expect(screen.queryByTestId('tourist-tax-price-tooltip')).not.toBeInTheDocument();
        });

        it('should NOT render TouristTaxPriceTooltip when disableTouristTax is true', () => {
            props.disableTouristTax = true;

            render(<BookingDetails {...props} />);

            expect(screen.queryByTestId('tourist-tax-price-tooltip')).not.toBeInTheDocument();
        });

        it('should NOT render TouristTaxPriceTooltip when touristTax is NOT valid', () => {
            mockGetTouristTaxFieldsFromOffer.mockReturnValueOnce(mockTouristTaxErrorFields);

            render(<BookingDetails {...props} />);

            expect(screen.queryByTestId('tourist-tax-price-tooltip')).not.toBeInTheDocument();
        });
    });

    describe('isHolidayPackageCostHighlighted', () => {
        beforeEach(() => {
            mockStores.bookingStore.paymentInfo = { totalPrice: 1000 };
            mockStores.layoutStore.isTouristTaxEnabled = true;
        });

        it('should apply paymentBookingTotalOpened class to total price when details are shown', () => {
            mockStores.layoutStore.isTradePortal = true;

            render(<BookingDetails {...props} />);

            const totalPriceElement = screen.getByTestId('booking-details-total-price');
            expect(totalPriceElement).toHaveClass('paymentBookingTotalOpened');
        });

        it('should apply packageCostHighlightedWrapper class when isHolidayPackageCostHighlighted is true', () => {
            mockStores.layoutStore.isHolidayPackageCostHighlighted = true;

            render(<BookingDetails {...props} />);

            const wrapperElement = screen.getByTestId('booking-details-price-section');
            expect(wrapperElement).toHaveClass('packageCostHighlightedWrapper');
        });

        it('should NOT apply packageCostHighlightedWrapper class when isHolidayPackageCostHighlighted is false', () => {
            mockStores.layoutStore.isHolidayPackageCostHighlighted = false;

            render(<BookingDetails {...props} />);

            const wrapperElement = screen.getByTestId('booking-details-price-section');
            expect(wrapperElement).not.toHaveClass('packageCostHighlightedWrapper');
        });

        it('should apply semantic class to package cost section', () => {
            render(<BookingDetails {...props} />);

            const packageCostSection = screen.getByTestId('booking-details-package-cost');
            expect(packageCostSection).toHaveClass('packageCost');
        });
    });

    describe('Flight Plus Hotel Package', () => {
        beforeEach(() => {
            mockStores.bookingStore.isFlightAndHotelPackage = true;
            mockStores.bookingStore.flightPlusHotelDiscount = 100;
            mockStores.bookingStore.priceBreakdown = [{ name: 'Adults', amount: 100, code: 'Adults', quantity: 1 }];
        });

        it('should render FlightPlusHotelDiscountPrice component when areDetailsShown is true', () => {
            mockStores.layoutStore.isTradePortal = true;

            render(<BookingDetails {...props} />);

            expect(screen.getByTestId('flight-plus-hotel-discount')).toBeInTheDocument();
        });

        it('should NOT render FlightPlusHotelDiscountPrice component when areDetailsShown is false', () => {
            mockStores.layoutStore.isTradePortal = false;

            render(<BookingDetails {...props} />);

            expect(screen.queryByTestId('flight-plus-hotel-discount')).not.toBeInTheDocument();
        });

        it('should render FlightPlusHotelPricesPackageCost', () => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockStores.bookingStore.paymentInfo = { totalPrice: 1, pricePP: 0.5 };

            render(<BookingDetails {...props} />);

            expect(screen.getByText(SitecoreDictionary.FlightPlusHotelPricesPackageCost)).toHaveClass('fphPackageCost');
        });
    });
});
