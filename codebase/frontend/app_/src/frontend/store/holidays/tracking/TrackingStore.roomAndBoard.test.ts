import {
    createMockStores,
    mockAmendPaymentPayload,
    mockAmendRoomAndBoardOffer,
    mockBooking,
    mockFeesTrackingProduct,
    mockRoom,
    mockUnitRoom,
} from 'frontend/__mocks__';
import { mockOfferWithoutAltBoards } from 'frontend/__mocks__/altOffer';
import { mockUnitRoomListMock } from 'frontend/__mocks__/room';
import { mockRoomAndBoardRoomVariant } from 'frontend/__mocks__/roomAndBoard';
import { IRoom } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { BrandValues } from 'models/enum/tracking/GenericEventParams';
import { ProductCategories } from 'models/enum/tracking/ProductCategories';

import { TrackingStoreRoomAndBoard } from './TrackingStore.roomAndBoard';

jest.mock('frontend/utils/tracking/boardsAndRooms.utils', () => ({
    __esModule: true,
    getEcommerceProductFromBaseProduct: jest.fn(data => data),
}));

const mockGetRoomsTypesTitles = jest.fn().mockImplementation(() => 'roomType_title');
const mockGetBoardsTypes = jest.fn().mockImplementation(() => 'boardType_title');
const mockGetCategoryLabel = jest.fn().mockImplementation(() => 'category_label');
jest.mock('frontend/utils/tracking/tracking.utils', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/utils/tracking/tracking.utils'),
    getRoomsTypesTitles: (...params) => mockGetRoomsTypesTitles(...params),
    getBoardsTypes: (...params) => mockGetBoardsTypes(...params),
    getCategoryLabel: (...params) => mockGetCategoryLabel(...params),
}));

let rootStore;
let rbcTrackingStore: TrackingStoreRoomAndBoard;

describe('TrackingStore.roomAndBoard', () => {
    jest.useFakeTimers({ now: new Date('2023-12-01') });

    let mockGetTrackingPricesObject;

    beforeEach(() => {
        mockGetTrackingPricesObject = {
            metric6: 0,
            revenue: 20.11,
            productPrice: 20.11,
            fees: undefined,
            amendmentCharges: 20.11,
        };

        rootStore = createMockStores({
            trackingStore: {
                buildBaseHolidayProduct: jest.fn(() => ({ baseHolidayProduct: true })),
                pageLang: 'EN',
                pageMeta: {
                    pageCategory: 'pageCategory',
                    pageLoadLayoutId: 'pageLoadLayoutId',
                    pageName: 'pageName',
                    pageTitle: 'pageTitle',
                },
                buildFeesAnalyticProduct: jest.fn(() => mockFeesTrackingProduct),
                getPrices: jest.fn().mockReturnValue(mockGetTrackingPricesObject),
            },
            amendRoomAndBoardStore: {
                chosenRoomVariant: mockRoomAndBoardRoomVariant,
            },
            viewBookingStore: {
                booking: mockBooking,
                dimension66: 'Other',
                paymentMethod: 'Visa',
            },
        });
        rbcTrackingStore = new TrackingStoreRoomAndBoard(rootStore);
    });

    describe('getRoomAndBoardType', () => {
        it('Should return room and board label types', () => {
            const result = rbcTrackingStore.getRoomAndBoardType([mockUnitRoom]);

            expect(mockGetRoomsTypesTitles).toHaveBeenCalledWith([mockUnitRoom]);
            expect(mockGetBoardsTypes).toHaveBeenCalledWith([mockUnitRoom]);
            expect(result).toBe('roomType_title | boardType_title');
        });
    });

    describe('buildAmendRoomAndBoardProduct', () => {
        it('Should return room and board product according to parameters', () => {
            rbcTrackingStore.getRoomAndBoardsSuffixAndName = jest.fn().mockImplementation(() => ({ name: 'rbc_name' }));
            const rbcProduct = rbcTrackingStore.buildAmendRoomAndBoardProduct(
                EventTypes.Booking,
                mockOfferWithoutAltBoards,
                mockRoomAndBoardRoomVariant,
                mockRoomAndBoardRoomVariant,
            );

            expect(rootStore.trackingStore.getPrices).toHaveBeenCalledWith(
                mockRoomAndBoardRoomVariant.amendmentPaymentInfo,
            );
            expect(rbcTrackingStore.getRoomAndBoardsSuffixAndName).toHaveBeenCalledWith(
                mockRoomAndBoardRoomVariant.units,
                mockRoomAndBoardRoomVariant.units,
            );
            expect(mockGetCategoryLabel).toHaveBeenCalledWith(
                ProductCategories.RoomAndBoard,
                mockRoomAndBoardRoomVariant.amendmentCharges,
            );
            expect(rootStore.trackingStore.buildBaseHolidayProduct).toHaveBeenCalledWith(
                mockOfferWithoutAltBoards,
                EventTypes.Booking,
                0,
                {
                    category: 'category_label',
                    name: 'rbc_name',
                    id: '',
                    quantity: 1,
                    price: mockGetTrackingPricesObject.revenue,
                    dimension108: EventTypes.Booking,
                    dimension15: 50,
                    metric6: 0,
                },
            );
            expect(rbcProduct).toStrictEqual({ baseHolidayProduct: true });
        });
    });

    describe('trackNewRoomOrBoardClick', () => {
        it('Should NOT call addToDataLayer when no booking', () => {
            rbcTrackingStore.rootStore.viewBookingStore.booking = null;

            rbcTrackingStore.trackNewRoomOrBoardClick(EventTypes.PostBookingChangeBoardSelect, 'name', 20);

            expect(rbcTrackingStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
        });

        it('Should call addToDataLayer with appropriate params and rounded prices', () => {
            rbcTrackingStore.trackNewRoomOrBoardClick(EventTypes.PostBookingChangeBoardSelect, 'name', 20);

            expect(rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct).toHaveBeenCalledWith(
                mockBooking,
                EventTypes.PostBookingChangeBoardSelect,
                undefined,
                {
                    category: 'Change Board: upgrade_PB',
                    name: 'name',
                    id: '',
                    price: 20,
                    revenue: 20,
                    quantity: 1,
                    variant: 'name',
                    brand: 'Handpicked',
                    metric6: 0,
                    metric3: 0,
                },
                true,
            );
            expect(rbcTrackingStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.PostBookingChangeBoardSelect,
                dimension173: 'bookingReference',
                dimension136: 'pageCategory: pageName',
                ecommerce: {
                    click: {
                        actionField: {
                            action: 'click',
                            list: 'Post-Booking: Change Board',
                        },
                        products: [
                            { baseHolidayProduct: true, dimension18: 'London Gatwick', dimension20: 'Lanzarote' },
                        ],
                    },
                },
            });
        });

        it('Should call addToDataLayer with room type and refund price', () => {
            rbcTrackingStore.trackNewRoomOrBoardClick(EventTypes.PostBookingChangeRoomSelect, 'name', -20);

            expect(rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct).toHaveBeenCalledWith(
                mockBooking,
                EventTypes.PostBookingChangeRoomSelect,
                undefined,
                {
                    category: 'Change Room: downgrade_PB',
                    name: 'name',
                    id: '',
                    price: 0,
                    revenue: 0,
                    quantity: 1,
                    variant: 'name',
                    brand: 'Handpicked',
                    metric6: 20,
                    metric3: 0,
                },
                true,
            );
            expect(rbcTrackingStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.PostBookingChangeRoomSelect,
                dimension173: 'bookingReference',
                dimension136: 'pageCategory: pageName',
                ecommerce: {
                    click: {
                        actionField: {
                            action: 'click',
                            list: 'Post-Booking: Change Room',
                        },
                        products: [
                            { baseHolidayProduct: true, dimension18: 'London Gatwick', dimension20: 'Lanzarote' },
                        ],
                    },
                },
            });
        });
    });

    describe('getRoomAndBoardsSuffixAndName', () => {
        it('Should return data when room and board have been changed', () => {
            const result = rbcTrackingStore.getRoomAndBoardsSuffixAndName([mockRoom], [mockUnitRoom]);

            expect(result).toStrictEqual({ idSuffix: 'CRB', name: 'roomType_title | boardType_title' });
        });

        it('Should return data when only room has been changed', () => {
            const result = rbcTrackingStore.getRoomAndBoardsSuffixAndName(
                [mockRoom],
                [{ ...mockRoom, code: 'test' } as IUnit],
            );

            expect(result).toStrictEqual({ idSuffix: 'CR', name: 'roomType_title' });
        });

        it('Should return data when only board has been changed', () => {
            const result = rbcTrackingStore.getRoomAndBoardsSuffixAndName(
                [mockUnitRoom as IRoom],
                [{ ...mockUnitRoom, board: 'test' }],
            );

            expect(result).toStrictEqual({ idSuffix: 'CB', name: 'boardType_title' });
        });
    });

    describe('trackRoomAndBoardConfirmClick', () => {
        it('Should NOT call addToDataLayer when no booking', () => {
            rbcTrackingStore.rootStore.viewBookingStore.booking = null;

            rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingChangeBoardUpdate);

            expect(rbcTrackingStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
        });

        it('Should NOT call addToDataLayer when no chosen variant', () => {
            rbcTrackingStore.rootStore.amendRoomAndBoardStore.chosenRoomVariant = null;

            rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingChangeBoardUpdate);

            expect(rbcTrackingStore.rootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled();
        });

        it('Should call addToDataLayer with appropriate params for board update event', () => {
            rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingChangeBoardUpdate);

            expect(rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct).toHaveBeenCalledWith(
                mockBooking,
                EventTypes.PostBookingChangeBoardUpdate,
                undefined,
                {
                    category: 'Room & Board: upgrade_PB',
                    name: 'roomType_title | boardType_title',
                    id: '',
                    price: 20.11,
                    quantity: 1,
                    variant: 'name',
                    revenue: 20.11,
                    brand: 'Handpicked',
                    metric6: 0,
                    metric3: 0,
                },
                true,
            );
            expect(rbcTrackingStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.PostBookingChangeBoardUpdate,
                dimension173: 'bookingReference',
                dimension136: 'pageCategory: pageName',
                ecommerce: {
                    currencyCode: 'GBP',
                    detail: {
                        actionField: { list: 'Post-Booking: Change Board' },
                        products: [
                            {
                                baseHolidayProduct: true,
                                dimension18: 'London Gatwick',
                                dimension20: 'Lanzarote',
                                item_generic_1: 'SingleRoom',
                                item_generic_2: '1/1',
                            },
                        ],
                    },
                },
                dimension66: 'Other',
                paymentMethod: 'Visa',
            });
        });

        it('Should include fees product when fees exist and event type is confirmation', () => {
            mockGetTrackingPricesObject.fees = {
                feesCount: 2,
                feesPerPersonAmount: 25,
            };
            rbcTrackingStore.rootStore.viewBookingStore.viewBookingPayload = {
                ...mockAmendPaymentPayload,
                amendPaymentPayload: {
                    ...mockAmendPaymentPayload,
                    amendRoomAndBoardOffer: mockAmendRoomAndBoardOffer,
                },
            };
            rbcTrackingStore.rootStore.amendRoomAndBoardStore.chosenRoomVariant = null;

            rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

            expect(rbcTrackingStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: 'post_booking_confirmation_basket',
                dimension173: 'bookingReference',
                dimension136: 'pageCategory: Room & Board Confirmation|EN',
                ecommerce: {
                    purchase: {
                        actionField: {
                            action: 'purchase',
                            coupon: 'promoCode',
                            event: 'post_booking_confirmation_basket',
                            id: 'bookingReference_1701388800000_PB_CRB',
                            metric3: 0,
                            revenue: 20.11,
                            timestamp: '2023-12-01_00:00:00',
                        },
                        products: [
                            {
                                baseHolidayProduct: true,
                                dimension18: 'London Gatwick',
                                dimension20: 'Lanzarote',
                                item_generic_1: 'SingleRoom',
                                item_generic_2: '1/1',
                            },
                            mockFeesTrackingProduct,
                        ],
                    },
                },
                dimension66: 'Other',
                paymentMethod: 'Visa',
            });
        });

        it('Should set metric6 and zero revenue when confirmation event is a downgrade', () => {
            mockGetTrackingPricesObject.revenue = 0;
            mockGetTrackingPricesObject.productPrice = 0;
            mockGetTrackingPricesObject.amendmentCharges = -20.11;
            mockGetTrackingPricesObject.metric6 = 20.11;
            rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

            expect(rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct).toHaveBeenCalledWith(
                mockBooking,
                EventTypes.PostBookingConfirmationBasket,
                undefined,
                {
                    category: 'Room & Board: downgrade_PB',
                    name: 'roomType_title | boardType_title',
                    id: '',
                    price: 0,
                    revenue: 0,
                    quantity: 1,
                    variant: 'name',
                    brand: 'Handpicked',
                    metric6: 20.11,
                    metric3: 0,
                },
                true,
            );
            expect(rbcTrackingStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: EventTypes.PostBookingConfirmationBasket,
                dimension173: 'bookingReference',
                dimension136: 'pageCategory: Room & Board Confirmation|EN',
                ecommerce: {
                    purchase: {
                        actionField: {
                            action: 'purchase',
                            coupon: 'promoCode',
                            event: 'post_booking_confirmation_basket',
                            id: 'bookingReference_1701388800000_PB_CRB',
                            metric3: 0,
                            revenue: 0,
                            timestamp: '2023-12-01_00:00:00',
                        },
                        products: [
                            {
                                baseHolidayProduct: true,
                                dimension18: 'London Gatwick',
                                dimension20: 'Lanzarote',
                                item_generic_1: 'SingleRoom',
                                item_generic_2: '1/1',
                            },
                        ],
                    },
                },
                dimension66: 'Other',
                paymentMethod: 'Visa',
            });
        });

        it('Should use empty coupon string when promoCodeBreakDown is undefined', () => {
            rbcTrackingStore.rootStore.amendRoomAndBoardStore.chosenRoomVariant!.promoCodeBreakDown = undefined;
            rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

            expect(rbcTrackingStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    ecommerce: {
                        purchase: expect.objectContaining({
                            actionField: expect.objectContaining({ coupon: '' }),
                        }),
                    },
                }),
            );
        });

        it('Should use SingleRoom status when isMultiroom flag is true but booking only has 1 unit', () => {
            rbcTrackingStore.rootStore.viewBookingStore.viewBookingPayload = {
                ...mockAmendPaymentPayload,
                amendPaymentPayload: {
                    ...mockAmendPaymentPayload,
                    isMultiroom: true,
                    amendRoomAndBoardOffer: mockAmendRoomAndBoardOffer,
                },
            };
            rbcTrackingStore.rootStore.amendRoomAndBoardStore.chosenRoomVariant = {
                ...mockRoomAndBoardRoomVariant,
                units: [mockUnitRoomListMock[0]!],
            };

            rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

            const call = (rbcTrackingStore.rootStore.trackingStore.addToDataLayer as jest.Mock).mock.calls[0][0];
            const product = call.ecommerce.purchase.products[0];

            expect(product.item_generic_1).toBe('SingleRoom');
        });

        describe('multiroom', () => {
            const multiroomPayload = {
                ...mockAmendPaymentPayload,
                amendPaymentPayload: {
                    ...mockAmendPaymentPayload,
                    isMultiroom: true,
                    amendRoomAndBoardOffer: mockAmendRoomAndBoardOffer,
                },
            };

            beforeEach(() => {
                rbcTrackingStore.rootStore.viewBookingStore.viewBookingPayload = multiroomPayload;
                rbcTrackingStore.rootStore.amendRoomAndBoardStore.chosenRoomVariant = null;
            });

            it('Should use "Change Board" category for the board product and "Change Room" for room products', () => {
                rbcTrackingStore.rootStore.viewBookingStore.viewBookingPayload = {
                    ...multiroomPayload,
                    amendPaymentPayload: {
                        ...multiroomPayload.amendPaymentPayload,
                        perRoomRoomCharges: [20, 20],
                        totalAmendmentPrice: 100,
                    },
                };

                rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

                const calls = (rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct as jest.Mock).mock
                    .calls;
                const boardProductParams = calls[0][3];
                const roomProduct1Params = calls[1][3];
                const roomProduct2Params = calls[2][3];

                expect(boardProductParams).toMatchObject({ category: 'Change Board: upgrade_PB' });
                expect(roomProduct1Params).toMatchObject({ category: 'Change Room: upgrade_PB' });
                expect(roomProduct2Params).toMatchObject({ category: 'Change Room: upgrade_PB' });
            });

            it('Should build a board product and per-room products when both room and board changed', () => {
                rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

                expect(rbcTrackingStore.rootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith(
                    expect.objectContaining({
                        ecommerce: {
                            purchase: expect.objectContaining({
                                products: [
                                    {
                                        baseHolidayProduct: true,
                                        dimension18: 'London Gatwick',
                                        dimension20: 'Lanzarote',
                                        item_generic_1: 'MultiRoom',
                                        item_generic_2: '2',
                                    },
                                    {
                                        baseHolidayProduct: true,
                                        dimension18: 'London Gatwick',
                                        dimension20: 'Lanzarote',
                                        item_generic_1: 'MultiRoom',
                                        item_generic_2: '1/2',
                                    },
                                    {
                                        baseHolidayProduct: true,
                                        dimension18: 'London Gatwick',
                                        dimension20: 'Lanzarote',
                                        item_generic_1: 'MultiRoom',
                                        item_generic_2: '2/2',
                                    },
                                ],
                            }),
                        },
                    }),
                );
            });

            it('Should use perRoomRoomCharges from payload for room product prices when available', () => {
                rbcTrackingStore.rootStore.viewBookingStore.viewBookingPayload = {
                    ...multiroomPayload,
                    amendPaymentPayload: {
                        ...multiroomPayload.amendPaymentPayload,
                        perRoomRoomCharges: [100, 150],
                        totalAmendmentPrice: 300,
                    },
                };

                rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

                const buildBaseHolidayProductCalls = (
                    rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct as jest.Mock
                ).mock.calls;

                const roomProduct1Params = buildBaseHolidayProductCalls[1][3];
                const roomProduct2Params = buildBaseHolidayProductCalls[2][3];

                expect(roomProduct1Params).toMatchObject({ price: 100, revenue: 100, metric6: 0 });
                expect(roomProduct2Params).toMatchObject({ price: 150, revenue: 150, metric6: 0 });
            });

            it('Should apply the sign of totalAmendmentPrice to per-room charges when the total is a downgrade', () => {
                rbcTrackingStore.rootStore.viewBookingStore.viewBookingPayload = {
                    ...multiroomPayload,
                    amendPaymentPayload: {
                        ...multiroomPayload.amendPaymentPayload,
                        perRoomRoomCharges: [218.52, 218.52],
                        totalAmendmentPrice: -800,
                    },
                };

                rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

                const buildBaseHolidayProductCalls = (
                    rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct as jest.Mock
                ).mock.calls;

                const roomProduct1Params = buildBaseHolidayProductCalls[1][3];
                const roomProduct2Params = buildBaseHolidayProductCalls[2][3];

                expect(roomProduct1Params).toMatchObject({ price: 0, revenue: 0, metric6: 800 });
                expect(roomProduct2Params).toMatchObject({ price: 0, revenue: 0, metric6: 800 });
            });

            it('Should zero board product price and revenue on downgrade even when boardCost is computed as positive', () => {
                rbcTrackingStore.rootStore.viewBookingStore.viewBookingPayload = {
                    ...multiroomPayload,
                    amendPaymentPayload: {
                        ...multiroomPayload.amendPaymentPayload,
                        perRoomRoomCharges: [500, 500],
                        totalAmendmentPrice: -800,
                    },
                };

                rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

                const boardProductParams = (
                    rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct as jest.Mock
                ).mock.calls[0][3];

                expect(boardProductParams).toMatchObject({ price: 0, revenue: 0, metric6: 800 });
            });

            it('Should only build room products when only the room changed', () => {
                const previousBoard = mockBooking.package.accom.rooms[0].board;
                const roomOnlyUnits = mockUnitRoomListMock.map(unit => ({
                    ...unit,
                    board: previousBoard,
                }));

                rbcTrackingStore.rootStore.viewBookingStore.viewBookingPayload = {
                    ...multiroomPayload,
                    amendPaymentPayload: {
                        ...multiroomPayload.amendPaymentPayload,
                        amendRoomAndBoardOffer: {
                            selectedRoomVariant: {
                                ...mockRoomAndBoardRoomVariant,
                                units: roomOnlyUnits,
                            },
                        },
                    },
                };

                rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

                const call = (rbcTrackingStore.rootStore.trackingStore.addToDataLayer as jest.Mock).mock.calls[0][0];
                const products = call.ecommerce.purchase.products;

                expect(products).toHaveLength(2);
                expect(products[0]).toMatchObject({ item_generic_1: 'MultiRoom', item_generic_2: '1/2' });
                expect(products[1]).toMatchObject({ item_generic_1: 'MultiRoom', item_generic_2: '2/2' });
            });

            it('Should only build a board product when only the board changed', () => {
                const previousCode = mockBooking.package.accom.rooms[0].code;
                const boardOnlyUnits = mockUnitRoomListMock.map(unit => ({
                    ...unit,
                    code: previousCode,
                }));

                rbcTrackingStore.rootStore.viewBookingStore.viewBookingPayload = {
                    ...multiroomPayload,
                    amendPaymentPayload: {
                        ...multiroomPayload.amendPaymentPayload,
                        amendRoomAndBoardOffer: {
                            selectedRoomVariant: {
                                ...mockRoomAndBoardRoomVariant,
                                units: boardOnlyUnits,
                            },
                        },
                    },
                };

                rbcTrackingStore.trackRoomAndBoardConfirmClick(EventTypes.PostBookingConfirmationBasket);

                const call = (rbcTrackingStore.rootStore.trackingStore.addToDataLayer as jest.Mock).mock.calls[0][0];
                const products = call.ecommerce.purchase.products;

                expect(products).toHaveLength(1);
                expect(products[0]).toMatchObject({ item_generic_1: 'MultiRoom', item_generic_2: '2' });
            });
        });
    });

    describe('trackNoAvailabilityError', () => {
        it('Should call trackCustomError with appropriate params', () => {
            rbcTrackingStore.trackNoAvailabilityError();

            expect(rbcTrackingStore.rootStore.trackingStore.trackCustomError).toHaveBeenCalledWith(
                'Room & Board',
                'No Availability',
            );
        });
    });

    describe('buildEcommerceProduct', () => {
        it('Should return an empty object if booking has not been provided', () => {
            rbcTrackingStore.rootStore.viewBookingStore.booking = null;
            const result = rbcTrackingStore.buildEcommerceProduct(EventTypes.PostBookingChangeRoomSelect, {});

            expect(result).toStrictEqual({});
        });

        it('Should return an empty object if buildBaseHolidayProduct will return null', () => {
            rbcTrackingStore.rootStore.viewBookingStore.booking = mockBooking;
            jest.mocked(rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct).mockReturnValueOnce(null);
            const result = rbcTrackingStore.buildEcommerceProduct(EventTypes.PostBookingChangeRoomSelect, {});

            expect(result).toStrictEqual({});
        });

        it('Should call buildBaseHolidayProduct with appropriate parameters and return an ecommerce object', () => {
            const result = rbcTrackingStore.buildEcommerceProduct(EventTypes.PostBookingChangeRoomSelect, {
                test: 'test',
            });

            expect(result).toStrictEqual({
                baseHolidayProduct: true,
                dimension18: 'London Gatwick',
                dimension20: 'Lanzarote',
            });
            expect(rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct).toHaveBeenCalledWith(
                mockBooking,
                EventTypes.PostBookingChangeRoomSelect,
                undefined,
                {
                    variant: 'name',
                    brand: 'Handpicked',
                    id: '',
                    metric3: 0,
                    quantity: 1,
                    test: 'test',
                },
                true,
            );
        });

        it('should call buildBaseHolidayProduct with right brand when it is luxury booking', () => {
            rbcTrackingStore.rootStore.viewBookingStore.booking = {
                ...mockBooking,
                promoCollections: [OfferPromotionCodes.Luxury],
            };
            const result = rbcTrackingStore.buildEcommerceProduct(EventTypes.PostBookingChangeRoomSelect, {
                test: 'test',
            });

            expect(result).toStrictEqual({
                baseHolidayProduct: true,
                dimension18: 'London Gatwick',
                dimension20: 'Lanzarote',
            });
            expect(rbcTrackingStore.rootStore.trackingStore.buildBaseHolidayProduct).toHaveBeenCalledWith(
                rbcTrackingStore.rootStore.viewBookingStore.booking,
                EventTypes.PostBookingChangeRoomSelect,
                undefined,
                {
                    variant: rbcTrackingStore.rootStore.viewBookingStore.booking.package.accom.hotel?.theme?.itemName,
                    brand: BrandValues.LuxuryCollection,
                    id: '',
                    metric3: 0,
                    quantity: 1,
                    test: 'test',
                },
                true,
            );
        });
    });
});
