import {
    createMockStores,
    mockAmendHotelOffer,
    mockAmendPaymentInfo,
    mockAmendPaymentPayload,
    mockAmendTrackingPayload,
    mockBooking,
    mockInboundFlight,
    mockOutboundFlight,
    mockTransfer,
    mockTransferWithAmendmentCharges,
    mockUnitRoom,
} from 'frontend/__mocks__';
import {
    mockAmendTransferTrackingProduct,
    mockBaseTrackingProduct,
    mockSecondaryTrackingProduct,
} from 'frontend/__mocks__/tracking';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { deepClone } from 'frontend/utils/array.utils';
import { AlternativeHotelsSortingOptions } from 'models/enum/AlternativeHotelsSortingOptions';
import { RecommendedOrderBy } from 'models/enum/OrderBy';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';
import { GenericValue } from 'models/enum/tracking/GenericValues';
import { TransferType } from 'models/enum/transfer/TransferType';

import { TrackingStore } from './TrackingStore';
import { TrackingHotelChangeStore } from './TrackingStore.hotelChange';

jest.mock('frontend/utils/airports.utils');

const mockedGetSearchDetailsForBooking = jest.fn();
const mockedGetSearchDetailObject = jest.fn();
jest.mock('frontend/utils/tracking/trackingList.utils', () => ({
    __esModule: true,
    getSearchDetailsForBooking: (...params) => mockedGetSearchDetailsForBooking(...params),
    getSearchDetailObject: (...params) => mockedGetSearchDetailObject(...params),
}));

describe('TrackingStore.hotelChange', () => {
    let trackingStore: Partial<TrackingStore>;
    let hotelChangeTrackStore: TrackingHotelChangeStore;
    const mockNullableObject = {
        roomAndBoard: null,
        transfer: null,
    };
    let mockInitialData;

    const mockOfferWithoutAltBoardsFromAmendHotelOffer = {
        extraLuggageInfo: mockAmendHotelOffer.extraLuggageInfo,
        date: mockAmendHotelOffer.accom.date,
        hasDistressedFlights: false,
        id: `${mockAmendHotelOffer.accom.code}_PB`,
        price: mockAmendHotelOffer.amendmentPaymentInfo.amendmentCharges,
        pricePP: mockAmendHotelOffer.amendmentPaymentInfo.amendmentCharges,
        stay: mockAmendHotelOffer.accom.stay,
        transport: mockBooking.package.transport,
        transfers: mockAmendHotelOffer.transfers,
        hotel: mockAmendHotelOffer.hotel,
        accom: mockAmendHotelOffer.accom,
        totalPrice: mockAmendHotelOffer.amendmentPaymentInfo.amendmentCharges,
        touristTax: 0,
        touristTaxPP: 0,
        hasDiscountedBoardUpgrade: false,
    };

    beforeEach(() => {
        mockInitialData = {
            amendmentPaymentInfo: mockAmendPaymentInfo,
            transfers: [mockTransfer],
            unit: [mockUnitRoom],
        };
        trackingStore = {
            buildCoreParamsObject: jest.fn().mockReturnValue('coreParams'),
            generateGenericValuesWithGuests: jest.fn().mockReturnValue('customParams'),
            getPrices: jest.fn().mockReturnValue({ revenue: 15, amendmentCharges: 15, metric6: 0 }),
            buildBaseHolidayProduct: jest.fn().mockReturnValue({ baseHolidayProduct: true }),
            addToDataLayer: jest.fn(),
            trackCustomError: jest.fn(),
            buildAmendTransferProduct: jest.fn().mockReturnValue(mockAmendTransferTrackingProduct),
            buildPageName: jest.fn().mockReturnValue('Page Name'),
            buildFeesAnalyticProduct: jest.fn().mockReturnValue({
                dimension108: EventTypes.Purchase,
                name: 'Change Fee',
                id: 'Fees',
                category: 'Fees',
                price: 25,
                quantity: 2,
            }),
            pageName: 'pageName',
        };

        const rootStore = createMockStores({
            layoutStore: {
                sitePath: 'sitePath',
            },
            trackingStore,
            amendHotelStore: {
                newlySelectedHotelOffer: deepClone({
                    ...mockAmendHotelOffer,
                    amendmentPaymentInfo: { ...mockAmendHotelOffer.amendmentPaymentInfo },
                }),
            },
            viewBookingStore: {
                viewBookingPayload: {
                    amendPaymentPayload: {
                        ...mockAmendPaymentPayload,
                        amendHotelOffer: deepClone(mockAmendHotelOffer),
                    },
                },
                dimension66: 'Other',
                paymentMethod: 'Visa',
            },
        });

        jest.mocked(getRouteByDirection).mockImplementation(() => ({
            outbound: mockOutboundFlight,
            inbound: mockInboundFlight,
        }));
        hotelChangeTrackStore = new TrackingHotelChangeStore(rootStore);
    });

    describe('getAmendHotelSortDimension', () => {
        it('should return string for selected sort type', () => {
            const result = hotelChangeTrackStore.getAmendHotelSortDimension(
                AlternativeHotelsSortingOptions.PriceHighToLow,
            );

            expect(result).toBe('price: desc');
        });
    });

    describe('trackSortHotelList', () => {
        it('should call fireHotelListImpressionEvent with search update params', () => {
            hotelChangeTrackStore.fireHotelListImpressionEvent = jest.fn();

            hotelChangeTrackStore.trackSortHotelList([mockAmendHotelOffer]);

            expect(hotelChangeTrackStore.fireHotelListImpressionEvent).toHaveBeenCalledWith(
                [mockAmendHotelOffer],
                EventTypes.SearchSortUpdate,
            );
        });
    });

    describe('trackHotelListImpressionEvent', () => {
        it('should call fireHotelListImpressionEvent with search hotel params', () => {
            jest.spyOn(global, 'setTimeout');
            hotelChangeTrackStore.fireHotelListImpressionEvent = jest.fn();

            hotelChangeTrackStore.trackHotelListImpressionEvent([mockAmendHotelOffer]);

            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function));

            jest.runOnlyPendingTimers();

            expect(hotelChangeTrackStore.fireHotelListImpressionEvent).toHaveBeenCalledWith(
                [mockAmendHotelOffer],
                EventTypes.SearchChangeHotel,
                RecommendedOrderBy.Bd4,
            );
        });
    });

    describe('fireHotelListImpressionEvent', () => {
        const mockedListOffer = {
            ...mockOfferWithoutAltBoardsFromAmendHotelOffer,
            price: mockAmendHotelOffer.amendmentChargesInfo.fullAmendmentCharges,
            pricePP: mockAmendHotelOffer.amendmentChargesInfo.fullAmendmentCharges,
            totalPrice: mockAmendHotelOffer.amendmentChargesInfo.fullAmendmentCharges,
            priceExcludingTouristTax: mockAmendHotelOffer.amendmentChargesInfo.fullAmendmentCharges,
            pricePPExcludingTouristTax: mockAmendHotelOffer.amendmentChargesInfo.fullAmendmentCharges,
        };

        beforeEach(() => {
            mockedGetSearchDetailObject.mockImplementation(() => ({ detailedObject: 'detailedObject' }));
            mockedGetSearchDetailsForBooking.mockImplementation(() => ({ bookingDetails: 'bookingDetails' }));
        });

        it('should call addToDataLayer with hotel change tracking sort type', () => {
            hotelChangeTrackStore.getAmendHotelSortDimension = jest.fn(() => 'sort_dimension');
            hotelChangeTrackStore.rootStore.amendHotelStore.selectedSortingOption =
                AlternativeHotelsSortingOptions.PriceHighToLow;

            hotelChangeTrackStore.fireHotelListImpressionEvent([mockAmendHotelOffer], EventTypes.GenericEvent);

            expect(hotelChangeTrackStore.getAmendHotelSortDimension).toHaveBeenCalledWith('PriceDesc');
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    ecommerce: expect.objectContaining({
                        detail: {
                            products: [
                                {
                                    detailedObject: 'detailedObject',
                                    dimension75: 'sort_dimension',
                                    dimension18: 'London Gatwick',
                                },
                            ],
                        },
                    }),
                }),
            );
        });

        it('should call addToDataLayer with all params', () => {
            hotelChangeTrackStore.getAmendHotelSortDimension = jest.fn(() => 'sort dimension');
            hotelChangeTrackStore.rootStore.amendHotelStore.pageNumber = 3;
            jest.mocked(hotelChangeTrackStore.rootStore.trackingStore.getPrices).mockReturnValue({
                metric6: 0,
                productPrice: 15,
                fees: undefined,
                revenue: 15,
                amendmentCharges: 15,
            });

            hotelChangeTrackStore.fireHotelListImpressionEvent(
                [mockAmendHotelOffer],
                EventTypes.GenericEvent,
                RecommendedOrderBy.Bd4,
            );

            expect(getRouteByDirection).toHaveBeenCalledWith(mockBooking.package.transport.routes);
            expect(hotelChangeTrackStore.getAmendHotelSortDimension).not.toHaveBeenCalled();
            expect(mockedGetSearchDetailsForBooking).toHaveBeenCalledWith(
                mockBooking.package.transport.routes,
                mockBooking.guests,
                mockBooking.package.accom.rooms[0],
                3,
                undefined,
            );
            expect(hotelChangeTrackStore.rootStore.trackingStore.buildBaseHolidayProduct).toHaveBeenCalledWith(
                mockedListOffer,
                EventTypes.GenericEvent,
                0,
            );
            expect(hotelChangeTrackStore.rootStore.trackingStore.buildUrgencyMessagingDimensions).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                mockedListOffer.accom.unit,
            );
            expect(mockedGetSearchDetailObject).toHaveBeenCalledWith([mockedListOffer], EventTypes.GenericEvent, {
                bookingDetails: 'bookingDetails',
            });
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.GenericEvent,
                dimension136: 'Post Booking: pageName',
                onsite_search_origin: 'Post Booking: pageName',
                ecommerce: {
                    detail: {
                        products: [
                            {
                                detailedObject: 'detailedObject',
                                dimension75: RecommendedOrderBy.Bd4,
                                dimension18: 'London Gatwick',
                            },
                        ],
                    },
                    impressions: [
                        {
                            baseHolidayProduct: true,
                            list: 'Post Booking: pageName',
                            quantity: 1,
                            price: 15,
                            metric6: 0,
                            dimension75: RecommendedOrderBy.Bd4,
                        },
                    ],
                },
            });
        });

        it('should do early return if no booking', () => {
            hotelChangeTrackStore.rootStore.viewBookingStore.booking = null;

            hotelChangeTrackStore.fireHotelListImpressionEvent(
                [mockAmendHotelOffer],
                EventTypes.GenericEvent,
                RecommendedOrderBy.Bd4,
            );

            expect(getRouteByDirection).not.toHaveBeenCalled();
            expect(mockedGetSearchDetailsForBooking).not.toHaveBeenCalled();
            expect(mockedGetSearchDetailObject).not.toHaveBeenCalled();
            expect(hotelChangeTrackStore.rootStore.trackingStore.buildBaseHolidayProduct).not.toHaveBeenCalled();
            expect(
                hotelChangeTrackStore.rootStore.trackingStore.buildUrgencyMessagingDimensions,
            ).not.toHaveBeenCalled();
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
        });

        it('should do early return if no altHotelOffers', () => {
            hotelChangeTrackStore.fireHotelListImpressionEvent([], EventTypes.GenericEvent, RecommendedOrderBy.Bd4);

            expect(getRouteByDirection).not.toHaveBeenCalled();
            expect(mockedGetSearchDetailsForBooking).not.toHaveBeenCalled();
            expect(mockedGetSearchDetailObject).not.toHaveBeenCalled();
            expect(hotelChangeTrackStore.rootStore.trackingStore.buildBaseHolidayProduct).not.toHaveBeenCalled();
            expect(
                hotelChangeTrackStore.rootStore.trackingStore.buildUrgencyMessagingDimensions,
            ).not.toHaveBeenCalled();
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
        });
    });

    describe('clickLoadMoreAmendHotelList', () => {
        it('should call addToDataLayer with "Load more" click params', () => {
            hotelChangeTrackStore.clickLoadMoreAmendHotelList();

            expect(hotelChangeTrackStore.rootStore.trackingStore.generateGenericValuesWithGuests).toHaveBeenCalledWith({
                genericValue1: null,
                genericValue2: null,
                genericValue4: 'bookingReference',
                destinationUrl: 'sitePath/booking/change-hotel',
            });
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.GenericEvent,
                coreParams: 'coreParams',
                customParams: 'customParams',
                eventParams: {
                    eventCategory: EventCategories.Holidays,
                    eventAction: EventLabels.ChangeHotel,
                    eventType: EventTypes.Interaction,
                    eventLabel: EventLabels.LoadMore,
                },
            });
        });
    });

    describe('trackLoadMoreAmendHotelList', () => {
        it('should call fireHotelListImpressionEvent with "Load more" hotel list params', () => {
            hotelChangeTrackStore.fireHotelListImpressionEvent = jest.fn();

            hotelChangeTrackStore.trackLoadMoreAmendHotelList([mockAmendHotelOffer]);

            expect(hotelChangeTrackStore.fireHotelListImpressionEvent).toHaveBeenCalledWith(
                [mockAmendHotelOffer],
                EventTypes.ChangeHotelLoadMore,
                RecommendedOrderBy.Bd4,
            );
        });
    });

    describe('clickBookHotel', () => {
        it('should call addToDataLayer with book hotel params', () => {
            hotelChangeTrackStore.clickBookHotel(mockAmendHotelOffer);

            expect(hotelChangeTrackStore.rootStore.trackingStore.generateGenericValuesWithGuests).toHaveBeenCalledWith({
                genericValue1: null,
                genericValue2: 'Hotel Example',
                genericValue4: 'bookingReference',
                destinationUrl: 'sitePath/booking/change-hotel/summary',
            });
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.GenericEvent,
                coreParams: 'coreParams',
                customParams: 'customParams',
                eventParams: {
                    eventCategory: EventCategories.Holidays,
                    eventAction: EventLabels.ChangeHotel,
                    eventType: EventTypes.Interaction,
                    eventLabel: EventLabels.BookHotel,
                },
            });
        });
    });

    describe('clickViewBookingFromAmendHotel', () => {
        it('should call addToDataLayer with appropriate params', () => {
            hotelChangeTrackStore.clickViewBookingFromAmendHotel(mockAmendHotelOffer, '/hotelLink?preview=1');

            expect(hotelChangeTrackStore.rootStore.trackingStore.generateGenericValuesWithGuests).toHaveBeenCalledWith({
                genericValue1: null,
                genericValue2: 'Hotel Example',
                genericValue4: 'bookingReference',
                destinationUrl: 'sitePath/hotelLink',
            });
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.GenericEvent,
                coreParams: 'coreParams',
                customParams: 'customParams',
                eventParams: {
                    eventCategory: EventCategories.Holidays,
                    eventAction: EventLabels.ChangeHotel,
                    eventType: EventTypes.Interaction,
                    eventLabel: EventLabels.ViewHotelDetails,
                },
            });
        });
    });

    describe('firePriceJumpPopupEvent', () => {
        it('should call addToDataLayer with passed params', () => {
            hotelChangeTrackStore.firePriceJumpPopupEvent(13, 'Interaction', EventTypes.NonInteraction);

            expect(hotelChangeTrackStore.rootStore.trackingStore.buildCoreParamsObject).toHaveBeenCalled();
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                coreParams: 'coreParams',
                customParams: 'customParams',
                event: 'generic_event',
                eventParams: {
                    eventAction: EventLabels.ChangeHotel,
                    eventCategory: EventCategories.Holidays,
                    eventLabel: EventLabels.PriceChange,
                    eventType: EventTypes.NonInteraction,
                },
            });
            expect(hotelChangeTrackStore.rootStore.trackingStore.generateGenericValuesWithGuests).toHaveBeenCalledWith({
                destinationUrl: '',
                genericValue1: 13,
                genericValue2: 'Interaction',
                genericValue4: 'bookingReference',
            });
        });

        it('should do early return when no booking', () => {
            hotelChangeTrackStore.rootStore.viewBookingStore.booking = null;

            hotelChangeTrackStore.firePriceJumpPopupEvent(13, 'Interaction', EventTypes.NonInteraction);

            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
            expect(
                hotelChangeTrackStore.rootStore.trackingStore.generateGenericValuesWithGuests,
            ).not.toHaveBeenCalled();
        });
    });

    describe('clickOnRoomAndBoardConfirm', () => {
        const prevSelectedHotelOffer = {
            ...mockAmendHotelOffer,
            amendmentPaymentInfo: {
                ...mockAmendHotelOffer.amendmentPaymentInfo,
                amendmentCharges: 70,
            },
            hotel: {
                ...mockAmendHotelOffer.hotel,
                name: 'Test_name',
            },
        };

        beforeEach(() => {
            hotelChangeTrackStore.updateRoomAndBoardSecondaryProduct = jest.fn();
        });

        it('should reset secondary transfer product if new hotel offer transfer has not the same type', () => {
            hotelChangeTrackStore.trackingSecondaryProducts.transfer = mockSecondaryTrackingProduct;
            hotelChangeTrackStore.clickOnRoomAndBoardConfirm(
                {
                    ...prevSelectedHotelOffer,
                    transfers: [
                        {
                            ...prevSelectedHotelOffer.transfers[0],
                            type: TransferType.Shared,
                        },
                    ],
                },
                mockAmendHotelOffer,
            );

            expect(hotelChangeTrackStore.trackingSecondaryProducts.transfer).toBe(null);
        });

        it('should do the early return if buildAmendRoomAndBoardProduct return null', () => {
            hotelChangeTrackStore.rootStore.trackingStore.roomAndBoard.buildAmendRoomAndBoardProduct = jest.fn(
                () => null,
            );

            hotelChangeTrackStore.clickOnRoomAndBoardConfirm(prevSelectedHotelOffer, mockAmendHotelOffer);

            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
            expect(hotelChangeTrackStore.updateRoomAndBoardSecondaryProduct).not.toHaveBeenCalled();
        });

        it('should do the early return if no booking', () => {
            hotelChangeTrackStore.rootStore.viewBookingStore.booking = null;

            hotelChangeTrackStore.clickOnRoomAndBoardConfirm(prevSelectedHotelOffer, mockAmendHotelOffer);

            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
            expect(hotelChangeTrackStore.updateRoomAndBoardSecondaryProduct).not.toHaveBeenCalled();
        });

        it('should call addToDataLayer with room and board product', () => {
            hotelChangeTrackStore.clickOnRoomAndBoardConfirm(prevSelectedHotelOffer, mockAmendHotelOffer);

            expect(
                hotelChangeTrackStore.rootStore.trackingStore.roomAndBoard.buildAmendRoomAndBoardProduct,
            ).toHaveBeenCalledWith(
                EventTypes.PostBookingChangeBoardUpdate,
                expect.any(Object),
                expect.any(Object),
                expect.objectContaining({
                    amendmentCharges: 30,
                    amendmentPaymentInfo: expect.objectContaining({
                        amendmentCharges: 30,
                    }),
                }),
            );
            expect(hotelChangeTrackStore.updateRoomAndBoardSecondaryProduct).toHaveBeenCalledWith(
                mockAmendHotelOffer,
                mockBaseTrackingProduct,
            );
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.PostBookingChangeBoardUpdate,
                dimension136: 'Post Booking: pageName',
                dimension173: 'bookingReference',
                metric6: 0,
                ecommerce: {
                    currencyCode: 'GBP',
                    detail: {
                        products: [mockBaseTrackingProduct],
                        actionField: {
                            list: 'Post Booking: pageName',
                        },
                    },
                },
            });
        });
    });

    describe('trackHotelConfirm', () => {
        it('should call addToDataLayer with ecommerce event', () => {
            hotelChangeTrackStore.initialOfferData = mockInitialData;
            hotelChangeTrackStore.getHotelChangeProducts = jest.fn(() => [mockSecondaryTrackingProduct]);

            hotelChangeTrackStore.trackHotelConfirm();

            expect(hotelChangeTrackStore.getHotelChangeProducts).toHaveBeenCalledWith(
                hotelChangeTrackStore.rootStore.amendHotelStore.newlySelectedHotelOffer,
            );

            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: 'post_booking_change_hotel_update',
                dimension136: 'Post Booking: pageName',
                dimension173: 'bookingReference',
                metric6: 0,
                ecommerce: {
                    currencyCode: 'GBP',
                    detail: {
                        actionField: {
                            list: 'Post Booking: pageName',
                        },
                        products: [mockSecondaryTrackingProduct],
                    },
                },
            });
        });

        it('should do the early return if no newlySelectedHotelOffer', () => {
            hotelChangeTrackStore.rootStore.amendHotelStore.newlySelectedHotelOffer = null;

            hotelChangeTrackStore.trackHotelConfirm();

            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
        });
    });

    describe('trackSuccessFullAmendment', () => {
        jest.useFakeTimers({
            now: new Date('2020-10-12'),
        });

        it('Do early return if no amendHotelOffer in amendPaymentPayload', () => {
            hotelChangeTrackStore.rootStore.viewBookingStore.viewBookingPayload!.amendPaymentPayload!.amendHotelOffer =
                undefined;

            hotelChangeTrackStore.trackSuccessFullAmendment();

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
        });

        it('Do early return if no booking', () => {
            hotelChangeTrackStore.rootStore.viewBookingStore.booking = null;
            hotelChangeTrackStore.trackSuccessFullAmendment();

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
        });

        it('Call addToDataLayer with need products', () => {
            hotelChangeTrackStore.getHotelChangeProducts = jest.fn(() => [mockSecondaryTrackingProduct]);

            hotelChangeTrackStore.trackSuccessFullAmendment();

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual({
                transfer: mockAmendPaymentPayload.trackingData!.secondaryProducts!.transfer,
                roomAndBoard: mockAmendPaymentPayload.trackingData!.secondaryProducts!.roomAndBoard,
            });
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.PostBookingConfirmationBasket,
                dimension136: 'Page Name',
                dimension173: 'bookingReference',
                metric6: 0,
                ecommerce: {
                    purchase: {
                        actionField: {
                            action: 'purchase',
                            coupon: 'promoCode',
                            event: 'post_booking_confirmation_basket',
                            id: 'bookingReference_1602460800000_PB_HC',
                            metric3: 0,
                            revenue: 15,
                            timestamp: '2020-10-12_00:00:00',
                        },
                        products: [mockSecondaryTrackingProduct],
                    },
                },
                dimension66: 'Other',
                paymentMethod: 'Visa',
            });
        });
    });

    describe('clearStore', () => {
        it('Clear store props', () => {
            hotelChangeTrackStore.initialOfferData = mockInitialData;
            hotelChangeTrackStore.trackingSecondaryProducts = {
                transfer: mockSecondaryTrackingProduct,
                roomAndBoard: mockSecondaryTrackingProduct,
            };

            hotelChangeTrackStore.clearStore();

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);
            expect(hotelChangeTrackStore.initialOfferData).toBe(null);
        });
    });

    describe('clickOnTransferConfirm', () => {
        it('should do early return if no booking', () => {
            hotelChangeTrackStore.rootStore.viewBookingStore.booking = null;
            hotelChangeTrackStore.updateTransferSecondaryProduct = jest.fn();

            hotelChangeTrackStore.clickOnTransferConfirm(mockTransferWithAmendmentCharges);

            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
            expect(hotelChangeTrackStore.rootStore.trackingStore.buildAmendTransferProduct).not.toHaveBeenCalled();
            expect(hotelChangeTrackStore.updateTransferSecondaryProduct).not.toHaveBeenCalled();
        });

        it('should call addToDataLayer with appropriate data', () => {
            hotelChangeTrackStore.updateTransferSecondaryProduct = jest.fn();
            hotelChangeTrackStore.rootStore.amendHotelStore.newlySelectedHotelOffer = mockAmendHotelOffer;

            hotelChangeTrackStore.clickOnTransferConfirm(mockTransferWithAmendmentCharges);

            expect(hotelChangeTrackStore.rootStore.trackingStore.buildAmendTransferProduct).toHaveBeenCalledWith(
                expect.objectContaining(mockOfferWithoutAltBoardsFromAmendHotelOffer),
                EventTypes.AmendTransferSelect,
                {
                    ...mockTransferWithAmendmentCharges,
                    amendmentCharges: mockAmendHotelOffer.amendmentChargesInfo.amendmentCharges,
                },
            );
            expect(hotelChangeTrackStore.updateTransferSecondaryProduct).toHaveBeenCalledWith(
                mockTransferWithAmendmentCharges,
                mockAmendTransferTrackingProduct,
            );
            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: 'post_booking_change_transfer_update',
                dimension136: 'Post Booking: pageName',
                dimension173: 'bookingReference',
                metric6: 0,
                ecommerce: {
                    currencyCode: 'GBP',
                    detail: {
                        actionField: {
                            list: 'Post Booking: pageName',
                        },
                        products: [mockAmendTransferTrackingProduct],
                    },
                },
            });
        });
    });

    describe('clickOnRoomAndBoardChange', () => {
        it('Call addToDataLayer with appropriate params', () => {
            hotelChangeTrackStore.clickOnRoomAndBoardChange();

            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: 'generic_event',
                coreParams: 'coreParams',
                customParams: 'customParams',
                eventParams: {
                    eventCategory: 'Holidays',
                    eventAction: 'Change Hotel',
                    eventType: 'interaction',
                    eventLabel: 'Edit Your Room & Board',
                },
            });
        });

        it('Do NOT call addToDataLayer if no booking', () => {
            hotelChangeTrackStore.rootStore.viewBookingStore.booking = null;

            hotelChangeTrackStore.clickOnRoomAndBoardChange();

            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
        });
    });

    describe('clickOnTransferChange', () => {
        it('Call addToDataLayer with appropriate params', () => {
            hotelChangeTrackStore.clickOnTransferChange();

            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: 'generic_event',
                coreParams: 'coreParams',
                customParams: 'customParams',
                eventParams: {
                    eventCategory: 'Holidays',
                    eventAction: 'Change Hotel',
                    eventType: 'interaction',
                    eventLabel: 'Edit Your Transfer',
                },
            });
        });

        it('DO NOT call addToDataLayer if no booking', () => {
            hotelChangeTrackStore.rootStore.viewBookingStore.booking = null;

            hotelChangeTrackStore.clickOnTransferChange();

            expect(hotelChangeTrackStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
        });
    });

    describe('validationErrorHotelTracking', () => {
        it('Call rootStore.trackingStore.trackCustomError with hotel label', () => {
            hotelChangeTrackStore.validationErrorHotelTracking();

            expect(hotelChangeTrackStore.rootStore.trackingStore.trackCustomError).toHaveBeenCalledWith(
                EventLabels.ChangeHotel,
                'No Longer available',
            );
        });
    });

    describe('getChangeHotelCategory', () => {
        it('Return hotel label', () => {
            const result = hotelChangeTrackStore.getChangeHotelCategory(13);

            expect(result).toBe('Change Hotel: upgrade_PB');
        });
    });

    describe('getHotelChangeProducts', () => {
        beforeEach(() => {
            hotelChangeTrackStore.initialOfferData = mockInitialData;
        });

        it('Return products with all secondary products ', () => {
            hotelChangeTrackStore.getAmendHotelProduct = jest.fn().mockReturnValue(mockBaseTrackingProduct);

            hotelChangeTrackStore.trackingSecondaryProducts = {
                roomAndBoard: mockSecondaryTrackingProduct,
                transfer: mockSecondaryTrackingProduct,
            };

            const result = hotelChangeTrackStore.getHotelChangeProducts(mockAmendHotelOffer);
            expect(result).toStrictEqual([
                {
                    ...mockBaseTrackingProduct,
                    dimension15: mockAmendHotelOffer.amendmentPaymentInfo.amendmentCharges,
                },
                mockSecondaryTrackingProduct,
                mockSecondaryTrackingProduct,
            ]);
        });

        it('Return main and room and board product, when no transfer secondary product', () => {
            hotelChangeTrackStore.getAmendHotelProduct = jest.fn().mockReturnValue(mockBaseTrackingProduct);
            hotelChangeTrackStore.trackingSecondaryProducts = {
                roomAndBoard: mockSecondaryTrackingProduct,
                transfer: null,
            };

            const result = hotelChangeTrackStore.getHotelChangeProducts(mockAmendHotelOffer);
            expect(result).toStrictEqual([
                {
                    ...mockBaseTrackingProduct,
                    dimension15: mockAmendHotelOffer.amendmentPaymentInfo.amendmentCharges,
                },
                mockSecondaryTrackingProduct,
            ]);
        });

        it('Return main product, when no transfer and room and board secondary products', () => {
            hotelChangeTrackStore.getAmendHotelProduct = jest.fn().mockReturnValue(mockBaseTrackingProduct);
            hotelChangeTrackStore.trackingSecondaryProducts = {
                roomAndBoard: null,
                transfer: null,
            };

            const result = hotelChangeTrackStore.getHotelChangeProducts(mockAmendHotelOffer);
            expect(result).toStrictEqual([
                {
                    ...mockBaseTrackingProduct,
                    dimension15: mockAmendHotelOffer.amendmentPaymentInfo.amendmentCharges,
                },
            ]);
        });

        it('Should include fees object if there is a change fee', () => {
            hotelChangeTrackStore.getAmendHotelProduct = jest.fn().mockReturnValue(mockBaseTrackingProduct);

            hotelChangeTrackStore.trackingSecondaryProducts = {
                roomAndBoard: null,
                transfer: null,
            };
            hotelChangeTrackStore.rootStore.trackingStore.getPrices = jest
                .fn()
                .mockImplementation(() => ({ fees: { feesCount: 50, feesPerPersonAmount: 2 } }));

            const result = hotelChangeTrackStore.getHotelChangeProducts({
                ...mockAmendHotelOffer,
                amendmentPaymentInfo: {
                    ...mockAmendHotelOffer.amendmentPaymentInfo,
                    feesPerPersons: [
                        {
                            feesCount: 2,
                            feesPerPersonAmount: 25,
                        },
                    ],
                },
            });

            expect(result).toStrictEqual([
                {
                    ...mockBaseTrackingProduct,
                    dimension15: 100,
                },
                {
                    dimension108: EventTypes.Purchase,
                    name: 'Change Fee',
                    id: 'Fees',
                    category: 'Fees',
                    price: 25,
                    quantity: 2,
                },
            ]);
        });

        it('Should NOT include fees object if there is no change fee', () => {
            hotelChangeTrackStore.getAmendHotelProduct = jest.fn().mockReturnValue(mockBaseTrackingProduct);
            hotelChangeTrackStore.trackingSecondaryProducts = {
                roomAndBoard: null,
                transfer: null,
            };
            hotelChangeTrackStore.rootStore.trackingStore.getPrices = jest
                .fn()
                .mockImplementation(() => ({ fees: null }));
            const result = hotelChangeTrackStore.getHotelChangeProducts(mockAmendHotelOffer);

            expect(result).toStrictEqual([
                {
                    ...mockBaseTrackingProduct,
                    dimension15: mockAmendHotelOffer.amendmentPaymentInfo.amendmentCharges,
                },
            ]);
        });
    });

    describe('pageNameLabel', () => {
        it('should return label with page', () => {
            hotelChangeTrackStore.rootStore.trackingStore.pageName = 'pageName';

            expect(hotelChangeTrackStore.pageNameLabel).toBe('Post Booking: pageName');
        });
    });

    describe('getSecondaryProductPriceMeta', () => {
        const mockedDefaultObject = {
            price: 0,
            category: '',
        };

        beforeEach(() => {
            hotelChangeTrackStore.initialOfferData = deepClone({
                ...mockInitialData,
                amendmentPaymentInfo: {
                    ...mockInitialData.amendmentPaymentInfo,
                    amendmentCharges: 21,
                },
            });
            hotelChangeTrackStore.trackingSecondaryProducts.transfer = { ...mockSecondaryTrackingProduct, price: 33 };
        });

        it('should return default object if no newlySelectedHotelOffer', () => {
            hotelChangeTrackStore.rootStore.amendHotelStore.newlySelectedHotelOffer = null;

            const result = hotelChangeTrackStore.getSecondaryProductPriceMeta('transfer');

            expect(result).toStrictEqual(mockedDefaultObject);
        });

        it('should return default object if no initialOfferData', () => {
            hotelChangeTrackStore.initialOfferData = null;

            const result = hotelChangeTrackStore.getSecondaryProductPriceMeta('transfer');

            expect(result).toStrictEqual(mockedDefaultObject);
        });

        it('should return the price object for transfer', () => {
            const result = hotelChangeTrackStore.getSecondaryProductPriceMeta('transfer');

            expect(result).toStrictEqual({ price: 79, category: 'Transfers: upgrade_PB' });
        });

        it('should return the price object for rbc', () => {
            const result = hotelChangeTrackStore.getSecondaryProductPriceMeta('roomAndBoard');

            expect(result).toStrictEqual({ category: 'Room & Board: upgrade_PB', price: 46 });
        });
    });

    describe('updateTransferSecondaryProduct', () => {
        beforeEach(() => {
            hotelChangeTrackStore.initialOfferData = deepClone(mockInitialData);
        });

        it('should do early return if no newlySelectedHotelOffer', () => {
            hotelChangeTrackStore.rootStore.amendHotelStore.newlySelectedHotelOffer = null;

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);

            hotelChangeTrackStore.updateTransferSecondaryProduct(mockTransferWithAmendmentCharges, null);

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);
        });

        it('should do early return if no transferProduct', () => {
            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);

            hotelChangeTrackStore.updateTransferSecondaryProduct(mockTransferWithAmendmentCharges, null);

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);
        });

        it('Change nothing when no initialAmendHotelOffer', () => {
            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);

            hotelChangeTrackStore.trackingSecondaryProducts.transfer = mockSecondaryTrackingProduct;

            hotelChangeTrackStore.updateTransferSecondaryProduct(
                mockTransferWithAmendmentCharges,
                mockAmendTransferTrackingProduct,
            );

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);
        });

        it('Update transfer secondary product', () => {
            hotelChangeTrackStore.initialOfferData!.transfers[0].type = TransferType.NoTransfer;
            hotelChangeTrackStore.rootStore.trackingStore.getPrices = jest
                .fn()
                .mockImplementation(() => ({ productPrice: 15, metric6: 0 }));

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);

            hotelChangeTrackStore.updateTransferSecondaryProduct(
                mockTransferWithAmendmentCharges,
                mockAmendTransferTrackingProduct,
            );

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual({
                transfer: {
                    category: 'Transfers: change_PB',
                    name: mockAmendTransferTrackingProduct.name,
                    id: mockAmendTransferTrackingProduct.id,
                    quantity: 1,
                    price: 15,
                    metric6: 0,
                    currencyCode: mockAmendTransferTrackingProduct.currencyCode,
                },
                roomAndBoard: null,
            });
        });

        it('Update transfer secondary product as null, when types are equals', () => {
            hotelChangeTrackStore.initialOfferData!.transfers[0].type = mockTransferWithAmendmentCharges.transfer.type;

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);

            hotelChangeTrackStore.trackingSecondaryProducts.transfer = mockSecondaryTrackingProduct;

            hotelChangeTrackStore.updateTransferSecondaryProduct(
                mockTransferWithAmendmentCharges,
                mockAmendTransferTrackingProduct,
            );

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);
        });
    });

    describe('updateRoomAndBoardSecondaryProduct', () => {
        it('should do nothing if hotelChangeTrackStore.initialAmendHotelOffer not exists', () => {
            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);

            hotelChangeTrackStore.updateRoomAndBoardSecondaryProduct(mockAmendHotelOffer, mockBaseTrackingProduct);

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual({
                roomAndBoard: null,
                transfer: null,
            });
        });

        it('should update as null room and board secondary product, if type are equals', () => {
            hotelChangeTrackStore.initialOfferData = mockInitialData;

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);

            hotelChangeTrackStore.trackingSecondaryProducts.roomAndBoard = mockSecondaryTrackingProduct;

            hotelChangeTrackStore.updateRoomAndBoardSecondaryProduct(mockAmendHotelOffer, mockBaseTrackingProduct);

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);
        });

        it('should update room and board secondary product', () => {
            hotelChangeTrackStore.initialOfferData = mockInitialData;
            hotelChangeTrackStore.rootStore.trackingStore.getPrices = jest
                .fn()
                .mockImplementation(() => ({ amendmentCharges: 15, productPrice: 18, metric6: 0 }));

            jest.mocked(
                hotelChangeTrackStore.rootStore.trackingStore.roomAndBoard!.getRoomAndBoardType,
            ).mockReturnValueOnce('rbc_type_2');

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual(mockNullableObject);

            hotelChangeTrackStore.updateRoomAndBoardSecondaryProduct(mockAmendHotelOffer, mockBaseTrackingProduct);

            expect(hotelChangeTrackStore.rootStore.trackingStore.roomAndBoard.getRoomAndBoardType).toHaveBeenCalledWith(
                hotelChangeTrackStore.initialOfferData!.unit,
            );
            expect(hotelChangeTrackStore.rootStore.trackingStore.roomAndBoard.getRoomAndBoardType).toHaveBeenCalledWith(
                mockAmendHotelOffer.accom.unit,
            );
            expect(
                hotelChangeTrackStore.rootStore.trackingStore.roomAndBoard.getRoomAndBoardsSuffixAndName,
            ).toHaveBeenCalledWith(hotelChangeTrackStore.initialOfferData!.unit, mockAmendHotelOffer.accom.unit);

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual({
                roomAndBoard: {
                    category: 'Room & Board: change_PB',
                    name: 'suffix_name',
                    id: 'id',
                    quantity: 1,
                    metric6: 0,
                    price: 18,
                    currencyCode: mockBaseTrackingProduct.currencyCode,
                },
                transfer: null,
            });
        });
    });

    it('should apply appropriate values to store on create', () => {
        expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual({
            roomAndBoard: null,
            transfer: null,
        });
        expect(hotelChangeTrackStore.initialOfferData).toBe(null);
    });

    describe('initializeFromPaymentPayload', () => {
        it('should update store state after the call from payload', () => {
            hotelChangeTrackStore.initializeFromPaymentPayload(mockAmendTrackingPayload);

            expect(hotelChangeTrackStore.trackingSecondaryProducts).toStrictEqual({
                roomAndBoard: mockAmendTrackingPayload.secondaryProducts!.roomAndBoard,
                transfer: mockAmendTrackingPayload.secondaryProducts!.transfer,
            });
            expect(hotelChangeTrackStore.initialOfferData).toBe(mockAmendTrackingPayload.initialData);
        });
    });

    describe('getAmendHotelProduct', () => {
        it('should return null when no booking', () => {
            hotelChangeTrackStore.rootStore.viewBookingStore.booking = null;
            const result = hotelChangeTrackStore.getAmendHotelProduct(mockAmendHotelOffer);

            expect(result).toBe(null);
        });

        it('Return amend hotel tracking product', () => {
            hotelChangeTrackStore.getChangeHotelCategory = jest.fn(() => 'category');
            hotelChangeTrackStore.rootStore.trackingStore.getPrices = jest
                .fn()
                .mockImplementation(() => ({ amendmentCharges: 15, productPrice: 18 }));

            const result = hotelChangeTrackStore.getAmendHotelProduct(mockAmendHotelOffer);

            expect(result).toStrictEqual({ baseHolidayProduct: true });
            expect(hotelChangeTrackStore.rootStore.trackingStore.getPrices).toHaveBeenCalledWith(
                mockAmendHotelOffer.amendmentPaymentInfo,
            );
            expect(hotelChangeTrackStore.getChangeHotelCategory).toHaveBeenCalledWith(15);
            expect(hotelChangeTrackStore.rootStore.trackingStore.buildBaseHolidayProduct).toHaveBeenCalledWith(
                expect.objectContaining(mockOfferWithoutAltBoardsFromAmendHotelOffer),
                EventTypes.PostBookingChangeHotelUpdate,
                0,
                {
                    category: 'category',
                    price: 18,
                    quantity: 1,
                    dimension15: 15,
                    id: `${mockAmendHotelOffer.accom.code}_PB`,
                    name: `${mockAmendHotelOffer.hotel.name}_PB`,
                },
            );
        });
    });

    describe('noAlternativeHotelsTracking', () => {
        it('should call trackCustomError with appropriate params  when noAlternativeHotelsTracking has been called', () => {
            hotelChangeTrackStore.noAlternativeHotelsTracking();

            expect(trackingStore.trackCustomError).toHaveBeenCalledWith(
                EventLabels.ChangeHotel,
                'No alt hotel for these dates',
            );
        });
    });

    describe('clickOnManageButton', () => {
        it('should call addToDataLayer with appropriate params when clickOnManageButton has been called', () => {
            hotelChangeTrackStore.clickOnManageButton();

            expect(trackingStore.buildCoreParamsObject).toHaveBeenCalled();
            expect(trackingStore.generateGenericValuesWithGuests).toHaveBeenCalledWith({
                genericValue1: null,
                genericValue2: null,
                genericValue4: mockBooking.bookingReference,
                destinationUrl: 'sitePath/booking/change-hotel',
            });
            expect(trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.GenericEvent,
                coreParams: 'coreParams',
                customParams: 'customParams',
                eventParams: {
                    eventCategory: EventCategories.Holidays,
                    eventAction: EventActions.ViewBooking,
                    eventType: EventTypes.Interaction,
                    eventLabel: EventLabels.ManageHoliday,
                },
            });
        });
    });

    describe('clickOnChangeHotelButton', () => {
        it('should call addToDataLayer with appropriate params when clickOnMangeHolidayButton has been called', () => {
            hotelChangeTrackStore.clickOnChangeHotelButton(mockBooking);

            expect(trackingStore.buildCoreParamsObject).toHaveBeenCalled();
            expect(trackingStore.generateGenericValuesWithGuests).toHaveBeenCalledWith({
                genericValue1: GenericValue.PopUp,
                genericValue2: mockBooking.hotel!.name,
                genericValue4: mockBooking.bookingReference,
                destinationUrl: 'sitePath/booking/change-hotel',
            });
            expect(trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.GenericEvent,
                coreParams: 'coreParams',
                customParams: 'customParams',
                eventParams: {
                    eventCategory: EventCategories.Holidays,
                    eventAction: EventActions.ViewBooking,
                    eventType: EventTypes.Interaction,
                    eventLabel: EventLabels.ChangeHotel,
                },
            });
        });

        it('should call generateGenericValuesWithGuests with null for hotel name when hotel is not defined', () => {
            hotelChangeTrackStore.clickOnChangeHotelButton({
                ...mockBooking,
                hotel: undefined,
            });

            expect(trackingStore.generateGenericValuesWithGuests).toHaveBeenCalledWith({
                genericValue1: GenericValue.PopUp,
                genericValue2: null,
                genericValue4: mockBooking.bookingReference,
                destinationUrl: 'sitePath/booking/change-hotel',
            });
        });
    });

    describe('priceJumpPopupAppearEvent', () => {
        beforeEach(() => {
            hotelChangeTrackStore.firePriceJumpPopupEvent = jest.fn();
        });

        it('should call firePriceJumpPopupEvent with popup appear params', () => {
            hotelChangeTrackStore.priceJumpPopupAppearEvent(10);

            expect(hotelChangeTrackStore.firePriceJumpPopupEvent).toHaveBeenCalledWith(
                10,
                'Pop Up Module',
                EventTypes.NonInteraction,
            );
        });
    });

    describe('priceJumpPopupInteractionEvent', () => {
        beforeEach(() => {
            hotelChangeTrackStore.firePriceJumpPopupEvent = jest.fn();
        });

        it('should call firePriceJumpPopupEvent with isAccepted params', () => {
            hotelChangeTrackStore.priceJumpPopupInteractionEvent(10, true);

            expect(hotelChangeTrackStore.firePriceJumpPopupEvent).toHaveBeenCalledWith(
                10,
                'Accept',
                EventTypes.Interaction,
            );
        });

        it('should call firePriceJumpPopupEvent without isAccepted params', () => {
            hotelChangeTrackStore.priceJumpPopupInteractionEvent(10);

            expect(hotelChangeTrackStore.firePriceJumpPopupEvent).toHaveBeenCalledWith(
                10,
                'No Thanks',
                EventTypes.Interaction,
            );
        });
    });
});
