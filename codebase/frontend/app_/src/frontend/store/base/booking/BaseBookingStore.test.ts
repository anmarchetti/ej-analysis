import { makeObservable } from 'mobx';

import { CurrencyCode } from 'code/currency';
import {
    createMockStores,
    leadPassengerMock,
    mockAltBoard1,
    mockAltBoard2,
    mockAltNoTransfer,
    mockAltPrivateTransfer,
    mockAltSharedTransfer,
    mockBooking,
    mockHotel,
    mockSeats,
    mockTransfer,
    mockUnitRoom,
    paymentInfoMock,
} from 'frontend/__mocks__';
import { bedBreakfastBoard } from 'frontend/__mocks__/boards';
import { bookingExtrasMock, extraLuggageInfoMock, luggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockedBooking } from 'frontend/__mocks__/tracking';
import { mockedTransport } from 'frontend/__mocks__/transport';
import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import offersService from 'frontend/services/offers.service';
import { TRootStore } from 'frontend/store/IStores';
import { containsLuxuryPromoCode, swapOfferAccommodations } from 'frontend/utils/offer.utils';
import * as paymentTransaction from 'frontend/utils/paymentTransaction';
import { getFlightDigitalNumber } from 'frontend/utils/route.utils';
import { getOfferWithPopulatedData } from 'frontend/utils/seatAndBags.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { buildRoomAllocationFromOfferUnitParams } from 'frontend/utils/url.utils';
import { ApiError } from 'models/data/ApiError';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IFlightExtras } from 'models/data/IFlightExtras';
import { IHotel } from 'models/data/IHotel';
import { IAltBoard, IOffer, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { ISpecificOffer, ISpecificOfferWithAltAcc } from 'models/data/ISpecificOffer';
import { ITransfer } from 'models/data/ITransfer';
import { IValidatePackageInfo } from 'models/data/IValidPackageInfo';
import { ApiErrors } from 'models/enum/ApiErrors';
import { GuestType } from 'models/enum/GuestType';
import { HoldLuggageCategory } from 'models/enum/HoldLuggage';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import SitePath from 'models/enum/SitePath';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { TransferType } from 'models/enum/transfer/TransferType';
import { GuestInfo } from 'models/GuestInfo';
import { RoomAllocation } from 'models/RoomAllocation';

import BaseBookingStore, {
    FLIGHT_EXTRA_CATEGORY_CODE_CABIN_BAGS,
    IBaseBookingStoreInitialState,
} from './BaseBookingStore';

class TestBaseBookingStore extends BaseBookingStore {
    constructor(rootStore: TRootStore) {
        super(rootStore);

        makeObservable(this);
    }

    protected override runPromoCodeSuccessPaymentAction = (): void => {
        // no-op for tests
    };

    updateOfferInfo = (): void => {
        // no-op for tests
    };

    validatePackage = async (): Promise<void> => {
        // no-op for tests
    };
}

jest.mock('frontend/services/logging', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
    },
}));
jest.mock('frontend/utils/route.utils', () => ({
    getFlightDigitalNumber: jest.fn(),
}));
jest.mock('frontend/services/booking.service');
jest.mock('frontend/utils/seatAndBags.utils');
jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    getDate: jest.fn(date => date),
}));
jest.mock('frontend/utils/paymentTransaction', () => ({
    setTransactionProcessing: jest.fn(),
    getTransactionId: jest.fn(() => '12345'),
    setTransactionDone: jest.fn(),
    startNewTransaction: jest.fn(),
    getTransaction: jest.fn(() => ({ p: transactionPrice })),
    updateTransaction: jest.fn(),
}));

const mockGetWebStorageItem = jest.fn();
const mockSetWebStorageItem = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    getWebStorageItem: (...args) => mockGetWebStorageItem(...args),
    setWebStorageItem: (...args) => mockSetWebStorageItem(...args),
}));

let mockContainsLuxuryPromoCode = false;
jest.mock('frontend/utils/offer.utils', () => ({
    ...jest.requireActual('frontend/utils/offer.utils'),
    containsLuxuryPromoCode: jest.fn(() => mockContainsLuxuryPromoCode),
    swapOfferAccommodations: jest.fn(offer => offer),
}));

const unit = {
    code: 'SUI.CV-LX!NOR.BAR - RO',
    price: 746.0,
    pricePP: 249.0,
    discount: 0.0,
    discountPP: 0.0,
    avail: 2,
    isFreeForKids: false,
    roomType: {
        code: 'SUI.CV-LX',
        title: mockSitecoreField('SUITE LUXURY CITY VIEW'),
        description: '',
        content: '',
        images: [
            {
                small: 'https://photos.hotelbeds.com/giata/43/431179/431179a_hb_ro_003.jpg',
                medium: 'https://photos.hotelbeds.com/giata/bigger/43/431179/431179a_hb_ro_003.jpg',
                large: 'https://photos.hotelbeds.com/giata/xl/43/431179/431179a_hb_ro_003.jpg',
            },
        ],
        facilities: [
            {
                name: 'Alarm clock',
                code: '273',
                number: '',
                disclaimerMessage: '',
            },
        ],
        stays: [
            {
                stayType: 'BED',
                description: 'Bed room',
                facilities: [
                    {
                        name: 'King-size bed',
                        code: '155',
                        number: '1',
                        disclaimerMessage: '',
                    },
                ],
            },
        ],
        iconUrl: '',
    },
    board: 'RO',
    boardType: {
        code: 'RO',
        title: 'Room only',
        content: '',
        description: '',
        iconUrl: '/-/jssmedia/48AFA2C9659B41358DD864EFDC4E1999.ashx',
    },
    occupation: {
        adults: 2,
        children: 1,
        infants: 0,
        paxIds: [1, 2, 3],
        childAges: [4],
    },
};
const [mockedOutboundRoute, mockedInboundRoute] = mockedTransport.routes;
const offer = {
    date: '2020-09-02T00:00:00',
    stay: 7,
    accom: {
        id: 'X9431179',
        packageId: '1154857380/2/1950/21',
        unit: [unit],
        date: '2020-09-02T00:00:00',
        stay: 2,
        code: 'code',
        prom: 'prom',
        isExt: false,
    },
    transfers: [mockTransfer],
    transport: mockedTransport,
    price: 2000,
    totalPrice: 2000,
    transferPrice: 200,
    hotel: {
        test: 'new hotel',
    } as any,
    id: 'id',
    pricePP: 123,
    altAcc: [],
    ecoFacility: undefined,
    hasDistressedFlights: false,
    extraLuggageInfo: luggageInfoMock,
    touristTax: 0,
    touristTaxPP: 0,
    hasDiscountedBoardUpgrade: true,
    priceExcludingTouristTax: 2000,
    pricePPExcludingTouristTax: 123,
    altBoards: [{}],
} as IOfferWithoutAltBoards;

const transactionPrice = 1250;

const mockLoadResortInfo = jest.spyOn(bookingService, 'loadResortInfo');

const mockLoadHotelHighlightsInfo = jest.spyOn(bookingService, 'loadHotelHighlightsInfo');

const createRootStore = () =>
    createMockStores({
        layoutStore: {
            isHotelDetailsBookPage: false,
            isExtrasPage: false,
            IsMapHiddenOnDesktop: false,
            isExtraLuggageEnabled: true,
            isPromoPage: false,
            isFullMaintenance: false,
            isCommitBookingPage: false,
            pageFields: {
                Code: mockSitecoreField('code from layout fields'),
            },
            getSettingAsNumber: jest.fn(),
            isTouristTaxEnabled: true,
        },
        appStore: {
            setLoading: jest.fn(),
            setNavigationBooking: jest.fn(),
        },
        alternativeFlightsStore: {
            clearStore: jest.fn(),
        },
        guestDetailsStore: {
            leadPassenger: leadPassengerMock,
            guestsDetails: [{ type: GuestType.Adult }],
            createGuestsDetails: jest.fn(),
            clearGuestDetails: jest.fn(),
        },
        hotelsStore: {
            offers: [],
            activeOfferId: null,
            selectSpecificOffer: jest.fn(),
        },
        engageStore: {
            clearContentOrder: jest.fn(),
            sendCustomEvent: jest.fn(),
        },
        searchStore: {
            validateSearchParameters: jest.fn(),
            setSelectedOfferIndex: jest.fn(),
            searchWho: {
                roomsAllocation: [
                    {
                        adults: [{}, {}],
                        children: [{}],
                        infants: [{}],
                        roomCode: 'QWER',
                    },
                ],
                isAutoAllocation: true,
                isGuestsParametersValid: false,
                maxNumberOfGuests: 5,
            },
            searchWhen: { from: new Date(2020, 0, 1), to: new Date(2020, 0, 7), flexDays: 3 },
            searchFrom: {
                origins: ['LGW'],
            },
            searchTo: {
                selectedDestinationCodes: ['ES'],
                selectedDestinationCodesQuery: 'ES',
                destinationsDisplayValue: { main: 'test' },
                setSelectedAccommodationCodes: jest.fn(),
            },
            clearSearchValues: jest.fn(),
            clearAvailableCodesAndDates: jest.fn(),
            getValuesFromQueryParamsStore: jest.fn(),
        },
        searchFiltersStore: {
            hotelTypesFilters: 'lux',
            onClearAllSelectedFilters: jest.fn(),
            getFiltersParamsFromQueryParamsStore: jest.fn(),
            clearFlightNumberValues: jest.fn(),
            filters: [],
        },
        queryParamsStore: {
            emptyAncillariesParams: {},
            offerRoomsAllocationFromUrl: [],
            outboundLCBSelectionFromUrl: 'outboundLCBSelectionFromUrl',
            inboundLCBSelectionFromUrl: 'inboundLCBSelectionFromUrl',
            altAccommodationsFromUrl: ['altAccommodationsFromUrl'],
            buildHotelDetailsQuery: jest.fn(() => 'query'),
            parseBrowserQuery: jest.fn(),
            isFlightPlusHotelFunnel: false,
            fphDiscountPriceFromUrl: undefined,
        },
        routerStore: {
            backToSearchUrl: 'backToSearchUrl',
            updateCurrentPage: jest.fn(),
            onClickBackButton: jest.fn(),
            state: {
                searchPrice: '500',
            },
            redirectToExtrasPage: jest.fn(),
            redirectToSearchResultsPage: jest.fn(),
            redirectTo: jest.fn(),
            pathname: SitePath.Extras,
        },
        seatMapStore: {
            seatSelectionFromUrl: '3A|2B',
            isSeatMapFlowEnabled: false,
            selectedSeatsPrice: 10,
            selectedSeatsPricePP: 5,
            selectedSeats: [
                {
                    sectorId: 'sectorId-0',
                    seats: [{ paxIndex: '000', seatNumber: 'seatNumber' }],
                },
            ],
            clearValidatedSeats: jest.fn(),
            setValidatedSelectedSeats: jest.fn(),
        },
        flightsPassengersStore: { clearAllPassengersLCB: jest.fn() },
        bookingStore: {
            validatePackage: jest.fn(),
            toggleMapVisibilityOnMobile: jest.fn(),
        },
        trackingStore: {
            trackSearchProductClick: jest.fn(),
            applyPromoCodeTrigger: jest.fn(),
            trackLateCheckoutChange: jest.fn(),
            holidayConfigChangeTrigger: jest.fn(),
        },
    });

describe('BaseBookingStore', () => {
    let rootStore: any = createRootStore();
    let store: TestBaseBookingStore;

    const prepareStoreForAltAccommodationsTests = store => {
        store.selectedOffer = { ...offer, date: new Date(offer.date) };
        store.packageIdFromUrl = 'packageId';
        store.from = new Date('7/07/2020');
        store.to = new Date('12/09/2020');
        store.origins = ['1', '2', '3'];
    };

    beforeEach(() => {
        jest.restoreAllMocks();
        rootStore = createRootStore();
        store = new TestBaseBookingStore(rootStore);

        store.extraLuggage.clearExtraLuggage = jest.fn();
        store.extraLuggage.setLuggagePricesAndTypes = jest.fn();
        store.extraLuggage.setExtraLuggageInfo = jest.fn();
        store.extraLuggage.convertExtraLuggage = jest.fn();
    });

    describe('serialize', () => {
        it('should return initial state object', () => {
            store.selectedOffer = offer;
            store.notValidatedOfferPricePP = 10;
            store.accommodationIdFromUrl = 'accomodation id';
            store.outboundFlightIdFromUrl = 'outbound flight id';
            store.inboundFlightIdFromUrl = 'inbound flight id';
            store.packageIdFromUrl = 'package id';
            store.boardTypeFromUrl = 'board type';
            store.guestsInfoPayload = { leadPassenger: 'lead passenger' } as any;
            store.bookingInfoPayload = { bookingReference: '12345' } as any;
            store.defaultTransferFromUrl = 'default transfer';
            store.selectedTransferFromUrl = 'selected transfer';
            store.otherRoutesFromUrl = ['other route'];
            store.isExtFromUrl = true;
            store.isLateCheckoutRoomSelected = true;

            expect(store.serialize()).toEqual({
                selectedOffer: offer,
                notValidatedOfferPricePP: 10,
                notValidatedOfferPrice: 0,
                accommodationIdFromUrl: 'accomodation id',
                outboundFlightIdFromUrl: 'outbound flight id',
                inboundFlightIdFromUrl: 'inbound flight id',
                packageIdFromUrl: 'package id',
                boardTypeFromUrl: 'board type',
                guestsInfoPayload: { leadPassenger: 'lead passenger' } as any,
                bookingInfoPayload: { bookingReference: '12345' } as any,
                defaultTransferFromUrl: 'default transfer',
                selectedTransferFromUrl: 'selected transfer',
                otherRoutesFromUrl: ['other route'],
                isExtFromUrl: true,
                isLateCheckoutRoomSelected: true,
            });
        });
    });

    describe('deserialize', () => {
        it('should do nothing when no initialState', () => {
            store.deserialize();

            expect(store.accommodationIdFromUrl).toBeUndefined();
            expect(store.outboundFlightIdFromUrl).toBeUndefined();
            expect(store.inboundFlightIdFromUrl).toBeUndefined();
            expect(store.packageIdFromUrl).toBeUndefined();
            expect(store.boardTypeFromUrl).toBeUndefined();
            expect(store.guestsInfoPayload).toBeUndefined();
            expect(store.bookingInfoPayload).toBeUndefined();
            expect(store.defaultTransferFromUrl).toBeUndefined();
            expect(store.selectedTransferFromUrl).toBeUndefined();
            expect(store.otherRoutesFromUrl).toBeUndefined();
            expect(store.isExtFromUrl).toBeUndefined();
            expect(store.isLateCheckoutRoomSelected).toBeFalsy();
        });

        it('should initialize store using initial state', () => {
            const initialState: IBaseBookingStoreInitialState = {
                selectedOffer: offer,
                notValidatedOfferPricePP: 10,
                notValidatedOfferPrice: 20,
                accommodationIdFromUrl: 'accomodation id',
                outboundFlightIdFromUrl: 'outbound flight id',
                inboundFlightIdFromUrl: 'inbound flight id',
                packageIdFromUrl: 'package id',
                boardTypeFromUrl: 'board type',
                guestsInfoPayload: { leadPassenger: 'lead passenger' } as any,
                bookingInfoPayload: { bookingReference: '12345' } as any,
                defaultTransferFromUrl: 'default transfer',
                selectedTransferFromUrl: 'selected transfer',
                otherRoutesFromUrl: ['other route'],
                isExtFromUrl: true,
                isLateCheckoutRoomSelected: true,
            };

            store.deserialize(initialState);

            expect(store.accommodationIdFromUrl).toEqual('accomodation id');
            expect(store.outboundFlightIdFromUrl).toEqual('outbound flight id');
            expect(store.inboundFlightIdFromUrl).toEqual('inbound flight id');
            expect(store.packageIdFromUrl).toEqual('package id');
            expect(store.boardTypeFromUrl).toEqual('board type');
            expect(store.guestsInfoPayload).toEqual({ leadPassenger: 'lead passenger' } as any);
            expect(store.bookingInfoPayload).toEqual({ bookingReference: '12345' } as any);
            expect(store.defaultTransferFromUrl).toEqual('default transfer');
            expect(store.selectedTransferFromUrl).toEqual('selected transfer');
            expect(store.otherRoutesFromUrl).toEqual(['other route']);
            expect(store.isExtFromUrl).toEqual(true);
            expect(store.isLateCheckoutRoomSelected).toEqual(true);
        });
    });

    describe('outboundFlight', () => {
        it('should return outbound flight from booking when booking exists', () => {
            store.booking = {
                package: { transport: mockedTransport },
            } as any;
            store.selectedOffer = {
                transport: { routes: [{ fltNo: '1234' }, { fltNo: '5678' }] },
            } as any;

            expect(store.outboundFlight).toEqual(mockedOutboundRoute);
        });

        it('should return outbound flight from selected offer when booking does NOT exist', () => {
            store.selectedOffer = {
                transport: mockedTransport,
            } as any;

            expect(store.outboundFlight).toEqual(mockedOutboundRoute);
        });
    });

    describe('CreateRoomAllocation', () => {
        it('should create room allocations correctly', () => {
            const store = new TestBaseBookingStore(rootStore);
            store.roomsAllocation = [
                {
                    adults: [{}, {}] as GuestInfo[],
                    children: [{ age: 6 }] as GuestInfo[],
                    infants: [{}] as GuestInfo[],
                } as RoomAllocation,
            ];
            const expectedAllocation = [
                {
                    adults: 2,
                    children: 1,
                    infants: 1,
                    roomCode: '',
                    childrenAges: [6],
                },
            ];

            const result = store.createRoomAllocation();

            expect(result).toEqual(expectedAllocation);
        });

        it('should return an empty array when no rooms are allocated', () => {
            const store = new TestBaseBookingStore(rootStore);
            store.roomsAllocation = [];

            const result = store.createRoomAllocation();

            expect(result).toEqual([]);
        });
    });

    describe('roomsWithAllocation', () => {
        it('should return offerRoomsAllocationFromUrl when selectedOffer is undefined', () => {
            store.selectedOffer = undefined;

            expect(store.roomsWithAllocation).toEqual(rootStore.queryParamsStore.offerRoomsAllocationFromUrl);
        });

        it('should return offerRoomsAllocationFromUrl when unit in selected offer is empty', () => {
            store.selectedOffer = { accom: { unit: [] as IUnit[] } } as IOfferWithoutAltBoards;

            expect(store.roomsWithAllocation).toEqual(rootStore.queryParamsStore.offerRoomsAllocationFromUrl);
        });

        it('should return buildRoomAllocationFromOfferUnitParams when selectedOffer.accom.unit is provided', () => {
            store.selectedOffer = { accom: { unit: [{}, {}] } } as IOfferWithoutAltBoards;

            expect(store.roomsWithAllocation).toEqual(
                buildRoomAllocationFromOfferUnitParams(store.selectedOffer.accom.unit),
            );
        });
    });

    describe('inboundFlight', () => {
        it('should return inbound flight from booking when booking exists', () => {
            store.booking = {
                package: { transport: mockedTransport },
            } as any;
            store.selectedOffer = {
                transport: { routes: [{ fltNo: '1234' }, { fltNo: '5678' }] },
            } as any;

            expect(store.inboundFlight).toEqual(mockedInboundRoute);
        });

        it('should return inbound flight from selected offer when booking does NOT exist', () => {
            store.selectedOffer = {
                transport: mockedTransport,
            } as any;

            expect(store.inboundFlight).toEqual(mockedInboundRoute);
        });
    });

    it('outboundFlightNumber should getFlightDigitalNumber with outbound flight', () => {
        store.booking = { transport: mockedTransport } as any;

        store.outboundFlightNumber;

        expect(getFlightDigitalNumber).toHaveBeenCalledWith(store.outboundFlight);
    });

    it('inboundFlightNumber should call getFlightDigitalNumber with inbound flight', () => {
        store.booking = { transport: mockedTransport } as any;

        store.inboundFlightNumber;

        expect(getFlightDigitalNumber).toHaveBeenCalledWith(store.inboundFlight);
    });

    describe('paymentInfo', () => {
        it('should return undefined when package is not valid', () => {
            store.isPackageValid = false;
            expect(store.paymentInfo).toBeUndefined();
        });

        it('should return undefined when no package info', () => {
            store.isPackageValid = true;
            expect(store.paymentInfo).toBeUndefined();
        });

        it('should return paymentInfo', () => {
            store.isPackageValid = true;
            store.packageInfo = { paymentInfo: paymentInfoMock } as any;
            expect(store.paymentInfo).toEqual(paymentInfoMock);
        });
    });

    describe('packageTaxesAndFees', () => {
        it('should return undefined when package is not valid', () => {
            store.isPackageValid = false;

            expect(store.packageTaxesAndFees).toBeUndefined();
        });

        it('should return undefined when no package info', () => {
            store.isPackageValid = true;

            expect(store.packageTaxesAndFees).toBeUndefined();
        });

        it('should return package taxesAndFees', () => {
            const taxesAndFees = [{ paylocalAmountConverted: 12 }, { paylocalAmountConverted: 7 }];

            store.isPackageValid = true;
            store.packageInfo = { taxesAndFees } as unknown as IValidatePackageInfo;

            expect(store.packageTaxesAndFees).toEqual(taxesAndFees);
        });
    });

    describe('getTotalPrice', () => {
        it('should return 0 when is nothing defined', () => {
            expect(store.totalPrice).toEqual(0);
        });

        it('should return paymentInfo.totalPrice when paymentInfo is defined', () => {
            store.isPackageValid = true;
            store.packageInfo = { paymentInfo: paymentInfoMock } as unknown as IValidatePackageInfo;
            expect(store.totalPrice).toEqual(paymentInfoMock.totalPrice);
        });

        it('should return selectedOffer.price when only selectedOffer is defined', () => {
            store.selectedOffer = offer;
            expect(store.selectedOffer?.price).toEqual(offer.price);
        });

        it('should return selectedOffer.price when selectedOffer and paymentInfo are defined', () => {
            store.selectedOffer = offer;
            store.packageInfo = { paymentInfo: paymentInfoMock } as unknown as IValidatePackageInfo;
            expect(store.selectedOffer?.price).toEqual(offer.price);
        });

        describe('on isHotelDetailsBookPage', () => {
            beforeEach(() => {
                rootStore.layoutStore.isHotelDetailsBookPage = true;
            });

            it('should return selectedOffer.price when selectedOffer is defined', () => {
                store.selectedOffer = offer;

                expect(store.selectedOffer?.price).toEqual(offer.price);
            });

            it('should return 0 when only paymentInfo is defined', () => {
                store.packageInfo = { paymentInfo: paymentInfoMock } as unknown as IValidatePackageInfo;

                expect(store.totalPrice).toEqual(0);
            });

            it('should return selectedOffer.price when paymentInfo and selectedOffer are defined', () => {
                store.packageInfo = { paymentInfo: paymentInfoMock } as unknown as IValidatePackageInfo;
                store.selectedOffer = offer;

                expect(store.selectedOffer?.price).toEqual(offer.price);
            });

            it('should return 0 when is nothing defined', () => {
                expect(store.totalPrice).toEqual(0);
            });
        });
    });

    describe('get totalPriceWithTouristTax', () => {
        beforeEach(() => {
            store.selectedOffer = { price: 100, touristTax: 20 } as IOffer;
            store.packageInfo = { paymentInfo: paymentInfoMock } as unknown as IValidatePackageInfo;
        });

        it('should return paymentInfo.totalPrice when touristTax is not defined', () => {
            store.isPackageValid = true;
            store.selectedOffer = { price: 100 } as IOffer;

            expect(store.totalPriceWithTouristTax).toEqual(paymentInfoMock.totalPrice);
        });

        it('should return paymentInfo.totalPrice + touristTax when both are defined', () => {
            store.isPackageValid = true;

            expect(store.totalPriceWithTouristTax).toEqual(paymentInfoMock.totalPrice + 20);
        });

        it('should return totalPrice without tax when isTouristTaxEnabled is false', () => {
            rootStore.layoutStore.isTouristTaxEnabled = false;
            store.isPackageValid = true;

            expect(store.totalPriceWithTouristTax).toEqual(paymentInfoMock.totalPrice);
        });

        it('should round up tax values', () => {
            store.isPackageValid = true;
            store.selectedOffer = { price: 100, touristTax: 21.1 } as IOffer;

            expect(store.totalPriceWithTouristTax).toEqual(paymentInfoMock.totalPrice + 22);
        });

        it('should return price with tax when selectedOffer is defined', () => {
            store.selectedOffer = { price: 100 } as IOffer;

            expect(store.totalPriceWithTouristTax).toEqual(100);
        });

        it('should return price without tax when selectedOffer is defined and isTouristTaxEnabled is false', () => {
            store.selectedOffer = { price: 100, priceExcludingTouristTax: 80 } as IOffer;
            rootStore.layoutStore.isTouristTaxEnabled = false;

            expect(store.totalPriceWithTouristTax).toEqual(80);
        });

        it('should return 0 when selectedOffer is not defined', () => {
            store.selectedOffer = undefined;

            expect(store.totalPriceWithTouristTax).toEqual(0);
        });

        it('should return selectedOffer.price on HotelDetailsBook page even when touristTax is defined', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;
            store.isPackageValid = true;

            expect(store.totalPriceWithTouristTax).toEqual(100);
        });
    });

    describe('flightPlusHotelDiscount', () => {
        beforeEach(() => {
            rootStore.queryParamsStore.isFlightPlusHotelFunnel = true;
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = 10;
            store.cacheOfferPriceExcludingTouristTax = 1000;
            jest.spyOn(store, 'totalPrice', 'get').mockReturnValueOnce(1000);
            store.isPackageValid = false;
            rootStore.layoutStore.isHotelDetailsBookPage = false;
            store.packageInfo = {
                extraPriceBreakdown: [{ code: 'Holiday', amount: 1000, name: 'Holiday', quantity: 1 }],
            } as IValidatePackageInfo;
        });

        it('should return dPrice when FPH funnel, dPrice exists, and offerPrice equals Holiday amount', () => {
            expect(store.flightPlusHotelDiscount).toBe(10);
        });

        it('should return dPrice when using selectedOffer.price and it equals Holiday amount', () => {
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = 15;
            store.cacheOfferPriceExcludingTouristTax = undefined;
            store.selectedOffer = { priceExcludingTouristTax: 500 } as IOffer;
            store.packageInfo = {
                extraPriceBreakdown: [{ code: 'Holiday', amount: 500, name: 'Holiday', quantity: 1 }],
            } as IValidatePackageInfo;

            expect(store.flightPlusHotelDiscount).toBe(15);
        });

        it('should return undefined when not FPH funnel', () => {
            rootStore.queryParamsStore.isFlightPlusHotelFunnel = false;

            expect(store.flightPlusHotelDiscount).toBeUndefined();
        });

        it('should return undefined when dPrice is not in URL', () => {
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = undefined;

            expect(store.flightPlusHotelDiscount).toBeUndefined();
        });

        it('should return undefined when offerPrice does not equal Holiday amount', () => {
            store.cacheOfferPriceExcludingTouristTax = undefined;
            store.selectedOffer = { priceExcludingTouristTax: 900 } as IOffer;
            store.packageInfo = {
                extraPriceBreakdown: [{ code: 'Holiday', amount: 1000, name: 'Holiday', quantity: 1 }],
            } as IValidatePackageInfo;

            expect(store.flightPlusHotelDiscount).toBeUndefined();
        });

        it('should return undefined when both cacheOfferPrice and selectedOffer.price are unavailable', () => {
            store.cacheOfferPriceExcludingTouristTax = undefined;
            store.selectedOffer = undefined;

            expect(store.flightPlusHotelDiscount).toBeUndefined();
        });

        it('should return undefined when dPrice is 0', () => {
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = 0;

            expect(store.flightPlusHotelDiscount).toBeUndefined();
        });

        it('should round up Holiday amount using Math.ceil before comparison', () => {
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = 25;
            store.cacheOfferPriceExcludingTouristTax = 1003;
            store.packageInfo = {
                extraPriceBreakdown: [{ code: 'Holiday', amount: 1002.02, name: 'Holiday', quantity: 1 }],
            } as IValidatePackageInfo;

            expect(store.flightPlusHotelDiscount).toBe(25);
        });

        it('should round up Holiday amount: 1002.99 -> 1003', () => {
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = 30;
            store.cacheOfferPriceExcludingTouristTax = 1003;
            store.packageInfo = {
                extraPriceBreakdown: [{ code: 'Holiday', amount: 1002.99, name: 'Holiday', quantity: 1 }],
            } as IValidatePackageInfo;

            expect(store.flightPlusHotelDiscount).toBe(30);
        });

        it('should fallback to totalPrice when Holiday not found in extraPriceBreakdown', () => {
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = 35;
            store.cacheOfferPriceExcludingTouristTax = 1000;
            jest.spyOn(store, 'totalPrice', 'get').mockReturnValueOnce(999.2);
            store.packageInfo = {
                extraPriceBreakdown: [{ code: 'Transfer', amount: 50, name: 'Transfer', quantity: 1 }],
            } as IValidatePackageInfo;

            expect(store.flightPlusHotelDiscount).toBe(35);
        });

        it('should fallback to totalPrice when packageInfo.extraPriceBreakdown is undefined', () => {
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = 40;
            store.cacheOfferPriceExcludingTouristTax = 1000;
            jest.spyOn(store, 'totalPrice', 'get').mockReturnValueOnce(1000);
            store.packageInfo = {} as IValidatePackageInfo;

            expect(store.flightPlusHotelDiscount).toBe(40);
        });

        it('should fallback to totalPrice when packageInfo is undefined', () => {
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = 45;
            store.cacheOfferPriceExcludingTouristTax = 1000;
            jest.spyOn(store, 'totalPrice', 'get').mockReturnValueOnce(999.9);
            store.packageInfo = undefined;

            expect(store.flightPlusHotelDiscount).toBe(45);
        });

        it('should use Holiday amount from extraPriceBreakdown with paymentInfo.totalPrice', () => {
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = 25;
            store.cacheOfferPriceExcludingTouristTax = 1200;
            store.isPackageValid = true;
            store.packageInfo = {
                paymentInfo: { totalPrice: 1250 },
                extraPriceBreakdown: [{ code: 'Holiday', amount: 1200, name: 'Holiday', quantity: 1 }],
            } as IValidatePackageInfo;

            expect(store.flightPlusHotelDiscount).toBe(25);
        });

        it('should prioritize cacheOfferPrice over selectedOffer.price in offerPrice calculation', () => {
            rootStore.queryParamsStore.fphDiscountPriceFromUrl = 20;
            store.cacheOfferPriceExcludingTouristTax = 1500;
            store.selectedOffer = { priceExcludingTouristTax: 900 } as IOffer;
            store.packageInfo = {
                extraPriceBreakdown: [{ code: 'Holiday', amount: 900, name: 'Holiday', quantity: 1 }],
            } as IValidatePackageInfo;

            expect(store.flightPlusHotelDiscount).toBeUndefined();
        });
    });

    describe('getTotalPricePP', () => {
        it('should return 0 when is nothing defined', () => {
            expect(store.totalPricePP).toEqual(0);
        });

        it('should return paymentInfo.pricePP when paymentInfo is defined', () => {
            store.isPackageValid = true;
            store.packageInfo = { paymentInfo: paymentInfoMock } as any;
            expect(store.totalPricePP).toEqual(paymentInfoMock.pricePP);
        });

        it('should return selectedOffer.pricePP when only selectedOffer is defined', () => {
            store.selectedOffer = offer;
            expect(store.selectedOffer?.pricePP).toEqual(offer.pricePP);
        });

        it('should return selectedOffer.pricePP when selectedOffer and paymentInfo are defined', () => {
            store.selectedOffer = offer;
            store.packageInfo = { paymentInfo: paymentInfoMock } as any;
            expect(store.selectedOffer?.pricePP).toEqual(offer.pricePP);
        });

        describe('on isHotelDetailsBookPage', () => {
            beforeEach(() => {
                rootStore.layoutStore.isHotelDetailsBookPage = true;
            });

            it('should return selectedOffer.pricePP when selectedOffer is defined', () => {
                store.selectedOffer = offer;

                expect(store.selectedOffer?.pricePP).toEqual(offer.pricePP);
            });

            it('should return 0 when only paymentInfo is defined', () => {
                store.packageInfo = { paymentInfo: paymentInfoMock } as any;

                expect(store.totalPricePP).toEqual(0);
            });

            it('should return selectedOffer.pricePP when paymentInfo and selectedOffer are defined', () => {
                store.packageInfo = { paymentInfo: paymentInfoMock } as any;
                store.selectedOffer = offer;

                expect(store.selectedOffer?.pricePP).toEqual(offer.pricePP);
            });

            it('should return 0 when is nothing defined', () => {
                expect(store.totalPricePP).toEqual(0);
            });
        });
    });

    describe('getTotalPricePPWithTouristTax', () => {
        beforeEach(() => {
            store.selectedOffer = { pricePP: 100, touristTaxPP: 20 } as IOffer;
            store.packageInfo = { paymentInfo: paymentInfoMock } as unknown as IValidatePackageInfo;
        });

        it('should return paymentInfo.pricePP when offer touristTaxPP is not defined', () => {
            store.isPackageValid = true;
            store.selectedOffer = { pricePP: 100 } as IOffer;

            expect(store.totalPricePPWithTouristTax).toEqual(paymentInfoMock.pricePP);
        });

        it('should return paymentInfo.pricePP + offer touristTaxPP when both are defined', () => {
            store.isPackageValid = true;

            expect(store.totalPricePPWithTouristTax).toEqual(paymentInfoMock.pricePP + 20);
        });

        it('should return totalPricePP without tax when isTouristTaxEnabled is false', () => {
            rootStore.layoutStore.isTouristTaxEnabled = false;
            store.isPackageValid = true;

            expect(store.totalPricePPWithTouristTax).toEqual(paymentInfoMock.pricePP);
        });

        it('should round up tax values', () => {
            store.isPackageValid = true;
            store.selectedOffer = { pricePP: 100, touristTaxPP: 21.1 } as IOffer;

            expect(store.totalPricePPWithTouristTax).toEqual(paymentInfoMock.pricePP + 22);
        });

        it('should return pricePP with tax when selectedOffer is defined', () => {
            store.selectedOffer = { pricePP: 100 } as IOffer;

            expect(store.totalPricePPWithTouristTax).toEqual(100);
        });

        it('should return pricePP without tax when selectedOffer is defined and isTouristTaxEnabled is false', () => {
            store.selectedOffer = { pricePP: 100, pricePPExcludingTouristTax: 80 } as IOffer;
            rootStore.layoutStore.isTouristTaxEnabled = false;

            expect(store.totalPricePPWithTouristTax).toEqual(80);
        });

        it('should return 0 when selectedOffer is not defined', () => {
            store.selectedOffer = undefined;

            expect(store.totalPricePPWithTouristTax).toEqual(0);
        });

        it('should return selectedOffer.pricePP on HotelDetailsBook page even when paymentInfo is defined', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;
            store.isPackageValid = true;
            store.packageInfo = {
                paymentInfo: paymentInfoMock,
            } as unknown as IValidatePackageInfo;

            expect(store.totalPricePPWithTouristTax).toEqual(100);
        });
    });

    describe('totalPriceForExtras', () => {
        beforeEach(() => {
            store.selectedOffer = { priceExcludingTouristTax: 100 } as IOfferWithoutAltBoards;
            jest.spyOn(store.extraLuggage, 'extraLuggagePriceTotal', 'get').mockReturnValue(20);
        });

        it('should add selectedSeatsPrice and extraLuggagePriceTotal on HotelDetailsBookPage', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;

            expect(store.totalPriceForExtras).toEqual(130);
        });

        it('should NOT add selectedSeatsPrice and extraLuggagePriceTotal when it is not HotelDetailsBookPage', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = false;

            expect(store.totalPriceForExtras).toEqual(100);
        });

        it('should return price from session storage when selectedOffer is unavailable', () => {
            store.selectedOffer = null;
            rootStore.layoutStore.isHotelDetailsBookPage = true;

            mockGetWebStorageItem.mockReturnValue({ price: 44 });

            expect(store.totalPriceForExtras).toEqual(74);
        });
    });

    describe('totalPricePPForExtras', () => {
        it('should return sum of totalPricePP, selectedSeatsPricePP and extraLuggagePricePP', () => {
            store.selectedOffer = { pricePPExcludingTouristTax: 50 } as any;
            jest.spyOn(store.extraLuggage, 'extraLuggagePricePP', 'get').mockReturnValue(10);
            expect(store.totalPricePPForExtras).toEqual(65);
        });
    });

    describe('setSelectedOfferPrices', () => {
        it('should set prises for selected offer', () => {
            store.selectedOffer = {} as any;
            Object.defineProperty(store, 'totalPrice', {
                get: jest.fn(() => 1000),
                set: jest.fn(),
            });
            Object.defineProperty(store, 'totalPricePP', {
                get: jest.fn(() => 500),
                set: jest.fn(),
            });

            store.setSelectedOfferPrices();

            expect(store.selectedOffer?.price).toEqual(1000);
            expect(store.selectedOffer?.pricePP).toEqual(500);
        });
    });

    it('should return offers units', () => {
        store.selectedOffer = offer;

        expect(store.offerUnits).toMatchObject(offer.accom.unit);
    });

    describe('clearBooking', () => {
        it('Should clear booking and call clearValidatedSeats', () => {
            store.booking = mockedBooking;

            expect(store.booking).not.toBeUndefined();

            store.clearBooking();

            expect(store.booking).toBeUndefined();
            expect(rootStore.seatMapStore.clearValidatedSeats).toHaveBeenCalled();
        });
    });

    describe('clearAncillariesAndUpdateUrl', () => {
        it('should clear selected extras and update URL when selected extras exists', async () => {
            rootStore.queryParamsStore.emptyAncillariesParams = { lug: '' };
            store.clearAncillaries = jest.fn();

            await store.clearAncillariesAndUpdateUrl();

            const { routerStore, queryParamsStore } = rootStore;
            const { buildHotelDetailsQuery, emptyAncillariesParams } = queryParamsStore;

            expect(buildHotelDetailsQuery).toHaveBeenCalledWith(undefined, emptyAncillariesParams);
            expect(routerStore.updateCurrentPage).toHaveBeenCalledWith('query', true);
            expect(store.clearAncillaries).toHaveBeenCalled();
        });

        it('should NOT update URL when no extras was selected', async () => {
            store.clearAncillaries = jest.fn();

            await store.clearAncillariesAndUpdateUrl();

            expect(rootStore.queryParamsStore.buildHotelDetailsQuery).not.toHaveBeenCalled();
            expect(rootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
            expect(store.clearAncillaries).toHaveBeenCalled();
        });
    });

    describe('clearFlightNumbersAndUpdateUrl', () => {
        it('should clear selected flight numbers and update URL when selected flight numbers exist', async () => {
            rootStore.searchFiltersStore.outboundFlightNumber = 'EZY0001';
            rootStore.searchFiltersStore.inboundFlightNumber = 'EZY0002';

            await store.clearFlightNumbersAndUpdateUrl();

            expect(rootStore.searchFiltersStore.clearFlightNumberValues).toHaveBeenCalled();
        });

        it('should clear selected flight numbers and update URL when the selected outbound flight number exists', async () => {
            rootStore.searchFiltersStore.outboundFlightNumber = 'EZY0001';

            await store.clearFlightNumbersAndUpdateUrl();

            expect(rootStore.searchFiltersStore.clearFlightNumberValues).toHaveBeenCalled();
        });

        it('should clear selected flight numbers and update URL when the selected inbound flight number exists', async () => {
            rootStore.searchFiltersStore.inboundFlightNumber = 'EZY0002';

            await store.clearFlightNumbersAndUpdateUrl();

            expect(rootStore.searchFiltersStore.clearFlightNumberValues).toHaveBeenCalled();
        });

        it('should NOT update URL when no flight numbers was selected', async () => {
            await store.clearFlightNumbersAndUpdateUrl();

            expect(rootStore.searchFiltersStore.clearFlightNumberValues).not.toHaveBeenCalled();
        });
    });

    describe('clearAncillaries', () => {
        it('should clear shared ancillaries', () => {
            store.clearAncillaries();

            expect(rootStore.seatMapStore.clearValidatedSeats).toHaveBeenCalled();
            expect(store.extraLuggage.clearExtraLuggage).toHaveBeenCalled();
            expect(rootStore.flightsPassengersStore.clearAllPassengersLCB).toHaveBeenCalled();
        });

        it('should clear airport parking if airport parking store is present', () => {
            rootStore.airportParkingStore = {
                clearAirportParking: jest.fn(),
            };

            store.clearAncillaries();

            expect(rootStore.airportParkingStore.clearAirportParking).toHaveBeenCalled();
        });
    });

    describe('clearBookingFlow', () => {
        it('should reset value', () => {
            store.notValidatedOfferPricePP = 1000;
            store.failedToLoadData = true;
            store.isBookingFailed = true;
            store.alternativeFlights = {} as any;
            store.alternativeRooms = [{}, {}] as any;
            store.alternativeBoards = [{}, {}] as any;
            store.alternativeTransfers = [{}, {}] as any;
            store.lateRoomCheckout = {} as any;
            store.accommodationIdFromUrl = 'test';
            store.outboundFlightIdFromUrl = 'test';
            store.inboundFlightIdFromUrl = 'test';
            store.packageIdFromUrl = 'test';
            store.boardTypeFromUrl = 'test';
            store.selectedTransferFromUrl = 'test';
            store.otherRoutesFromUrl = ['test'];
            store.defaultTransferFromUrl = 'test';
            store.isExtFromUrl = true;
            store.recommendedHotels = [{}] as any;
            store.isLateCheckoutRoomSelected = true;
            store.extraLuggageCategoriesExist = false;
            store.cabinBagsCategoriesExist = true;
            store.clearSelectedOffer = jest.fn();
            store.isFlightExtrasFailed = true;

            store.clearBookingFlow();

            expect(store.clearSelectedOffer).toHaveBeenCalled();
            expect(store.notValidatedOfferPricePP).toEqual(0);
            expect(store.failedToLoadData).toBe(false);
            expect(store.isBookingFailed).toBe(false);
            expect(store.alternativeFlights).toEqual([]);
            expect(store.alternativeRooms).toEqual([]);
            expect(store.alternativeBoards).toEqual([]);
            expect(store.alternativeTransfers).toEqual([]);
            expect(store.lateRoomCheckout).toBeNull();
            expect(store.accommodationIdFromUrl).toEqual('');
            expect(store.outboundFlightIdFromUrl).toEqual('');
            expect(store.inboundFlightIdFromUrl).toEqual('');
            expect(store.packageIdFromUrl).toEqual('');
            expect(store.boardTypeFromUrl).toEqual('');
            expect(store.selectedTransferFromUrl).toEqual('');
            expect(store.otherRoutesFromUrl).toBeUndefined();
            expect(store.defaultTransferFromUrl).toEqual('');
            expect(store.isExtFromUrl).toBe(false);
            expect(store.recommendedHotels).toBeNull();
            expect(store.isLateCheckoutRoomSelected).toBe(false);
            expect(store.isLateCheckoutRoomSelected).toBe(false);
            expect(store.extraLuggageCategoriesExist).toBe(true);
            expect(store.cabinBagsCategoriesExist).toBe(true);

            expect(rootStore.engageStore.clearContentOrder).toHaveBeenCalled();
            expect(rootStore.guestDetailsStore.clearGuestDetails).toHaveBeenCalled();
            expect(rootStore.alternativeFlightsStore.clearStore).toHaveBeenCalled();
            expect(rootStore.seatMapStore.clearValidatedSeats).toHaveBeenCalled();
            expect(store.extraLuggage.clearExtraLuggage).toHaveBeenCalled();
            expect(rootStore.flightsPassengersStore.clearAllPassengersLCB).toHaveBeenCalled();
        });
    });

    describe('clearPackageValidation', () => {
        it('should reset isPackageValid', () => {
            store.isPackageValid = true;

            store.clearPackageValidation();

            expect(store.isPackageValid).toBeNull();
        });
    });

    describe('resetBookingStore', () => {
        it('should reset booking store', () => {
            store.clearBookingFlow = jest.fn();
            store.clearPackageValidation = jest.fn();

            store.resetBookingStore();

            expect(store.clearBookingFlow).toHaveBeenCalled();
            expect(store.clearPackageValidation).toHaveBeenCalled();
        });
    });

    describe('onFetchOfferError', () => {
        it('should do nothing when failSilently', () => {
            store.resetBookingStore = jest.fn();

            store.onFetchOfferError(true);

            expect(store.failedToLoadData).toBeFalsy();
            expect(store.resetBookingStore).not.toHaveBeenCalled();
            expect(rootStore.routerStore.onClickBackButton).not.toHaveBeenCalled();
        });

        it('should redirect to search page when came from iframe', () => {
            rootStore.queryParamsStore.isPromotingIframe = jest.fn(() => true);
            rootStore.layoutStore.isHotelDetailsBookPage = true;

            store.resetBookingStore = jest.fn();

            store.onFetchOfferError(false);

            expect(store.failedToLoadData).toBeFalsy();
            expect(store.resetBookingStore).toHaveBeenCalled();
            expect(rootStore.routerStore.onClickBackButton).toHaveBeenCalledWith(rootStore.routerStore.backToSearchUrl);
        });

        it('should set failedToLoadData to true', () => {
            store.onFetchOfferError(false);

            expect(store.failedToLoadData).toBeTruthy();
        });
    });

    describe('updatePreviousPriceFormOffer', () => {
        it('set previous price when has selected offer', () => {
            store.packageInfo = {} as any;
            store.selectedOffer = offer;

            store.updatePreviousPriceFormOffer();

            expect(store.previousPrice).toEqual(2000);
            expect(store.packageInfo).toBeUndefined();
        });

        it('set previous price to 0 when no selected offer', () => {
            store.previousPrice = 2000;

            store.updatePreviousPriceFormOffer();

            expect(store.previousPrice).toEqual(0);
        });
    });

    describe('loadAdditionalData', () => {
        it('should load flights, rooms, transfers', () => {
            store.selectedOffer = {} as any;

            store.loadAlternativeFlights = jest.fn();
            store.loadOffersAlterations = jest.fn();
            store.loadExtras = jest.fn();

            store.loadAdditionalData();

            expect(store.loadAlternativeFlights).toHaveBeenCalled();
            expect(store.loadOffersAlterations).toHaveBeenCalledWith(store.selectedOffer);
            expect(store.loadExtras).toHaveBeenCalled();
        });

        it('should not load rooms when no selectedOffer set', () => {
            store.selectedOffer = null;

            store.loadAlternativeFlights = jest.fn();
            store.loadOffersAlterations = jest.fn();
            store.loadExtras = jest.fn();

            store.loadAdditionalData();

            expect(store.loadAlternativeFlights).toHaveBeenCalled();
            expect(store.loadOffersAlterations).not.toHaveBeenCalled();
            expect(store.loadExtras).toHaveBeenCalled();
        });

        it('should not call loadAlternativeFlights when disableLoadAlternativeFlights is true', () => {
            store.loadAlternativeFlights = jest.fn();
            store.loadOffersAlterations = jest.fn();
            store.loadExtras = jest.fn();

            store.loadAdditionalData(true);

            expect(store.loadAlternativeFlights).not.toHaveBeenCalled();
            expect(store.loadExtras).toHaveBeenCalled();
        });
    });

    describe('getOriginsWithOtherRoutes', () => {
        it('should return origins and otherRoutesFromUrl without duplications', () => {
            store.origins = ['LGW', 'LPL'];
            store.otherRoutesFromUrl = ['LTN', 'LGW'];

            const result = store.getOriginsWithOtherRoutes();

            expect(result).toEqual('LGW,LPL,LTN');
        });

        it('should return origins from searchFrom when origins and otherRoutesFromUrl are NOT provided', () => {
            store.origins = [];
            store.otherRoutesFromUrl = undefined;
            store.rootStore.searchStore.searchFrom.origins = ['LGW', 'LPL'];

            const result = store.getOriginsWithOtherRoutes();

            expect(result).toEqual('LGW,LPL');
        });

        it('should return empty string when origins, origins from searchFrom and otherRoutesFromUrl are NOT provided', () => {
            store.origins = [];
            store.otherRoutesFromUrl = undefined;
            store.rootStore.searchStore.searchFrom.origins = undefined;

            const result = store.getOriginsWithOtherRoutes();

            expect(result).toEqual('');
        });
    });

    describe('loadAlternativeFlights', () => {
        const offersResult = {
            offers: [{ accom: { id: 'testID' } }] as IAlternativeOffer[],
        };

        beforeEach(() => {
            rootStore.searchStore = {
                searchWho: { adultsQuantity: 1, childrenQuantity: 1, infantsQuantity: 1 },
                searchWhen: {
                    selectedNumberOfNights: 2,
                },
                searchFrom: {
                    origins: [],
                },
            };
        });

        it('should load alternative with the dates form offer', async () => {
            store.selectedOffer = offer as any;
            bookingService.loadAlternativeFlights = jest.fn().mockReturnValue(Promise.resolve(offersResult));
            expect(store.isLoadingAlternativeFlights).toBeFalsy();
            const promise = store.loadAlternativeFlights();
            expect(store.isLoadingAlternativeFlights).toBeTruthy();
            await promise;
            expect(bookingService.loadAlternativeFlights).toHaveBeenCalledWith(
                offer.date,
                0,
                offer.stay.toString(),
                'LGW',
                store.roomsWithAllocation,
                offer.accom.id,
                offer.accom.unit[0].board,
                offer.transport.routes[0].id,
                offer.transport.routes[1].id,
                offer.transfers[0].code,
                true,
                offer.transport.routes[0].depPt,
                undefined,
            );
            expect(store.failedLoadingAlternativeFlights).toBeFalsy();
            expect(store.isLoadingAlternativeFlights).toBeFalsy();
            expect(store.alternativeFlights).toEqual(offersResult.offers);
        });

        it('should load alternative with the date from search request', async () => {
            const offer = {
                accom: {
                    unit: [
                        {
                            roomType: {
                                code: 'code',
                            },
                        },
                    ],
                },
            };

            store.selectedOffer = offer as any;
            bookingService.loadAlternativeFlights = jest.fn().mockReturnValue(Promise.resolve(offersResult));
            expect(store.isLoadingAlternativeFlights).toBeFalsy();
            const promise = store.loadAlternativeFlights();
            expect(store.isLoadingAlternativeFlights).toBeTruthy();
            await promise;
            expect(bookingService.loadAlternativeFlights).toHaveBeenCalled();
            expect(store.failedLoadingAlternativeFlights).toBeFalsy();
            expect(store.isLoadingAlternativeFlights).toBeFalsy();
            expect(store.alternativeFlights).toEqual(offersResult.offers);
        });

        it('when something went wrong should set failedLoadingAlternativeFlights to true', async () => {
            rootStore.searchStore = {
                searchWho: { adultsQuantity: 1, childrenQuantity: 1, infantsQuantity: 1 },
                searchWhen: {
                    selectedNumberOfNights: 2,
                },
                searchFrom: {
                    origins: [],
                },
            };
            const offer = {
                accom: { unit: [{ roomType: { code: 'code' } }] },
            };

            store.selectedOffer = offer as any;
            bookingService.loadAlternativeFlights = jest.fn().mockReturnValue(Promise.reject({}));
            expect(store.isLoadingAlternativeFlights).toBeFalsy();
            const promise = store.loadAlternativeFlights();
            expect(store.isLoadingAlternativeFlights).toBeTruthy();
            await promise;
            expect(bookingService.loadAlternativeFlights).toHaveBeenCalled();
            expect(store.failedLoadingAlternativeFlights).toBeTruthy();
            expect(store.isLoadingAlternativeFlights).toBeFalsy();
            expect(store.alternativeFlights).toEqual([]);
        });

        it('should save empty response to alternativeFlights when saveEmptyOffers is true', async () => {
            store.alternativeFlights = offersResult.offers;
            bookingService.loadAlternativeFlights = jest.fn().mockReturnValue(Promise.resolve([]));

            await store.loadAlternativeFlights();

            expect(store.alternativeFlights).toEqual([]);
        });

        it('should NOT save empty response to alternativeFlights when saveEmptyOffers is false', async () => {
            store.alternativeFlights = offersResult.offers;
            bookingService.loadAlternativeFlights = jest.fn().mockReturnValue(Promise.resolve([]));

            await store.loadAlternativeFlights({ saveEmptyOffers: false });

            expect(store.alternativeFlights).toEqual(offersResult.offers);
        });
    });

    describe('outboundFlightId', () => {
        it('should return id from selected offer', () => {
            store.selectedOffer = { transport: mockedTransport } as any;
            expect(store.outboundFlightId).toEqual('Eaf170684b65f1e91ddcff8f737f8f07f');
        });

        it('should return id from url', () => {
            store.outboundFlightIdFromUrl = 'test id';
            expect(store.outboundFlightId).toEqual('test id');
        });
    });

    describe('inboundFlightId', () => {
        it('should return id from selected offer', () => {
            store.selectedOffer = { transport: mockedTransport } as any;
            expect(store.inboundFlightId).toEqual('Ea0e3d4ed50d28b03399b3308532cabc1');
        });

        it('should return id from url', () => {
            store.inboundFlightIdFromUrl = 'test id';
            expect(store.inboundFlightId).toEqual('test id');
        });
    });

    describe('transfers', () => {
        it('should return undefined when no selected offer', () => {
            expect(store.transfers).toBeUndefined();
        });

        it('should return transfers from selected offer when no transfers', () => {
            store.selectedOffer = { transfers: [mockTransfer] } as any;

            expect(store.transfers).toEqual([mockTransfer]);
        });
    });

    describe('transfer', () => {
        it('should return null when no transfers', () => {
            expect(store.transfer).toBeNull();
        });

        it('should return transfer', () => {
            store.selectedOffer = { transfers: [mockTransfer] } as any;

            expect(store.transfer).toEqual(mockTransfer);
        });
    });

    describe('selectedTransferCode', () => {
        it('should return empty string when no transfers', () => {
            expect(store.selectedTransferCode).toEqual('');
        });

        it('should return transfer code', () => {
            store.selectedOffer = { transfers: [mockTransfer] } as any;

            expect(store.selectedTransferCode).toEqual('TRANSFER_CODE');
        });
    });

    describe('loadOffersAlterations', () => {
        let offer;

        beforeEach(() => {
            rootStore.searchStore = {
                searchWho: { adultsQuantity: 1, childrenQuantity: 1, infantsQuantity: 1 },
                searchWhen: {
                    selectedNumberOfNights: 2,
                },
                searchFrom: {
                    origins: [],
                },
            };

            offer = {
                accom: {
                    unit: [
                        {
                            roomType: {
                                code: 'code',
                            },
                        },
                    ],
                },
                transport: {
                    routes: [{ depPt: 'LGW' }],
                },
            };
        });

        it('should load offer alteration with the dates form offer', async () => {
            offer.accom.date = 'date';

            const expectedResult = {
                rooms: [{ id: 'test' }],
                boards: [{ code: 'HB' }],
            };

            bookingService.fetchOffersAlterations = jest.fn().mockReturnValue(Promise.resolve(expectedResult));

            expect(store.isLoadingOffersAlterations).toBeFalsy();

            const promise = store.loadOffersAlterations(offer as any);

            expect(store.isLoadingOffersAlterations).toBeTruthy();

            await promise;

            expect(bookingService.fetchOffersAlterations).toHaveBeenCalledWith(
                undefined,
                undefined,
                '6',
                'LGW',
                [{ adults: 0, children: 0, childrenAges: [], infants: 0, roomCode: 'undefined' }],
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                ['altAccommodationsFromUrl'],
                '',
                undefined,
            );
            expect(store.failedLoadingOffersAlterations).toBeFalsy();
            expect(store.isLoadingOffersAlterations).toBeFalsy();
            expect(store.alternativeRooms).toEqual(expectedResult.rooms);
            expect(store.alternativeBoards).toEqual(expectedResult.boards);
        });

        it('should set failedLoadingOffersAlterations to true when something went wrong', async () => {
            bookingService.fetchOffersAlterations = jest.fn(() => Promise.reject());
            expect(store.isLoadingOffersAlterations).toBeFalsy();

            await store.loadOffersAlterations(offer);

            expect(bookingService.fetchOffersAlterations).toHaveBeenCalled();
            expect(store.failedLoadingOffersAlterations).toBeTruthy();
            expect(store.isLoadingOffersAlterations).toBeFalsy();
            expect(store.alternativeRooms).toEqual([]);
            expect(store.alternativeBoards).toEqual([]);
        });

        it('should load rooms and boards', async () => {
            const mockedRooms: IUnit[][] = [[mockUnitRoom]];
            const mockedBoards: IAltBoard[] = [bedBreakfastBoard];

            bookingService.fetchOffersAlterations = jest
                .fn()
                .mockReturnValue(Promise.resolve({ rooms: mockedRooms, boards: mockedBoards }));

            await store.loadOffersAlterations(offer);

            expect(store.alternativeRooms).toEqual([[mockUnitRoom]]);
            expect(store.alternativeBoards).toEqual([bedBreakfastBoard]);
        });

        it('should set empty array of rooms and boards when response is broken', async () => {
            bookingService.fetchOffersAlterations = jest
                .fn()
                .mockReturnValue(Promise.resolve({ rooms: undefined, boards: undefined }));

            await store.loadOffersAlterations(offer);

            expect(store.alternativeRooms).toEqual([]);
            expect(store.alternativeBoards).toEqual([]);
        });

        it('should call loadOffersAlterations with altAcc', async () => {
            prepareStoreForAltAccommodationsTests(store);

            await store.loadOffersAlterations(store.selectedOffer as any);

            expect(bookingService.fetchOffersAlterations).toHaveBeenCalledWith(
                store.selectedOffer?.date,
                undefined,
                '7',
                'LGW',
                [
                    {
                        adults: 2,
                        children: 1,
                        childrenAges: [4],
                        infants: 0,
                        roomCode: 'SUI.CV-LX!NOR.BAR%20-%20RO',
                    },
                ],
                'X9431179',
                'Eaf170684b65f1e91ddcff8f737f8f07f',
                'Ea0e3d4ed50d28b03399b3308532cabc1',
                '1154857380/2/1950/21',
                'RO',
                undefined,
                rootStore.queryParamsStore.altAccommodationsFromUrl,
                'TRANSFER_CODE',
                undefined,
            );
        });
    });

    describe('loadFlightExtras', () => {
        beforeEach(() => {
            bookingService.fetchBookingExtras = jest.fn();
            rootStore.layoutStore.extraLuggageCategoryCodes = ['BAGE'];
            rootStore.layoutStore.largeCabinBagsCategoryCode = ['CABI'];
        });

        describe('do nothing', () => {
            beforeEach(() => {
                store.selectedOffer = {} as IOfferWithoutAltBoards;
            });

            it('when isHotelDetailsBookPage = true', () => {
                rootStore.layoutStore.isHotelDetailsBookPage = true;

                store.loadFlightExtras();

                expect(bookingService.fetchBookingExtras).not.toHaveBeenCalled();
            });

            it('when no selectedOffer', () => {
                store.selectedOffer = null;

                store.loadFlightExtras();

                expect(bookingService.fetchBookingExtras).not.toHaveBeenCalled();
            });

            it('when isExtraLuggageEnabled == false', () => {
                rootStore.layoutStore.isExtraLuggageEnabled = false;

                store.loadFlightExtras();

                expect(bookingService.fetchBookingExtras).not.toHaveBeenCalled();
            });

            it('when isCabinBagsEnabled == false', () => {
                rootStore.layoutStore.isCabinBagsEnabled = false;

                store.loadFlightExtras();

                expect(bookingService.fetchBookingExtras).not.toHaveBeenCalled();
            });

            it('when bookingExtras is NOT empty', () => {
                store.extraLuggage.bookingExtras = bookingExtrasMock;

                store.loadFlightExtras();

                expect(bookingService.fetchBookingExtras).not.toHaveBeenCalled();
            });

            it('when it is internal flight', () => {
                jest.spyOn(store, 'isFlightExternal', 'get').mockReturnValue(false);

                store.loadFlightExtras();

                expect(bookingService.fetchBookingExtras).not.toHaveBeenCalled();
            });
        });

        it('call fetchBookingExtras and store response to bookingExtras', async () => {
            store.selectedOffer = offer;
            bookingService.fetchBookingExtras = jest.fn().mockReturnValue(Promise.resolve(bookingExtrasMock));

            expect(store.extraLuggage.bookingExtras).toBeNull();

            await store.loadFlightExtras();

            expect(bookingService.fetchBookingExtras).toHaveBeenCalledWith({
                offer: store.selectedOffer,
                guests: rootStore.guestDetailsStore.guestsDetails,
            });

            expect(store.extraLuggage.setLuggagePricesAndTypes).toHaveBeenCalled();
            expect(store.extraLuggage.bookingExtras).toEqual(bookingExtrasMock);
        });

        it('should set bookingExtras to [] bookingExtras and isFlightExtrasFailed to true when request is failed', async () => {
            store.selectedOffer = offer;
            bookingService.fetchBookingExtras = jest.fn().mockReturnValue(Promise.reject());

            expect(store.extraLuggage.bookingExtras).toBeNull();
            expect(store.isFlightExtrasFailed).toBe(false);

            await store.loadFlightExtras();

            expect(bookingService.fetchBookingExtras).toHaveBeenCalledWith({
                offer: store.selectedOffer,
                guests: rootStore.guestDetailsStore.guestsDetails,
            });
            expect(store.extraLuggage.bookingExtras).toEqual([]);
            expect(store.isFlightExtrasFailed).toBe(true);
        });

        it('should set bookingExtras to an empty array when response body is empty', async () => {
            store.selectedOffer = offer;
            bookingService.fetchBookingExtras = jest.fn().mockReturnValue(Promise.resolve([]));

            expect(store.isFlightExtrasFailed).not.toBe(true);
            expect(store.extraLuggage.bookingExtras).not.toStrictEqual([]);

            await store.loadFlightExtras();

            expect(store.extraLuggage.bookingExtras).toStrictEqual([]);
        });

        it('should set extraLuggageCategoriesExist to false when result does NOT have any object with code listed in extraLuggageCategoryCodes', async () => {
            store.selectedOffer = offer;
            bookingService.fetchBookingExtras = jest.fn().mockReturnValue(Promise.resolve(bookingExtrasMock));
            rootStore.layoutStore.extraLuggageCategoryCodes = ['NOT', 'ING'];

            await store.loadFlightExtras();

            expect(store.extraLuggageCategoriesExist).toBe(false);
            expect(store.cabinBagsCategoriesExist).toBe(true);
        });

        it('should set cabinBagsCategoriesExist to false when result does NOT have any object with code listed in largeCabinBagsCategoryCode', async () => {
            store.selectedOffer = offer;
            bookingService.fetchBookingExtras = jest.fn().mockReturnValue(Promise.resolve(bookingExtrasMock));
            rootStore.layoutStore.largeCabinBagsCategoryCode = ['NOT', 'ING'];

            await store.loadFlightExtras();

            expect(store.cabinBagsCategoriesExist).toBe(false);
            expect(store.extraLuggageCategoriesExist).toBe(true);
        });
    });

    describe('isExternalHotel', () => {
        it('should return false when no selected offer', () => {
            expect(store.isExternalHotel).toBe(false);
        });

        it('should return false when selected hotel is NOT external', () => {
            store.selectedOffer = { accom: { isExt: false } } as any;
            expect(store.isExternalHotel).toBe(false);
        });

        it('should return true when selected hotel is external', () => {
            store.selectedOffer = { accom: { isExt: true } } as any;
            expect(store.isExternalHotel).toBe(true);
        });
    });

    describe('isFlightExternal', () => {
        beforeEach(() => {
            rootStore.layoutStore.isExtrasPage = true;
            store.selectedOffer = offer;
        });

        it('should return true when selectedOffer flight is external', () => {
            store.selectedOffer!.transport.routes[0].isExt = true;
            store.booking = { package: { transport: { routes: [{ isExt: false }] } } } as IBookingInfo;

            expect(store.isFlightExternal).toBe(true);
        });

        it('should return true when booking.package flight is external', () => {
            store.selectedOffer!.transport.routes[0].isExt = false;
            store.booking = { package: { transport: { routes: [{ isExt: true }] } } } as IBookingInfo;

            expect(store.isFlightExternal).toBe(true);
        });

        it('should return true when either selectedOffer or booking.package flight is external', () => {
            store.selectedOffer!.transport.routes[0].isExt = true;
            store.booking = { package: { transport: { routes: [{ isExt: true }] } } } as IBookingInfo;

            expect(store.isFlightExternal).toBe(true);
        });

        it('should return false when neither selectedOffer nor booking.package flight is external', () => {
            store.selectedOffer!.transport.routes[0].isExt = false;
            store.booking = { package: { transport: { routes: [{ isExt: false }] } } } as IBookingInfo;

            expect(store.isFlightExternal).toBe(false);
        });

        it('should return false when booking.package is undefined and selectedOffer flight is not external', () => {
            store.selectedOffer!.transport.routes[0].isExt = false;
            store.booking = undefined;

            expect(store.isFlightExternal).toBe(false);
        });

        it('should return true when booking.package is undefined and selectedOffer flight is external', () => {
            store.selectedOffer!.transport.routes[0].isExt = true;
            store.booking = undefined;

            expect(store.isFlightExternal).toBe(true);
        });
    });

    describe('setters', () => {
        [
            { property: 'showInvalidLuggageInUrlPopup', setter: 'setShowInvalidLuggageInUrlPopup' },
            { property: 'isTransferRemoveSE', setter: 'setIsTransferRemoveSE' },
            { property: 'isSERemoveTransfer', setter: 'setIsSERemoveTransfer' },
            { property: 'isTransferRemoveLargeSE', setter: 'setIsTransferRemoveLargeSE' },
            { property: 'isLargeSERemoveTransfer', setter: 'setIsLargeSERemoveTransfer' },
            { property: 'transferCandidate', setter: 'setTransferCandidate' },
            { property: 'prevTransfer', setter: 'setPrevTransfer' },
            { property: 'otherRoutesFromUrl', setter: 'setOtherRoutesValue' },
            { property: 'boardCodeError', setter: 'changeBoardCodeError' },
            { property: 'prevTransfer', setter: 'setPrevTransfer' },
        ].forEach(({ property, setter }) => {
            it(`${setter} should set ${property}`, () => {
                store[property] = false;

                store[setter](true);

                expect(store[property]).toBe(true);
            });
        });
    });

    describe('clearSEAccommodationFails', () => {
        it('should set all accommodation fail props to false', () => {
            store.isTransferRemoveSE = true;
            store.isSERemoveTransfer = true;
            store.isTransferRemoveLargeSE = true;
            store.isLargeSERemoveTransfer = true;

            store.clearSEAccommodationFails();

            expect(store.isTransferRemoveSE).toBe(false);
            expect(store.isSERemoveTransfer).toBe(false);
            expect(store.isTransferRemoveLargeSE).toBe(false);
            expect(store.isLargeSERemoveTransfer).toBe(false);
        });
    });

    describe('travelDate', () => {
        it('should return null when NO depDate in selectedOffer', () => {
            store.selectedOffer = { ...offer, transport: { routes: [] } };

            expect(store.travelDate).toEqual(null);
        });

        it('should return date without DST offset when depDate exists', () => {
            store.selectedOffer = { ...offer, transport: { routes: [{ depDate: '2024-07-22' } as IRoute] } };

            expect(store.travelDate).toEqual(new Date('2024-07-22T00:00:00.000Z'));
        });
    });

    describe('isEnoughTimeForAddSETransfer', () => {
        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(new Date(2024, 6, 19));
            rootStore.layoutStore.SEAccommodationNoticePeriod = 7;
        });

        it('should return true when NO offer selected', () => {
            store.selectedOffer = null;

            expect(store.isEnoughTimeForAddSETransfer).toEqual(true);
        });

        it('should return true when NO SEAccommodationNoticePeriod setting', () => {
            rootStore.layoutStore.SEAccommodationNoticePeriod = undefined;

            expect(store.isEnoughTimeForAddSETransfer).toEqual(true);
        });

        it('should return true when NO depDate', () => {
            store.selectedOffer = { ...offer, transport: { routes: [] } };

            expect(store.isEnoughTimeForAddSETransfer).toEqual(true);
        });

        it('should return false when number of days before departure is less than SEAccommodationNoticePeriod', () => {
            store.selectedOffer = { ...offer, transport: { routes: [{ depDate: '2024-07-22' } as IRoute] } };

            expect(store.isEnoughTimeForAddSETransfer).toEqual(false);
        });

        it('should return true when number of days before departure is more than SEAccommodationNoticePeriod', () => {
            store.selectedOffer = { ...offer, transport: { routes: [{ depDate: '2024-09-01' } as IRoute] } };

            expect(store.isEnoughTimeForAddSETransfer).toEqual(true);
        });

        it('should return true when number of days before departure is equal to SEAccommodationNoticePeriod', () => {
            store.selectedOffer = { ...offer, transport: { routes: [{ depDate: '2024-07-26' } as IRoute] } };

            expect(store.isEnoughTimeForAddSETransfer).toEqual(true);
        });
    });

    describe('grabSearchValuesFromSearchStoreWithoutDestination', () => {
        it('should update search values', () => {
            const newFrom = new Date('2023-01-01');
            const newTo = new Date('2023-02-02');
            const room = new RoomAllocation();

            room.addAdult();
            room.addAdult();
            room.addChild(7);
            room.addInfant();
            room.setRoomCode('RM1');

            store.from = new Date('2022-01-01');
            rootStore.searchStore.searchWhen.from = newFrom;
            store.to = new Date('2022-02-02');
            rootStore.searchStore.searchWhen.to = newTo;
            store.flexDays = 0;
            rootStore.searchStore.searchWhen.flexDays = 3;
            store.origins = [];
            rootStore.searchStore.searchFrom.origins = ['TEST'];
            store.isAutoAllocation = false;
            rootStore.searchStore.searchWho.isAutoAllocation = true;
            store.roomsAllocation = [];
            rootStore.searchStore.searchWho.roomsAllocation = [room];

            store.grabSearchValuesFromSearchStoreWithoutDestination();
            expect(store.from).toBe(rootStore.searchStore.searchWhen.from);
            expect(store.to).toBe(rootStore.searchStore.searchWhen.to);
            expect(store.flexDays).toBe(rootStore.searchStore.searchWhen.flexDays);
            expect(store.origins).toStrictEqual(rootStore.searchStore.searchFrom.origins);
            expect(store.isAutoAllocation).toBe(rootStore.searchStore.searchWho.isAutoAllocation);
            expect(store.roomsAllocation).toHaveLength(1);
            expect(store.roomsAllocation[0]).not.toBe(room);
            expect(store.roomsAllocation[0].adults).toHaveLength(2);
            expect(store.roomsAllocation[0].children).toHaveLength(1);
            expect(store.roomsAllocation[0].children[0].age).toBe(7);
            expect(store.roomsAllocation[0].infants).toHaveLength(1);
            expect(store.roomsAllocation[0].roomCode).toBe('RM1');
        });

        it('should set an empty array when origins value is undefined', () => {
            store.origins = ['ES'];
            store.rootStore.searchStore.searchFrom.origins = undefined;

            store.grabSearchValuesFromSearchStoreWithoutDestination();

            expect(store.origins).toStrictEqual([]);
        });
    });

    describe('clearResortInfo', () => {
        it('should set resort info to the null', () => {
            store.resortInfo = { resortDescription: 'resortDescription', resortImageUrl: 'resortImageUrl' };

            store.clearResortInfo();

            expect(store.resortInfo).toBe(null);
        });
    });

    describe('loadResortInfo', () => {
        it('should call load resort info from booking service', async () => {
            jest.spyOn(store, 'accommodationId', 'get').mockReturnValue('accommodationId');

            await store.loadResortInfo();

            expect(mockLoadResortInfo).toHaveBeenCalledWith('accommodationId');
        });

        it('should call load resort info from booking service on hotel details page', async () => {
            rootStore.layoutStore.isHotelDetailsBrowsePage = true;
            rootStore.layoutStore.accommodationOrDestinationCode = 'accommodationOrDestinationCode';
            jest.spyOn(store, 'accommodationId', 'get').mockReturnValue('accommodationId');

            await store.loadResortInfo();

            expect(mockLoadResortInfo).toHaveBeenCalledWith('accommodationOrDestinationCode');
        });
    });

    describe('loadHotelHighlightsInfo', () => {
        it('should call load hotel highlights info from booking service', async () => {
            jest.spyOn(store, 'accommodationId', 'get').mockReturnValue('accommodationId');

            await store.loadHotelHighlightsInfo();

            expect(mockLoadHotelHighlightsInfo).toHaveBeenCalledWith('accommodationId');
        });

        it('should log errors when loading hotel highlights info fails', async () => {
            jest.spyOn(store, 'accommodationId', 'get').mockReturnValue('accommodationId');
            (bookingService.loadHotelHighlightsInfo as jest.MockedFn<any>).mockRejectedValue(new Error('test'));

            await store.loadHotelHighlightsInfo();

            expect(logger.info).toHaveBeenCalled();
        });

        it('should not call load hotel highlights info when no id', async () => {
            jest.spyOn(store, 'accommodationId', 'get').mockReturnValue('');

            await store.loadHotelHighlightsInfo();

            expect(mockLoadHotelHighlightsInfo).not.toHaveBeenCalled();
        });
    });

    it('should clearHotelHighlightsInfo', () => {
        store.hotelHighlightsInfo = [];

        store.clearHotelHighlightsInfo();

        expect(store.hotelHighlightsInfo).toBe(null);
    });

    describe('isTransferNotAccommodateSE', () => {
        beforeEach(() => {
            offer.transfers[0].type = TransferType.Shared;
            store.selectedOffer = offer;
        });

        it('should return true when Shared transfer has no smallSeSurcharge and largeSeSurcharge and SE exists', () => {
            jest.spyOn(store.extraLuggage, 'sportEquipmentNumber', 'get').mockReturnValue(5);
            store.selectedOffer!.transfers[0].smallSeSurcharge = undefined;
            store.selectedOffer!.transfers[0].largeSeSurcharge = undefined;

            expect(store.isTransferNotAccommodateSE).toBe(true);
        });

        it('should return false for transfers other than Shared', () => {
            store.selectedOffer!.transfers[0].type = TransferType.Private;
            store.selectedOffer!.transfers[0].smallSeSurcharge = undefined;
            store.selectedOffer!.transfers[0].largeSeSurcharge = undefined;
            jest.spyOn(store.extraLuggage, 'sportEquipmentNumber', 'get').mockReturnValue(5);

            expect(store.isTransferNotAccommodateSE).toBe(false);
        });

        describe('should return false for transfers with ', () => {
            it('small sport equipment surcharge', () => {
                store.selectedOffer!.transfers[0].type = TransferType.Shared;
                store.selectedOffer!.transfers[0].smallSeSurcharge = 20;
                store.selectedOffer!.transfers[0].largeSeSurcharge = undefined;
                jest.spyOn(store.extraLuggage, 'sportEquipmentNumber', 'get').mockReturnValue(5);

                expect(store.isTransferNotAccommodateSE).toBe(false);
            });

            it('large sport equipment surcharge', () => {
                store.selectedOffer!.transfers[0].type = TransferType.Shared;
                store.selectedOffer!.transfers[0].smallSeSurcharge = undefined;
                store.selectedOffer!.transfers[0].largeSeSurcharge = 50;
                jest.spyOn(store.extraLuggage, 'sportEquipmentNumber', 'get').mockReturnValue(5);

                expect(store.isTransferNotAccommodateSE).toBe(false);
            });
        });

        it('should return false when no SE', () => {
            store.selectedOffer!.transfers[0].type = TransferType.Shared;
            store.selectedOffer!.transfers[0].smallSeSurcharge = 20;
            store.selectedOffer!.transfers[0].largeSeSurcharge = 50;
            jest.spyOn(store.extraLuggage, 'sportEquipmentNumber', 'get').mockReturnValue(0);

            expect(store.isTransferNotAccommodateSE).toBe(false);
        });
    });

    describe('isTransferNotAccommodateLargeSE', () => {
        beforeEach(() => {
            store.selectedOffer = offer;
            offer.transfers[0].type = TransferType.Shared;
            jest.spyOn(store.extraLuggage, 'largeSportEquipmentNumber', 'get').mockReturnValue(5);
        });

        it('should return false when Shared transfer has NO smallSeSurcharge AND largeSeSurcharge AND large SE exists', () => {
            store.selectedOffer!.transfers[0].smallSeSurcharge = undefined;
            store.selectedOffer!.transfers[0].largeSeSurcharge = undefined;

            expect(store.isTransferNotAccommodateLargeSE).toBe(false);
        });

        it('should return false for transfers other than Shared', () => {
            store.selectedOffer!.transfers[0].type = TransferType.Private;
            store.selectedOffer!.transfers[0].smallSeSurcharge = undefined;
            store.selectedOffer!.transfers[0].largeSeSurcharge = undefined;

            expect(store.isTransferNotAccommodateLargeSE).toBe(false);
        });

        it('should return true for transfers with small SE surcharge but without large', () => {
            store.selectedOffer!.transfers[0].type = TransferType.Shared;
            store.selectedOffer!.transfers[0].smallSeSurcharge = 20;
            store.selectedOffer!.transfers[0].largeSeSurcharge = undefined;

            expect(store.isTransferNotAccommodateLargeSE).toBe(true);
        });

        it('should return false for transfers with large sport equipment surcharge', () => {
            store.selectedOffer!.transfers[0].type = TransferType.Shared;
            store.selectedOffer!.transfers[0].smallSeSurcharge = undefined;
            store.selectedOffer!.transfers[0].largeSeSurcharge = 50;

            expect(store.isTransferNotAccommodateLargeSE).toBe(false);
        });

        it('should return false when NO large SE', () => {
            store.selectedOffer!.transfers[0].type = TransferType.Shared;
            store.selectedOffer!.transfers[0].smallSeSurcharge = 20;
            store.selectedOffer!.transfers[0].largeSeSurcharge = 50;
            jest.spyOn(store.extraLuggage, 'largeSportEquipmentNumber', 'get').mockReturnValue(0);

            expect(store.isTransferNotAccommodateLargeSE).toBe(false);
        });
    });

    describe('clearSearchPriceFromUrl', () => {
        it('should clear searchPrice from URL when on HotelDetailsBook page and searchPrice is present', async () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;
            rootStore.routerStore.state = { searchPrice: '500' };

            await store['clearSearchPriceFromUrl']();

            expect(rootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith(
                rootStore.queryParamsStore.buildHotelDetailsQuery(),
            );
        });

        it('should not clear searchPrice from URL when searchPrice is not present', async () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;
            rootStore.routerStore.state = {};

            await store['clearSearchPriceFromUrl']();

            expect(rootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
        });

        it('should not clear searchPrice from URL on non-HotelDetailsBook pages', async () => {
            rootStore.layoutStore.isExtrasPage = true;
            rootStore.routerStore.state = { searchPrice: '500' };

            await store['clearSearchPriceFromUrl']();

            expect(rootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
        });
    });

    describe('checkSEAndTransferCorrespondence', () => {
        beforeEach(() => {
            store.setIsTransferNotAccommodatingSE = jest.fn();
            jest.spyOn(store, 'transfer', 'get').mockReturnValue(mockAltSharedTransfer);
            jest.spyOn(store, 'isEnoughTimeForAddSETransfer', 'get').mockReturnValue(true);
            jest.spyOn(store.extraLuggage, 'sportEquipmentNumber', 'get').mockReturnValue(7);
        });

        it('should skip when transfer does NOT selected', () => {
            jest.spyOn(store, 'transfer', 'get').mockReturnValueOnce(null);

            store.checkSEAndTransferCorrespondence();

            expect(store.setIsTransferNotAccommodatingSE).not.toHaveBeenCalled();
        });

        it('should skip when sport equipment NOT added', () => {
            jest.spyOn(store.extraLuggage, 'sportEquipmentNumber', 'get').mockReturnValueOnce(0);

            store.checkSEAndTransferCorrespondence();

            expect(store.setIsTransferNotAccommodatingSE).not.toHaveBeenCalled();
        });

        it('should skip when NoTransfer transfer selected', () => {
            jest.spyOn(store, 'transfer', 'get').mockReturnValue(mockAltNoTransfer);
            jest.spyOn(store, 'isEnoughTimeForAddSETransfer', 'get').mockReturnValue(false);

            store.checkSEAndTransferCorrespondence();

            expect(store.setIsTransferNotAccommodatingSE).not.toHaveBeenCalled();
        });

        describe('Private transfer', () => {
            beforeEach(() => {
                jest.spyOn(store, 'transfer', 'get').mockReturnValue(mockAltPrivateTransfer);
            });

            it('should NOT call setIsTransferNotAccommodatingSE when isEnoughTimeForAddSETransfer is true', () => {
                store.checkSEAndTransferCorrespondence();

                expect(store.setIsTransferNotAccommodatingSE).not.toHaveBeenCalled();
            });

            it('should call setIsTransferNotAccommodatingSE when isEnoughTimeForAddSETransfer is false', () => {
                jest.spyOn(store, 'isEnoughTimeForAddSETransfer', 'get').mockReturnValue(false);

                store.checkSEAndTransferCorrespondence();

                expect(store.setIsTransferNotAccommodatingSE).toHaveBeenCalledWith(true);
            });
        });

        describe('Shared transfer', () => {
            it('should call setIsTransferNotAccommodatingSE when NO surcharges in transfer', () => {
                store.checkSEAndTransferCorrespondence();

                expect(store.setIsTransferNotAccommodatingSE).toHaveBeenCalledWith(true);
            });

            it('should call setIsTransferNotAccommodatingSE when isEnoughTimeForAddSETransfer is false', () => {
                jest.spyOn(store, 'isEnoughTimeForAddSETransfer', 'get').mockReturnValue(false);
                jest.spyOn(store, 'transfer', 'get').mockReturnValueOnce({
                    ...mockAltSharedTransfer,
                    smallSeSurcharge: 33,
                });

                store.checkSEAndTransferCorrespondence();

                expect(store.setIsTransferNotAccommodatingSE).toHaveBeenCalledWith(true);
            });

            it('should NOT call setIsTransferNotAccommodatingSE when NO largeSeSurcharge AND NO large sport equipment added', () => {
                jest.spyOn(store, 'transfer', 'get').mockReturnValueOnce({
                    ...mockAltSharedTransfer,
                    smallSeSurcharge: 33,
                });

                store.checkSEAndTransferCorrespondence();

                expect(store.setIsTransferNotAccommodatingSE).not.toHaveBeenCalled();
            });

            it('should call setIsTransferNotAccommodatingSE when NO largeSeSurcharge AND large sport equipment added', () => {
                jest.spyOn(store.extraLuggage, 'largeSportEquipmentNumber', 'get').mockReturnValue(3);
                jest.spyOn(store, 'transfer', 'get').mockReturnValueOnce({
                    ...mockAltSharedTransfer,
                    smallSeSurcharge: 33,
                });

                store.checkSEAndTransferCorrespondence();

                expect(store.setIsTransferNotAccommodatingSE).toHaveBeenCalledWith(true);
            });

            it('should NOT call setIsTransferNotAccommodatingSE when both surcharges exists AND large sport equipment added', () => {
                jest.spyOn(store.extraLuggage, 'largeSportEquipmentNumber', 'get').mockReturnValue(3);
                jest.spyOn(store, 'transfer', 'get').mockReturnValueOnce({
                    ...mockAltSharedTransfer,
                    smallSeSurcharge: 33,
                    largeSeSurcharge: 66,
                });

                store.checkSEAndTransferCorrespondence();

                expect(store.setIsTransferNotAccommodatingSE).not.toHaveBeenCalled();
            });
        });
    });

    describe('isAllSearchParametersSelected', () => {
        beforeEach(() => {
            store.origins = ['London', 'Paris'];
            store.selectedDestinationCodes = ['BRA'];
            store.from = new Date('2025-01-01');
            store.to = new Date('2025-01-11');
        });

        it('should return true on promo page', () => {
            rootStore.layoutStore.isPromoPage = true;

            expect(store.isAllSearchParametersSelected).toBe(true);
        });

        it('should return true when all props provided', () => {
            expect(store.isAllSearchParametersSelected).toBe(true);
        });

        it('should return false when origins length 0', () => {
            store.origins = [];

            expect(store.isAllSearchParametersSelected).toBe(false);
        });

        it('should return false when selectedDestinationCodes undefined', () => {
            store.selectedDestinationCodes = undefined as any;

            expect(store.isAllSearchParametersSelected).toBe(false);
        });

        it('should return false when from is null', () => {
            store.from = null;

            expect(store.isAllSearchParametersSelected).toBe(false);
        });

        it('should return false when to is null', () => {
            store.to = null;

            expect(store.isAllSearchParametersSelected).toBe(false);
        });
    });

    describe('guest quantity', () => {
        beforeEach(() => {
            store.roomsAllocation = rootStore.searchStore.searchWho.roomsAllocation;
        });

        it('adultsQuantity should return number of adults', () => {
            expect(store.adultsQuantity).toEqual(2);
        });

        it('childrenQuantity should return number of children', () => {
            expect(store.childrenQuantity).toEqual(1);
        });

        it('infantsQuantity should return number of infants', () => {
            expect(store.infantsQuantity).toEqual(1);
        });

        it('totalGuestsQuantity should return total number of guest', () => {
            jest.spyOn(store, 'adultsQuantity', 'get').mockReturnValue(1);
            jest.spyOn(store, 'childrenQuantity', 'get').mockReturnValue(2);
            jest.spyOn(store, 'infantsQuantity', 'get').mockReturnValue(3);

            expect(store.totalGuestsQuantity).toEqual(6);
        });
    });

    describe('currentSavedPrice', () => {
        const totalPrice = 2000;
        const totalPriceForExtras = 2500;

        beforeEach(() => {
            jest.spyOn(store, 'totalPrice', 'get').mockReturnValue(totalPrice);
            jest.spyOn(store, 'totalPriceForExtras', 'get').mockReturnValue(totalPrice);
        });

        it("should return totalPrice when it's equal totalPriceForExtras", () => {
            expect(store.currentSavedPrice).toEqual(totalPrice);
        });

        it('should return zero when offer not defined', () => {
            jest.spyOn(store, 'totalPrice', 'get').mockReturnValue(0);
            jest.spyOn(store, 'totalPriceForExtras', 'get').mockReturnValue(0);

            expect(store.currentSavedPrice).toEqual(0);
        });

        it("should return totalPriceForExtras when totalPrice doesn't equal totalPriceForExtras", () => {
            jest.spyOn(store, 'totalPriceForExtras', 'get').mockReturnValue(totalPriceForExtras);

            expect(store.currentSavedPrice).toEqual(totalPriceForExtras);
        });

        describe('on Payment or Confirm Page', () => {
            beforeEach(() => {
                rootStore.layoutStore.isCommitBookingPage = true;
            });

            it('should return totalPrice', () => {
                expect(store.currentSavedPrice).toEqual(totalPrice);
            });

            it('should return price from transaction when offer price is 0', () => {
                jest.spyOn(store, 'totalPrice', 'get').mockReturnValue(0);

                const currentPrice = store.currentSavedPrice;

                expect(paymentTransaction.getTransaction).toHaveBeenCalled();
                expect(currentPrice).toEqual(transactionPrice);
            });
        });
    });

    describe('whoValueOnlyGuests', () => {
        it('should return empty string when quantity NOT provided', () => {
            jest.spyOn(store, 'adultsQuantity', 'get').mockReturnValue(1);
            jest.spyOn(store, 'childrenQuantity', 'get').mockReturnValue(2);
            jest.spyOn(store, 'infantsQuantity', 'get').mockReturnValue(3);

            expect(store.whoValueOnlyGuests).toEqual(
                '1 Globals.Labels.Adult, 2 Globals.Labels.Children, 3 Globals.Labels.Infants',
            );
        });
    });

    it('lastActualSearchParams should return last params', () => {
        const { searchWhen, searchFrom, searchTo, searchWho } = rootStore.searchStore;

        store.from = searchWhen.from;
        store.to = searchWhen.to;
        store.flexDays = searchWhen.flexDays;
        store.origins = searchFrom.origins;
        store.selectedDestinationCodesQuery = searchTo.selectedDestinationCodesQuery;
        store.roomsAllocation = searchWho.roomsAllocation;
        store.selectedDestinationCodes = searchTo.selectedDestinationCodes;
        store.isAutoAllocation = searchWho.isAutoAllocation;

        expect(store.lastActualSearchParams).toEqual({
            from: searchWhen.from,
            to: searchWhen.to,
            flexDays: searchWhen.flexDays,
            origins: searchFrom.origins,
            selectedDestinationCodesQuery: searchTo.selectedDestinationCodesQuery,
            roomsAllocation: searchWho.roomsAllocation,
            selectedDestinationCodes: searchTo.selectedDestinationCodes,
            isAutoAllocation: searchWho.isAutoAllocation,
        });
    });

    describe('commitBookingRequestBodyBase', () => {
        it('should include extraLuggageInfo in the body', async () => {
            rootStore.queryParamsStore.specialRequests = [];
            store.extraLuggage.extraLuggageInfo = extraLuggageInfoMock;

            const body = store.commitBookingRequestBodyBase;

            expect(body.extraLuggageInfo).toBeDefined();
            expect(body.extraLuggageInfo).toEqual(extraLuggageInfoMock);
        });

        it('should include extra title field for board and room types', () => {
            const expectedUnits = {
                boardType: { code: 'test', title: 'title' },
                roomType: { code: 'test', title: 'title' },
            };
            const offer = {
                accom: {
                    unit: [expectedUnits],
                },
                hotel: { name: 'test' },
            } as any;

            store.selectedOffer = offer;
            rootStore.queryParamsStore.specialRequests = [];

            const body = store.commitBookingRequestBodyBase;

            expect(body.offer.accom.unit[0]).toBeDefined();
            expect(body.offer.accom.unit[0].boardType).toEqual(expectedUnits.boardType);
            expect(body.offer.accom.unit[0].roomType).toEqual(expectedUnits.roomType);
            expect(body.offer.accom.hotelName).toEqual('test');
        });
    });

    describe('commitBookingGuestsInfo', () => {
        it('should return booking guest info', () => {
            const { guests, leadPassenger, promoCode } = store.commitBookingGuestsInfo;

            expect(guests).toEqual([{ dateOfBirth: '', type: GuestType.Adult }]);
            expect(leadPassenger).toEqual({
                ...leadPassengerMock,
                dateOfBirth: '',
                phone: '34567890',
                townCity: '',
            });
            expect(promoCode).toBeUndefined();
        });

        it('should return empty object for lead passenger when it is NOT exist', () => {
            rootStore.guestDetailsStore.leadPassenger = null;

            expect(store.commitBookingGuestsInfo.leadPassenger).toEqual({});
        });

        it('should set promoCode prop when it is exists', () => {
            store.promoCode = { value: 'promoCode' } as any;

            expect(store.commitBookingGuestsInfo.promoCode).toBe('promoCode');
        });
    });

    describe('commitBookingOfferInfo', () => {
        beforeEach(() => {
            store.defaultTransferFromUrl = 'defaultTransferFromUrl';
        });

        it('should return commit booking offer info', () => {
            store.selectedOffer = mockedOffer;

            expect(store.commitBookingOfferInfo.offer).toEqual({
                ...mockedOffer,
                defaultTransferCode: 'defaultTransferFromUrl',
                hotel: {
                    hotelType: mockedOffer?.hotel?.hotelType,
                },
                accom: {
                    ...mockedOffer.accom,
                    hotelName: 'Hotel Example',
                },
            });
        });

        it('should ignore hotelName when NO unit in accom', () => {
            store.selectedOffer = { ...mockedOffer, accom: { unit: null } } as any;

            expect(store.commitBookingOfferInfo.offer.accom).toEqual({ unit: null });
        });
    });

    describe('validateBookingRequestBody', () => {
        it('should return validate booking request body with extra luggage provided', () => {
            store.extraLuggage.extraLuggageInfo = extraLuggageInfoMock;

            const body = store.validateBookingBaseRequestBody;

            expect(body.extraLuggageInfo).toEqual(extraLuggageInfoMock);
        });

        it('should include hotel with all required fields in validate booking request body', () => {
            store.selectedOffer = {
                ...mockedOffer,
                hotel: mockHotel,
            };

            const body = store.validateBookingBaseRequestBody;

            expect(body.offer.hotel).toEqual({
                country: mockHotel.country,
                giataCode: mockHotel.giataCode,
                hotelType: mockHotel.hotelType,
                location: mockHotel.location,
                name: mockHotel.name,
                resort: mockHotel.resort,
            });
        });
    });

    it('clearSearchParams', () => {
        store.from = new Date();
        store.to = new Date();
        store.flexDays = 3;
        store.origins = ['ES'];
        store.selectedDestinationCodes = ['ES'];
        store.isAutoAllocation = true;
        store.roomsAllocation = [{} as any];
        store.selectedDestinationCodesQuery = 'ES';
        store.destinationsDisplayValue = { main: 'test' };

        store.clearSearchParams();

        expect(store.from).toBeNull();
        expect(store.to).toBeNull();
        expect(store.flexDays).toBeFalsy();
        expect(store.origins).toEqual([]);
        expect(store.selectedDestinationCodes).toEqual([]);
        expect(store.isAutoAllocation).toBeFalsy();
        expect(store.roomsAllocation).toEqual([]);
        expect(store.selectedDestinationCodesQuery).toEqual('');
        expect(store.destinationsDisplayValue).toEqual({ main: '' });
    });

    describe('updateRoomsAllocationFromSearchStore', () => {
        beforeEach(() => {
            store.roomsAllocation = [{ adults: [] } as any];
        });

        it('should skip when isGuestsParametersValid is false', () => {
            store.updateRoomsAllocationFromSearchStore();

            expect(store.roomsAllocation).toEqual([{ adults: [] }]);
        });

        it('should update RoomsAllocation From SearchStore when isGuestsParametersValid is true', () => {
            const room = new RoomAllocation();

            room.addAdult();
            room.addChild(5);
            room.addInfant();
            room.setRoomCode('RM1');
            rootStore.searchStore.searchWho.isGuestsParametersValid = true;
            rootStore.searchStore.searchWho.roomsAllocation = [room];

            store.updateRoomsAllocationFromSearchStore();

            expect(store.roomsAllocation).toHaveLength(1);
            expect(store.roomsAllocation[0]).not.toBe(room);
            expect(store.roomsAllocation[0].adults).toHaveLength(1);
            expect(store.roomsAllocation[0].children).toHaveLength(1);
            expect(store.roomsAllocation[0].children[0].age).toBe(5);
            expect(store.roomsAllocation[0].infants).toHaveLength(1);
            expect(store.roomsAllocation[0].roomCode).toBe('RM1');
        });
    });

    describe('updateSearchDates', () => {
        it('should set dates from arguments', () => {
            const from = new Date(2020, 0, 1);
            const to = new Date(2020, 0, 7);

            store.updateSearchDates(from, to);

            expect(store.from).toEqual(from);
            expect(store.to).toEqual(to);
        });

        it('should set dates from queryParams store', () => {
            const from = new Date(2020, 0, 1);
            const to = new Date(2020, 0, 7);
            rootStore.queryParamsStore = {
                fromDateFromUrl: from,
                toDateFromUrl: to,
            };

            store.updateSearchDates();

            expect(store.from).toEqual(from);
            expect(store.to).toEqual(to);
        });

        it('should set null when no arguments and dates in queryParams store', () => {
            rootStore.queryParamsStore = {};
            store.from = new Date();
            store.to = new Date();

            store.updateSearchDates();

            expect(store.from).toBeNull();
            expect(store.to).toBeNull();
        });
    });

    describe('updateSearchOrigins', () => {
        it('should set origins from arguments', () => {
            store.updateSearchOrigins(['ES']);

            expect(store.origins).toEqual(['ES']);
        });

        it('should set origins from queryParamsStore', () => {
            rootStore.queryParamsStore = { originFromUrl: ['UK'] };

            store.updateSearchOrigins();

            expect(store.origins).toEqual(['UK']);
        });
    });

    describe('setDestinationsDisplayValue', () => {
        it('should set searchTo.destinationsDisplayValue as destinationsDisplayValue', () => {
            store.destinationsDisplayValue = { main: '' };
            store.rootStore.searchStore.searchTo.destinationsDisplayValue = { main: 'test' };

            store.setDestinationsDisplayValue();

            expect(store.destinationsDisplayValue).toStrictEqual(
                store.rootStore.searchStore.searchTo.destinationsDisplayValue,
            );
        });
    });

    describe('setSearchValuesByQueryString', () => {
        it('should set Search Values By Query String', () => {
            store.resetBookingStore = jest.fn();
            store.grabSearchValuesFromSearchStore = jest.fn();

            store.setSearchValuesByQueryString('QueryString');

            expect(store.resetBookingStore).toHaveBeenCalled();
            expect(rootStore.searchStore.clearAvailableCodesAndDates).toHaveBeenCalled();
            expect(rootStore.searchStore.clearSearchValues).toHaveBeenCalledWith(true);
            expect(rootStore.queryParamsStore.parseBrowserQuery).toHaveBeenCalledWith('QueryString');
            expect(rootStore.searchStore.getValuesFromQueryParamsStore).toHaveBeenCalledWith(true);
            expect(rootStore.searchFiltersStore.onClearAllSelectedFilters).toHaveBeenCalled();
            expect(rootStore.searchFiltersStore.getFiltersParamsFromQueryParamsStore).toHaveBeenCalled();
            expect(store.grabSearchValuesFromSearchStore).toHaveBeenCalled();
        });
    });

    describe('setOfferAndSearchValues', () => {
        it('should set new values', () => {
            store.flexDays = 3;
            store.selectedDestinationCodesQuery = 'ESP';
            store.isAutoAllocation = true;

            store.setOfferAndSearchValues(offer as any);

            expect(store.selectedOffer).toEqual(offer);
            expect(store.from).toEqual(new Date('2020-09-02T00:00:00'));
            expect(store.to).toEqual(new Date('2020-09-09T00:00:00'));
            expect(store.flexDays).toBeFalsy();
            expect(store.origins).toEqual(['LGW']);
            expect(store.alternativeBoards).toEqual([{}]);
            expect(store.selectedDestinationCodes).toEqual(['X9431179']);
            expect(store.selectedDestinationCodesQuery).toEqual('');
            expect(store.isAutoAllocation).toBeFalsy();
            expect(store.roomsAllocation).not.toEqual(rootStore.searchStore.searchWho.roomsAllocation);
            expect(store.defaultTransferFromUrl).toEqual(offer.transfers[0].code);
            expect(store.selectedTransferFromUrl).toEqual(offer.transfers[0].code);

            expect(rootStore.searchStore.clearSearchValues).toHaveBeenCalled();
            expect(rootStore.searchStore.searchTo.setSelectedAccommodationCodes).toHaveBeenCalledWith('X9431179');
        });
    });

    describe('parsePromocode', () => {
        it('should do nothing when promocode already exists', () => {
            store.promoCode = { value: 'promo' } as any;

            store.parsePromocode();

            expect(store.promoCode.value).toBe('promo');
        });

        it('should set promo code from payload when it is exist', () => {
            jest.spyOn(store, 'promoCodeFromPayload', 'get').mockReturnValue('promoCodeFromPayload');

            store.parsePromocode();

            expect(store.promoCode.value).toBe('promoCodeFromPayload');
        });
    });

    describe('onApplyPromoCode', () => {
        it('should not set promocode when code is empty', () => {
            store.validatePromoCode = jest.fn();
            store.onApplyPromoCode('');

            expect(store.promoCode.value).toEqual(undefined);
            expect(store.validatePromoCode).not.toHaveBeenCalled();
        });

        it('should set promocode and call validatePromoCode with callbacks that run success flow', async () => {
            const packageInfo = { requestId: 'test' } as IValidatePackageInfo;
            bookingService.validatePromoCode = jest.fn().mockResolvedValue({ data: packageInfo });
            bookingService.validatePackage = jest.fn().mockResolvedValue({ data: packageInfo });
            const successEvent = jest.fn();
            store.promoCode.setInLocalStorage = jest.fn();
            const onSuccess = (): void => {
                store.promoCode.setInLocalStorage(store.packageId, store.offerUnits);
                rootStore.trackingStore.applyPromoCodeTrigger(true);
                successEvent();
            };

            store.promoCode.value = 'PROMO1';
            await store.validatePromoCode(onSuccess, jest.fn());

            expect(store.promoCode.value).toBe('PROMO1');
            expect(bookingService.validatePromoCode).toHaveBeenCalledWith(store.validateBookingRequestBody);
            expect(bookingService.validatePackage).toHaveBeenCalledWith(store.validateBookingRequestBody);
            expect(store.promoCode.setInLocalStorage).toHaveBeenCalled();
            expect(rootStore.trackingStore.applyPromoCodeTrigger).toHaveBeenCalledWith(true);
            expect(successEvent).toHaveBeenCalled();
        });

        it('should call onErrorEvent and clear promo when validatePromoCode fails', async () => {
            const error = new Error('validate failed');
            bookingService.validatePromoCode = jest.fn().mockRejectedValue(error);
            const errorEvent = jest.fn();
            store.clearPromoCode = jest.fn();
            const onError = (e: unknown): void => {
                errorEvent(e);
                store.clearPromoCode();
                rootStore.trackingStore.applyPromoCodeTrigger(false);
            };

            store.promoCode.value = 'PROMO1';
            await store.validatePromoCode(jest.fn(), onError).catch(() => undefined);

            expect(errorEvent).toHaveBeenCalledWith(error);
            expect(store.clearPromoCode).toHaveBeenCalled();
            expect(rootStore.trackingStore.applyPromoCodeTrigger).toHaveBeenCalledWith(false);
        });

        it('should call onErrorEvent, clearPromoCode and applyPromoCodeTrigger(false) when onApplyPromoCode is used and validation fails', () => {
            const error = new Error('validate failed');
            const errorEvent = jest.fn();
            store.clearPromoCode = jest.fn();
            const validatePromoCodeSpy = jest
                .spyOn(store, 'validatePromoCode')
                .mockImplementation((_onSuccess, onError) => {
                    if (onError) {
                        onError(error);
                    }

                    return Promise.resolve();
                });

            store.onApplyPromoCode('PROMO1', jest.fn(), errorEvent);

            expect(validatePromoCodeSpy).toHaveBeenCalled();
            expect(errorEvent).toHaveBeenCalledWith(error);
            expect(store.clearPromoCode).toHaveBeenCalled();
            expect(rootStore.trackingStore.applyPromoCodeTrigger).toHaveBeenCalledWith(false);
        });
    });

    describe('validatePromoCode', () => {
        it('should call service with validateBookingRequestBody, set packageInfo from validatePackage and applyingPromoCode, then onSuccess', async () => {
            const promoCodeResponse = { requestId: 'promo-id', creditIsEnabled: false } as IValidatePackageInfo;
            const packageResponse = { requestId: 'package-id', creditIsEnabled: false } as IValidatePackageInfo;
            bookingService.validatePromoCode = jest.fn().mockResolvedValue({ data: promoCodeResponse });
            bookingService.validatePackage = jest.fn().mockResolvedValue({ data: packageResponse });
            store.applyingPromoCode = true;
            store.priceManipulating = true;
            const expectedTotalPrice = 999;
            jest.spyOn(store, 'totalPrice', 'get').mockReturnValue(expectedTotalPrice);
            const onSuccess = jest.fn();
            const onError = jest.fn();

            await store.validatePromoCode(onSuccess, onError);

            expect(bookingService.validatePromoCode).toHaveBeenCalledWith(store.validateBookingRequestBody);
            expect(bookingService.validatePackage).toHaveBeenCalledWith(store.validateBookingRequestBody);
            expect(store.packageInfo).toEqual(packageResponse);
            expect(store.applyingPromoCode).toBe(true);
            expect(store.previousPrice).toBe(expectedTotalPrice);
            expect(onSuccess).toHaveBeenCalled();
            expect(onError).not.toHaveBeenCalled();
            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(false);
        });

        it('should call onError when service rejects', async () => {
            const error = new Error('validate promo code failed');
            bookingService.validatePromoCode = jest.fn().mockRejectedValue(error);
            const onSuccess = jest.fn();
            const onError = jest.fn();

            await store.validatePromoCode(onSuccess, onError);

            expect(bookingService.validatePromoCode).toHaveBeenCalled();
            expect(onError).toHaveBeenCalledWith(error);
            expect(onSuccess).not.toHaveBeenCalled();
            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(false);
        });

        it('should set isPackageValid and return without calling onSuccess when full maintenance', async () => {
            rootStore.layoutStore.isFullMaintenance = true;
            const packageInfo = { requestId: 'test' } as IValidatePackageInfo;
            bookingService.validatePromoCode = jest.fn().mockResolvedValue({ data: packageInfo });
            const onSuccess = jest.fn();
            const onError = jest.fn();

            await store.validatePromoCode(onSuccess, onError);

            expect(bookingService.validatePromoCode).toHaveBeenCalled();
            expect(store.isPackageValid).toBe(true);
            expect(onSuccess).not.toHaveBeenCalled();
            expect(onError).not.toHaveBeenCalled();
            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(false);
        });

        it('should call setLoading(true) and setLoading(false) when disableLoader is false', async () => {
            const packageInfo = { requestId: 'test' } as IValidatePackageInfo;
            bookingService.validatePromoCode = jest.fn().mockResolvedValue({ data: packageInfo });
            bookingService.validatePackage = jest.fn().mockResolvedValue({ data: packageInfo });

            await store.validatePromoCode(undefined, undefined, false);

            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(true);
            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(false);
        });

        it('should return without calling service when isPackageValidationInProgress is true then becomes false', async () => {
            bookingService.validatePromoCode = jest.fn().mockResolvedValue({ data: {} });
            bookingService.validatePackage = jest.fn().mockResolvedValue({ data: {} });
            let getterCallCount = 0;
            jest.spyOn(Object.getPrototypeOf(store), 'isPackageValidationInProgress', 'get').mockImplementation(() => {
                getterCallCount += 1;

                return getterCallCount === 1;
            });

            await store.validatePromoCode(jest.fn(), jest.fn());

            expect(bookingService.validatePromoCode).not.toHaveBeenCalled();
        });
    });

    describe('onErrorPromoCode', () => {
        it('should call promocode error callback', () => {
            store.promoCode.onPromocodeErrorCallback = jest.fn();
            const mockApiError = {} as ApiError;

            store.onErrorPromoCode(mockApiError);

            expect(store.promoCode.onPromocodeErrorCallback).toHaveBeenCalledWith(mockApiError);
        });
    });

    describe('onSelectRecommendedOffer', () => {
        const mockedQuery =
            'ibf=true&to=18-04-2024&from=15-04-2024&dst=ALL&sAccId=&geog=ALL&flex=0&org=LGW,LTN&aa=0&rooms=2&outId=E7a43180e40807fd3dd8485c8617acab3&inId=E7d1bd1feccff6a8ee35ba9f4a69dff6b&accId=CYLN0079&packId=2240062608/2/2296/3&boardType=BB&offerRooms=2/DB01&transfer=SUMM028037SS&dtransfer=SUMM028037SS&isExt=0&lateRoomCheckout=0&lug=&ss=&equip=&__ejhreco=ejh-reco-pdp-book-bottom|3|zEqP0kny';

        beforeEach(() => {
            store.setSearchValuesByQueryString = jest.fn();
        });

        it('should call setSearchValuesByQueryString with query when they are exists', () => {
            store.onSelectRecommendedOffer(
                mockedOffer,
                `/cyprus/larnaca/protaras/cavo-zoe-seaside-hotel?${mockedQuery}`,
            );

            expect(store.setSearchValuesByQueryString).toHaveBeenCalledWith(mockedQuery);
        });

        it('should call buildHotelDetailsQuery with additional params when query does NOT exists in URL', () => {
            store.onSelectRecommendedOffer(mockedOffer, `/cyprus/larnaca/protaras/cavo-zoe-seaside-hotel`);

            expect(rootStore.queryParamsStore.buildHotelDetailsQuery).toHaveBeenCalledWith(mockedOffer, {
                dst: 'US',
                dtransfer: mockTransfer.code,
                from: '10-12-2029',
                geog: 'US',
                org: ['LGW'],
                rooms: [
                    {
                        adults: 2,
                        children: 2,
                        childrenAges: [],
                        infants: 0,
                        roomCode: 'ROOM',
                    },
                ],
                ss: '',
                to: '17-12-2029',
                transfer: mockTransfer.code,
            });
        });
    });

    describe('getOfferParamsFromQueryParamsStore', () => {
        it('should set data from queryParams store', () => {
            rootStore.queryParamsStore = {
                accommodationIdFromUrl: 'accommodationIdFromUrl',
                outboundFlightIdFromUrl: 'outboundFlightIdFromUrl',
                inboundFlightIdFromUrl: 'inboundFlightIdFromUrl',
                packageIdFromUrl: 'packageIdFromUrl',
                boardTypeFromUrl: 'boardTypeFromUrl',
                selectedTransferFromUrl: 'selectedTransferFromUrl',
                defaultTransferFromUrl: 'defaultTransferFromUrl',
                isExtFromUrl: 'isExtFromUrl',
            };

            store.getOfferParamsFromQueryParamsStore();

            expect(store.accommodationIdFromUrl).toEqual('accommodationIdFromUrl');
            expect(store.outboundFlightIdFromUrl).toEqual('outboundFlightIdFromUrl');
            expect(store.inboundFlightIdFromUrl).toEqual('inboundFlightIdFromUrl');
            expect(store.packageIdFromUrl).toEqual('packageIdFromUrl');
            expect(store.boardTypeFromUrl).toEqual('boardTypeFromUrl');
            expect(store.selectedTransferFromUrl).toEqual('selectedTransferFromUrl');
            expect(store.defaultTransferFromUrl).toEqual('defaultTransferFromUrl');
            expect(store.isExtFromUrl).toEqual('isExtFromUrl');
        });
    });

    describe('isPriceChangeToleranceError', () => {
        it('should return false when errorCode does NOT match', () => {
            const error = { errorCode: ApiErrors.DenyPayment } as any;

            expect(store.isPriceChangeToleranceError(error)).toBe(false);
        });

        it('should return false when errorCode is CanNotCreateBooking but NO innerErrors', () => {
            const error = { errorCode: ApiErrors.CanNotCreateBooking } as any;

            expect(store.isPriceChangeToleranceError(error)).toBe(false);
        });

        it('should return false when errorCode is CommitBookingError but no priceChangeToleranceError in inner error', () => {
            const error = {
                errorCode: ApiErrors.CommitBookingError,
                innerErrors: [{ code: ApiErrors.EmailAlreadyExists }],
            } as any;

            expect(store.isPriceChangeToleranceError(error)).toBe(false);
        });

        it('should return true when errorCode is CommitBookingError AND priceChangeToleranceError exist in inner error', () => {
            const error = { errorCode: ApiErrors.CommitBookingError, innerErrors: [{ code: 'E1369' }] } as any;

            expect(store.isPriceChangeToleranceError(error)).toBe(true);
        });
    });

    describe('alterativeFlightsDate', () => {
        it('should return null when NO alternativeFlights', () => {
            expect(store.alterativeFlightsDate).toBe(null);
        });

        it('should return date of first alternative flight', () => {
            store.alternativeFlights = [mockedOffer];

            expect(store.alterativeFlightsDate).toBe('2029-12-10T00:00:00');
        });
    });

    describe('isChildrenAgeValid', () => {
        it('should return true when all rooms have valid children ages', () => {
            store.roomsAllocation = [
                { children: [{ age: 5 }, { age: 10 }] },
                { children: [{ age: 3 }] },
            ] as unknown as RoomAllocation[];

            expect(store.isChildrenAgeValid).toBe(true);
        });

        it('should return false when at least one room has invalid children ages', () => {
            store.roomsAllocation = [
                { children: [{ age: 5 }, { age: 10 }] },
                { children: [{ age: -1 }] },
            ] as unknown as RoomAllocation[];

            expect(store.isChildrenAgeValid).toBe(false);
        });
    });

    describe('isTotalGuestQuantityValid', () => {
        beforeEach(() => {
            store.roomsAllocation = rootStore.searchStore.searchWho.roomsAllocation;
        });

        it('should return true when guests quantity less than maxNumberOfGuests', () => {
            rootStore.searchStore.searchWho.maxNumberOfGuests = 12;

            expect(store.isTotalGuestQuantityValid).toBe(true);
        });

        it('should return false when guests quantity more than maxNumberOfGuests', () => {
            rootStore.searchStore.searchWho.maxNumberOfGuests = 1;

            expect(store.isTotalGuestQuantityValid).toBe(false);
        });
    });

    describe('isGuestQuantityPerRoomValid', () => {
        beforeEach(() => {
            rootStore.searchStore.searchWho.maxNumberOfGuestsPerRoom = 9;
        });

        it('should return true when no room exceeds maxNumberOfGuestsPerRoom', () => {
            const room = new RoomAllocation();

            new Array(9).fill(0).forEach(() => room.addAdult());
            store.roomsAllocation = [room];

            expect((store as any).isGuestQuantityPerRoomValid).toBe(true);
        });

        it('should return false when any room exceeds maxNumberOfGuestsPerRoom', () => {
            const room = new RoomAllocation();

            new Array(10).fill(0).forEach(() => room.addAdult());
            store.roomsAllocation = [room];

            expect((store as any).isGuestQuantityPerRoomValid).toBe(false);
        });
    });

    describe('isGuestsParametersValid', () => {
        beforeEach(() => {
            jest.spyOn(store, 'isTotalGuestQuantityValid', 'get').mockReturnValue(true);
            jest.spyOn(store, 'isChildrenAgeValid', 'get').mockReturnValue(true);
            jest.spyOn(store as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(true);
        });

        it('should return true when all parameters are valid', () => {
            expect(store.isGuestsParametersValid).toBe(true);
        });

        it('should return false when isGuestQuantityPerRoomValid is false', () => {
            jest.spyOn(store as any, 'isGuestQuantityPerRoomValid', 'get').mockReturnValue(false);

            expect(store.isGuestsParametersValid).toBe(false);
        });

        it('should return false when isChildrenAgeValid is false', () => {
            jest.spyOn(store, 'isChildrenAgeValid', 'get').mockReturnValue(false);
            expect(store.isGuestsParametersValid).toBe(false);
        });

        it('should return false when isTotalGuestQuantityValid is false', () => {
            jest.spyOn(store, 'isTotalGuestQuantityValid', 'get').mockReturnValue(false);

            expect(store.isGuestsParametersValid).toBe(false);
        });
    });

    describe('currency', () => {
        it('should return undefined when paymentInfo AND selectedOffer currency NOT defined', () => {
            expect(store.currency).toBeUndefined();
        });

        it('should return true when isTotalGuestQuantityValid AND isChildrenAgeValid are true', () => {
            jest.spyOn(store, 'paymentInfo', 'get').mockReturnValue(paymentInfoMock as any);

            expect(store.currency).toBe(CurrencyCode.CHF);
        });

        it('should return true when isTotalGuestQuantityValid AND isChildrenAgeValid are true', () => {
            store.selectedOffer = {
                currency: {
                    code: CurrencyCode.EUR,
                },
            } as any;

            expect(store.currency).toBe(CurrencyCode.EUR);
        });
    });

    describe('merchandisedPromotion', () => {
        const createMockOfferPromotion = (overrides = {}) => ({
            cardDescription: 'Offer promotion',
            date: '01/01/2026 - 31/12/2026',
            tandCs: 'Terms apply',
            title: 'PROMO-CODE',
            ...overrides,
        });

        const createMockPackagePromotion = (overrides = {}) => ({
            title: 'PROMO-CODE',
            discountAmountPerBooking: 100,
            ...overrides,
        });

        const setupSelectedOfferWithPromotion = (promotion: any) => {
            store.selectedOffer = { promotion } as any;
        };

        const setupPackageInfoWithPromotion = (promotion: any, priceBreakdown?: any[]) => {
            store.packageInfo = {
                paymentInfo: paymentInfoMock,
                promotion,
                ...(priceBreakdown && { priceBreakdown }),
            } as any;
        };

        it('should return undefined when packageInfo is not defined', () => {
            expect(store.merchandisedPromotion).toBeUndefined();
        });

        it('should return undefined when packageInfo exists but promotion is not defined', () => {
            store.packageInfo = { paymentInfo: paymentInfoMock } as any;

            expect(store.merchandisedPromotion).toBeUndefined();
        });

        it('should return promotion from packageInfo when it exists', () => {
            const mockPromotion = {
                cardDescription: 'Save £50 off on your booking',
                discountAmountPerBooking: 50,
            };
            setupPackageInfoWithPromotion(mockPromotion);

            expect(store.merchandisedPromotion).toEqual(mockPromotion);
        });

        it('should return promotion from selectedOffer when packageInfo.promotion is undefined', () => {
            const mockOfferPromotion = createMockOfferPromotion();
            setupSelectedOfferWithPromotion(mockOfferPromotion);
            store.packageInfo = { paymentInfo: paymentInfoMock } as any;

            expect(store.merchandisedPromotion).toEqual(mockOfferPromotion);
        });

        it('should merge promotion data from both selectedOffer and packageInfo', () => {
            const mockOfferPromotion = createMockOfferPromotion();
            const mockPackagePromotion = createMockPackagePromotion({ minimumSpendValue: 500 });
            setupSelectedOfferWithPromotion(mockOfferPromotion);
            setupPackageInfoWithPromotion(mockPackagePromotion);

            const result = store.merchandisedPromotion;

            expect(result?.date).toBe('01/01/2026 - 31/12/2026');
            expect(result?.tandCs).toBe('Terms apply');
            expect(result?.cardDescription).toBe('Offer promotion');
            expect(result?.discountAmountPerBooking).toBe(100);
            expect(result?.minimumSpendValue).toBe(500);
        });

        it('should prioritize packageInfo.promotion values over selectedOffer.promotion when both have same fields', () => {
            const mockOfferPromotion = createMockOfferPromotion({
                title: 'OLD-CODE',
                discountAmountPerBooking: 50,
            });
            const mockPackagePromotion = createMockPackagePromotion({
                title: 'NEW-CODE',
            });
            setupSelectedOfferWithPromotion(mockOfferPromotion);
            setupPackageInfoWithPromotion(mockPackagePromotion);

            const result = store.merchandisedPromotion;

            expect(result?.title).toBe('NEW-CODE');
            expect(result?.discountAmountPerBooking).toBe(100);
        });

        it('should prioritize all discount fields from packageInfo.promotion for display calculations', () => {
            const mockOfferPromotion = createMockOfferPromotion({
                discountAmountPerBooking: 50,
                percentageDiscountPerBooking: 0.05,
                discountAmountPerPerson: 10,
                discountPercentagePerPerson: 0.02,
            });
            const mockPackagePromotion = createMockPackagePromotion({
                percentageDiscountPerBooking: 0.1,
                discountAmountPerPerson: 25,
                discountPercentagePerPerson: 0.05,
            });
            setupSelectedOfferWithPromotion(mockOfferPromotion);
            setupPackageInfoWithPromotion(mockPackagePromotion);

            const result = store.merchandisedPromotion;

            expect(result?.discountAmountPerBooking).toBe(100);
            expect(result?.percentageDiscountPerBooking).toBe(0.1);
            expect(result?.discountAmountPerPerson).toBe(25);
            expect(result?.discountPercentagePerPerson).toBe(0.05);
        });

        it('should extract discount from priceBreakdown when promo code is applied', () => {
            const mockOfferPromotion = createMockOfferPromotion({ title: 'EUBO' });
            const priceBreakdown = [{ code: 'Promotions', name: 'Promo Code', amount: -150, quantity: 1 }];

            store.promoCode = { value: 'EUBO' } as any;
            setupSelectedOfferWithPromotion(mockOfferPromotion);
            setupPackageInfoWithPromotion(undefined, priceBreakdown);

            const result = store.merchandisedPromotion;

            expect(result?.discountAmountPerBooking).toBe(150);
        });
    });

    describe('isLateRoomCheckoutAvailable', () => {
        beforeEach(() => {
            rootStore.layoutStore.timeForLateRoomCheckout = new Date('2020-09-19T17:10:00+00:00');
            store.selectedOffer = mockedOffer;
            store.lateRoomCheckout = {} as any;
        });

        it('should return false when timeForLateRoomCheckout is false', () => {
            rootStore.layoutStore.timeForLateRoomCheckout = false;

            expect(store.isLateRoomCheckoutAvailable).toBe(false);
        });

        it('should return false when selectedOffer is null', () => {
            store.selectedOffer = null;

            expect(store.isLateRoomCheckoutAvailable).toBe(false);
        });

        it('should return false when lateRoomCheckout is null', () => {
            store.lateRoomCheckout = null;

            expect(store.isLateRoomCheckoutAvailable).toBe(false);
        });

        it('should return true when timeForLateRoomCheckout earlier than returnFlight for 2 hours', () => {
            expect(store.isLateRoomCheckoutAvailable).toBe(true);
        });

        it('should return false when timeForLateRoomCheckout later than returnFlight for 2 hours', () => {
            rootStore.layoutStore.timeForLateRoomCheckout = new Date('2020-09-19T21:10:00+00:00');

            expect(store.isLateRoomCheckoutAvailable).toBe(false);
        });

        it('should return false when timeForLateRoomCheckout equal returnFlight', () => {
            rootStore.layoutStore.timeForLateRoomCheckout = new Date('2020-09-19T19:10:00+00:00');

            expect(store.isLateRoomCheckoutAvailable).toBe(false);
        });

        it('should return true when timeForLateRoomCheckout earlier than returnFlight for 10 minutes', () => {
            rootStore.layoutStore.timeForLateRoomCheckout = new Date('2020-09-19T19:00:00+00:00');

            expect(store.isLateRoomCheckoutAvailable).toBe(true);
        });
    });

    it('should clearRecommendedHotels', () => {
        store.recommendedHotels = [];

        store.clearRecommendedHotels();

        expect(store.recommendedHotels).toBe(null);
    });

    describe('updateOfferInfoBase', () => {
        const mockedAltAcc = [{ accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' }];
        let mockedOffer;
        let mockedOffers;

        beforeEach(() => {
            mockedOffer = {
                transfers: [mockTransfer],
                seatSelection: mockSeats,
                extraLuggageInfo: extraLuggageInfoMock,
            };
            mockedOffers = {
                hotel: mockHotel,
                offers: [mockedOffer],
                altAcc: mockedAltAcc,
            } as ISpecificOfferWithAltAcc & ISpecificOffer;
            rootStore.layoutStore.isHotelDetailsBookPage = true;
            rootStore.seatMapStore.isSeatMapFlowEnabled = true;
            store.selectedOffer = null;
            store.updateTransfersVisibility = jest.fn();
        });

        it('should call all proper functions', () => {
            store.updateOfferInfoBase(mockedOffers);

            expect(getOfferWithPopulatedData).toHaveBeenCalledWith(
                mockedOffer,
                rootStore.seatMapStore.seatSelectionFromUrl,
            );
            expect(rootStore.seatMapStore.setValidatedSelectedSeats).toHaveBeenCalledWith(mockSeats);
            expect(store.extraLuggage.setExtraLuggageInfo).toHaveBeenCalledWith(extraLuggageInfoMock);
            expect(store.updateTransfersVisibility).toHaveBeenCalledWith([mockTransfer]);

            expect(store.selectedOffer!.seatSelection).toEqual(mockSeats);
            expect(store.failedToLoadData).toBe(false);
            expect(store.selectBoardTypeError).toBe(false);
            expect(store.selectedOffer!.altAcc).toEqual(mockedAltAcc);
        });

        it('should NOT setValidatedSelectedSeats when NO seatSelection received', () => {
            store.updateOfferInfoBase({ ...mockedOffers, offers: [{ seatSelection: undefined }] });

            expect(rootStore.seatMapStore.setValidatedSelectedSeats).not.toHaveBeenCalled();
        });

        it('should NOT change offers seatSelection when seatSelection is empty array', () => {
            store.updateOfferInfoBase({ ...mockedOffers, offers: [{ seatSelection: [] }] });

            expect(store.selectedOffer!.seatSelection).toEqual([]);
        });

        it('should NOT change offers seatSelection when NO seatSelectionFromUrl', () => {
            rootStore.seatMapStore.seatSelectionFromUrl = undefined;

            store.updateOfferInfoBase(mockedOffers);

            expect(store.selectedOffer!.seatSelection).toEqual(mockSeats);
        });

        it('should NOT call getOfferWithPopulatedData when isSeatMapFlowEnabled is false', () => {
            rootStore.seatMapStore.isSeatMapFlowEnabled = false;

            store.updateOfferInfoBase(mockedOffers);

            expect(getOfferWithPopulatedData).not.toHaveBeenCalled();
        });

        it('should NOT setExtraLuggageInfo when NO extraLuggageInfo received', () => {
            store.updateOfferInfoBase({ ...mockedOffers, offers: [{ extraLuggageInfo: null }] });

            expect(store.extraLuggage.setExtraLuggageInfo).not.toHaveBeenCalled();
        });

        it('should NOT set altAcc when altAcc NOT defined', () => {
            store.updateOfferInfoBase({ ...mockedOffers, altAcc: undefined });

            expect(store.selectedOffer!.altAcc).toBeUndefined();
        });

        it('should NOT set altAcc when altAcc is empty array', () => {
            store.updateOfferInfoBase({ ...mockedOffers, altAcc: [] });

            expect(store.selectedOffer!.altAcc).toBeUndefined();
        });

        it('should call only proper functions when NO selectedOffer', () => {
            store.updateOfferInfoBase({ ...mockedOffers, offers: [] });

            expect(getOfferWithPopulatedData).not.toHaveBeenCalled();
            expect(rootStore.seatMapStore.setValidatedSelectedSeats).not.toHaveBeenCalled();
            expect(store.extraLuggage.setExtraLuggageInfo).not.toHaveBeenCalled();
            expect(store.updateTransfersVisibility).toHaveBeenCalledWith(undefined);
            expect(store.selectedOffer).toBeNull();
        });
    });

    describe('grabSearchValuesFromSearchStore', () => {
        it('should set values', () => {
            store.grabSearchValuesFromSearchStoreWithoutDestination = jest.fn();

            store.grabSearchValuesFromSearchStore();

            expect(store.grabSearchValuesFromSearchStoreWithoutDestination).toHaveBeenCalled();
            expect(store.selectedDestinationCodes).toStrictEqual(
                store.rootStore.searchStore.searchTo.selectedDestinationCodes,
            );
            expect(store.selectedDestinationCodesQuery).toBe(
                store.rootStore.searchStore.searchTo.selectedDestinationCodesQuery,
            );
            expect(store.destinationsDisplayValue).toStrictEqual(
                store.rootStore.searchStore.searchTo.destinationsDisplayValue,
            );
        });
    });

    describe('fetchNewOfferContract', () => {
        it('should fetchNewOfferContract', async () => {
            store.selectedOffer = offer;
            store.flexDays = 3;
            store.origins = ['LGW'];
            store.selectedTransferFromUrl = 'selectedTransferFromUrl';
            store.selectedDestinationCodesQuery = 'ES';
            store.from = new Date('7/07/2020');
            store.to = new Date('12/09/2020');

            jest.spyOn(store, 'canLoadOffer', 'get').mockReturnValue(true);
            offersService.fetchOffer = jest.fn();

            await store.fetchNewOfferContract(
                'packageId',
                'accommodationId',
                2,
                'newRoomCode',
                true,
                'newBoardTypeCode',
            );

            expect(offersService.fetchOffer).toHaveBeenCalledWith(
                '2020-09-02T00:00:00',
                3,
                '155',
                'LGW',
                [],
                'accommodationId',
                'Eaf170684b65f1e91ddcff8f737f8f07f',
                'Ea0e3d4ed50d28b03399b3308532cabc1',
                'packageId',
                'newBoardTypeCode',
                'selectedTransferFromUrl',
                'ES',
                true,
                false,
                rootStore.queryParamsStore.altAccommodationsFromUrl,
                rootStore.seatMapStore.selectedSeats,
                undefined,
                undefined,
                undefined,
                undefined,
                'lux',
                500,
                'outboundLCBSelectionFromUrl',
                'inboundLCBSelectionFromUrl',
                undefined,
                undefined,
            );
        });
    });

    describe('setBookingSidebarLoaded', () => {
        it('should set isBookingSidebarLoaded value to true', () => {
            store.isBookingSidebarLoaded = false;

            store.setBookingSidebarLoaded(true);

            expect(store.isBookingSidebarLoaded).toBe(true);
        });

        it('should set isBookingSidebarLoaded value to false', () => {
            store.isBookingSidebarLoaded = true;

            store.setBookingSidebarLoaded(false);

            expect(store.isBookingSidebarLoaded).toBe(false);
        });
    });

    describe('availableDepartureCabinBags', () => {
        const mockCabinBagFlight = (
            availableQuantity: number,
            categoryCode: string = FLIGHT_EXTRA_CATEGORY_CODE_CABIN_BAGS,
        ): IFlightExtras => ({
            flightNumber: '1',
            routeId: '1',
            flightExtraCategories: [
                {
                    categoryCode,
                    categoryName: 'cabin bags',
                    categoryType: HoldLuggageCategory.CabinBags,
                    flightExtras: [
                        {
                            adultPrice: 10,
                            availableQuantity,
                            categoryCode: 'category code',
                            childPrice: 100,
                            description: 'description',
                            flightExtraCode: 'extra code',
                            icon: 'icon',
                            limitPerPax: 1,
                            name: 'name',
                        },
                    ],
                },
            ],
        });

        it('should return infinity if no departure flight', () => {
            store.extraLuggage.bookingExtras = [];
            expect(store.availableDepartureCabinBags).toBe(Infinity);
        });

        it('should return infinity if no CABI code present', () => {
            store.extraLuggage.bookingExtras = [mockCabinBagFlight(0, 'no cabin bag')];
            expect(store.availableDepartureCabinBags).toBe(Infinity);
        });

        it('should return infinity if no flight extras inside CABI category', () => {
            const mock = mockCabinBagFlight(0);
            mock.flightExtraCategories[0].flightExtras = [];
            store.extraLuggage.bookingExtras = [mock];
            expect(store.availableDepartureCabinBags).toBe(Infinity);
        });

        it('should return the available quantity of the departure flight', () => {
            store.extraLuggage.bookingExtras = [mockCabinBagFlight(10)];
            expect(store.availableDepartureCabinBags).toBe(10);
        });
    });

    describe('availableReturnCabinBags', () => {
        const mockCabinBagFlight = (
            availableQuantity: number,
            categoryCode: string = FLIGHT_EXTRA_CATEGORY_CODE_CABIN_BAGS,
        ): IFlightExtras => ({
            flightNumber: '1',
            routeId: '1',
            flightExtraCategories: [
                {
                    categoryCode,
                    categoryName: 'cabin bags',
                    categoryType: HoldLuggageCategory.CabinBags,
                    flightExtras: [
                        {
                            adultPrice: 10,
                            availableQuantity,
                            categoryCode: 'category code',
                            childPrice: 100,
                            description: 'description',
                            flightExtraCode: 'extra code',
                            icon: 'icon',
                            limitPerPax: 1,
                            name: 'name',
                        },
                    ],
                },
            ],
        });

        it('should return infinity if no return flight', () => {
            store.extraLuggage.bookingExtras = [];
            expect(store.availableReturnCabinBags).toBe(Infinity);
        });

        it('should return infinity if no CABI code present', () => {
            store.extraLuggage.bookingExtras = [mockCabinBagFlight(10), mockCabinBagFlight(0, 'no cabin bag')];
            expect(store.availableReturnCabinBags).toBe(Infinity);
        });

        it('should return infinity if no flight extras inside CABI category', () => {
            const mock = mockCabinBagFlight(0);
            mock.flightExtraCategories[0].flightExtras = [];
            store.extraLuggage.bookingExtras = [mockCabinBagFlight(10), mock];
            expect(store.availableReturnCabinBags).toBe(Infinity);
        });

        it('should return the available quantity of the return flight', () => {
            store.extraLuggage.bookingExtras = [mockCabinBagFlight(10), mockCabinBagFlight(20)];
            expect(store.availableReturnCabinBags).toBe(20);
        });
    });

    describe('selectedNumberOfNights', () => {
        it('should return monthSearchDuration when isMonthSearch is true and both outbound date and inbound date are defined', () => {
            const mockMonthSearchDuration = 15;
            store.monthSearchDuration = mockMonthSearchDuration;
            store.isMonthSearch = true;
            store.from = new Date(2019, 1, 1);
            store.to = new Date(2019, 1, 3);

            expect(store.selectedNumberOfNights).toBe(mockMonthSearchDuration);
        });

        it(' should return number of nights between outbound date and inbound date', () => {
            store.from = new Date(2019, 1, 1);
            store.to = new Date(2019, 1, 3);

            expect(store.selectedNumberOfNights).toBe(2);
        });
    });

    describe('storeOriginalBooking', () => {
        it('should NOT store the original booking if it does NOT exist', () => {
            store.storeOriginalBooking();

            expect(mockSetWebStorageItem).not.toHaveBeenCalled();
        });

        it('should store the original booking if it exists', () => {
            store.selectedOffer = mockedOffer;

            store.storeOriginalBooking();

            expect(mockSetWebStorageItem).toHaveBeenCalled();
        });
    });

    describe('isLuxuryPackage', () => {
        it('should return true when it is luxury offer', () => {
            mockContainsLuxuryPromoCode = true;

            expect(store.isLuxuryPackage).toBe(true);
        });

        it('should return false when it is NOT luxury offer', () => {
            mockContainsLuxuryPromoCode = false;

            expect(store.isLuxuryPackage).toBe(false);
        });

        it('should use booking if selectedOffer is not set', () => {
            store.selectedOffer = null;
            store.booking = { ...mockBooking, promoCollections: [OfferPromotionCodes.Luxury] };

            store.isLuxuryPackage;
            expect(containsLuxuryPromoCode).toHaveBeenCalledWith(store.booking.promoCollections);
        });
    });

    describe('isNotEnoughLCBForLuxBooking', () => {
        it('should return false when it is NOT luxury holiday and LCB is unavailable fully', () => {
            rootStore.bookingStore.isLuxuryPackage = false;
            jest.spyOn(store.extraLuggage, 'isLCBFull', 'get').mockReturnValue(true);

            expect(store.isNotEnoughLCBForLuxBooking).toBe(false);
        });

        it('should return false when it is NOT luxury holiday and LCB is unavailable partially', () => {
            rootStore.bookingStore.isLuxuryPackage = false;
            jest.spyOn(store.extraLuggage, 'isLCBFull', 'get').mockReturnValue(false);
            jest.spyOn(store.extraLuggage, 'isLCBAlmostFull', 'get').mockReturnValue(true);

            expect(store.isNotEnoughLCBForLuxBooking).toBe(false);
        });

        it('should return false when it is NOT luxury holiday and no cabin bags return in flight extra response', () => {
            rootStore.bookingStore.isLuxuryPackage = false;
            rootStore.cabinBagsCategoriesExist = false;
            jest.spyOn(store.extraLuggage, 'isLCBFull', 'get').mockReturnValue(false);
            jest.spyOn(store.extraLuggage, 'isLCBAlmostFull', 'get').mockReturnValue(false);

            expect(store.isNotEnoughLCBForLuxBooking).toBe(false);
        });

        it('should return true when it is luxury holidays and LCB is unavailable fully', () => {
            rootStore.bookingStore.isLuxuryPackage = true;
            jest.spyOn(store.extraLuggage, 'isLCBFull', 'get').mockReturnValue(true);

            expect(store.isNotEnoughLCBForLuxBooking).toBe(true);
        });

        it('should return true when it is luxury holidays and LCB is unavailable partially', () => {
            rootStore.bookingStore.isLuxuryPackage = true;
            jest.spyOn(store.extraLuggage, 'isLCBFull', 'get').mockReturnValue(false);
            jest.spyOn(store.extraLuggage, 'isLCBAlmostFull', 'get').mockReturnValue(true);

            expect(store.isNotEnoughLCBForLuxBooking).toBe(true);
        });

        it('should return true when it is luxury holidays and no cabin bags return in flight extra response', () => {
            rootStore.bookingStore.isLuxuryPackage = true;
            rootStore.cabinBagsCategoriesExist = false;
            jest.spyOn(store.extraLuggage, 'isLCBFull', 'get').mockReturnValue(false);
            jest.spyOn(store.extraLuggage, 'isLCBAlmostFull', 'get').mockReturnValue(false);

            expect(store.isNotEnoughLCBForLuxBooking).toBe(true);
        });
    });

    describe('onMapCardButtonClick', () => {
        const args = { booking: true, data: { accom: [] } as unknown as IOffer };

        beforeEach(() => {
            jest.spyOn(store, 'resetBookingStore').mockImplementation();
            jest.spyOn(store, 'updatePreviousPriceFormOffer').mockImplementation();
            jest.spyOn(store, 'grabSearchValuesFromSearchStore').mockImplementation();
        });

        it('should redirect to extras page when on hotel details book page and booking is true', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;

            store.onMapCardButtonClick(args);

            expect(rootStore.trackingStore.trackSearchProductClick).toHaveBeenCalled();
            expect(store.updatePreviousPriceFormOffer).toHaveBeenCalled();
            expect(rootStore.routerStore.redirectToExtrasPage).toHaveBeenCalled();
            expect(rootStore.bookingStore.validatePackage).toHaveBeenCalled();
        });

        it('should redirect to search results page when search parameters are invalid and booking is true', () => {
            rootStore.searchStore.validateSearchParameters.mockReturnValue(false);

            store.onMapCardButtonClick(args);

            expect(rootStore.trackingStore.trackSearchProductClick).toHaveBeenCalled();
            expect(store.grabSearchValuesFromSearchStore).toHaveBeenCalled();
            expect(rootStore.searchStore.setSelectedOfferIndex).toHaveBeenCalledWith(-1);
            expect(rootStore.routerStore.redirectToSearchResultsPage).toHaveBeenCalled();
        });

        it('should close map when search parameters are valid and both booking/isScreenExtraSmall is true', () => {
            rootStore.appStore.isScreenExtraSmall = true;
            rootStore.searchStore.validateSearchParameters.mockReturnValue(true);

            store.onMapCardButtonClick(args);

            expect(rootStore.bookingStore.toggleMapVisibilityOnMobile).toHaveBeenCalledWith(false);
        });

        it('should reset booking store and redirect to the provided URL when booking is false', () => {
            const url = '/some-url';

            store.onMapCardButtonClick({ booking: false, url, data: {} as IOffer });

            expect(rootStore.trackingStore.trackSearchProductClick).not.toHaveBeenCalled();
            expect(store.resetBookingStore).toHaveBeenCalled();
            expect(rootStore.hotelsStore.selectSpecificOffer).toHaveBeenCalledWith(undefined);
            expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(url);
        });

        it('should not redirect to search results page when search parameters are valid and booking is true', () => {
            rootStore.searchStore.validateSearchParameters.mockReturnValue(true);

            store.onMapCardButtonClick(args);

            expect(rootStore.trackingStore.trackSearchProductClick).toHaveBeenCalled();
            expect(store.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
            expect(rootStore.searchStore.setSelectedOfferIndex).not.toHaveBeenCalled();
            expect(rootStore.routerStore.redirectToSearchResultsPage).not.toHaveBeenCalled();
        });
    });

    describe('isTransferIncluded', () => {
        it('should return true when transfers are defined and not empty', () => {
            jest.spyOn(store, 'transfers', 'get').mockReturnValue([{ id: 'transfer1' }] as unknown as ITransfer[]);

            expect(store.isTransferIncluded).toBe(true);
        });

        it('should return false when transfers are undefined', () => {
            jest.spyOn(store, 'transfers', 'get').mockReturnValue(undefined);

            expect(store.isTransferIncluded).toBe(false);
        });

        it('should return false when transfers are an empty array', () => {
            jest.spyOn(store, 'transfers', 'get').mockReturnValue([]);

            expect(store.isTransferIncluded).toBe(false);
        });
    });

    describe('hotel', () => {
        it('should return hotel from selectedOffer when selectedOffer is defined', () => {
            const mockHotel = { name: 'Mock Hotel' } as IHotel;
            store.selectedOffer = { hotel: mockHotel } as IOfferWithoutAltBoards;

            expect(store.hotel).toStrictEqual(mockHotel);
        });

        it('should return null when selectedOffer is not defined', () => {
            store.selectedOffer = null;

            expect(store.hotel).toBeUndefined();
        });
    });

    describe('priceBreakdown', () => {
        it('should return undefined when package is not valid', () => {
            store.isPackageValid = false;
            store.packageInfo = { priceBreakdown: [{ label: 'Test', value: 100 }] } as unknown as IValidatePackageInfo;

            expect(store.priceBreakdown).toBeUndefined();
        });

        it('should return undefined when packageInfo is not defined', () => {
            store.isPackageValid = true;
            store.packageInfo = null;

            expect(store.priceBreakdown).toBeUndefined();
        });

        it('should return price breakdown when package is valid and packageInfo is defined', () => {
            store.isPackageValid = true;
            store.packageInfo = { priceBreakdown: [{ label: 'Test', value: 100 }] } as unknown as IValidatePackageInfo;

            expect(store.priceBreakdown).toEqual([{ label: 'Test', value: 100 }]);
        });
    });

    describe('room', () => {
        it('should return the room type when offerUnits has at least one unit', () => {
            jest.spyOn(store, 'offerUnits', 'get').mockReturnValue([
                { roomType: { code: 'DELUXE', title: 'Deluxe Room' } },
            ] as unknown as IUnit[]);

            expect(store.room).toEqual({ code: 'DELUXE', title: 'Deluxe Room' });
        });

        it('should return null when offerUnits is an empty array', () => {
            jest.spyOn(store, 'offerUnits', 'get').mockReturnValue([]);

            expect(store.room).toBeNull();
        });
    });

    describe('boardType', () => {
        it('should return the board type when offerUnits has at least one unit with a boardType', () => {
            jest.spyOn(store, 'offerUnits', 'get').mockReturnValue([
                { boardType: { code: 'RO', title: 'Room Only' } },
            ] as unknown as IUnit[]);

            expect(store.boardType).toEqual({ code: 'RO', title: 'Room Only' });
        });

        it('should return null when offerUnits is an empty array', () => {
            jest.spyOn(store, 'offerUnits', 'get').mockReturnValue([]);

            expect(store.boardType).toBeNull();
        });
    });

    describe('departureDate', () => {
        it('should return the departure date when selectedOffer is defined', () => {
            store.selectedOffer = { date: '2023-12-25T00:00:00' } as unknown as IOfferWithoutAltBoards;

            expect(store.departureDate).toEqual(new Date('2023-12-25T00:00:00'));
        });

        it('should return null when selectedOffer is not defined', () => {
            store.selectedOffer = null;

            expect(store.departureDate).toBeNull();
        });
    });

    describe('allBoardTypes', () => {
        it('should return all unique board types when selectedOffer has units with board types', () => {
            store.selectedOffer = {
                accom: {
                    unit: [
                        { boardType: { code: 'BB', title: 'Bed & Breakfast' }, isFreeBoardUpgrade: false },
                        { boardType: { code: 'HB', title: 'Half Board' }, isFreeBoardUpgrade: true },
                    ],
                },
            } as IOfferWithoutAltBoards;
            store.alternativeBoards = [mockAltBoard2];

            const result = store.allBoardTypes;

            expect(result).toEqual([
                { code: 'BB', title: 'Bed & Breakfast', price: 0, pricePP: 0, isFreeBoardUpgrade: false },
                { code: 'HB', title: 'Half Board', price: 0, pricePP: 0, isFreeBoardUpgrade: true },
                mockAltBoard2,
            ]);
        });

        it('should return unique board types when duplicates exist in selectedOffer and alternativeBoards', () => {
            store.selectedOffer = {
                accom: {
                    unit: [
                        { boardType: { code: 'BB', title: 'Bed & Breakfast' }, isFreeBoardUpgrade: false },
                        { boardType: { code: 'HB', title: 'Half Board' }, isFreeBoardUpgrade: true },
                    ],
                },
            } as IOfferWithoutAltBoards;
            store.alternativeBoards = [mockAltBoard1, mockAltBoard2];

            const result = store.allBoardTypes;

            expect(result).toEqual([
                { code: 'BB', title: 'Bed & Breakfast', price: 0, pricePP: 0, isFreeBoardUpgrade: false },
                { code: 'HB', title: 'Half Board', price: 0, pricePP: 0, isFreeBoardUpgrade: true },
                mockAltBoard2,
            ]);
        });

        it('should return alternativeBoards when selectedOffer is undefined', () => {
            store.selectedOffer = undefined;
            store.alternativeBoards = [mockAltBoard2];

            const result = store.allBoardTypes;

            expect(result).toEqual([]);
        });

        it('should return an empty array when both selectedOffer and alternativeBoards are undefined', () => {
            store.selectedOffer = undefined;
            store.alternativeBoards = undefined as unknown as IAltBoard[];

            const result = store.allBoardTypes;

            expect(result).toEqual([]);
        });
    });

    describe('fetchOfferOnPageLoad', () => {
        it('should fetch offer and set loading when on hotel details book page', async () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;
            rootStore.layoutStore.isExtrasPage = false;
            rootStore.layoutStore.isGuestDetailsPage = false;
            store.fetchOffer = jest.fn();
            store.grabSearchValuesFromSearchStore = jest.fn();

            await store.fetchOfferOnPageLoad(true);

            expect(store.grabSearchValuesFromSearchStore).toHaveBeenCalled();
            expect(store.fetchOffer).toHaveBeenCalledWith(true);
            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(true);
            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(false);
        });

        it('should fetch offer and check SE and transfer correspondence when on extras page', async () => {
            rootStore.layoutStore.isHotelDetailsBookPage = false;
            rootStore.layoutStore.isExtrasPage = true;
            rootStore.layoutStore.isGuestDetailsPage = false;
            store.fetchOffer = jest.fn();
            store.grabSearchValuesFromSearchStore = jest.fn();
            store.checkSEAndTransferCorrespondence = jest.fn();

            await store.fetchOfferOnPageLoad(true);

            expect(store.grabSearchValuesFromSearchStore).toHaveBeenCalled();
            expect(store.fetchOffer).toHaveBeenCalledWith(true);
            expect(store.checkSEAndTransferCorrespondence).toHaveBeenCalled();
            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(true);
            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(false);
        });

        it('should fetch offer and set navigation booking when on guest details page without selected offer', async () => {
            rootStore.layoutStore.isHotelDetailsBookPage = false;
            rootStore.layoutStore.isExtrasPage = false;
            rootStore.layoutStore.isGuestDetailsPage = true;
            store.selectedOffer = null;
            store.fetchOffer = jest.fn();
            store.grabSearchValuesFromSearchStore = jest.fn();

            await store.fetchOfferOnPageLoad(true);

            expect(store.grabSearchValuesFromSearchStore).toHaveBeenCalled();
            expect(store.fetchOffer).toHaveBeenCalledWith(true);
            expect(rootStore.appStore.setNavigationBooking).toHaveBeenCalledWith(false);
            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(true);
            expect(rootStore.appStore.setLoading).toHaveBeenCalledWith(false);
        });

        it('should not fetch offer when not on hotel details, extras, or guest details page', async () => {
            rootStore.layoutStore.isHotelDetailsBookPage = false;
            rootStore.layoutStore.isExtrasPage = false;
            rootStore.layoutStore.isGuestDetailsPage = false;
            store.fetchOffer = jest.fn();
            store.grabSearchValuesFromSearchStore = jest.fn();

            await store.fetchOfferOnPageLoad(true);

            expect(store.grabSearchValuesFromSearchStore).not.toHaveBeenCalled();
            expect(store.fetchOffer).not.toHaveBeenCalled();
            expect(rootStore.appStore.setLoading).not.toHaveBeenCalled();
        });
    });

    describe('fetchOfferAndReloadPage', () => {
        it('should call fetchOffer with onFail callback when onFail is provided', async () => {
            const onFail = jest.fn();
            store.fetchOffer = jest.fn();

            await store.fetchOfferAndReloadPage(false, true, onFail);

            expect(store.fetchOffer).toHaveBeenCalledWith(false, true, onFail);
        });

        it('should call fetchOffer without onFail callback when onFail is not provided', async () => {
            store.fetchOffer = jest.fn();

            await store.fetchOfferAndReloadPage(false, true);

            expect(store.fetchOffer).toHaveBeenCalledWith(
                false,
                false,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
            );
        });

        it('should update current page when fetchOffer succeeds and isChangeUrl is true', async () => {
            store.fetchOffer = jest.fn();
            store.failedToLoadData = false;

            await store.fetchOfferAndReloadPage(false, true);

            expect(rootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith(
                rootStore.queryParamsStore.buildHotelDetailsQuery(),
            );
        });

        it('should not update current page when fetchOffer succeeds and isChangeUrl is false', async () => {
            store.fetchOffer = jest.fn();
            store.failedToLoadData = false;

            await store.fetchOfferAndReloadPage(false, false);

            expect(rootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
        });

        it('should not update current page when fetchOffer fails', async () => {
            store.fetchOffer = jest.fn();
            store.failedToLoadData = true;

            await store.fetchOfferAndReloadPage(false, true);

            expect(rootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
        });
    });

    describe('setLateRoomCheckoutToBooking', () => {
        it('should call fetchOffer and updateCurrentPage when late room checkout is selected', async () => {
            store.fetchOffer = jest.fn();

            await store.setLateRoomCheckoutToBooking(true);

            expect(store.fetchOffer).toHaveBeenCalledWith(true);
            expect(rootStore.trackingStore.trackLateCheckoutChange).toHaveBeenCalledWith(EventTypes.AddToBasket);
            expect(rootStore.routerStore.updateCurrentPage).toHaveBeenCalled();
        });

        it('should call fetchOffer and updateCurrentPage when late room checkout is deselected', async () => {
            store.fetchOffer = jest.fn();

            await store.setLateRoomCheckoutToBooking(false);

            expect(store.fetchOffer).toHaveBeenCalledWith(true);
            expect(rootStore.trackingStore.trackLateCheckoutChange).toHaveBeenCalledWith(EventTypes.RemoveFromBasket);
            expect(rootStore.routerStore.updateCurrentPage).toHaveBeenCalled();
        });

        it('should not call updateCurrentPage when fetchOffer fails', async () => {
            store.fetchOffer = jest.fn().mockImplementation(() => {
                store.failedToLoadData = true;
            });

            await store.setLateRoomCheckoutToBooking(true);

            expect(rootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
        });
    });

    describe('changeBoardType', () => {
        const testAccommodation = {
            accommodationId: 'testAcc',
            packageId: 'testPackage',
        };

        beforeEach(() => {
            store.updateOfferInfo = jest.fn();
            store.changeBoardCodeError = jest.fn();
            store.loadAdditionalData = jest.fn();
            store.selectedOffer = mockedOffer;
        });

        it('should call callFetchOffer function without errors', async () => {
            store.alternativeBoards = [
                {
                    ...mockAltBoard1,
                    code: 'test',
                    ...testAccommodation,
                    isExt: true,
                },
            ];

            store['callFetchOffer'] = jest.fn();
            store.changeIsClickChangeButton = jest.fn();

            await store.changeBoardType('test', 100);

            expect(store.changeIsClickChangeButton).toHaveBeenCalledWith(true);
            expect(store['callFetchOffer']).toHaveBeenCalledWith(true, 'test', []);
            expect(store.selectBoardTypeError).toBeFalsy();
        });

        it('should call callFetchOffer function with errors', async () => {
            store.alternativeBoards = [
                {
                    ...mockAltBoard1,
                    code: 'test',
                    ...testAccommodation,
                    isExt: true,
                },
            ];

            store['callFetchOffer'] = jest.fn().mockRejectedValue({});
            await store.changeBoardType('test', 100);
            expect(store['callFetchOffer']).toHaveBeenCalledWith(true, 'test', []);
            expect(store.selectBoardTypeError).toBeTruthy();
        });

        it('should update offer with new board type', async () => {
            rootStore.layoutStore.isExtrasPage = false;
            rootStore.queryParamsStore.buildHotelDetailsQuery = jest.fn(() => 'query');

            const offer = {} as unknown as IOfferWithoutAltBoards;

            store.alternativeBoards = [
                {
                    ...mockAltBoard1,
                    code: 'test',
                    ...testAccommodation,
                    isExt: true,
                },
            ];

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve(offer));

            await store.changeBoardType('test', 100);

            expect(store['newBoardType']).toBeUndefined();
            expect(store.updateOfferInfo).toHaveBeenCalledWith({
                ...offer,
                altAcc: rootStore.queryParamsStore.altAccommodationsFromUrl,
            });
            expect(store.changeBoardCodeError).toHaveBeenCalled();
            expect(rootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith('query');
            expect(rootStore.trackingStore.holidayConfigChangeTrigger).toHaveBeenCalledWith(
                EventTypes.BoardBasisUpdate,
                100,
            );
            expect(store.loadAdditionalData).toHaveBeenCalled();
        });

        it('should track alteration room change', async () => {
            rootStore.layoutStore.isExtrasPage = false;
            rootStore.queryParamsStore.buildHotelDetailsQuery = jest.fn(() => 'query');

            store.alternativeBoards = [
                {
                    ...mockAltBoard1,
                    code: 'test',
                    ...testAccommodation,
                    isExt: true,
                    roomAlterations: { test2: 'test2' },
                },
            ];

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve(offer));

            await store.changeBoardType('test', 100);

            expect(rootStore.trackingStore.holidayConfigChangeTrigger).toHaveBeenCalledWith(EventTypes.RoomUpdate, 100);
        });

        it('should send BOARD_BASIS_BOOK_FLOW_CHANGE engage event when board type changes successfully', async () => {
            rootStore.layoutStore.isExtrasPage = false;
            rootStore.queryParamsStore.buildHotelDetailsQuery = jest.fn(() => 'query');
            rootStore.searchFiltersStore.filters = [
                {
                    code: 'BoardType',
                    name: 'Board Type',
                    options: [{ code: 'BB', name: 'Bed and Breakfast', count: 10, groupCode: 'BoardType' as any }],
                },
            ] as any;

            const mockOffer = {} as unknown as IOfferWithoutAltBoards;

            store.alternativeBoards = [
                {
                    ...mockAltBoard1,
                    code: 'BB',
                    ...testAccommodation,
                    isExt: false,
                },
            ];

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve(mockOffer));

            await store.changeBoardType('BB', 100);

            expect(rootStore.engageStore.sendCustomEvent).toHaveBeenCalledWith('BOARD_BASIS_BOOK_FLOW_CHANGE', {
                boardBasis: 'bedAndBreakfast',
            });
        });

        it('should perform price manipulation', async () => {
            rootStore.layoutStore.isExtrasPage = true;
            rootStore.queryParamsStore.buildHotelDetailsQuery = jest.fn(() => 'query');

            const offer = {} as unknown as IOfferWithoutAltBoards;

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve(offer));
            store.togglePriceManipulating = jest.fn();
            store.validatePackage = jest.fn();
            store.setSelectedOfferPrices = jest.fn();

            store.alternativeBoards = [
                {
                    ...mockAltBoard1,
                    code: 'test',
                    ...testAccommodation,
                    isExt: true,
                },
            ];

            await store.changeBoardType('test', 100);

            expect(store.togglePriceManipulating).toHaveBeenCalledWith(true);
            expect(store.validatePackage).toHaveBeenCalled();
            expect(store.setSelectedOfferPrices).toHaveBeenCalled();
        });

        it('should change accommodation data when contract is changed', async () => {
            store.selectedOffer!.accom.unit[0] = {
                boardType: {
                    code: 'test',
                    ...testAccommodation,
                },
            } as unknown as IUnit;

            await store.changeBoardType('test', 100);

            expect(swapOfferAccommodations).toHaveBeenCalledWith(
                store.selectedOffer,
                rootStore.queryParamsStore.altAccommodationsFromUrl,
                'testAcc',
                'testPackage',
            );
        });

        it('should set isExt from a new boardType', async () => {
            store.alternativeBoards = [
                {
                    ...mockAltBoard1,
                    code: 'test',
                    accommodationId: 'testAcc',
                    packageId: 'testPackage',
                    isExt: true,
                },
            ];

            await store.changeBoardType('test', 100);

            expect(store.selectedOffer?.accom.isExt).toBe(true);
        });

        it('should set default falsy isExt from a new boardType', async () => {
            store.selectedOffer!.accom = {
                ...store.selectedOffer!.accom,
                isExt: true,
                unit: [
                    {
                        boardType: {
                            code: 'test2',
                            ...testAccommodation,
                        },
                    } as unknown as IUnit,
                ],
            };

            store.alternativeBoards = [
                {
                    ...mockAltBoard1,
                    code: 'test',
                    accommodationId: 'testAcc',
                    packageId: 'testPackage',
                },
            ];

            await store.changeBoardType('test', 100);

            expect(store.selectedOffer?.accom.isExt).toBe(false);
        });

        it('should not change isExt when new board not found', async () => {
            store.selectedOffer!.accom = {
                ...store.selectedOffer!.accom,
                isExt: true,
                unit: [
                    {
                        boardType: {
                            code: 'test2',
                            ...testAccommodation,
                        },
                    } as unknown as IUnit,
                ],
            };

            store.alternativeBoards = [
                {
                    ...mockAltBoard1,
                    code: 'test3',
                    accommodationId: 'testAcc',
                    packageId: 'testPackage',
                    isExt: true,
                },
            ];

            await store.changeBoardType('test', 100);

            expect(store.selectedOffer?.accom.isExt).toBe(true);
        });

        it('should call onSuccess when succeed', async () => {
            const onSuccess = jest.fn();

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({}));

            store.alternativeBoards = [
                {
                    ...mockAltBoard1,
                    code: 'test',
                    ...testAccommodation,
                    isExt: true,
                },
            ];

            await store.changeBoardType('test', 100, onSuccess);

            expect(onSuccess).toHaveBeenCalled();
        });
    });

    describe('handleOfferPrices', () => {
        const firstOffer = { ...mockedOffer, price: 200, pricePP: 100 } as IOffer;

        it('should set cached prices from firstOffer', () => {
            store.handleOfferPrices({ hotel: mockHotel, offers: [firstOffer] } as ISpecificOffer);

            expect(store.cacheOfferPrice).toBe(200);
            expect(store.cacheOfferPricePP).toBe(100);
            expect(store.cacheOfferPriceExcludingTouristTax).toBe(200);
            expect(store.cacheOfferPricePPExcludingTouristTax).toBe(100);
            expect(store.notValidatedOfferPricePP).toBe(100);
            expect(store.notValidatedOfferPrice).toBe(200);
            expect(firstOffer.price).toBe(0);
            expect(firstOffer.pricePP).toBe(0);
            expect(firstOffer.priceExcludingTouristTax).toBe(0);
            expect(firstOffer.pricePPExcludingTouristTax).toBe(0);
        });

        it('should set default values when firstOffer is undefined', () => {
            store.handleOfferPrices(undefined);

            expect(store.cacheOfferPrice).toBe(undefined);
            expect(store.cacheOfferPricePP).toBe(undefined);
            expect(store.cacheOfferPriceExcludingTouristTax).toBe(undefined);
            expect(store.cacheOfferPricePPExcludingTouristTax).toBe(undefined);
            expect(store.notValidatedOfferPricePP).toBe(0);
            expect(store.notValidatedOfferPrice).toBe(0);
        });
    });

    describe('validateBookingBaseRequestBody', () => {
        it('should set priceExcludingTouristTax and pricePPExcludingTouristTax from cached values', () => {
            store.cacheOfferPriceExcludingTouristTax = 2000;
            store.cacheOfferPricePPExcludingTouristTax = 1000;

            expect(store.validateBookingBaseRequestBody.offer.priceExcludingTouristTax).toBe(2000);
            expect(store.validateBookingBaseRequestBody.offer.pricePPExcludingTouristTax).toBe(1000);
        });

        it('should set priceExcludingTouristTax and pricePPExcludingTouristTax from selected offer', () => {
            store.selectedOffer = mockedOffer;
            store.cacheOfferPriceExcludingTouristTax = undefined;
            store.cacheOfferPricePPExcludingTouristTax = undefined;

            expect(store.validateBookingBaseRequestBody.offer.priceExcludingTouristTax).toBe(200);
            expect(store.validateBookingBaseRequestBody.offer.pricePPExcludingTouristTax).toBe(100);
        });
    });

    describe('addExtrasToPrice', () => {
        it('should return price when isHotelDetailsBookPage is false', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = false;

            expect(store.addExtrasToPrice(2000)).toBe(2000);
        });

        it('should return price with extras when isHotelDetailsBookPage is true', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;
            jest.spyOn(store.extraLuggage, 'extraLuggagePriceTotal', 'get').mockReturnValue(20);

            expect(store.addExtrasToPrice(2000)).toBe(2030);
        });
    });
});
