import { mockAltNoTransfer, mockAltSharedTransfer, mockPassengerWithLCB, mockTransfer } from 'frontend/__mocks__';
import { extraLuggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { mockedOffer, mockedUnit, mockedUnit2 } from 'frontend/__mocks__/offer';
import { mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import bookingService from 'frontend/services/booking.service';
import offersService from 'frontend/services/offers.service';
import { swapOfferAccommodations } from 'frontend/utils/offer.utils';
import * as paymentTransaction from 'frontend/utils/paymentTransaction';
import * as taxUtils from 'frontend/utils/touristTax.utils';
import * as utils from 'frontend/utils/webStorage.utils';
import { ApiError } from 'models/data/ApiError';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IOfferWithoutAltBoards } from 'models/data/IOffer';
import { ISpecificOffer, ISpecificOfferWithAltAcc } from 'models/data/ISpecificOffer';
import { IValidatePackageInfo } from 'models/data/IValidPackageInfo';
import { ApiErrors } from 'models/enum/ApiErrors';
import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { TradePortalBookingStore } from './TradePortalBookingStore';

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

jest.spyOn(taxUtils, 'getTouristTaxFieldsFromOffer').mockReturnValue(mockTouristTaxFields);

const transport = {
    routes: [
        {
            arrDate: '2020-09-02T16:25:00+00:00',
            arrLocation: 'Croatia',
            arrName: 'Split Airport',
            arrPt: 'SPU',
            arrTime: '1625',
            avail: 84,
            car: 'EZY',
            cycDate: '2020-09-02',
            depDate: '2020-09-02T13:00:00+00:00',
            depLocation: 'London',
            depName: 'London Gatwick',
            depPt: 'LGW',
            depTime: '1300',
            direction: 'outbound',
            fltNo: 'EZY8395',
            id: 'Eaf170684b65f1e91ddcff8f737f8f07f',
            isExt: true,
            routeCd: 'SPULGW3T',
        },
        {
            arrDate: '2020-09-08T14:10:00+00:00',
            arrLocation: 'London',
            arrName: 'London Gatwick',
            arrPt: 'LGW',
            arrTime: '1410',
            avail: 147,
            car: 'EZY',
            cycDate: '2020-09-08',
            depDate: '2020-09-08T12:30:00+00:00',
            depLocation: 'Croatia',
            depName: 'Split Airport',
            depPt: 'SPU',
            depTime: '1230',
            direction: 'inbound',
            fltNo: 'EZY8398',
            id: 'Ea0e3d4ed50d28b03399b3308532cabc1',
            isExt: true,
            routeCd: 'SPULGW2T',
        },
    ],
};

const offer = {
    date: '2020-09-02T00:00:00',
    stay: 7,
    accom: {
        id: 'X9431179',
        unit: [mockedUnit],
    } as any,
    transfers: [mockTransfer],
    transport,
    price: 2000,
    hotel: {
        test: 'new hotel',
    },
    altBoards: [{}],
} as any;

const mockApiError = {} as ApiError;

describe('TradePortalBookingStore', () => {
    const createRootStore = () => ({
        appStore: { setLoading: jest.fn(), setNavigationBooking: jest.fn() },
        layoutStore: {
            basePath: '/en/holidays',
            isHotelDetailsBookPage: false,
            isExtrasPage: false,
            isTradePortal: true,
            getSetting: jest.fn(),
            getSettingAsNumber: jest.fn(),
            isApplySpecialFilter: jest.fn(),
        },
        guestDetailsStore: {
            guestsDetails: [],
            createGuestsDetails: jest.fn(),
            clearGuestDetails: jest.fn(),
        },
        hotelsStore: { clearPrefillParams: jest.fn() },
        searchStore: {
            searchFrom: {
                origins: ['LGW'],
            },
            searchTo: {
                selectedDestinationCodes: ['ES'],
                selectedDestinationCodesQuery: 'ES',
                destinationsDisplayValue: { main: 'test' },
            },
            searchWhen: {
                flexDays: 3,
                from: new Date(2020, 0, 1),
                to: new Date(2020, 0, 7),
            },
            searchWho: {
                isAutoAllocation: true,
                roomsAllocation: [
                    {
                        adults: [{}, {}],
                        children: [{}],
                        infants: [{}],
                        roomCode: 'QWER',
                    },
                ],
            },
        },
        queryParamsStore: {
            offerRoomsAllocationFromUrl: [],
            altAccommodationsFromUrl: ['altAccommodationsFromUrl'],
            outboundLCBSelectionFromUrl: 'outboundLCBSelectionFromUrl',
            inboundLCBSelectionFromUrl: 'inboundLCBSelectionFromUrl',
            buildHotelDetailsQuery: jest.fn(() => 'query'),
        },
        routerStore: {
            redirectToHomePage: jest.fn(),
            updateCurrentPage: jest.fn(),
            state: {
                searchPrice: '500',
            },
        },
        payStore: {
            onForceErrors: jest.fn(),
            setSessionId: jest.fn(),
            setPaymentError: jest.fn(),
            setFailedToPay: jest.fn(),
            setPaymentErrors: jest.fn(),
        },
        paymentStore: {
            canPay: false,
            clearPaymentUI: jest.fn(),
            clearPaymentStore: jest.fn(),
            setBookingReference: jest.fn(),
            selectFullPayment: jest.fn(),
        },
        redeemVoucherStore: { cleanupRedeemStore: jest.fn() },
        holidayCreditStore: { setCreditEnabledApiSettings: jest.fn() },
        trackingStore: {
            holidayConfigChangeTrigger: jest.fn(),
            trackTransferChange: jest.fn(),
            trackLateCheckoutChange: jest.fn(),
            trackRecommenderNotLoaded: jest.fn(),
            setBd4RecommenderPlacementId: jest.fn(),
            setBd4RecommenderTracking: jest.fn(),
            applyPromoCodeTrigger: jest.fn(),
        },
        seatMapStore: {
            isEnabledToBookSeats: false,
            selectedSeats: [
                {
                    sectorId: 'sectorId-0',
                    seats: [{ paxIndex: '000', seatNumber: 'seatNumber' }],
                },
            ],
            setIsSelectedSeatsUnavailableError: jest.fn(),
            setValidatedSelectedSeats: jest.fn(),
        },
        flightsPassengersStore: { setPassengersStore: jest.fn() },
        searchFiltersStore: { hotelTypesFilters: 'lux' },
    });

    const prepareStoreForAltAccommodationsTests = store => {
        store.selectedOffer = { ...offer, date: new Date(offer.date) };
        store.packageIdFromUrl = 'packageId';
        store.from = new Date('7/07/2020');
        store.to = new Date('12/09/2020');
        store.origins = ['1', '2', '3'];
        offersService.fetchOffer = jest.fn().mockResolvedValue({
            hotel: {},
            offers: [
                {
                    accom: { unit: [{ code: 'code_from_offer' }] },
                } as IOfferWithoutAltBoards,
            ],
        } as ISpecificOffer);
    };
    let rootStore: any = createRootStore();
    let store: TradePortalBookingStore;

    beforeEach(() => {
        rootStore = createRootStore();
        store = new TradePortalBookingStore(rootStore);
        store.grabSearchValuesFromSearchStore = jest.fn();
        jest.spyOn(store.extraLuggage, 'isExtraLuggageFromUrlValid', 'get').mockReturnValue(true);
    });

    describe('Transfers', () => {
        describe('isTransferIncluded', () => {
            it('should return false when transfers empty', () => {
                store.selectedOffer = { transfers: [] } as any;

                expect(store.isTransferIncluded).toBeFalsy();
            });

            it('should return true when has transfers', () => {
                store.selectedOffer = { transfers: [mockTransfer] } as any;

                expect(store.isTransferIncluded).toBeTruthy();
            });
        });
    });

    describe('hotel', () => {
        it('should return hotel info from selected offer', () => {
            const hotel = { code: 'test' };

            store.selectedOffer = {
                hotel,
            } as IOfferWithoutAltBoards;

            expect(store.hotel).toEqual(hotel);
        });

        it('should return undefined when no offer selected', () => {
            store.selectedOffer = undefined;

            expect(store.hotel).toEqual(undefined);
        });
    });

    describe('priceBreakdown', () => {
        it('should return undefined when package is NOT valid and has no info', () => {
            expect(store.priceBreakdown).toBeUndefined();
        });

        it('should return priceBreakdown', () => {
            store.isPackageValid = true;
            store.packageInfo = {
                priceBreakdown: 'priceBreakdown',
            } as any;

            expect(store.priceBreakdown).toEqual('priceBreakdown');
        });
    });

    describe('room', () => {
        it('should return null when NO roomType', () => {
            store.selectedOffer = { accom: { unit: [{}] } } as any;

            expect(store.room).toBeNull();
        });

        it('should return first room type', () => {
            store.selectedOffer = offer;

            expect(store.room).toEqual(offer.accom.unit[0].roomType);
        });
    });

    describe('fetchOffer', () => {
        beforeEach(() => {
            store.updateOfferInfo = jest.fn();
            store.onFetchOfferError = jest.fn();
            store.loadExtras = jest.fn();
            store.loadAdditionalData = jest.fn();
        });

        it('should do nothing when offer is loading', () => {
            store.isLoadingOffer = true;
            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve(null));

            store.fetchOffer();

            expect(store['callFetchOffer']).not.toHaveBeenCalled();
        });

        it('should load offer and do nothing when NO offer', async () => {
            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve(null));

            await store.fetchOffer(true);

            expect(store.updateOfferInfo).not.toHaveBeenCalled();
            expect(store.onFetchOfferError).not.toHaveBeenCalled();
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
            rootStore.layoutStore.isConfirmPage = false;
            store.selectedOffer = { ...offer, price: 0 };

            await store.fetchOffer(true);

            expect(store.updateOfferInfo).not.toHaveBeenCalled();
            expect(store.onFetchOfferError).toHaveBeenCalled();
            expect(store.isLoadingOffer).toBeFalsy();
        });

        it('should do nothing when has selected offer, alternative transfers and isExtrasPage', () => {
            rootStore.layoutStore.isExtrasPage = true;
            store.selectedOffer = offer;
            store.alternativeTransfers = [mockTransfer];
            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve(null));

            store.fetchOffer(false);

            expect(store['callFetchOffer']).not.toHaveBeenCalled();
        });

        it('should call loadAlternativeTransfers when has selected offer, no alternative transfers and isGuestDetailsPage', () => {
            rootStore.layoutStore.isGuestDetailsPage = true;
            store.selectedOffer = offer;
            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve(null));

            store.fetchOffer(false);

            expect(store['callFetchOffer']).not.toHaveBeenCalled();
            expect(store.loadExtras).toHaveBeenCalled();
        });

        it('should call loadAlternativeTransfers when has selected offer, no alternative transfers and isConfirmPage', () => {
            rootStore.layoutStore.isConfirmPage = true;
            store.selectedOffer = offer;
            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve(null));

            store.fetchOffer(false);

            expect(store['callFetchOffer']).not.toHaveBeenCalled();
            expect(store.loadExtras).toHaveBeenCalled();
        });

        it('should update offer info and load additional data', async () => {
            rootStore.routerStore.isHotelDetailsPage = jest.fn(() => true);

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [offer] }));
            store.updateOfferInfo = jest.fn();
            store.loadFlightExtras = jest.fn();
            store.onFetchOfferError = jest.fn();

            await store.fetchOffer();

            expect(store.updateOfferInfo).toHaveBeenCalledWith({ offers: [offer] });
            expect(store.loadAdditionalData).toHaveBeenCalled();
            expect(store.loadFlightExtras).toHaveBeenCalled();
            expect(store.onFetchOfferError).not.toHaveBeenCalled();
        });

        it('should call LCBAvailabilityCheckFlow after loading flight extras', async () => {
            rootStore.routerStore.isHotelDetailsPage = jest.fn(() => true);

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [offer] }));

            store.loadFlightExtras = jest.fn();
            store.extraLuggage.LCBAvailabilityCheckFlow = jest.fn();

            await store.fetchOffer();

            expect(store.loadFlightExtras).toHaveBeenCalled();
            expect(store.extraLuggage.LCBAvailabilityCheckFlow).toHaveBeenCalled();
        });

        it('should parse promo code at payment page', async () => {
            rootStore.routerStore.pathname = '/booking';
            rootStore.layoutStore.isConfirmPage = true;
            rootStore.layoutStore.isHotelDetailsPage = false;

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
            store.selectedOffer = offer;
            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [offer] }));
            store.validatePackage = jest.fn();
            store.loadFlightExtras = jest.fn();
            store.parsePromocode = jest.fn();

            await store.fetchOffer(true);

            expect(store.parsePromocode).toHaveBeenCalled();
        });

        it('should call fetchOffer with stored seats', async () => {
            rootStore.layoutStore.isExtrasPage = true;
            rootStore.layoutStore.isHotelDetailsPage = false;
            rootStore.routerStore.pathname = '/booking';
            rootStore.seatMapStore.selectedSeats = [{}];

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
            store.loadFlightExtras = jest.fn();
            offersService.fetchOffer = jest.fn().mockResolvedValue({
                hotel: {},
                offers: [{ accom: {} } as IOfferWithoutAltBoards],
            } as ISpecificOffer);

            await store.fetchOffer(true);

            expect(offersService.fetchOffer).toHaveBeenCalled();
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

        it('should change setShowInvalidLuggageInUrlPopup flag when fetchOffer throws LCB error', async () => {
            const error = {
                response: {
                    data: {
                        code: ApiErrors.LargeCabinBagAllowanceExceeded,
                    },
                },
            };

            prepareStoreForAltAccommodationsTests(store);

            jest.spyOn(store, 'fetchOffer');
            offersService.fetchOffer = jest.fn().mockReturnValue(Promise.reject(error));
            store.onFetchOfferError = jest.fn();
            store.setShowInvalidLuggageInUrlPopup = jest.fn();

            await store.fetchOffer(true);

            expect(store.setShowInvalidLuggageInUrlPopup).toHaveBeenCalledWith(true);
            expect(store.onFetchOfferError).not.toHaveBeenCalled();
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

        it('should call fetchOffer with altAcc', async () => {
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

        // TODO: add room allocation
        it('should call fetchOffer with selected luggage and lcb', async () => {
            rootStore.queryParamsStore.luggageSelectionFromUrl = { LUG: 3 };
            rootStore.queryParamsStore.sportEquipmentSelectionFromUrl = { BIKE: 2 };
            rootStore.queryParamsStore.searchPrice = 500;
            rootStore.flightsPassengersStore.outBoundPassengers = [mockPassengerWithLCB('2')];
            rootStore.flightsPassengersStore.inBoundPassengers = [mockPassengerWithLCB('3')];

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
                '2',
                '3',
                undefined,
                undefined,
            );
        });

        it('should call setShowInvalidLuggageInUrlPopup with true and break when isExtraLuggageFromUrlValid is false', async () => {
            rootStore.routerStore.isHotelDetailsPage = true;

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [offer] }));
            store.validatePackage = jest.fn();
            store.setShowInvalidLuggageInUrlPopup = jest.fn();
            jest.spyOn(store.extraLuggage, 'isExtraLuggageFromUrlValid', 'get').mockReturnValue(false);

            await store.fetchOffer(true);

            expect(store.setShowInvalidLuggageInUrlPopup).toHaveBeenCalledWith(true);
            expect(store.validatePackage).not.toHaveBeenCalled();
        });

        it('should create guest details when guestDetails length is zero', async () => {
            rootStore.routerStore.isHotelDetailsPage = true;

            store['callFetchOffer'] = jest.fn().mockReturnValue(Promise.resolve({ offers: [offer] }));

            await store.fetchOffer(true);

            expect(rootStore.guestDetailsStore.createGuestsDetails).toHaveBeenCalled();
        });
    });

    describe('validatePackage', () => {
        it('should validate package without errors', async () => {
            const packageInfo = {
                requestId: 'test',
                creditIsEnabled: true,
                extraLuggageInfo: { items: [] },
            } as any;

            bookingService.validatePackage = jest.fn().mockReturnValue(Promise.resolve({ data: { ...packageInfo } }));

            store.extraLuggage.setExtraLuggageInfo = jest.fn();
            store.extraLuggage.extraLuggageInfo = extraLuggageInfoMock;

            jest.spyOn(store.extraLuggage, 'luggageSelectionFromUrl', 'get').mockReturnValue({});
            jest.spyOn(store.extraLuggage, 'sportEquipmentSelectionFromUrl', 'get').mockReturnValue({});

            await store.validatePackage();

            expect(rootStore.guestDetailsStore.createGuestsDetails).toHaveBeenCalled();
            expect(store.extraLuggage.setExtraLuggageInfo).toHaveBeenCalledWith(packageInfo.extraLuggageInfo);
            expect(bookingService.validatePackage).toHaveBeenCalled();
            expect(store.isValidatingPackage).toBeFalsy();
            expect(store.isPackageValid).toBeTruthy();
        });

        it('should validate package with errors and set isPackageValid to false', async () => {
            const packageInfo = {
                requestId: 'test',
            } as IValidatePackageInfo;

            bookingService.validatePackage = jest.fn().mockReturnValue(Promise.reject(packageInfo));
            store.extraLuggage.extraLuggageInfo = extraLuggageInfoMock;

            jest.spyOn(store.extraLuggage, 'luggageSelectionFromUrl', 'get').mockReturnValue({});
            jest.spyOn(store.extraLuggage, 'sportEquipmentSelectionFromUrl', 'get').mockReturnValue({});

            await store.validatePackage();

            expect(rootStore.guestDetailsStore.createGuestsDetails).toHaveBeenCalled();
            expect(rootStore.seatMapStore.setIsSelectedSeatsUnavailableError).toHaveBeenCalled();
            expect(bookingService.validatePackage).toHaveBeenCalled();
            expect(store.isValidatingPackage).toBeFalsy();
            expect(store.isPackageValid).toBeFalsy();
        });

        it('should call setValidatedSelectedSeats when isEnabledToBookSeats is true', async () => {
            rootStore.seatMapStore.isEnabledToBookSeats = true;

            const seatSelection = [{}];
            const packageInfo = {
                requestId: 'test',
                creditIsEnabled: true,
                seatSelection,
            } as IValidatePackageInfo;
            bookingService.validatePackage = jest.fn().mockReturnValue(Promise.resolve({ data: { ...packageInfo } }));
            store.extraLuggage.extraLuggageInfo = extraLuggageInfoMock;

            jest.spyOn(store.extraLuggage, 'luggageSelectionFromUrl', 'get').mockReturnValue({});
            jest.spyOn(store.extraLuggage, 'sportEquipmentSelectionFromUrl', 'get').mockReturnValue({});

            await store.validatePackage();

            expect(rootStore.seatMapStore.setValidatedSelectedSeats).toHaveBeenCalledWith(seatSelection);
        });

        it('should NOT call setValidatedSelectedSeats when isEnabledToBookSeats is false', async () => {
            const packageInfo = {
                requestId: 'test',
                creditIsEnabled: true,
                seatSelection: [{}],
            } as IValidatePackageInfo;
            bookingService.validatePackage = jest.fn().mockReturnValue(Promise.resolve({ data: { ...packageInfo } }));
            await store.validatePackage();

            expect(rootStore.seatMapStore.setValidatedSelectedSeats).not.toHaveBeenCalled();
        });
    });

    describe('createBookingBody', () => {
        it('should update  only sessionId and bookingReference when no threeDSData', () => {
            store.guestsInfoPayload = {
                guests: [],
                leadPassenger: {},
                promoCode: '',
                deviceId: '000-111',
            };

            jest.spyOn(store, 'commitBookingRequestBody', 'get').mockReturnValue({} as any);

            expect(store['createBookingBody']()).toEqual({
                sessionId: undefined,
                bookingReference: undefined,
                deviceId: '000-111',
            });
        });
    });

    describe('commitBooking', () => {
        beforeEach(() => {
            bookingService.commitBooking = jest.fn().mockReturnValue(Promise.resolve({ data: {} }));
            store['createBookingBody'] = jest.fn(() => ({} as any));
        });

        it('should do nothing when booking is committing', async () => {
            store.isCommittingBooking = true;

            await store.commitBooking();

            expect(bookingService.commitBooking).not.toHaveBeenCalled();
        });

        it('should do nothing when cannot pay', async () => {
            await store.commitBooking();

            expect(rootStore.payStore.onForceErrors).toHaveBeenCalledWith(true);
            expect(bookingService.commitBooking).not.toHaveBeenCalled();
        });

        it('should call bookingService.commitBooking', async () => {
            rootStore.paymentStore.canPay = true;
            const setTransactionProcessing = jest.spyOn(paymentTransaction, 'setTransactionProcessing');

            const promise = store.commitBooking();

            expect(store.isCommittingBooking).toBeTruthy();

            await promise;

            expect(store.isLoadingBookingConfirmationInfo).toBeTruthy();
            expect(setTransactionProcessing).toHaveBeenCalled();
            expect(bookingService.commitBooking).toHaveBeenCalledWith({}, '12345');
            expect(rootStore.payStore.setSessionId).toHaveBeenCalledWith(null);
            expect(rootStore.paymentStore.setBookingReference).toHaveBeenCalledWith(null);
        });

        it('should call clearPaymentUI when error happens during commit booking', async () => {
            const error = {
                errorCode: ApiErrors.CanNotCreateBooking,
                correlationId: 'id',
            };
            bookingService.commitBooking = jest.fn().mockRejectedValue(error);
            rootStore.paymentStore.canPay = true;

            const promise = store.commitBooking();

            await promise;

            expect(store.rootStore.paymentStore.clearPaymentUI).toHaveBeenCalled();
        });

        it('should call setIsPaymentPriceJump and setPriceAfterJump when there is CommitBookingPriceJump error with message', async () => {
            const error = {
                errorCode: ApiErrors.CommitBookingError,
                correlationId: 'id',
                innerErrors: [
                    {
                        code: ApiErrors.CommitBookingPriceJump,
                        message: '2000',
                    },
                ],
            };
            bookingService.commitBooking = jest.fn().mockRejectedValue(error);
            rootStore.paymentStore.canPay = true;
            jest.spyOn(paymentTransaction, 'setTransactionProcessing');
            store.setIsPaymentPriceJump = jest.fn();
            store.setPriceAfterJump = jest.fn();

            const promise = store.commitBooking();

            await promise;

            expect(store.setIsPaymentPriceJump).toHaveBeenCalledWith(true);
            expect(store.setPriceAfterJump).toHaveBeenCalledWith(2000);
        });

        it('should call setIsPaymentPriceJump and setPriceAfterJump with 0 when there is CommitBookingPriceJump error without message', async () => {
            const error = {
                errorCode: ApiErrors.CommitBookingError,
                correlationId: 'id',
                innerErrors: [{ code: ApiErrors.CommitBookingPriceJump }],
            };
            bookingService.commitBooking = jest.fn().mockRejectedValue(error);
            rootStore.paymentStore.canPay = true;
            jest.spyOn(paymentTransaction, 'setTransactionProcessing');
            store.setIsPaymentPriceJump = jest.fn();
            store.setPriceAfterJump = jest.fn();

            const promise = store.commitBooking();

            await promise;

            expect(store.setIsPaymentPriceJump).toHaveBeenCalledWith(true);
            expect(store.setPriceAfterJump).toHaveBeenCalledWith(0);
        });
    });

    describe('selectedBoardType', () => {
        it('should return null when no items in unit', async () => {
            store.selectedOffer = {
                accom: { unit: [] },
            } as any;

            expect(store.boardType).toEqual(null);
        });

        it('should return null when unit NOT defined', async () => {
            store.selectedOffer = { accom: {} } as any;

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

            store.selectedOffer = {
                accom: {
                    unit: [{ boardType: board }],
                },
            } as any;
            expect(store.boardType).toEqual(board);
        });
    });

    describe('allBoardTypes', () => {
        it('should return all boards for selected offer', async () => {
            store.selectedOffer = {
                accom: {
                    unit: [
                        {
                            isFreeBoardUpgrade: true,
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
            } as any;
            store.alternativeBoards = [
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

            const expectedResult = [
                {
                    code: 'test',
                    content: 'content',
                    description: 'description',
                    iconUrl: 'icon/url',
                    title: 'title',
                    price: 0,
                    pricePP: 0,
                    isFreeBoardUpgrade: true,
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

        it('should return empty array when NO offer selected', async () => {
            store.selectedOffer = null;

            expect(store.allBoardTypes).toEqual([]);
        });
    });

    describe('changeFlight', () => {
        beforeEach(() => {
            store.selectedOffer = {
                transport: {
                    routes: [{}, {}] as any,
                },
                hotel: { test: 'initial hotel' },
            } as any;
            store.changeIsClickChangeButton = jest.fn();
            store.togglePriceManipulating = jest.fn();
            store.fetchOfferAndReloadPage = jest.fn();
            store.loadRecommendedHotels = jest.fn();
            store.clearAncillariesAndUpdateUrl = jest.fn();
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
            expect(rootStore.trackingStore.holidayConfigChangeTrigger).toHaveBeenCalledWith(
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
        const mockSelectedNumberOfNights = 8;
        const mockFrom = new Date('2025-11-11');

        beforeEach(() => {
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
                true,
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
            );
        });

        it('should pass atcomCode, from and selectedNumberOfNights param values from booking store when they are defined', async () => {
            store.selectedOffer = {
                ...mockedOffer,
            };

            await store.loadRecommendedHotels(Bd4TravelPlacementId.Destination);

            expect(offersService.fetchRecommendedOffers).toHaveBeenCalledWith(
                new Date(store.selectedOffer.date),
                3,
                [`${store.selectedNumberOfNights}`],
                'LGW',
                'ES',
                true,
                [{ adults: 2, children: 1, childrenAges: [0], infants: 1, roomCode: '' }],
                undefined,
                '',
                undefined,
                'ejh-reco-dg-central',
                mockedOffer.accom.code,
                undefined,
                undefined,
                false,
                undefined,
            );
        });
    });

    describe('changeRoom', () => {
        beforeEach(() => {
            store.selectedOffer = {
                accom: { unit: [mockedUnit] },
                isExt: false,
            } as any;
            store.changeIsClickChangeButton = jest.fn();
            store.togglePriceManipulating = jest.fn();
            store.fetchOffer = jest.fn();
        });

        it('should update room in selected offer', async () => {
            await store.changeRoom(0, mockedUnit2, 100);

            expect(store.changeIsClickChangeButton).toHaveBeenCalledWith(true);
            expect(store.selectedOffer?.accom.unit[0]).toEqual({
                ...mockedUnit2,
                board: store.selectedOffer?.accom.unit[0].board,
            });
            expect(store.togglePriceManipulating).not.toHaveBeenCalled();
            expect(rootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith('query');
            expect(store.fetchOffer).toHaveBeenCalledWith(true, true, expect.any(Function), '');
            expect(rootStore.trackingStore.holidayConfigChangeTrigger).toHaveBeenCalledWith(EventTypes.RoomUpdate, 100);
        });

        it('should call togglePriceManipulating when it is Extras page', async () => {
            rootStore.layoutStore.isExtrasPage = true;

            await store.changeRoom(0, mockedUnit2, 100);

            expect(store.togglePriceManipulating).toHaveBeenCalledWith(true);
        });

        it('should fetch offer', async () => {
            await store.changeRoom(0, mockedUnit2, 100);

            expect(store.fetchOffer).toHaveBeenCalled();
        });

        it('should call swapAccommodations', async () => {
            await store.changeRoom(0, mockedUnit2, 100);

            expect(swapOfferAccommodations).toHaveBeenCalled();
        });

        it('should change isExt', async () => {
            await store.changeRoom(0, mockedUnit2, 100);

            expect(store.selectedOffer?.accom.isExt).toBe(true);
        });

        it('should fetch offer with new boardType when a new room has a requireBoardAlteration param', async () => {
            mockedUnit2.requireBoardAlteration = 'AI';

            await store.changeRoom(0, mockedUnit2, 100);

            expect(store.fetchOffer).toHaveBeenCalledWith(true, true, expect.any(Function), 'AI');
        });

        it('should update room and board in selected offer when requireBoardAlteration', async () => {
            mockedUnit2.requireBoardAlteration = 'HB';
            const newRoom = {
                ...mockedUnit2,
                board: mockedUnit2.requireBoardAlteration,
            };

            await store.changeRoom(0, mockedUnit2, 100);

            expect(store.selectedOffer?.accom.unit[0]).toEqual(newRoom);
        });

        it('should keep the previous boardType if the selected unit does not have one', async () => {
            delete (mockedUnit2 as { boardType?: IBoardType }).boardType;

            await store.changeRoom(0, mockedUnit2, 100);

            expect(store.selectedOffer?.accom.unit[0].boardType).toStrictEqual(mockedUnit.boardType);
        });
    });

    describe('changeTransfer', () => {
        beforeEach(() => {
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
            expect(rootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
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
            expect(rootStore.trackingStore.trackTransferChange).toHaveBeenCalledWith(
                store.selectedOffer?.transfers[0],
                EventTypes.AddToBasket,
            );
            expect(rootStore.routerStore.updateCurrentPage).toHaveBeenCalled();
        });

        it('should NOT call updateCurrentPage when offer was unsuccessfully loaded', async () => {
            store.failedToLoadData = true;
            await store.changeTransfer(mockTransfer);

            expect(rootStore.trackingStore.trackTransferChange).not.toHaveBeenCalled();
            expect(rootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
        });
    });

    describe('onApplyPromoCode / validatePromoCode (TradePortal hooks)', () => {
        it('should call validatePromoCode and not validatePackage when applying promo', () => {
            store.validatePackage = jest.fn();
            bookingService.validatePromoCode = jest.fn().mockResolvedValue({ data: { requestId: 'test' } });
            bookingService.validatePackage = jest.fn().mockResolvedValue({ data: { requestId: 'test' } });
            store.promoCode.setInLocalStorage = jest.fn();

            store.onApplyPromoCode('PROMO1');

            expect(store.promoCode.value).toBe('PROMO1');
            expect(store.validatePackage).not.toHaveBeenCalled();
        });

        it('should call selectFullPayment and set applyingPromoCode when onApplyPromoCode succeeds', async () => {
            const packageInfo = { requestId: 'test' };
            bookingService.validatePromoCode = jest.fn().mockResolvedValue({ data: packageInfo });
            bookingService.validatePackage = jest.fn().mockResolvedValue({ data: packageInfo });
            store.promoCode.setInLocalStorage = jest.fn();

            store.onApplyPromoCode('PROMO1');

            await new Promise(resolve => setImmediate(resolve));

            expect(rootStore.paymentStore.selectFullPayment).toHaveBeenCalled();
            expect(store.applyingPromoCode).toBe(true);
        });

        it('should call promocode error callback and not call redeem cleanup on onErrorPromoCode', () => {
            store.promoCode.onPromocodeErrorCallback = jest.fn();

            store.onErrorPromoCode(mockApiError);

            expect(store.promoCode.onPromocodeErrorCallback).toHaveBeenCalledWith(mockApiError);
            expect(rootStore.redeemVoucherStore.cleanupRedeemStore).not.toHaveBeenCalled();
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
        });

        it('return false when NO transport data', () => {
            delete (mockBooking as any).package.transport;

            expect(store.isCheckInAvailable(mockBooking)).toBeFalsy();
        });

        it('return false when NO payment info', () => {
            delete (mockBooking as any).paymentInfo;

            expect(store.isCheckInAvailable(mockBooking)).toBeFalsy();
        });

        it('return false when remaining balance more than 0', () => {
            mockBooking.paymentInfo.balanceDueAmount = 100;

            expect(store.isCheckInAvailable(mockBooking)).toBeFalsy();
        });

        it('return false when holiday is in past', () => {
            mockBooking.package.transport.routes[0].depDate = '2000-01-01T00:00:00';
            mockBooking.package.transport.routes[1].depDate = '2000-01-10T00:00:00';

            expect(store.isCheckInAvailable(mockBooking)).toBeFalsy();
        });

        it('return true when checking is available', () => {
            rootStore.layoutStore.getSettingAsNumber.mockReturnValueOnce(30);

            const mockNow = new Date('2050-01-01T00:00:00').getTime();

            jest.spyOn(Date, 'now').mockImplementationOnce(() => mockNow);

            expect(store.isCheckInAvailable(mockBooking)).toBeTruthy();
        });
    });

    describe('loadResortInfo', () => {
        it('should do nothing when NO accomodation id', () => {
            bookingService.loadResortInfo = jest.fn();
            store.loadResortInfo();

            expect(bookingService.loadResortInfo).not.toHaveBeenCalled();
        });

        it('should set resort info', async () => {
            store.selectedOffer = {
                accom: { id: '12345' } as any,
            } as any;
            bookingService.loadResortInfo = jest.fn().mockReturnValue(Promise.resolve('Resort info'));

            await store.loadResortInfo();

            expect(bookingService.loadResortInfo).toHaveBeenCalledWith('12345');
            expect(store.resortInfo).toEqual('Resort info');
        });

        it('should set resort info to null when an error', async () => {
            store.resortInfo = {} as any;
            store.selectedOffer = {
                accom: { id: '12345' },
            } as any;
            store.clearResortInfo = jest.fn();
            bookingService.loadResortInfo = jest.fn().mockReturnValue(Promise.reject());

            await store.loadResortInfo();

            expect(store.clearResortInfo).toHaveBeenCalled();
        });
    });

    describe('clearResortInfo', () => {
        it('set resort info to null', () => {
            store.resortInfo = 'resortInfo' as any;

            store.clearResortInfo();

            expect(store.resortInfo).toBeNull();
        });
    });

    describe('loadFeaturedFacilities', () => {
        it('should do nothing when NO accommodation id', () => {
            offersService.getFeaturedFacilities = jest.fn();
            store.loadFeaturedFacilities();

            expect(offersService.getFeaturedFacilities).not.toHaveBeenCalled();
        });

        it('should set featured facilities', async () => {
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

    describe('loadBookingConfirmationInfo', () => {
        it('redirect to home page when no bookingInfoPayload', () => {
            bookingService.viewBooking = jest.fn();

            store.loadBookingConfirmationInfo();

            expect(rootStore.routerStore.redirectToHomePage).toHaveBeenCalled();
            expect(bookingService.viewBooking).not.toHaveBeenCalled();
        });

        it('get booking info and set fields', async () => {
            jest.spyOn(utils, 'getWebStorageItem').mockReturnValueOnce({
                bookingPayload: { date: 'date', bookingReference: '12345', lastName: 'Black' },
                accomodationDiscount: 100,
            });
            const packageInfo = {
                requestId: 'test',
            } as IValidatePackageInfo;
            bookingService.viewBooking = jest.fn().mockReturnValue(Promise.resolve({ data: { ...packageInfo } }));

            const promise = store.loadBookingConfirmationInfo();

            expect(store.isLoadingBookingConfirmationInfo).toBe(true);

            await promise;

            expect(rootStore.routerStore.redirectToHomePage).not.toHaveBeenCalled();
            expect(bookingService.viewBooking).toHaveBeenCalledWith('date', '12345', 'Black');
            expect(store.selectedOffer).toEqual({ accom: { unit: [{ discount: 100 }] } });
            expect(store.booking).toEqual(packageInfo);
            expect(rootStore.flightsPassengersStore.setPassengersStore).toHaveBeenCalledWith(packageInfo);
            expect(store.isLoadingBookingConfirmationInfo).toBe(false);
        });

        it('should set isBookingFailed to true when request fails', async () => {
            jest.spyOn(utils, 'getWebStorageItem').mockReturnValueOnce({
                bookingPayload: { date: 'date', bookingReference: '12345', lastName: 'Black' },
                accomodationDiscount: 100,
            });
            bookingService.viewBooking = jest.fn().mockRejectedValueOnce(new Error());

            const promise = store.loadBookingConfirmationInfo();

            expect(store.isBookingFailed).toBe(false);

            await promise;

            expect(store.isBookingFailed).toBe(true);
            expect(store.isLoadingBookingConfirmationInfo).toBe(false);
        });
    });

    describe('validateBookingRequestBody', () => {
        it('should be the same as base booking request body', () => {
            const body = store.validateBookingRequestBody;
            expect(body).toEqual(store.validateBookingBaseRequestBody);
        });
    });

    describe('setIsPaymentPriceJump', () => {
        it('should set isPaymentPriceJump', () => {
            expect(store.isPaymentPriceJump).toBe(false);

            store.setIsPaymentPriceJump(true);

            expect(store.isPaymentPriceJump).toBe(true);
        });
    });

    describe('setPriceAfterJump', () => {
        it('should set priceAfterJump', () => {
            expect(store.priceAfterJump).toBe(0);

            store.setPriceAfterJump(1000);

            expect(store.priceAfterJump).toBe(1000);
        });
    });

    describe('updateOfferInfo', () => {
        it('should invoke the updateOfferInfo of the parent', () => {
            store.updateOfferInfoBase = jest.fn();
            const specificOffer: ISpecificOfferWithAltAcc = {
                ...offer,
                offers: [],
            };
            store.updateOfferInfo(specificOffer);

            expect(store.updateOfferInfoBase).toHaveBeenCalledWith(specificOffer);
        });
    });
});
