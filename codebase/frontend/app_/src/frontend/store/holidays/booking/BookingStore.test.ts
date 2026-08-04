import { AxiosError, AxiosResponse } from 'axios';

import {
    mockAltNoTransfer,
    mockAltSharedTransfer,
    mockFlightsRoutes,
    mockPassengerWithLCB,
    mockTransfer,
} from 'frontend/__mocks__';
import { extraLuggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import { mockedTransport } from 'frontend/__mocks__/transport';
import bookingService from 'frontend/services/booking.service';
import offersService from 'frontend/services/offers.service';
import { OrderCheckoutPayment } from 'frontend/store/base/tracking/sitecore/constants';
import createRootStore from 'frontend/store/holidays/booking/__mocks__/createRootStore';
import { commitBookingError } from 'frontend/store/holidays/payment/payment-failures.config';
import { canPayRemainingBalance } from 'frontend/utils/date.utils';
import * as freeNightsUtils from 'frontend/utils/freeNights.utils';
import { swapOfferAccommodations } from 'frontend/utils/offer.utils';
import * as paymentTransaction from 'frontend/utils/paymentTransaction';
import * as promoUtils from 'frontend/utils/promoPageDates';
import * as route from 'frontend/utils/route.utils';
import * as sitecorePersonalizeUtils from 'frontend/utils/sitecorePersonalize.utils';
import * as formActions from 'frontend/utils/submitForm';
import * as taxUtils from 'frontend/utils/touristTax.utils';
import * as viewBookingUtils from 'frontend/utils/viewBooking.utils';
import { ApiError } from 'models/data/ApiError';
import { IApiErrorData, IApiInnerError } from 'models/data/ApiErrorData';
import { IBookingInfo, IBookingInfoPayload } from 'models/data/IBookingInfo';
import { IBookingPaymentInfo } from 'models/data/ICommitBookingRequestBody';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { ISpecificOffer, ISpecificOfferWithAltAcc } from 'models/data/ISpecificOffer';
import { IValidatePackageInfo } from 'models/data/IValidPackageInfo';
import { IThreeDSData } from 'models/data/payment/IThreeDSData';
import {
    AIRPORT_PARKING_UNAVAILABLE_API_ERRORS,
    AIRPORT_PARKING_VALIDATION_API_ERRORS,
    ApiErrors,
} from 'models/enum/ApiErrors';
import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { PaymentType } from 'models/enum/PaymentType';
import { SitePath } from 'models/enum/SitePath';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { BookingStore } from './BookingStore';
const transactionPrice = 1250;

jest.mock('frontend/services/logging');
jest.mock('frontend/services/booking.service');
jest.mock('frontend/utils/paymentTransaction', () => ({
    setTransactionProcessing: jest.fn(),
    getTransactionId: jest.fn(() => '12345'),
    setTransactionDone: jest.fn(),
    startNewTransaction: jest.fn(),
    getTransaction: jest.fn(() => ({ p: transactionPrice })),
    updateTransaction: jest.fn(),
}));
jest.mock('frontend/utils/submitForm', () => ({
    submitForm: jest.fn(),
}));
jest.mock('frontend/utils/offer.utils', () => ({
    ...jest.requireActual('frontend/utils/offer.utils'),
    swapOfferAccommodations: jest.fn(offer => offer),
}));
jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    canPayRemainingBalance: jest.fn(() => true),
}));

const mockSetWebStorageItem = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    ...jest.requireActual('frontend/utils/webStorage.utils'),
    setWebStorageItem: (...args) => mockSetWebStorageItem(...args),
}));

const mockGetBookingPayload = jest.spyOn(viewBookingUtils, 'getBookingPayload');
const mockGetFreeNightsIncludedInOffer = jest.spyOn(freeNightsUtils, 'getFreeNightsIncludedInOffer');
const mockGetPaymentType = jest.spyOn(sitecorePersonalizeUtils, 'getPaymentType');
jest.spyOn(taxUtils, 'getTouristTaxFieldsFromOffer').mockReturnValue(mockTouristTaxFields);

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
        title: 'SUITE LUXURY CITY VIEW',
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
                    },
                ],
            },
        ],
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

const unit2 = {
    code: 'APT.B1!NOR.OPAQUE',
    price: 0.0,
    pricePP: 0.0,
    avail: 0,
    isFreeForKids: false,
    isExt: true,
    roomType: {
        code: 'APT.B1',
        title: 'APARTMENT ONE BEDROOM',
        description: '',
        content: '',
        images: [
            {
                small: 'https://photos.hotelbeds.com/giata/13/133509/133509a_hb_ro_007.jpg',
                medium: 'https://photos.hotelbeds.com/giata/bigger/13/133509/133509a_hb_ro_007.jpg',
                large: 'https://photos.hotelbeds.com/giata/xl/13/133509/133509a_hb_ro_007.jpg',
            },
        ],
        facilities: [
            {
                name: 'Balcony',
                code: '230',
                number: '',
            },
        ],
        stays: [
            {
                stayType: 'BED',
                description: 'Bed room',
                facilities: [
                    {
                        name: 'Single bed',
                        code: '1',
                        number: '2',
                    },
                ],
            },
        ],
    },
    board: 'SC',
    boardType: {
        code: 'SC',
        title: 'Self catering',
        content: '',
        description: '',
        iconUrl: '/-/jssmedia/73F6DE5C3C5843169650FFE8646E1C1C.ashx',
    },
    occupation: {
        adults: 2,
        children: 2,
        infants: 1,
        childAges: [3, 2],
    },
} as IUnit;

const offer = {
    date: '2020-09-02T00:00:00',
    stay: 7,
    accom: {
        id: 'X9431179',
        unit: [unit],
    } as any,
    transfers: [mockTransfer],
    transport: mockedTransport,
    price: 2000,
    hotel: {
        test: 'new hotel',
    },
    altBoards: [{}],
} as any;

describe('BookingStore', () => {
    const prepareStoreForAltAccommodationsTests = store => {
        store.selectedOffer = { ...offer, date: new Date(offer.date) };
        store.packageIdFromUrl = 'packageId';
        store.from = new Date('7/07/2020');
        store.to = new Date('12/09/2020');
        store.origins = ['1', '2', '3'];
    };
    let rootStore: any = createRootStore();

    beforeEach(() => {
        rootStore = createRootStore();
    });

    describe('Transfers', () => {
        describe('isTransferIncluded', () => {
            it('should return false when transfers empty', () => {
                const store = new BookingStore(rootStore);
                store.selectedOffer = { transfers: [] } as any;
                expect(store.isTransferIncluded).toBeFalsy();
            });

            it('should return true when has transfers', () => {
                const store = new BookingStore(rootStore);
                store.selectedOffer = { transfers: [mockTransfer] } as any;
                expect(store.isTransferIncluded).toBeTruthy();
            });
        });
    });

    describe('hotel', () => {
        it('should return hotel info from selected offer', () => {
            const store = new BookingStore(rootStore);
            const hotel = {
                code: 'test',
            };
            const offer = {
                hotel,
            } as IOfferWithoutAltBoards;

            store.selectedOffer = offer;

            const hotelResult = store.hotel;

            expect(hotelResult).toEqual(hotel);
        });

        it('should return undefined when no offer selected', () => {
            const store = new BookingStore(rootStore);

            store.selectedOffer = undefined;

            const hotelResult = store.hotel;

            expect(hotelResult).toEqual(undefined);
        });
    });

    describe('priceBreakdown', () => {
        it('should return undefined when package is NOT valid and has no info', () => {
            const store = new BookingStore(rootStore);

            expect(store.priceBreakdown).toBeUndefined();
        });

        it('should return priceBreakdown', () => {
            const store = new BookingStore(rootStore);

            store.isPackageValid = true;
            store.packageInfo = {
                priceBreakdown: 'priceBreakdown',
            } as any;

            expect(store.priceBreakdown).toEqual('priceBreakdown');
        });
    });

    describe('room', () => {
        it('should return null when no roomType', () => {
            const store = new BookingStore(rootStore);

            store.selectedOffer = {
                accom: {
                    unit: [{}],
                },
            } as any;

            expect(store.room).toBeNull();
        });

        it('should return first room type', () => {
            const store = new BookingStore(rootStore);

            store.selectedOffer = offer;

            expect(store.room).toEqual(offer.accom.unit[0].roomType);
        });
    });

    describe('fetchOffer', () => {
        const createStore = () => new BookingStore(rootStore);

        let store = createStore();

        beforeEach(() => {
            store = createStore();

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve(null));
            store.updateOfferInfo = jest.fn();
            store.onFetchOfferError = jest.fn();
            store.loadExtras = jest.fn();
            store.loadAdditionalData = jest.fn();
            store.loadFlightExtras = jest.fn();
            store.onFetchOfferError = jest.fn();
            store.extraLuggage.LCBAvailabilityCheckFlow = jest.fn();
        });

        it('should do nothing when offer is loading', () => {
            store.isLoadingOffer = true;

            store.fetchOffer();

            expect(store['callFetchOffer']).not.toHaveBeenCalled();
        });

        it('should try to fetch offer and call onFetchOfferError when no offer', async () => {
            await store.fetchOffer(true);

            expect(store.updateOfferInfo).not.toHaveBeenCalled();
            expect(store.onFetchOfferError).toHaveBeenCalled();
            expect(store.isLoadingOffer).toBeFalsy();
        });

        it('should load offer and call onFetchOfferError when offers length is 0', async () => {
            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [] }));
            store.isExtFromUrl = true;

            await store.fetchOffer(true, false, undefined, 'AI', []);

            expect(store['callFetchOffer']).toHaveBeenCalledWith(true, 'AI', []);
            expect(store.updateOfferInfo).not.toHaveBeenCalled();
            expect(store.onFetchOfferError).toHaveBeenCalled();
        });

        it('should callFetchOffer without board and rooms', async () => {
            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [] }));
            store.isExtFromUrl = false;

            await store.fetchOffer(true);

            expect(store['callFetchOffer']).toHaveBeenCalledWith(false, undefined, undefined);
        });

        it('should try to fetch offer and call onFetchOfferError when offer price is NOT provided and canValidateOffer is false', async () => {
            rootStore.layoutStore.isExtrasPage = false;
            rootStore.layoutStore.isGuestDetailsPage = false;
            rootStore.layoutStore.isPaymentPage = false;
            store.selectedOffer = { ...offer, price: 0 };

            await store.fetchOffer(true);

            expect(store.updateOfferInfo).not.toHaveBeenCalled();
            expect(store.onFetchOfferError).toHaveBeenCalled();
            expect(store.isLoadingOffer).toBeFalsy();
        });

        it('should do nothing when has selected offer price, alternative transfers and isGuestDetailsPage', () => {
            rootStore.layoutStore.isGuestDetailsPage = true;
            store.selectedOffer = offer;
            store.alternativeTransfers = [mockTransfer];

            store.fetchOffer(false);

            expect(store['callFetchOffer']).not.toHaveBeenCalled();
        });

        it('should call loadAlternativeTransfers when has selected offer price, no alternative transfers and isExtrasPage', () => {
            rootStore.layoutStore.isExtrasPage = true;
            store.selectedOffer = offer;

            store.fetchOffer(false);

            expect(store['callFetchOffer']).not.toHaveBeenCalled();
            expect(store.loadExtras).toHaveBeenCalled();
        });

        it('should call loadAlternativeTransfers when has selected offer price, no alternative transfers and isPaymentPage', () => {
            rootStore.layoutStore.isPaymentPage = true;
            store.selectedOffer = offer;

            store.fetchOffer(false);

            expect(store['callFetchOffer']).not.toHaveBeenCalled();
            expect(store.loadExtras).toHaveBeenCalled();
        });

        it('should update offer info and load additional data', async () => {
            rootStore.routerStore.isHotelDetailsPage = true;

            jest.spyOn(store.extraLuggage, 'isExtraLuggageFromUrlValid', 'get').mockReturnValue(true);
            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [offer] }));

            await store.fetchOffer();

            expect(store.updateOfferInfo).toHaveBeenCalledWith({ offers: [offer] });
            expect(store.loadAdditionalData).toHaveBeenCalled();
            expect(store.loadFlightExtras).toHaveBeenCalled();
            expect(store.onFetchOfferError).not.toHaveBeenCalled();
        });

        it('should call sendPromoCodeEvent from engageStore', async () => {
            rootStore.routerStore.isHotelDetailsPage = true;

            jest.spyOn(store.extraLuggage, 'isExtraLuggageFromUrlValid', 'get').mockReturnValue(true);
            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [offer] }));

            await store.fetchOffer();

            expect(rootStore.engageStore.getOrderingFromPromoCode).toHaveBeenCalled();
        });

        it('should call LCBAvailabilityCheckFlow after loading flight extras', async () => {
            rootStore.routerStore.isHotelDetailsPage = true;

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [offer] }));
            jest.spyOn(store.extraLuggage, 'isExtraLuggageFromUrlValid', 'get').mockReturnValue(true);

            await store.fetchOffer();

            expect(store.loadFlightExtras).toHaveBeenCalled();
            expect(store.extraLuggage.LCBAvailabilityCheckFlow).toHaveBeenCalled();
        });

        it('should parse promo code at payment page', async () => {
            rootStore.routerStore.pathname = '/booking';
            rootStore.layoutStore.isPaymentPage = true;
            rootStore.layoutStore.isHotelDetailsPage = false;
            rootStore.seatMapStore.selectedSeats = [{}];

            const store = new BookingStore(rootStore);

            store.accommodationIdFromUrl = '12321';
            store.outboundFlightIdFromUrl = 'dasd';
            store.inboundFlightIdFromUrl = 'asdsad';
            store.packageIdFromUrl = 'asdasd';
            store.from = new Date();
            store.to = new Date('12/12/2040');
            store.origins = ['1', '2', '3'];
            store.roomsAllocation = [{ adults: ['test', 'testt'] }] as any;
            store.guestsInfoPayload = {
                leadPassenger: {},
                guests: [],
                promoCode: 'promoCode',
                deviceId: '000-111',
            };
            store.validatePackage = jest.fn();
            store.loadFlightExtras = jest.fn();
            store.parsePromocode = jest.fn();
            jest.spyOn(store.extraLuggage, 'isExtraLuggageFromUrlValid', 'get').mockReturnValue(true);

            offersService.fetchOffer = jest.fn().mockResolvedValue({
                hotel: {},
                offers: [{ accom: {} } as IOfferWithoutAltBoards],
            } as ISpecificOffer);

            await store.fetchOffer(true);

            expect(store.parsePromocode).toHaveBeenCalled();
        });

        it('should call fetchOffer with stored seats', async () => {
            rootStore.layoutStore.isExtrasPage = true;
            rootStore.layoutStore.isHotelDetailsPage = false;
            rootStore.routerStore.pathname = '/booking';
            rootStore.seatMapStore.selectedSeats = [{}];

            const store = new BookingStore(rootStore);

            store.selectedTransferFromUrl = 'test';
            const promoCode = 'TEST';
            store.accommodationIdFromUrl = '12321';
            store.outboundFlightIdFromUrl = 'dasd';
            store.inboundFlightIdFromUrl = 'asdsad';
            store.packageIdFromUrl = 'asdasd';
            store.from = new Date('7/12/2040');
            store.to = new Date('12/12/2040');
            store.origins = ['1', '2', '3'];
            store.roomsAllocation = [{ adults: ['test', 'testt'] }] as any;
            store.guestsInfoPayload = {
                leadPassenger: {},
                guests: [],
                promoCode,
                deviceId: '000-111',
            };
            store.validatePackage = jest.fn();
            store.loadAdditionalData = jest.fn();
            store.loadFlightExtras = jest.fn();
            offersService.fetchOffer = jest.fn().mockResolvedValue({
                hotel: {},
                offers: [{ accom: {} } as IOfferWithoutAltBoards],
            } as ISpecificOffer);

            await store.fetchOffer(true);

            expect(offersService.fetchOffer).toHaveBeenCalledWith(
                store.from,
                3,
                '153',
                '1,2,3',
                [],
                '12321',
                'dasd',
                'asdsad',
                'asdasd',
                undefined,
                store.selectedTransferFromUrl,
                'ES',
                false,
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

        it('should call fetchOffer with altAcc', async () => {
            const store = new BookingStore(rootStore);
            store.selectedTransferFromUrl = 'test';

            prepareStoreForAltAccommodationsTests(store);

            await store.fetchOffer(true);

            expect(offersService.fetchOffer).toHaveBeenCalledWith(
                store.selectedOffer?.date,
                3,
                '155',
                '1,2,3',
                [],
                'X9431179',
                'Eaf170684b65f1e91ddcff8f737f8f07f',
                'Ea0e3d4ed50d28b03399b3308532cabc1',
                'packageId',
                'RO',
                store.selectedTransferFromUrl,
                'ES',
                false,
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

        it('should change setShowInvalidLuggageInUrlPopup flag when fetchOffer throws LCB error', async () => {
            const error = {
                response: {
                    data: {
                        code: ApiErrors.LargeCabinBagAllowanceExceeded,
                    },
                },
            };
            const store = new BookingStore(rootStore);

            prepareStoreForAltAccommodationsTests(store);

            jest.spyOn(store, 'fetchOffer');
            offersService.fetchOffer = jest.fn().mockReturnValue(Promise.reject(error));
            store.onFetchOfferError = jest.fn();
            store.setShowInvalidLuggageInUrlPopup = jest.fn();

            await store.fetchOffer(true);

            expect(store.setShowInvalidLuggageInUrlPopup).toHaveBeenCalledWith(true);
            expect(store.onFetchOfferError).not.toHaveBeenCalled();
        });

        it('should call fetchOffer with selected luggage and lcb', async () => {
            rootStore.queryParamsStore.luggageSelectionFromUrl = { LUG: 3 };
            rootStore.queryParamsStore.sportEquipmentSelectionFromUrl = { BIKE: 2 };
            rootStore.flightsPassengersStore.outBoundPassengers = [mockPassengerWithLCB('4')];
            rootStore.flightsPassengersStore.inBoundPassengers = [mockPassengerWithLCB('5')];

            const store = new BookingStore(rootStore);

            prepareStoreForAltAccommodationsTests(store);

            await store.fetchOffer(true);

            expect(offersService.fetchOffer).toHaveBeenCalledWith(
                store.selectedOffer?.date,
                3,
                '155',
                '1,2,3',
                [],
                'X9431179',
                'Eaf170684b65f1e91ddcff8f737f8f07f',
                'Ea0e3d4ed50d28b03399b3308532cabc1',
                'packageId',
                'RO',
                undefined,
                'ES',
                false,
                false,
                rootStore.queryParamsStore.altAccommodationsFromUrl,
                rootStore.seatMapStore.selectedSeats,
                {},
                {},
                {},
                {},
                'lux',
                500,
                '4',
                '5',
                undefined,
                undefined,
            );
        });

        it('should call validate-package on extras page', async () => {
            rootStore.layoutStore.isExtrasPage = true;
            rootStore.routerStore.pathname = '/booking';
            rootStore.layoutStore.isHotelDetailsPage = false;
            rootStore.seatMapStore.selectedSeats = [{}];

            const store = new BookingStore(rootStore);

            const promoCode = 'TEST';
            store.accommodationIdFromUrl = '12321';
            store.outboundFlightIdFromUrl = 'dasd';
            store.inboundFlightIdFromUrl = 'asdsad';
            store.packageIdFromUrl = 'asdasd';
            store.from = new Date();
            store.to = new Date('12/12/2040');
            store.origins = ['1', '2', '3'];
            store.roomsAllocation = [{ adults: ['test', 'testt'] }] as any;
            store.guestsInfoPayload = {
                leadPassenger: {},
                guests: [],
                promoCode,
                deviceId: '000-111',
            };
            store.isValidatingPackage = false;
            store.validatePackage = jest.fn();
            store.loadAdditionalData = jest.fn();
            store.loadFlightExtras = jest.fn();
            jest.spyOn(store.extraLuggage, 'isExtraLuggageFromUrlValid', 'get').mockReturnValue(true);
            offersService.fetchOffer = jest.fn().mockResolvedValue({
                hotel: {},
                offers: [{ accom: {} } as IOfferWithoutAltBoards],
            } as ISpecificOffer);

            await store.fetchOffer(true);

            expect(store.validatePackage).toHaveBeenCalled();
        });

        it('should not call validate-package on HD page', async () => {
            rootStore.routerStore.pathname = '/booking';
            rootStore.layoutStore.isHotelDetailsPage = true;
            rootStore.seatMapStore.selectedSeats = [{}];

            const store = new BookingStore(rootStore);

            const promoCode = 'TEST';
            store.accommodationIdFromUrl = '12321';
            store.outboundFlightIdFromUrl = 'dasd';
            store.inboundFlightIdFromUrl = 'asdsad';
            store.packageIdFromUrl = 'asdasd';
            store.from = new Date();
            store.to = new Date('12/12/2040');
            store.origins = ['1', '2', '3'];
            store.roomsAllocation = [{ adults: ['test', 'testt'] }] as any;
            store.guestsInfoPayload = {
                leadPassenger: {},
                guests: [],
                promoCode,
                deviceId: '000-111',
            };
            store.validatePackage = jest.fn();
            store.loadAdditionalData = jest.fn();
            store.loadFlightExtras = jest.fn();
            offersService.fetchOffer = jest.fn().mockResolvedValue({
                hotel: {},
                offers: [{ accom: {} } as IOfferWithoutAltBoards],
            } as ISpecificOffer);

            await store.fetchOffer(true);

            expect(store.validatePackage).not.toHaveBeenCalled();
        });

        it('should update url when offer room code changed', async () => {
            rootStore.routerStore.pathname = '/booking';
            rootStore.routerStore.updateCurrentPage = jest.fn();

            rootStore.layoutStore.isHotelDetailsBookPage = true;

            rootStore.queryParamsStore.isPromotingIframe = jest.fn(() => false);
            rootStore.queryParamsStore.offerRoomsAllocationFromUrl = [
                {
                    adults: 2,
                    children: 0,
                    infants: 0,
                    childrenAges: [],
                    roomCode: 'code_from_url',
                },
            ];
            rootStore.queryParamsStore.buildHotelDetailsQuery = jest.fn().mockReturnValue('build_query');

            const store = new BookingStore(rootStore);

            store.accommodationIdFromUrl = '12321';
            store.outboundFlightIdFromUrl = 'dasd';
            store.inboundFlightIdFromUrl = 'asdsad';
            store.packageIdFromUrl = 'asdasd';
            jest.spyOn(store.extraLuggage, 'isExtraLuggageFromUrlValid', 'get').mockReturnValue(true);

            offersService.fetchOffer = jest.fn().mockResolvedValue({
                hotel: {},
                offers: [
                    {
                        accom: {
                            unit: [{ code: 'code_from_offer' }],
                        },
                    } as IOfferWithoutAltBoards,
                ],
            } as ISpecificOffer);

            await store.fetchOffer(true);

            expect(rootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith('build_query');
        });

        it('should call setShowInvalidLuggageInUrlPopup with true and break when isExtraLuggageFromUrlValid is false', async () => {
            rootStore.routerStore.isHotelDetailsPage = jest.fn(() => true);
            const store = new BookingStore(rootStore);

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [offer] }));
            store.validatePackage = jest.fn();
            store.setShowInvalidLuggageInUrlPopup = jest.fn();
            jest.spyOn(store.extraLuggage, 'isExtraLuggageFromUrlValid', 'get').mockReturnValue(false);

            await store.fetchOffer(true);

            expect(store.setShowInvalidLuggageInUrlPopup).toHaveBeenCalledWith(true);
            expect(store.validatePackage).not.toHaveBeenCalled();
        });

        it('should create guest details if guestDetails length is zero', async () => {
            rootStore.routerStore.isHotelDetailsPage = jest.fn(() => true);
            const store = new BookingStore(rootStore);

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [offer] }));

            await store.fetchOffer(true);

            expect(rootStore.guestDetailsStore.createGuestsDetails).toHaveBeenCalled();
        });
    });

    describe('validatePackage', () => {
        it('should validate package without errors', async () => {
            const store = new BookingStore({
                holidayCreditStore: {
                    setCreditEnabledApiSettings: jest.fn(),
                },
                flightsPassengersStore: {
                    setPassengersStore: jest.fn(),
                },
                appStore: { setLoading: jest.fn() },
                guestDetailsStore: { createGuestsDetails: jest.fn(), guestsDetails: [] },
                paymentStore: { clearPaymentStore: jest.fn() },
                routerStore: {
                    redirectToSearchResultsPage: jest.fn(),
                    isHotelDetailsPage: jest.fn().mockReturnValue(true),
                    isPaymentPage: jest.fn().mockReturnValue(false),
                    isGuestDetailsPage: jest.fn().mockReturnValue(false),
                    history: {
                        location: {
                            pathname: '/booking',
                        },
                    },
                },
                layoutStore: {
                    isPaymentPage: false,
                    isHotelDetailsPage: true,
                    isGuestDetailsPage: false,
                    isViewBookingPage: jest.fn(),
                    isBookingsListPage: jest.fn(),
                    isPayBalancePage: jest.fn(),
                    isConfirmationPage: jest.fn(),
                    getSetting: jest.fn(),
                },
                searchStore: {
                    searchFrom: {
                        origins: [1, 2, 3],
                    },
                    searchTo: {
                        selectedDestinationCodes: [],
                    },
                    searchWhen: { from: new Date(), to: new Date(), selectedNumberOfNights: 2 },
                    searchWho: {
                        roomsAllocation: [
                            { adults: [], children: [], infants: [] },
                            { adults: [], children: [], infants: [] },
                        ],
                    },
                    selectedDestinationsQuery: 'dasd',
                },
                hotelsStore: {},
                seatMapStore: {
                    selectedSeats: [],
                    setValidatedSelectedSeats: jest.fn(),
                    setIsSelectedSeatsUnavailableError: jest.fn(),
                },
                airportParkingStore: {
                    selectedAirportParking: null,
                },
            } as any);

            const packageInfo = {
                requestId: 'test',
                creditIsEnabled: true,
                extraLuggageInfo: { items: [] },
            } as any;

            bookingService.validatePackage = jest.fn().mockReturnValue(Promise.resolve({ data: { ...packageInfo } }));

            store.extraLuggage.setExtraLuggageInfo = jest.fn();

            store.rootStore.guestDetailsStore.createGuestsDetails = jest.fn();
            store.extraLuggage.extraLuggageInfo = extraLuggageInfoMock;

            jest.spyOn(store.extraLuggage, 'luggageSelectionFromUrl', 'get').mockReturnValue({});
            jest.spyOn(store.extraLuggage, 'sportEquipmentSelectionFromUrl', 'get').mockReturnValue({});

            await store.validatePackage();

            expect(store.rootStore.guestDetailsStore.createGuestsDetails).toHaveBeenCalled();
            expect(store.extraLuggage.setExtraLuggageInfo).toHaveBeenCalledWith(packageInfo.extraLuggageInfo);
            expect(bookingService.validatePackage).toHaveBeenCalled();
            expect(store.isValidatingPackage).toBeFalsy();
            expect(store.isPackageValid).toBeTruthy();
        });

        it('should call handleValidatePackageException function when validate package fails', async () => {
            bookingService.validatePackage = jest.fn().mockRejectedValueOnce(new Error());

            const store = new BookingStore({
                appStore: {
                    setLoading: jest.fn(),
                },
                routerStore: {
                    redirectToSearchResultsPage: jest.fn(),
                    isHotelDetailsPage: jest.fn().mockReturnValue(true),
                    isPaymentPage: jest.fn().mockReturnValue(false),
                    isGuestDetailsPage: jest.fn().mockReturnValue(false),
                    history: {
                        location: {
                            pathname: '/booking',
                        },
                    },
                },
                layoutStore: {
                    isPaymentPage: false,
                    isHotelDetailsPage: true,
                    isGuestDetailsPage: false,
                    isViewBookingPage: jest.fn(),
                    isBookingsListPage: jest.fn(),
                    isPayBalancePage: jest.fn(),
                    isConfirmationPage: jest.fn(),
                    getSetting: jest.fn(),
                },
                paymentStore: { clearPaymentStore: jest.fn() },
                queryParamsStore: {
                    buildSearchQuery: jest.fn(),
                },
                hotelsStore: {},
                guestDetailsStore: { createGuestsDetails: jest.fn(), guestsDetails: [], clearGuestDetails: jest.fn() },
                searchStore: {
                    searchFrom: {
                        origins: [],
                    },
                    searchTo: {
                        selectedDestinationCodes: [],
                    },
                    searchWhen: {},
                    searchWho: {
                        roomsAllocation: [],
                    },
                },
                seatMapStore: {
                    selectedSeats: [],
                    setIsSelectedSeatsUnavailableError: jest.fn(),
                },
                airportParkingStore: {
                    selectedAirportParking: null,
                },
            } as any);
            const spy = jest.spyOn(store as any, 'handleValidatePackageException').mockImplementation(jest.fn());
            await store.validatePackage();

            expect(spy).toHaveBeenCalled();
        });

        it('should validate package with errors and set isPackageValid to false', async () => {
            const store = new BookingStore({
                appStore: {
                    setLoading: jest.fn(),
                },
                routerStore: {
                    redirectToSearchResultsPage: jest.fn(),
                    isHotelDetailsPage: jest.fn().mockReturnValue(true),
                    isPaymentPage: jest.fn().mockReturnValue(false),
                    isGuestDetailsPage: jest.fn().mockReturnValue(false),
                    history: {
                        location: {
                            pathname: '/booking',
                        },
                    },
                },
                layoutStore: {
                    isPaymentPage: false,
                    isHotelDetailsPage: true,
                    isGuestDetailsPage: false,
                    isViewBookingPage: jest.fn(),
                    isBookingsListPage: jest.fn(),
                    isPayBalancePage: jest.fn(),
                    isConfirmationPage: jest.fn(),
                    getSetting: jest.fn(),
                },
                paymentStore: { clearPaymentStore: jest.fn() },
                queryParamsStore: {
                    buildSearchQuery: jest.fn(),
                },
                hotelsStore: {},
                guestDetailsStore: { createGuestsDetails: jest.fn(), guestsDetails: [], clearGuestDetails: jest.fn() },
                searchStore: {
                    searchFrom: {
                        origins: [],
                    },
                    searchTo: {
                        selectedDestinationCodes: [],
                    },
                    searchWhen: {},
                    searchWho: {
                        roomsAllocation: [],
                    },
                },
                seatMapStore: {
                    selectedSeats: [],
                    setIsSelectedSeatsUnavailableError: jest.fn(),
                },
                airportParkingStore: {
                    selectedAirportParking: null,
                },
            } as any);

            bookingService.validatePackage = jest.fn().mockRejectedValueOnce(new Error());
            store.rootStore.guestDetailsStore.createGuestsDetails = jest.fn();
            store.extraLuggage.extraLuggageInfo = extraLuggageInfoMock;

            await store.validatePackage();

            expect(store.rootStore.guestDetailsStore.createGuestsDetails).toHaveBeenCalled();
            expect(bookingService.validatePackage).toHaveBeenCalled();
            expect(store.isValidatingPackage).toBeFalsy();
            expect(store.isPackageValid).toBeFalsy();
        });

        it('should call validatePackage twice when first call throws a NotAllSeatsForFlightSelected error', async () => {
            const error = {
                errorCode: ApiErrors.NotAllSeatsForFlightSelected,
            };
            const store = new BookingStore(rootStore);

            jest.spyOn(store, 'validatePackage');
            bookingService.validatePackage = jest
                .fn()
                .mockRejectedValueOnce(error)
                .mockResolvedValue({ data: { creditIsEnabled: false, transfers: [] } });

            await store.validatePackage();

            expect(store.validatePackage).toHaveBeenCalledTimes(2);
            expect(rootStore.seatMapStore.clearSelectedSeatsAndUpdateUrl).toHaveBeenCalled();
            expect(store.isPackageValid).toBeTruthy();
        });
    });

    describe('validatePromoCode (Holidays hooks)', () => {
        it('should call setCreditEnabledApiSettings and set applyingPromoCode on success', async () => {
            const packageInfo = {
                requestId: 'test',
                creditIsEnabled: true,
            } as IValidatePackageInfo;
            bookingService.validatePromoCode = jest.fn().mockResolvedValue({ data: packageInfo });
            bookingService.validatePackage = jest.fn().mockResolvedValue({ data: packageInfo });
            const store = new BookingStore(rootStore);
            store.priceManipulating = true;
            jest.spyOn(store, 'totalPrice', 'get').mockReturnValue(999);

            await store.validatePromoCode(jest.fn(), jest.fn());

            expect(rootStore.holidayCreditStore.setCreditEnabledApiSettings).toHaveBeenCalledWith(true);
            expect(store.applyingPromoCode).toBe(true);
        });

        it('should call reselectPayment when onApplyPromoCode succeeds', async () => {
            const packageInfo = { requestId: 'test', creditIsEnabled: false } as IValidatePackageInfo;
            bookingService.validatePromoCode = jest.fn().mockResolvedValue({ data: packageInfo });
            bookingService.validatePackage = jest.fn().mockResolvedValue({ data: packageInfo });
            const store = new BookingStore(rootStore);
            store.promoCode.setInLocalStorage = jest.fn();

            store.onApplyPromoCode('PROMO1');

            await new Promise(resolve => setImmediate(resolve));

            expect(rootStore.paymentStore.reselectPayment).toHaveBeenCalled();
        });

        it('should call redeemVoucherStore.cleanupRedeemStore when onErrorPromoCode is called', () => {
            const store = new BookingStore(rootStore);
            store.promoCode.onPromocodeErrorCallback = jest.fn();
            const mockApiError = {} as ApiError;

            store.onErrorPromoCode(mockApiError);

            expect(rootStore.redeemVoucherStore.cleanupRedeemStore).toHaveBeenCalled();
            expect(store.promoCode.onPromocodeErrorCallback).toHaveBeenCalledWith(mockApiError);
        });

        it('should include airport parking in both validatePromoCode and validatePackage calls when parking is selected', async () => {
            const packageInfo = { requestId: 'test', creditIsEnabled: false } as IValidatePackageInfo;
            bookingService.validatePromoCode = jest.fn().mockResolvedValue({ data: packageInfo });
            bookingService.validatePackage = jest.fn().mockResolvedValue({ data: packageInfo });
            const store = new BookingStore(rootStore);

            rootStore.airportParkingStore.selectedAirportParking = {
                title: 'Parking title',
                bookingDetails: {
                    productCode: 'LTM9',
                    totalPrice: 56.99,
                },
            } as any;

            await store.validatePromoCode(jest.fn(), jest.fn());

            const expectedBody = store.validateBookingRequestBody;
            expect(expectedBody.airportParking).toBeDefined();
            expect(bookingService.validatePromoCode).toHaveBeenCalledWith(expectedBody);
            expect(bookingService.validatePackage).toHaveBeenCalledWith(expectedBody);
        });
    });

    describe('handleValidatePackageException', () => {
        let store: BookingStore;
        let apiError: ApiError;
        let apiErrorWithoutInnerErrors: ApiError;

        const createApiError = (innerErrors: IApiInnerError[] | null): ApiError =>
            new ApiError(
                new AxiosError('', undefined, undefined, undefined, {
                    data: {
                        additionalData: { field: '' },
                        code: 'API-ERR-100000',
                        correlationId: '',
                        error: '',
                        innerErrors: innerErrors,
                        stackTrace: '',
                    },
                    status: 400,
                } as unknown as AxiosResponse<IApiErrorData>),
            );

        beforeEach(() => {
            store = new BookingStore(rootStore);
            apiError = createApiError([{ code: 'E11037', message: '' }]);
            apiErrorWithoutInnerErrors = createApiError(null);
        });

        it('should set isAirportParkingValidationError when error is airport parking validation error', () => {
            jest.spyOn(store as any, 'isEveryErrorAirportParkingError').mockReturnValue(true);
            store['handleValidatePackageException'](apiError);

            expect(store.isAirportParkingValidationError).toBe(true);
        });

        it('should set isAirportParkingValidationError to false when error is not airport parking validation error', () => {
            jest.spyOn(store as any, 'isEveryErrorAirportParkingError').mockReturnValue(false);
            store['handleValidatePackageException'](apiError);

            expect(store.isAirportParkingValidationError).toBe(false);
        });

        it('should set isAirportParkingValidationError to false when inner errors is null', () => {
            jest.spyOn(store as any, 'isEveryErrorAirportParkingError').mockReturnValue(false);
            store['handleValidatePackageException'](apiErrorWithoutInnerErrors);

            expect(store.isAirportParkingValidationError).toBe(false);
        });

        it('should call endHandleValidatePackageException when error is airport parking validation error', () => {
            store['endHandleValidatePackageException'] = jest.fn();
            jest.spyOn(store as any, 'isEveryErrorAirportParkingError').mockReturnValue(true);
            store['handleValidatePackageException'](apiError);

            expect(store['endHandleValidatePackageException']).toHaveBeenCalled();
        });
    });

    describe('endHandleValidatePackageException', () => {
        let store: BookingStore;

        beforeEach(() => {
            store = new BookingStore(rootStore);
        });

        it('should not call onError if onError is passed', () => {
            const onError = jest.fn();
            store['endHandleValidatePackageException']();

            expect(onError).not.toHaveBeenCalled();
        });

        it('should call onError if onError is passed', () => {
            const onError = jest.fn();
            store['endHandleValidatePackageException'](onError);

            expect(onError).toHaveBeenCalled();
        });

        it('should call clearPromoCode if onError is passed', () => {
            store.clearPromoCode = jest.fn();
            store['endHandleValidatePackageException']();

            expect(store.clearPromoCode).toHaveBeenCalled();
        });
    });

    describe('isEveryErrorAirportParkingError', () => {
        const store = new BookingStore(rootStore);

        it('should return true if every error code is airport parking error', () => {
            jest.spyOn(store as any, 'isAirportParkingError').mockReturnValue(true);
            const response = store['isEveryErrorAirportParkingError'](['error1', 'error2']);

            expect(response).toBe(true);
        });

        it('should return false if no errors codes are passed', () => {
            const response = store['isEveryErrorAirportParkingError']([]);

            expect(response).toBe(false);
        });

        it('should return false if at least one error code is other airport parking error', () => {
            jest.spyOn(store as any, 'isAirportParkingError')
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);
            const response = store['isEveryErrorAirportParkingError']([
                'errorParking1',
                'errorThatIsNOTParking1',
                'errorParking2',
            ]);

            expect(response).toBe(false);
        });
    });

    describe('isAirportParkingError', () => {
        const store = new BookingStore(rootStore);

        it('should return true if error is airport parking error', () => {
            const response = store['isAirportParkingError'](AIRPORT_PARKING_VALIDATION_API_ERRORS[0]);
            expect(response).toBe(true);
        });

        it('should return false if error is other airport parking error', () => {
            const response = store['isAirportParkingError']('not-present-error');
            expect(response).toBe(false);
        });
    });

    describe('createBookingBody', () => {
        it('should update  only sessionId and bookingReference when no threeDSData', () => {
            const store = new BookingStore(rootStore);
            store.guestsInfoPayload = {
                guests: [],
                leadPassenger: {},
                promoCode: '',
                deviceId: '000-111',
            };

            Object.defineProperty(store, 'commitBookingRequestBody', {
                get: jest.fn(() => ({})),
                set: jest.fn(),
            });
            const bookingBody = store['createBookingBody'](null);

            expect(bookingBody).toEqual({
                sessionId: undefined,
                bookingReference: undefined,
                deviceId: '000-111',
            });
        });

        it('should update paymentInfo', () => {
            rootStore.payStore = { sessionId: '12345', threeDSServerTransID: 'threeDSServerTransID' };
            rootStore.paymentStore = { bookingReference: '67890' };

            rootStore.payStore.selectedPaymentType = PaymentType.Card;
            const store = new BookingStore(rootStore);

            store.guestsInfoPayload = {
                guests: [],
                leadPassenger: {},
                promoCode: '',
                deviceId: '000-111',
            };

            const threeDSData = {
                md: 'md',
                paRes: 'paRes',
                issuerUrl: 'issuerUrl',
                challengeComplete: 'challengeComplete',
                bookingReference: 'bookingReference',
                requestId: 'requestId',
                sessionId: 'sessionId',
                transStatus: 'Y',
                threeDSEventType: '3ds1',
            };

            Object.defineProperty(store, 'commitBookingRequestBody', {
                get: jest.fn(() => ({ paymentInfo: {} as IBookingPaymentInfo })),
                set: jest.fn(),
            });

            const bookingBody = store['createBookingBody'](threeDSData as any);

            expect(bookingBody).toEqual({
                paymentInfo: {
                    threeDSServerTransID: 'threeDSServerTransID',
                    md: 'md',
                    paRes: 'paRes',
                    issuerUrl: 'issuerUrl',
                    challengeComplete: 'challengeComplete',
                    transStatus: 'Y',
                },
                requestId: 'requestId',
                sessionId: 'sessionId',
                bookingReference: 'bookingReference',
                deviceId: '000-111',
            });
        });
    });

    describe('handleCommitBookingError', () => {
        let store;
        let error;

        beforeEach(() => {
            store = new BookingStore(rootStore);
            error = {
                errorCode: ApiErrors.CommitBookingError,
                correlationId: 'id',
                innerErrors: [
                    {
                        code: ApiErrors.CommitBookingPriceJump,
                        message: '2000',
                    },
                ],
            };
        });

        it('should call setPaymentError when innerErrors are NOT provided', () => {
            error.innerErrors = [];

            store.handleCommitBookingError(error);

            expect(rootStore.payStore.setPaymentError).toHaveBeenCalledWith({
                ...commitBookingError,
                correlationId: 'id',
            });
        });

        it('should set isPaymentPriceJump and priceAfterJump when first inner error is CommitBookingPriceJump', () => {
            store.handleCommitBookingError(error);

            expect(rootStore.payStore.setPaymentError).not.toHaveBeenCalled();
            expect(store.isPaymentPriceJump).toBe(true);
            expect(store.priceAfterJump).toBe(2000);
        });

        it('should set priceAfterJump to 0 when first inner error is CommitBookingPriceJump and message is undefined', () => {
            error.innerErrors[0].message = undefined;

            store.handleCommitBookingError(error);

            expect(store.isPaymentPriceJump).toBe(true);
            expect(store.priceAfterJump).toBe(0);
        });
    });

    describe('selectedBoardType', () => {
        it('should return null in no items in unit', async () => {
            const offer = {
                accom: {
                    unit: [],
                },
            };
            const store = new BookingStore(rootStore);
            store.selectedOffer = offer as any;
            expect(store.boardType).toEqual(null);
        });

        it('should return null when unit not defined', async () => {
            const offer = {
                accom: {},
            };
            const store = new BookingStore(rootStore);
            store.selectedOffer = offer as any;
            expect(store.boardType).toEqual(null);
        });

        it('should return board type from selected offer', async () => {
            const board = {
                code: 'test',
                content: 'content',
                description: 'description',
                iconUrl: 'icon/url',
                title: 'title',
            } as IBoardType;
            const offer = {
                accom: {
                    unit: [{ boardType: board }],
                },
            };
            const store = new BookingStore(rootStore);
            store.selectedOffer = offer as any;
            expect(store.boardType).toEqual(board);
        });
    });

    describe('allBoardTypes', () => {
        it('should return all boards for selected offer', async () => {
            const offer = {
                accom: {
                    unit: [
                        {
                            isFreeBoardUpgrade: false,
                            boardType: {
                                code: 'test',
                                content: 'content',
                                description: 'description',
                                iconUrl: 'icon/url',
                                title: 'title',
                            } as IBoardType,
                        },
                    ],
                },
            };

            const alternativeBoards = [
                {
                    code: 'test1',
                    content: 'content',
                    description: 'description',
                    iconUrl: 'icon/url',
                    title: 'title',
                    price: 100,
                    pricePP: 100,
                } as IAltBoard,
            ];

            const store = new BookingStore(rootStore);

            store.selectedOffer = offer as any;
            store.alternativeBoards = alternativeBoards;

            const expectedResult = [
                {
                    code: 'test',
                    content: 'content',
                    description: 'description',
                    iconUrl: 'icon/url',
                    title: 'title',
                    price: 0,
                    pricePP: 0,
                    isFreeBoardUpgrade: false,
                },
                {
                    code: 'test1',
                    content: 'content',
                    description: 'description',
                    iconUrl: 'icon/url',
                    title: 'title',
                    price: 100,
                    pricePP: 100,
                },
            ];

            expect(store.allBoardTypes).toEqual(expectedResult);
        });

        it('should return empty array when no offer selected', async () => {
            const store = new BookingStore(rootStore);
            store.selectedOffer = null;
            expect(store.allBoardTypes).toEqual([]);
        });
    });

    describe('isHolidayDataAvailable', () => {
        it('should return true when selectedOffer exists, package is valid, and data has not failed to load', () => {
            const store = new BookingStore(rootStore);
            store.selectedOffer = offer;
            store.isPackageValid = true;
            store.failedToLoadData = false;

            expect(store.isHolidayDataAvailable).toBe(true);
        });

        it('should return false when selectedOffer is undefined', () => {
            const store = new BookingStore(rootStore);
            store.selectedOffer = undefined;
            store.isPackageValid = true;
            store.failedToLoadData = false;

            expect(store.isHolidayDataAvailable).toBe(false);
        });

        it('should return false when package is not valid', () => {
            const store = new BookingStore(rootStore);
            store.selectedOffer = offer;
            store.isPackageValid = false;
            store.failedToLoadData = false;

            expect(store.isHolidayDataAvailable).toBe(false);
        });

        it('should return false when data has failed to load', () => {
            const store = new BookingStore(rootStore);
            store.selectedOffer = offer;
            store.isPackageValid = true;
            store.failedToLoadData = true;

            expect(store.isHolidayDataAvailable).toBe(false);
        });
    });

    describe('allAlternativeRooms', () => {
        it('should return a flat array of all alternative rooms', () => {
            const store = new BookingStore(rootStore);
            store.alternativeRooms = [[unit as IUnit], [unit2]];

            expect(store.allAlternativeRooms).toEqual([unit, unit2]);
        });

        it('should return an empty array when there are no alternative rooms', () => {
            const store = new BookingStore(rootStore);
            store.alternativeRooms = [];

            expect(store.allAlternativeRooms).toEqual([]);
        });

        it('should handle nested empty arrays', () => {
            const store = new BookingStore(rootStore);
            store.alternativeRooms = [[], [unit as IUnit], []];

            expect(store.allAlternativeRooms).toEqual([unit]);
        });
    });

    describe('changeFlight', () => {
        const createStore = () => new BookingStore(rootStore);
        let store = createStore();

        beforeEach(() => {
            store = createStore();
            store.selectedOffer = {
                transport: {
                    routes: [{}, {}] as any,
                },
                hotel: {
                    test: 'initial hotel',
                },
            } as any;
            store.changeIsClickChangeButton = jest.fn();
            store.togglePriceManipulating = jest.fn();
            store.fetchOfferAndReloadPage = jest.fn();
            store.loadRecommendedHotels = jest.fn();
            store.clearAncillariesAndUpdateUrl = jest.fn();
            store.clearFlightNumbersAndUpdateUrl = jest.fn();
        });

        it('should update offer', async () => {
            await store.changeFlight({ offer, priceDiff: 100, reloadOffer: false });

            expect(store.changeIsClickChangeButton).toHaveBeenCalledWith(true);
            expect(store.selectedOffer).toEqual({
                ...offer,
                ...mockTouristTaxFields,
                hotel: store.selectedOffer?.hotel,
            });
            expect(store.togglePriceManipulating).not.toHaveBeenCalled();
            expect(store.fetchOfferAndReloadPage).not.toHaveBeenCalled();
            expect(store.loadRecommendedHotels).not.toHaveBeenCalled();
            expect(store.clearAncillariesAndUpdateUrl).toHaveBeenCalled();
            expect(store.clearFlightNumbersAndUpdateUrl).toHaveBeenCalled();
            expect(store.rootStore.trackingStore.holidayConfigChangeTrigger).toHaveBeenCalledWith(
                EventTypes.FlightUpdate,
                100,
                [{}, {}],
            );
        });

        it('should change selectedTransferFromUrl to offer transfer code when they are different from each other', async () => {
            store.selectedTransferFromUrl = 'test1';
            offer.transfers = [{ code: mockTransfer.code }];

            await store.changeFlight({ offer, priceDiff: 100, reloadOffer: false });

            expect(store.selectedTransferFromUrl).toBe(offer.transfers[0].code);
        });

        it('should change selectedOffer transfers to transfers from offer when selectedTransferFromUrl is equal to selectedTransferCode', async () => {
            store.selectedTransferFromUrl = mockTransfer.code;
            offer.transfers = [{ code: mockTransfer.code }];

            await store.changeFlight({ offer, priceDiff: 100, reloadOffer: false });

            expect(store.selectedOffer?.transfers).toStrictEqual(offer.transfers);
        });

        it('should call togglePriceManipulating when it is extras page', async () => {
            rootStore.layoutStore.isExtrasPage = true;

            await store.changeFlight({ offer, priceDiff: 100, reloadOffer: false });

            expect(store.togglePriceManipulating).toHaveBeenCalledWith(true);
        });

        it('should reload offer', async () => {
            await store.changeFlight({
                offer,
                priceDiff: 100,
                reloadOffer: true,
                isPriceGraphEventTarget: false,
                board: 'AI',
                rooms: [],
                isExt: true,
                disableLoadAlternativeFlights: true,
            });

            expect(store.fetchOfferAndReloadPage).toHaveBeenCalledWith(true, true, undefined, 'AI', [], true, true);
        });

        it('should call loadRecommendedHotels when it is hotel details book page', async () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;

            store.selectedOffer = {
                transport: {
                    routes: [{}, {}] as any,
                },
                hotel: {
                    test: 'initial hotel',
                },
            } as any;
            store.loadRecommendedHotels = jest.fn();

            await store.changeFlight({ offer, priceDiff: 100, reloadOffer: false });

            expect(store.loadRecommendedHotels).toHaveBeenCalled();
        });
    });

    describe('loadRecommendedHotels', () => {
        const createStore = () => new BookingStore(rootStore);
        let store;
        const mockSelectedNumberOfNights = 8;
        const mockFrom = new Date('2025-11-11');

        beforeEach(() => {
            store = createStore();

            offersService.fetchRecommendedOffers = jest.fn();
            rootStore.layoutStore.isPromoPage = false;
            rootStore.searchStore.searchWhen.selectedNumberOfNights = mockSelectedNumberOfNights;
            rootStore.searchStore.searchWhen.from = mockFrom;
            rootStore.searchStore.searchTo.selectedAccommodationCodes = 'XYZ';
        });

        it('should pass atcomCode, from and selectedNumberOfNights param values from searchWhen & searchTo stores when these fields are not defined in booking store', async () => {
            store.from = null;
            store.selectedOffer = null;
            jest.spyOn(store, 'selectedNumberOfNights', 'get').mockReturnValue(0);

            await store.loadRecommendedHotels(Bd4TravelPlacementId.Destination);

            expect(offersService.fetchRecommendedOffers).toHaveBeenCalledWith(
                rootStore.searchStore.searchWhen.from,
                3,
                [`${rootStore.searchStore.searchWhen.selectedNumberOfNights}`],
                'LGW',
                'ES',
                undefined,
                [{ adults: 2, children: 1, childrenAges: [0], infants: 1, roomCode: '' }],
                undefined,
                '',
                undefined,
                'ejh-reco-dg-central',
                rootStore.searchStore.searchTo.selectedAccommodationCodes,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
            );
        });

        it('should use promoPageStore from/to directly when isDynamicPromoPage is true and selectedNumberOfNights is 0', async () => {
            rootStore.layoutStore.isPromoPage = true;
            rootStore.layoutStore.isDynamicPromoPage = true;

            const promoStart = new Date('2025-12-01');
            const promoEnd = new Date('2025-12-10');

            rootStore.promoPageStore.from = promoStart;
            rootStore.promoPageStore.to = promoEnd;

            jest.spyOn(store, 'selectedNumberOfNights', 'get').mockReturnValue(0);
            store.selectedOffer = null;

            const getPromoPageDatesMock = jest.spyOn(promoUtils, 'getPromoPageDates');

            await store.loadRecommendedHotels(Bd4TravelPlacementId.Destination);

            expect(getPromoPageDatesMock).not.toHaveBeenCalled();

            expect(offersService.fetchRecommendedOffers).toHaveBeenCalledWith(
                promoStart,
                3,
                [],
                'LGW',
                'ES',
                undefined,
                [{ adults: 2, children: 1, childrenAges: [0], infants: 1, roomCode: '' }],
                undefined,
                '',
                undefined,
                'ejh-reco-dg-central',
                rootStore.searchStore.searchTo.selectedAccommodationCodes,
                promoEnd,
                undefined,
                true,
                rootStore.layoutStore.layoutId,
                rootStore.searchStore.selectedDestinationsQuery,
            );
        });

        it('should pass atcomCode, from and selectedNumberOfNights param values from booking store when they are defined', async () => {
            store.selectedOffer = {
                ...mockedOffer,
            };
            rootStore.searchStore.searchWho.isKidsGoFree = true;

            await store.loadRecommendedHotels(Bd4TravelPlacementId.Destination);

            expect(offersService.fetchRecommendedOffers).toHaveBeenCalledWith(
                new Date(store.selectedOffer.date),
                3,
                [`${store.selectedNumberOfNights}`],
                'LGW',
                'ES',
                undefined,
                [{ adults: 2, children: 1, childrenAges: [0], infants: 1, roomCode: '' }],
                undefined,
                FilterGroupCodes.FreeForKidsOnly,
                undefined,
                'ejh-reco-dg-central',
                mockedOffer.accom.code,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
            );
        });

        it('should use promoPageStore dates via getPromoPageDates and pass empty duration when isPromoPage and selectedNumberOfNights is 0', async () => {
            rootStore.layoutStore.isPromoPage = true;
            const promoStart = new Date('2025-12-01');
            const promoEnd = new Date('2025-12-10');

            rootStore.promoPageStore.from = promoStart;
            rootStore.promoPageStore.to = promoEnd;

            const getPromoPageDatesMock = jest.spyOn(promoUtils, 'getPromoPageDates').mockReturnValue({
                startDate: promoStart,
                endDate: promoEnd,
            });

            jest.spyOn(store, 'selectedNumberOfNights', 'get').mockReturnValue(0);
            store.selectedOffer = null;

            await store.loadRecommendedHotels(Bd4TravelPlacementId.Destination);

            expect(getPromoPageDatesMock).toHaveBeenCalledWith(rootStore.layoutStore.layout, promoStart, promoEnd);

            expect(offersService.fetchRecommendedOffers).toHaveBeenCalledWith(
                promoStart,
                3,
                [],
                'LGW',
                'ES',
                undefined,
                [{ adults: 2, children: 1, childrenAges: [0], infants: 1, roomCode: '' }],
                undefined,
                '',
                undefined,
                'ejh-reco-dg-central',
                rootStore.searchStore.searchTo.selectedAccommodationCodes,
                promoEnd,
                undefined,
                true,
                rootStore.layoutStore.layoutId,
                rootStore.searchStore.selectedDestinationsQuery,
            );
        });
    });

    describe('changeRoom', () => {
        const createStore = () => new BookingStore(rootStore);
        let store = createStore();

        beforeEach(() => {
            store = createStore();
            store.selectedOffer = {
                accom: {
                    unit: [unit],
                },
                isExt: false,
            } as any;
            store.changeIsClickChangeButton = jest.fn();
            store.togglePriceManipulating = jest.fn();
            store.fetchOffer = jest.fn();
        });

        it('should update room in selected offer without new board when requireBoardAlteration is undefined', async () => {
            const newRoom = {
                ...unit2,
                board: store.selectedOffer?.accom.unit[0].board,
            };

            await store.changeRoom(0, unit2, 100);

            expect(store.changeIsClickChangeButton).toHaveBeenCalledWith(true);
            expect(store.selectedOffer?.accom.unit[0]).toEqual(newRoom);
            expect(store.togglePriceManipulating).not.toHaveBeenCalled();
            expect(store.rootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith('query');
            expect(store.fetchOffer).toHaveBeenCalledWith(true, true, expect.any(Function), undefined);
            expect(store.rootStore.trackingStore.holidayConfigChangeTrigger).toHaveBeenCalledWith(
                EventTypes.RoomUpdate,
                100,
            );
        });

        it('should call togglePriceManipulating when it is Extras page', async () => {
            rootStore.layoutStore.isExtrasPage = true;
            await store.changeRoom(0, unit2, 100);

            expect(store.togglePriceManipulating).toHaveBeenCalledWith(true);
        });

        it('should fetch offer', async () => {
            await store.changeRoom(0, unit2, 100);

            expect(store.fetchOffer).toHaveBeenCalled();
        });

        it('should call swapAccommodations', async () => {
            await store.changeRoom(0, unit2, 100);

            expect(swapOfferAccommodations).toHaveBeenCalled();
        });

        it('should change isExt', async () => {
            await store.changeRoom(0, unit2, 100);

            expect(store.selectedOffer?.accom.isExt).toBe(true);
        });

        it('should fetch offer with new boardType when a new room has a requireBoardAlteration param', async () => {
            unit2.requireBoardAlteration = 'AI';

            await store.changeRoom(0, unit2, 100);

            expect(store.fetchOffer).toHaveBeenCalledWith(true, true, expect.any(Function), 'AI');
        });

        it('should update room and board in selected offer when requireBoardAlteration', async () => {
            unit2.requireBoardAlteration = 'HB';
            const newRoom = {
                ...unit2,
                board: unit2.requireBoardAlteration,
            };

            await store.changeRoom(0, unit2, 100);

            expect(store.selectedOffer?.accom.unit[0]).toEqual(newRoom);
        });

        it('should keep the previous boardType if the selected unit does not have one', async () => {
            delete (unit2 as { boardType?: IBoardType }).boardType;

            await store.changeRoom(0, unit2, 100);

            expect(store.selectedOffer?.accom.unit[0].boardType).toStrictEqual(unit.boardType);
        });
    });

    describe('changeTransfer', () => {
        const createStore = () => new BookingStore(rootStore);
        let store = createStore();

        beforeEach(() => {
            store = createStore();

            store.selectedOffer = { transfers: [] } as any;
            store.transferCandidate = mockAltSharedTransfer;

            store.changeIsClickChangeButton = jest.fn();
            store.togglePriceManipulating = jest.fn();
            store.fetchOffer = jest.fn();
            store.setTransferCandidate = jest.fn();
            store.setIsTransferRemoveSE = jest.fn();
        });

        it('should update selected offer transfers', async () => {
            store.failedToLoadData = true;

            await store.changeTransfer(mockTransfer);

            expect(store.changeIsClickChangeButton).toHaveBeenCalled();
            expect(store.togglePriceManipulating).not.toHaveBeenCalled();
            expect(store.selectedTransferFromUrl).toEqual(mockTransfer.code);
            expect(store.selectedOffer!.transfers).toEqual([mockTransfer]);
            expect(store.fetchOffer).toHaveBeenCalledWith(true);
            expect(store.rootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
            expect(store.setTransferCandidate).not.toHaveBeenCalled();
            expect(store.setIsTransferRemoveSE).not.toHaveBeenCalled();
        });

        it('should call togglePriceManipulating when it is Extras page', async () => {
            rootStore.layoutStore.isExtrasPage = true;
            store.failedToLoadData = true;

            await store.changeTransfer(mockTransfer);

            expect(store.togglePriceManipulating).toHaveBeenCalledWith(true);
        });

        describe('SE accommodation', () => {
            beforeEach(() => {
                jest.spyOn(store.extraLuggage, 'sportEquipmentNumber', 'get').mockReturnValue(2);
                jest.spyOn(store, 'isEnoughTimeForAddSETransfer', 'get').mockReturnValue(false);
            });

            it('should set SE accommodation fail params when SE AND transfer exists AND NOT enough time for it', async () => {
                await store.changeTransfer(mockTransfer);

                expect(store.setTransferCandidate).toHaveBeenCalledWith(mockTransfer);
                expect(store.setIsTransferRemoveSE).toHaveBeenCalledWith(true);
            });

            it('should NOT set SE accommodation fail params AND get transfer from transferCandidate when NO transfer passed', async () => {
                await store.changeTransfer();

                expect(store.setTransferCandidate).not.toHaveBeenCalledWith(mockTransfer);
                expect(store.setIsTransferRemoveSE).not.toHaveBeenCalled();
                expect(store.selectedTransferFromUrl).toEqual(mockAltSharedTransfer.code);
                expect(store.selectedOffer!.transfers).toEqual([mockAltSharedTransfer]);
            });

            it('should NOT set SE accommodation fail params when transfer type is NoTransfer', async () => {
                await store.changeTransfer(mockAltNoTransfer);

                expect(store.setTransferCandidate).not.toHaveBeenCalledWith(mockAltNoTransfer);
                expect(store.setIsTransferRemoveSE).not.toHaveBeenCalled();
            });

            it('should NOT set SE accommodation fail params when no SE added', async () => {
                jest.spyOn(store.extraLuggage, 'sportEquipmentNumber', 'get').mockReturnValue(0);

                await store.changeTransfer(mockTransfer);

                expect(store.setTransferCandidate).not.toHaveBeenCalledWith(mockTransfer);
                expect(store.setIsTransferRemoveSE).not.toHaveBeenCalled();
            });

            it('should NOT set SE accommodation fail params when enough time to alert', async () => {
                jest.spyOn(store, 'isEnoughTimeForAddSETransfer', 'get').mockReturnValue(true);

                await store.changeTransfer(mockTransfer);

                expect(store.setTransferCandidate).not.toHaveBeenCalledWith(mockTransfer);
                expect(store.setIsTransferRemoveSE).not.toHaveBeenCalled();
            });
        });

        it('should call updateCurrentPage when offer was successfully loaded', async () => {
            await store.changeTransfer(mockTransfer);

            expect(store.setTransferCandidate).toHaveBeenCalledWith(null);
            expect(store.rootStore.trackingStore.trackTransferChange).toHaveBeenCalledWith(
                store.selectedOffer?.transfers[0],
                EventTypes.AddToBasket,
            );
            expect(store.rootStore.routerStore.updateCurrentPage).toHaveBeenCalled();
        });

        it('should NOT call updateCurrentPage when offer was unsuccessfully loaded', async () => {
            store.failedToLoadData = true;
            await store.changeTransfer(mockTransfer);

            expect(store.rootStore.trackingStore.trackTransferChange).not.toHaveBeenCalled();
            expect(store.rootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
        });
    });

    describe('isFlightAndHotelPackage', () => {
        it('should return true when booking has FlightAndHotel promo code', () => {
            const store = new BookingStore(rootStore);
            store.booking = { promoCollections: ['fph'] } as any;

            expect(store.isFlightAndHotelPackage).toBe(true);
        });

        it('should return false when booking has no FlightAndHotel promo code', () => {
            const store = new BookingStore(rootStore);
            store.booking = { promoCollections: [] } as any;

            expect(store.isFlightAndHotelPackage).toBe(false);
        });

        it('should return false when booking is null', () => {
            const store = new BookingStore(rootStore);
            store.booking = null;

            expect(store.isFlightAndHotelPackage).toBe(false);
        });

        it('should return true when selectedOffer has FlightAndHotel promo code', () => {
            const store = new BookingStore(rootStore);
            store.selectedOffer = { promoCollections: ['fph'] } as any;
            store.booking = null;

            expect(store.isFlightAndHotelPackage).toBe(true);
        });

        it('should return false when selectedOffer has no FlightAndHotel promo code, even if booking does', () => {
            const store = new BookingStore(rootStore);
            store.selectedOffer = { promoCollections: [] } as any;
            store.booking = { promoCollections: ['fph'] } as any;

            expect(store.isFlightAndHotelPackage).toBe(false);
        });

        it('should fall back to booking promoCollections when selectedOffer is null', () => {
            const store = new BookingStore(rootStore);
            store.selectedOffer = null;
            store.booking = { promoCollections: ['fph'] } as any;

            expect(store.isFlightAndHotelPackage).toBe(true);
        });
    });

    describe('loadBookingConfirmationInfo', () => {
        it('should load booking confirmation info and set it', async () => {
            const store = new BookingStore(rootStore);
            const extraLuggageInfoMock = { items: ['item1', 'item2'] };
            const result = { data: { extraLuggageInfo: extraLuggageInfoMock, isLoggedInAsLeadPassenger: true } };
            const payloadMock = {
                date: '2023-10-30',
                bookingReference: 'ABC123',
                lastName: 'Doe',
                avail: 1,
            };

            bookingService.viewBooking = jest.fn(() => result) as any;

            store.bookingInfoPayload = payloadMock;
            store.extraLuggage.setExtraLuggageInfo = jest.fn();

            expect(store.booking).toBeUndefined();

            await store.loadBookingConfirmationInfo();

            expect(rootStore.userStore.setUserDetails).toHaveBeenCalled();
            expect(bookingService.viewBooking).toHaveBeenCalledWith(
                payloadMock.date,
                payloadMock.bookingReference,
                payloadMock.lastName,
            );
            expect(store.booking).toEqual(result.data);
            expect(rootStore.flightsPassengersStore.setPassengersStore).toHaveBeenCalledWith(result.data);
            expect(store.extraLuggage.setExtraLuggageInfo).toHaveBeenCalledWith(extraLuggageInfoMock);
            expect(mockSetWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.LatestConfirmedBooking,
                payloadMock,
                sessionStorage,
            );
        });

        it('should NOT save booking confirmation info to session storage when user is not logged in as lead passenger', async () => {
            const store = new BookingStore(rootStore);
            store.bookingInfoPayload = {
                date: '2023-10-30',
                bookingReference: 'ABC123',
                lastName: 'Doe',
                avail: 1,
            };
            const result = { data: { isLoggedInAsLeadPassenger: false } };

            bookingService.viewBooking = jest.fn(() => result) as any;

            await store.loadBookingConfirmationInfo();
            expect(mockSetWebStorageItem).not.toHaveBeenCalled();
        });

        it('should NOT save to session storage when booking promo code matches a promotion in HideBookingsWithPromotion setting', async () => {
            const store = new BookingStore(rootStore);
            store.bookingInfoPayload = {
                date: '2023-10-30',
                bookingReference: 'ABC123',
                lastName: 'Doe',
                avail: 1,
            };
            const result = {
                data: {
                    isLoggedInAsLeadPassenger: true,
                    promoCollections: [OfferPromotionCodes.Luxury],
                },
            };

            bookingService.viewBooking = jest.fn(() => result) as any;
            rootStore.layoutStore.getSetting.mockReturnValue(['Luxury']);

            await store.loadBookingConfirmationInfo();

            expect(mockSetWebStorageItem).not.toHaveBeenCalled();
        });

        it('should NOT save to session storage when booking promo code matches one of multiple promotions in HideBookingsWithPromotion setting', async () => {
            const store = new BookingStore(rootStore);
            store.bookingInfoPayload = {
                date: '2023-10-30',
                bookingReference: 'ABC123',
                lastName: 'Doe',
                avail: 1,
            };
            const result = {
                data: {
                    isLoggedInAsLeadPassenger: true,
                    promoCollections: [OfferPromotionCodes.FlightAndHotel],
                },
            };

            bookingService.viewBooking = jest.fn(() => result) as any;
            rootStore.layoutStore.getSetting.mockReturnValue(['Luxury', 'Flight Plus Hotel']);

            await store.loadBookingConfirmationInfo();

            expect(mockSetWebStorageItem).not.toHaveBeenCalled();
        });

        it('should save to session storage when booking promo code does not match any promotion in HideBookingsWithPromotion setting', async () => {
            const store = new BookingStore(rootStore);
            const payloadMock = {
                date: '2023-10-30',
                bookingReference: 'ABC123',
                lastName: 'Doe',
                avail: 1,
            };
            store.bookingInfoPayload = payloadMock;
            const result = {
                data: {
                    isLoggedInAsLeadPassenger: true,
                    promoCollections: [OfferPromotionCodes.Luxury],
                },
            };

            bookingService.viewBooking = jest.fn(() => result) as any;
            rootStore.layoutStore.getSetting.mockReturnValue(['Flight Plus Hotel']);

            await store.loadBookingConfirmationInfo();

            expect(mockSetWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.LatestConfirmedBooking,
                payloadMock,
                sessionStorage,
            );
        });

        it('should save to session storage when HideBookingsWithPromotion setting is empty', async () => {
            const store = new BookingStore(rootStore);
            const payloadMock = {
                date: '2023-10-30',
                bookingReference: 'ABC123',
                lastName: 'Doe',
                avail: 1,
            };
            store.bookingInfoPayload = payloadMock;
            const result = {
                data: {
                    isLoggedInAsLeadPassenger: true,
                    promoCollections: [OfferPromotionCodes.Luxury],
                },
            };

            bookingService.viewBooking = jest.fn(() => result) as any;
            rootStore.layoutStore.getSetting.mockReturnValue([]);

            await store.loadBookingConfirmationInfo();

            expect(mockSetWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.LatestConfirmedBooking,
                payloadMock,
                sessionStorage,
            );
        });

        it('should save to session storage when booking has no promoCollections', async () => {
            const store = new BookingStore(rootStore);
            const payloadMock = {
                date: '2023-10-30',
                bookingReference: 'ABC123',
                lastName: 'Doe',
                avail: 1,
            };
            store.bookingInfoPayload = payloadMock;
            const result = {
                data: {
                    isLoggedInAsLeadPassenger: true,
                },
            };

            bookingService.viewBooking = jest.fn(() => result) as any;
            rootStore.layoutStore.getSetting.mockReturnValue(['Luxury', 'Flight Plus Hotel']);

            await store.loadBookingConfirmationInfo();

            expect(mockSetWebStorageItem).toHaveBeenCalledWith(
                WebStorageKeys.LatestConfirmedBooking,
                payloadMock,
                sessionStorage,
            );
        });
    });

    describe('payRemainingBalance', () => {
        const createStore = () => new BookingStore(rootStore);

        let store = createStore();

        beforeEach(() => {
            store = createStore();

            store.booking = {
                package: {
                    accom: {
                        startDate: '1995-12-17T03:24:00',
                    },
                    transport: {
                        routes: mockFlightsRoutes,
                    },
                },
                bookingReference: '12345',
                guests: [
                    {
                        lastName: 'Tester',
                        isLead: true,
                    } as any,
                ],
            } as any;
            store.bookingInfoPayload = { billingInfo: { value: 'bookingInfoPayload' } } as any;
        });

        it('should pay', () => {
            store.payRemainingBalance();

            expect(rootStore.trackingStore.setPreviousPage).toHaveBeenCalled();
            expect(paymentTransaction.startNewTransaction).toHaveBeenCalledWith('12345');
            expect(formActions.submitForm).toHaveBeenCalledWith(
                `/en/holidays${SitePath.PayBalance}`,
                'pay-balance-payload',
                {
                    bookingReference: '12345',
                    date: '2023-05-11',
                    lastName: 'Tester',
                    billingInfo: { value: 'bookingInfoPayload' },
                    package: {
                        accom: {
                            startDate: '1995-12-17T03:24:00',
                        },
                        transport: {
                            routes: mockFlightsRoutes,
                        },
                    },
                    paymentInfo: undefined,
                },
            );
        });

        it('should pay using empty strings when no needed values', () => {
            store.booking!.package.accom = {} as any;
            store.booking!.package.transport.routes = [];
            store.booking!.guests[0] = {
                isLead: true,
            } as any;

            store.payRemainingBalance();

            expect(formActions.submitForm).toHaveBeenCalledWith(
                `/en/holidays${SitePath.PayBalance}`,
                'pay-balance-payload',
                {
                    bookingReference: '12345',
                    date: '',
                    lastName: '',
                    billingInfo: { value: 'bookingInfoPayload' },
                    package: {
                        accom: {},
                        transport: {
                            routes: [],
                        },
                    },
                    paymentInfo: undefined,
                },
            );
        });
    });

    describe('isCheckInAvailable', () => {
        let mockBooking = {} as IBookingInfo;

        beforeEach(() => {
            mockBooking = {
                paymentInfo: { balanceDueAmount: 0 },
                package: {
                    transport: { routes: [{ depDate: '2050-01-10T00:00:00' }, { depDate: '2050-01-20T00:00:00' }] },
                },
            } as IBookingInfo;
            jest.spyOn(route, 'getFlightsReferences').mockReturnValue(['id']);
        });

        it('should return false when no transport data', () => {
            delete (mockBooking as any).package.transport;
            jest.spyOn(route, 'getFlightsReferences').mockReturnValue([]);
            const store = new BookingStore(rootStore);

            expect(store.isCheckInAvailable(mockBooking)).toBeFalsy();
        });

        it('should return false when no payment info', () => {
            delete (mockBooking as any).paymentInfo;
            const store = new BookingStore(rootStore);

            expect(store.isCheckInAvailable(mockBooking)).toBeFalsy();
        });

        it('should return false when remaining balance more than 0', () => {
            mockBooking.paymentInfo.balanceDueAmount = 100;
            const store = new BookingStore(rootStore);

            expect(store.isCheckInAvailable(mockBooking)).toBeFalsy();
        });

        it('should return false when holiday is in past', () => {
            mockBooking.package.transport.routes[0].depDate = '2000-01-01T00:00:00';
            mockBooking.package.transport.routes[1].depDate = '2000-01-10T00:00:00';

            const store = new BookingStore(rootStore);

            expect(store.isCheckInAvailable(mockBooking)).toBeFalsy();
        });

        it('should return true when checking is available', () => {
            rootStore.layoutStore.getSettingAsNumber.mockReturnValueOnce(30);
            const store = new BookingStore(rootStore);
            const mockNow = new Date('2050-01-01T00:00:00').getTime();

            jest.spyOn(Date, 'now').mockImplementationOnce(() => mockNow);

            expect(store.isCheckInAvailable(mockBooking)).toBeTruthy();
        });

        it('should return false when no flight reference', () => {
            jest.spyOn(route, 'getFlightsReferences').mockReturnValueOnce([null]);

            rootStore.layoutStore.getSettingAsNumber.mockReturnValueOnce(30);
            const store = new BookingStore(rootStore);
            const mockNow = new Date('2050-01-01T00:00:00').getTime();

            jest.spyOn(Date, 'now').mockImplementationOnce(() => mockNow);

            expect(store.isCheckInAvailable(mockBooking)).toBeFalsy();
        });
    });

    describe('loadResortInfo', () => {
        it('should do nothing when no accomodation id', () => {
            const store = new BookingStore(rootStore);

            bookingService.loadResortInfo = jest.fn();
            store.loadResortInfo();

            expect(bookingService.loadResortInfo).not.toHaveBeenCalled();
        });

        it('should set resort info', async () => {
            const store = new BookingStore(rootStore);

            store.selectedOffer = {
                accom: {
                    id: '12345',
                } as any,
            } as any;
            bookingService.loadResortInfo = jest.fn().mockReturnValue(Promise.resolve('Resort info'));

            await store.loadResortInfo();

            expect(bookingService.loadResortInfo).toHaveBeenCalledWith('12345');
            expect(store.resortInfo).toEqual('Resort info');
        });

        it('should set resort info to null when an error', async () => {
            const store = new BookingStore(rootStore);

            store.resortInfo = {} as any;
            store.selectedOffer = {
                accom: {
                    id: '12345',
                } as any,
            } as any;
            store.clearResortInfo = jest.fn();
            bookingService.loadResortInfo = jest.fn().mockReturnValue(Promise.reject());

            await store.loadResortInfo();

            expect(store.clearResortInfo).toHaveBeenCalled();
        });
    });

    describe('clearResortInfo', () => {
        it('should set resort info to null', () => {
            const store = new BookingStore(rootStore);

            store.resortInfo = 'resortInfo' as any;

            store.clearResortInfo();

            expect(store.resortInfo).toBeNull();
        });
    });

    describe('setIsPaymentPriceJump', () => {
        it('should set isPaymentPriceJump', () => {
            const store = new BookingStore(rootStore);

            expect(store.isPaymentPriceJump).toBe(false);

            store.setIsPaymentPriceJump(true);

            expect(store.isPaymentPriceJump).toBe(true);
        });
    });

    describe('setPriceAfterJump', () => {
        it('should set priceAfterJump', () => {
            const store = new BookingStore(rootStore);

            expect(store.priceAfterJump).toBe(0);

            store.setPriceAfterJump(1000);

            expect(store.priceAfterJump).toBe(1000);
        });
    });

    describe('loadFeaturedFacilities', () => {
        it('should do nothing when no accomodation id', () => {
            const store = new BookingStore(rootStore);

            offersService.getFeaturedFacilities = jest.fn();
            store.loadFeaturedFacilities();

            expect(offersService.getFeaturedFacilities).not.toHaveBeenCalled();
        });

        it('should set featured facilities', async () => {
            const store = new BookingStore(rootStore);

            store.selectedOffer = {
                accom: {
                    id: '12345',
                } as any,
            } as any;
            offersService.getFeaturedFacilities = jest.fn().mockReturnValue(Promise.resolve('Featured Facilities'));

            await store.loadFeaturedFacilities();

            expect(offersService.getFeaturedFacilities).toHaveBeenCalledWith('12345');
            expect(store.featuredFacilities).toEqual('Featured Facilities');
        });

        it('should set featured facilities to [] when an error', async () => {
            const store = new BookingStore(rootStore);

            store.resortInfo = {} as any;
            store.selectedOffer = {
                accom: {
                    id: '12345',
                } as any,
            } as any;
            store.clearResortInfo = jest.fn();
            offersService.getFeaturedFacilities = jest.fn().mockReturnValue(Promise.reject());

            await store.loadFeaturedFacilities();

            expect(store.featuredFacilities).toEqual([]);
        });
    });

    describe('isPaymentReminderVisible', () => {
        let mockBooking = {} as IBookingInfo;
        let store;

        beforeEach(() => {
            mockBooking = {
                paymentInfo: {
                    balanceDueAmount: 20,
                    balanceDueDate: '2050-01-11T00:00:00', // 10 days from mocked now date
                    allowPayBalanceDueDate: '2020-08-02T00:00:00+00:00',
                },
                package: { transport: mockedTransport },
            } as IBookingInfo;

            store = new BookingStore(rootStore);
            jest.spyOn(Date, 'now').mockImplementation(() => new Date('2050-01-01T00:00:00').getTime());
        });

        it('should return false by default', () => {
            rootStore.layoutStore.getSettingAsNumber.mockReturnValueOnce(7);

            expect(store.isPaymentReminderVisible(mockBooking)).toBe(false);

            expect(canPayRemainingBalance).toHaveBeenCalled();
        });

        it('should return get minDaysToShowReminder from const when setting does NOT exist', () => {
            rootStore.layoutStore.getSettingAsNumber.mockReturnValueOnce(undefined);

            expect(store.isPaymentReminderVisible(mockBooking)).toBe(true);
        });
    });

    describe('validateBookingRequestBody', () => {
        let store;

        beforeEach(() => {
            store = new BookingStore(rootStore);
        });

        it('should not add selected airport parking to validation request body', () => {
            const body = store.validateBookingRequestBody;
            expect(body.airportParking).toEqual(undefined);
        });

        it('should add selected airport parking to validation request body when airport parking is selected', () => {
            rootStore.airportParkingStore.selectedAirportParking = {
                title: 'Parking title',
                description: 'Parking description',
                brandImage: 'test/image-url',
                bookingDetails: {
                    productCode: 'LTM9',
                    totalPrice: 56.99,
                    startTime: '14:35:00',
                    endTime: '14:50:00',
                    type: 'MEET_AND_GREET',
                    startDate: '2025-01-12T00:00:00',
                    endDate: '2025-01-16T00:00:00',
                },
            };

            const body = store.validateBookingRequestBody;
            expect(body.airportParking).toEqual(rootStore.airportParkingStore.selectedAirportParking);
        });
    });

    describe('updateOfferInfo', () => {
        let store;

        beforeEach(() => {
            store = new BookingStore(rootStore);
        });

        it('should set the selected airport parking', () => {
            const airportParking = {
                title: 'Parking title',
                description: 'Parking description',
                brandImage: 'test/image-url',
                bookingDetails: {
                    productCode: 'LTM9',
                    totalPrice: 56.99,
                    startTime: '14:35:00',
                    endTime: '14:50:00',
                    type: 'MEET_AND_GREET',
                    startDate: '2025-01-12T00:00:00',
                    endDate: '2025-01-16T00:00:00',
                },
            };
            const specificOffer: ISpecificOfferWithAltAcc = {
                ...offer,
                offers: [{ airportParking } as IOfferWithoutAltBoards],
            };
            store.updateOfferInfo(specificOffer);
            expect(rootStore.airportParkingStore.setSelectedAirportParking).toHaveBeenCalledWith(airportParking);
        });
    });

    describe('commitBookingRequestBody', () => {
        let store;

        beforeEach(() => {
            store = new BookingStore(rootStore);
            jest.spyOn(store, 'commitBookingRequestBodyBase', 'get').mockReturnValue({});
        });

        it('should not add selected airport parking to commit request body', () => {
            const body = store.commitBookingRequestBody;
            expect(body.airportParking).toEqual(undefined);
        });

        it('should add selected airport parking to commit request body when airport parking is selected', () => {
            rootStore.airportParkingStore.selectedAirportParking = {
                title: 'Parking title',
                description: 'Parking description',
                brandImage: 'test/image-url',
                bookingDetails: {
                    productCode: 'LTM9',
                    totalPrice: 56.99,
                    startTime: '14:35:00',
                    endTime: '14:50:00',
                    type: 'MEET_AND_GREET',
                    startDate: '2025-01-12T00:00:00',
                    endDate: '2025-01-16T00:00:00',
                },
            };

            const body = store.commitBookingRequestBody;
            expect(body.airportParking).toEqual(rootStore.airportParkingStore.selectedAirportParking);
        });
    });

    describe('getAdditionalOfferParams', () => {
        let store;

        beforeEach(() => {
            store = new BookingStore(rootStore);
        });

        it('should add selected airport parking if parkingCodeFromUrl is set', () => {
            rootStore.queryParamsStore.parkingCodeFromUrl = 'ABC';
            const res = store.getAdditionalOfferParams();
            expect(res).toEqual({
                airportParkingCode: 'ABC',
            });
        });

        it('should add selected airport parking if airportParkingStore-selectedAirportParking is set', () => {
            rootStore.airportParkingStore.selectedAirportParking = {
                title: 'Parking title',
                description: 'Parking description',
                brandImage: 'test/image-url',
                bookingDetails: {
                    productCode: 'LTM9',
                    totalPrice: 56.99,
                    startTime: '14:35:00',
                    endTime: '14:50:00',
                    type: 'MEET_AND_GREET',
                    startDate: '2025-01-12T00:00:00',
                    endDate: '2025-01-16T00:00:00',
                },
            };
            const res = store.getAdditionalOfferParams();
            expect(res).toEqual({
                airportParkingCode: 'LTM9',
            });
        });
    });

    describe('commitBooking', () => {
        let store: BookingStore;
        let rootStore: any;

        beforeEach(() => {
            rootStore = createRootStore();
            rootStore.payStore.selectedPaymentType = PaymentType.Card;
            store = new BookingStore(rootStore);

            bookingService.commitBooking = jest.fn().mockReturnValue(Promise.resolve({ data: {} }));
            store['createBookingBody'] = jest.fn(() => ({} as any));
        });

        it('should do nothing when booking is committing', async () => {
            store.isCommittingBooking = true;

            await store.commitBooking({} as IThreeDSData, false);

            expect(bookingService.commitBooking).not.toHaveBeenCalled();
        });

        it('should do nothing when cannot pay', async () => {
            await store.commitBooking({} as IThreeDSData, false);

            expect(store.rootStore.payStore.onForceErrors).toHaveBeenCalledWith(true);
            expect(bookingService.commitBooking).not.toHaveBeenCalled();
        });

        it('should call bookingService.commitBooking', async () => {
            const setTransactionProcessing = jest.spyOn(paymentTransaction, 'setTransactionProcessing');

            const promise = store.commitBooking({} as IThreeDSData, true);

            expect(store.isCommittingBooking).toBeTruthy();

            await promise;

            expect(store.rootStore.paymentStore.clearPaymentUI).toHaveBeenCalled();
            expect(setTransactionProcessing).toHaveBeenCalled();
            expect(bookingService.commitBooking).toHaveBeenCalledWith({}, '12345');
            expect(store.rootStore.payStore.setSessionId).toHaveBeenCalledWith(null);
            expect(store.rootStore.paymentStore.setBookingReference).toHaveBeenCalledWith(null);
        });

        it('should call setPaymentAuthorization when bookingService.commitBooking returns resultCode', async () => {
            bookingService.commitBooking = jest.fn().mockReturnValue(Promise.resolve({ data: { resultCode: 'code' } }));

            const promise = store.commitBooking({} as IThreeDSData, true);

            await promise;

            expect(store.rootStore.payStore.setPaymentAuthorization).toHaveBeenCalledWith({
                data: { resultCode: 'code' },
            });
        });

        it('should call cleanupRedeemStore, clearCardInfo, clearPrefillParams and getBookingPayload when bookingService.commitBooking does NOT return resultCode', async () => {
            mockGetBookingPayload.mockReturnValueOnce({} as IBookingInfoPayload);
            const promise = store.commitBooking({} as IThreeDSData, true);

            await promise;

            expect(store.rootStore.redeemVoucherStore.cleanupRedeemStore).toHaveBeenCalled();
            expect(store.rootStore.payStore.clearCardInfo).toHaveBeenCalled();
            expect(store.rootStore.hotelsStore.clearPrefillParams).toHaveBeenCalled();
            expect(mockGetBookingPayload).toHaveBeenCalled();
            expect(formActions.submitForm).not.toHaveBeenCalled();
        });

        it('should call submitForm with correct props when getBookingPayload returns lastName', async () => {
            mockGetFreeNightsIncludedInOffer.mockReturnValue(1);
            mockGetPaymentType.mockReturnValue(OrderCheckoutPayment.Card);
            store.promoCode.value = 'promoCode';
            store.selectedOffer = {} as IOfferWithoutAltBoards;
            store['createBookingBody'] = jest.fn().mockReturnValueOnce({
                paymentInfo: {
                    billingInfo: { address: 'address', city: 'city', fullName: 'test name', postCode: 'post code' },
                    cardType: 'Mastercard',
                },
            });
            mockGetBookingPayload.mockReturnValueOnce({ lastName: 'test name' } as IBookingInfoPayload);
            // isTradePortal=true so redirectToBookingConfirmation resolves normally (spinner cleared in finally)
            rootStore.layoutStore.isTradePortal = true;
            const promise = store.commitBooking({} as IThreeDSData, true);

            await promise;

            expect(formActions.submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/confirmation',
                'booking-info-payload',
                {
                    avail: 0,
                    billingInfo: { address: 'address', city: 'city', fullName: 'test name', postCode: 'post code' },
                    cardType: 'Mastercard',
                    freeNightsIncluded: 1,
                    lastName: 'test name',
                    paymentType: 'Card',
                    promoCode: 'promoCode',
                },
            );
        });

        it('should keep isCommittingBooking true and return a pending promise for non-Trade Portal redirect', async () => {
            mockGetBookingPayload.mockReturnValueOnce({ lastName: 'Smith' } as IBookingInfoPayload);
            store['createBookingBody'] = jest.fn().mockReturnValueOnce({
                paymentInfo: { billingInfo: {}, cardType: '' },
            });
            // isTradePortal = false (default) — redirectToBookingConfirmation returns a never-resolving promise

            // Do NOT await: the promise never resolves for non-TP users
            const promise = store.commitBooking({} as IThreeDSData, true);

            // Wait for the API call and synchronous follow-up code to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(formActions.submitForm).toHaveBeenCalled();
            expect(store.isCommittingBooking).toBe(true);

            // prevent Jest from detecting an unhandled floating promise
            promise.catch(() => {});
        });

        it('should set isCommittingBooking to false when clearIsCommittingBooking is called', () => {
            store.isCommittingBooking = true;

            store.clearIsCommittingBooking();

            expect(store.isCommittingBooking).toBe(false);
        });

        it('should append ecp=fph to confirmation URL when isFlightPlusHotelFunnel is true', async () => {
            mockGetFreeNightsIncludedInOffer.mockReturnValue(1);
            mockGetPaymentType.mockReturnValue(OrderCheckoutPayment.Card);
            store.selectedOffer = {} as IOfferWithoutAltBoards;
            store['createBookingBody'] = jest.fn().mockReturnValueOnce({
                paymentInfo: {
                    billingInfo: { address: 'address', city: 'city', fullName: 'test name', postCode: 'post code' },
                    cardType: 'Mastercard',
                },
            });
            mockGetBookingPayload.mockReturnValueOnce({ lastName: 'test name' } as IBookingInfoPayload);
            Object.defineProperty(store.rootStore.queryParamsStore, 'isFlightPlusHotelFunnel', {
                get: () => true,
            });

            const promise = store.commitBooking({} as IThreeDSData, true);

            await new Promise(resolve => setTimeout(resolve, 0));
            expect(formActions.submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/confirmation?ecp=fph',
                'booking-info-payload',
                expect.any(Object),
            );

            promise.catch(() => {});
        });

        it('should NOT append ecp param to confirmation URL when isFlightPlusHotelFunnel is false', async () => {
            mockGetFreeNightsIncludedInOffer.mockReturnValue(1);
            mockGetPaymentType.mockReturnValue(OrderCheckoutPayment.Card);
            store.selectedOffer = {} as IOfferWithoutAltBoards;
            store['createBookingBody'] = jest.fn().mockReturnValueOnce({
                paymentInfo: {
                    billingInfo: { address: 'address', city: 'city', fullName: 'test name', postCode: 'post code' },
                    cardType: 'Mastercard',
                },
            });
            mockGetBookingPayload.mockReturnValueOnce({ lastName: 'test name' } as IBookingInfoPayload);
            Object.defineProperty(store.rootStore.queryParamsStore, 'isFlightPlusHotelFunnel', {
                get: () => false,
            });

            const promise = store.commitBooking({} as IThreeDSData, true);

            await new Promise(resolve => setTimeout(resolve, 0));
            expect(formActions.submitForm).toHaveBeenCalledWith(
                '/en/holidays/booking/confirmation',
                'booking-info-payload',
                expect.any(Object),
            );

            promise.catch(() => {});
        });

        it('should call validatePackage when throws a MaxPriceJumpExceeded error', async () => {
            const error = {
                errorCode: ApiErrors.MaxPriceJumpExceeded,
            };

            jest.spyOn(store, 'commitBooking');
            bookingService.commitBooking = jest.fn().mockRejectedValue(error);
            jest.spyOn(store, 'validatePackage');
            bookingService.validatePackage = jest.fn();

            await store.commitBooking({} as IThreeDSData, true);

            expect(bookingService.validatePackage).toHaveBeenCalled();
        });

        it('should call handleCommitBookingError when error code is CommitBookingError', async () => {
            const error = { errorCode: ApiErrors.CommitBookingError };

            jest.spyOn(store, 'commitBooking');
            store.handleCommitBookingError = jest.fn();
            bookingService.commitBooking = jest.fn().mockRejectedValue(error);

            await store.commitBooking(undefined, true);

            expect(store.handleCommitBookingError).toHaveBeenCalledWith(error);
        });

        it('should call validatePackage when throws a PriceNotValid error', async () => {
            const error = {
                errorCode: ApiErrors.PriceNotValid,
            };

            jest.spyOn(store, 'commitBooking');
            bookingService.commitBooking = jest.fn().mockRejectedValue(error);
            jest.spyOn(store, 'validatePackage');
            bookingService.validatePackage = jest.fn();

            await store.commitBooking({} as any, true);

            expect(bookingService.validatePackage).toHaveBeenCalled();
        });

        it('should set isPackageValid to false when it throws OfferNotAvailable error and inner error is not airportParkingError', async () => {
            const error = {
                errorCode: ApiErrors.OfferNotAvailable,
            };
            store.isPackageValid = true;

            jest.spyOn(store, 'commitBooking');
            bookingService.commitBooking = jest.fn().mockRejectedValue(error);
            await store.commitBooking({} as any, true);

            expect(store.isPackageValid).toBe(false);
            expect(rootStore.airportParkingStore.setIsSelectedParkingUnavailableError).not.toHaveBeenCalled();
        });

        AIRPORT_PARKING_UNAVAILABLE_API_ERRORS.forEach(errorCode => {
            it(`should call setIsSelectedParkingUnavailableError when it throws OfferNotAvailable and inner errorCode is ${errorCode}`, async () => {
                const error = {
                    errorCode: ApiErrors.OfferNotAvailable,
                    innerErrors: [{ code: errorCode }, { code: 'Test 1' }],
                };

                jest.spyOn(store, 'commitBooking');
                bookingService.commitBooking = jest.fn().mockRejectedValue(error);
                await store.commitBooking({} as any, true);

                expect(rootStore.airportParkingStore.setIsSelectedParkingUnavailableError).toHaveBeenCalled();
            });
        });

        it(`should NOT call setPaymentErrors when it throws airport parking related error`, async () => {
            const error = {
                errorCode: ApiErrors.OfferNotAvailable,
                innerErrors: [{ code: ApiErrors.AirportAncillarySearchNotPermittedForCriteria }],
            };

            jest.spyOn(store, 'commitBooking');
            bookingService.commitBooking = jest.fn().mockRejectedValue(error);
            await store.commitBooking({} as any, true);

            expect(rootStore.payStore.setPaymentErrors).not.toHaveBeenCalled();
        });

        it('should call setPaymentErrors when it throws other errors not related to airport parking', async () => {
            const error = {
                errorCode: ApiErrors.OfferNotAvailable,
                innerErrors: [{ code: ApiErrors.CommitBookingError }, { code: ApiErrors.MaxPriceJumpExceeded }],
            };

            jest.spyOn(store, 'commitBooking');
            bookingService.commitBooking = jest.fn().mockRejectedValue(error);
            await store.commitBooking({} as any, true);

            expect(rootStore.payStore.setPaymentErrors).toHaveBeenCalled();
        });
    });
});
