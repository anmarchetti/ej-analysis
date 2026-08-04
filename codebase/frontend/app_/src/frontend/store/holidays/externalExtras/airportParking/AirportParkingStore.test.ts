import { createMockStores } from 'frontend/__mocks__';
import { AirportParkingService } from 'frontend/services/externalExtras/airportParking/airportParking.service';
import { BookingStore } from 'frontend/store/holidays/booking/BookingStore';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { QueryParamName } from 'models/enum/QueryParamName';

import { AirportParkingStore } from './AirportParkingStore';

jest.mock('frontend/services/externalExtras/airportParking/airportParking.service');
const mockGetAirportParking = AirportParkingService.getAirportParkings as jest.MockedFn<
    typeof AirportParkingService.getAirportParkings
>;

describe('AirportParkingStore', () => {
    let mockRootStore;
    let store;
    const mockOffer = {} as IOfferWithoutAltBoards;

    const selectedAirportParking: IAirportParking = {
        title: 'Test parking title',
        address: '123 Main St., Luton 123EAB',
        bookingDetails: {
            totalPrice: 49,
            endDate: '',
            endTime: '',
            extRefId: '',
            productCode: '',
            promotionCode: '',
            startDate: '',
            startTime: '',
            type: '',
            keyData: '',
        },
        description: 'Test parking description',
        transferTip: 'Test transfer tip',
        brandImage: '/testImage.jpg',
        isMeetAndGreet: false,
        isParkAndRide: false,
        isParkAndStroll: false,
    };

    beforeEach(() => {
        mockRootStore = createMockStores({
            bookingStore: {
                validatePackage: jest.fn(),
                togglePriceManipulating: jest.fn(),
            },
            queryParamsStore: {
                buildHotelDetailsQuery: jest.fn(),
            },
            routerStore: {
                updateCurrentPage: jest.fn(),
            },
            appStore: {
                setNavigationBooking: jest.fn(),
            },
        });
        store = new AirportParkingStore(mockRootStore);
    });

    describe('airportParkingInfo', () => {
        it('should be empty when there is no info', () => {
            expect(store.airportParkings).toBeNull();
        });
    });

    describe('initializeAirportParkings', () => {
        it('should call fetchAirportParkings with correct arguments and isAirportParkingsInitialized to true', () => {
            store.fetchAirportParkings = jest.fn();
            const mockTrackError = jest.fn();
            store.initializeAirportParkings(mockOffer, mockTrackError);

            expect(store.fetchAirportParkings).toHaveBeenCalledWith(mockOffer, mockTrackError);
            expect(store.isAirportParkingsInitialized).toBe(true);
        });
    });

    describe('fetchAirportParkingInfo', () => {
        it('should fetch data and set airportParkingInfo', async () => {
            const mockAirportParkingResponse = [
                {
                    title: 'Parking title',
                    address: '123 Main St., Luton 123EAB',
                    bookingDetails: {
                        totalPrice: 100,
                        endDate: '',
                        endTime: '',
                        extRefId: '',
                        productCode: '',
                        promotionCode: '',
                        startDate: '',
                        startTime: '',
                        type: '',
                        keyData: '',
                    },
                    description: 'Sell point',
                    transferTip: 'Transfer tip',
                    brandImage: '/image.jpg',
                    isMeetAndGreet: false,
                    isParkAndRide: true,
                    isParkAndStroll: false,
                },
                {
                    title: 'Parking title 2',
                    address: '567Main St., Luton 123EAB',
                    bookingDetails: {
                        totalPrice: 101,
                        endDate: '',
                        endTime: '',
                        extRefId: '',
                        productCode: '',
                        promotionCode: '',
                        startDate: '',
                        startTime: '',
                        type: '',
                        keyData: '',
                    },
                    description: 'Sell point',
                    transferTip: 'Transfer tip',
                    brandImage: '/image.jpg',
                    isMeetAndGreet: false,
                    isParkAndRide: false,
                    isParkAndStroll: true,
                },
            ];
            const mockTrackError = jest.fn();

            mockGetAirportParking.mockResolvedValue(mockAirportParkingResponse);

            await store.fetchAirportParkings(mockOffer, mockTrackError);

            expect(mockGetAirportParking).toHaveBeenCalledTimes(1);
            expect(store.airportParkings).toEqual(mockAirportParkingResponse);
            expect(mockTrackError).not.toHaveBeenCalled();
        });

        it('should set airportParkingInfo as null if no offer is selected', async () => {
            const bookingStoreWithNoOffer = {
                selectedOffer: null,
            } as BookingStore;

            mockRootStore.bookingStore = bookingStoreWithNoOffer;

            const store = new AirportParkingStore(mockRootStore);

            await store.fetchAirportParkings(null, jest.fn());

            expect(mockGetAirportParking).not.toHaveBeenCalled();
            expect(store.airportParkings).toBeNull();
        });

        it('should handle error and reset airportParkingInfo to null', async () => {
            store.airportParkings = [selectedAirportParking];
            const mockTrackError = jest.fn();

            expect(store.airportParkings).not.toBeNull();

            mockGetAirportParking.mockRejectedValue(new Error('error'));

            await store.fetchAirportParkings(mockOffer, mockTrackError);

            expect(store.airportParkings).toBeNull();
            expect(mockTrackError).toHaveBeenCalledWith('error');
        });

        it('should toggle transition screen while fetching parking data', async () => {
            await store.fetchAirportParkings(mockOffer, jest.fn());

            expect(mockRootStore.appStore.setNavigationBooking).toHaveBeenCalledTimes(2);
            expect(mockRootStore.appStore.setNavigationBooking).toHaveBeenNthCalledWith(1, true);
            expect(mockRootStore.appStore.setNavigationBooking).toHaveBeenNthCalledWith(2, false);
        });

        it('should toggle transition screen when selectedOffer is null', async () => {
            const bookingStoreWithNoOffer = {
                selectedOffer: null,
            } as BookingStore;

            mockRootStore.bookingStore = bookingStoreWithNoOffer;

            const store = new AirportParkingStore(mockRootStore);

            await store.fetchAirportParkings(null, jest.fn());

            expect(mockRootStore.appStore.setNavigationBooking).toHaveBeenCalledTimes(2);
            expect(mockRootStore.appStore.setNavigationBooking).toHaveBeenNthCalledWith(1, true);
            expect(mockRootStore.appStore.setNavigationBooking).toHaveBeenNthCalledWith(2, false);
        });

        it('should toggle transition screen when there is an error fetching parking data', async () => {
            store.airportParkings = [selectedAirportParking];

            expect(store.airportParkings).not.toBeNull();

            mockGetAirportParking.mockRejectedValue(new Error('error'));

            await store.fetchAirportParkings(mockOffer, jest.fn());

            expect(mockRootStore.appStore.setNavigationBooking).toHaveBeenCalledTimes(2);
            expect(mockRootStore.appStore.setNavigationBooking).toHaveBeenNthCalledWith(1, true);
            expect(mockRootStore.appStore.setNavigationBooking).toHaveBeenNthCalledWith(2, false);
            expect(store.airportParkings).toBeNull();
        });
    });

    describe('validateParking', () => {
        it('should validate parking when no parking selected and log success', async () => {
            store.setSelectedAirportParking = jest.fn();
            mockRootStore.bookingStore.validatePackage = jest.fn((_1, _2, _3, callback) => callback());

            await store.validateParking(null, jest.fn());

            expect(store.setSelectedAirportParking).toHaveBeenCalledWith(null);
            expect(mockRootStore.bookingStore.togglePriceManipulating).toHaveBeenCalledWith(true);
            expect(mockRootStore.bookingStore.validatePackage).toHaveBeenCalledTimes(1);
        });

        it('should validate selected parking and log success', async () => {
            store.setSelectedAirportParking = jest.fn();
            mockRootStore.bookingStore.validatePackage = jest.fn((_1, _2, _3, callback) => callback());

            await store.validateParking(selectedAirportParking, jest.fn());

            expect(store.setSelectedAirportParking).toHaveBeenCalledWith(selectedAirportParking);
            expect(mockRootStore.bookingStore.togglePriceManipulating).toHaveBeenCalledWith(true);
            expect(mockRootStore.bookingStore.validatePackage).toHaveBeenCalledTimes(1);
        });

        it('should clear the selected airport parking when validate package fails', async () => {
            store.clearSelectedAirportParkingAndUpdateUrl = jest.fn();
            mockRootStore.bookingStore.validatePackage = jest.fn((_1, _2, _3, _4, callback) => callback());

            await store.validateParking(selectedAirportParking, jest.fn());
            expect(store.clearSelectedAirportParkingAndUpdateUrl).toHaveBeenCalledTimes(1);
        });

        it('should not toggle the popup when no parking is selected', async () => {
            store.toggleIsParkingPopupOpened = jest.fn();
            mockRootStore.bookingStore.validatePackage = jest.fn((_1, _2, _3, callback) => callback());

            await store.validateParking(null, jest.fn());

            expect(store.toggleIsParkingPopupOpened).not.toHaveBeenCalled();
        });

        it('should toggle the popup when parking is selected', async () => {
            store.toggleIsParkingPopupOpened = jest.fn();
            mockRootStore.bookingStore.validatePackage = jest.fn((_1, _2, _3, callback) => callback());

            await store.validateParking(selectedAirportParking, jest.fn());

            expect(store.toggleIsParkingPopupOpened).toHaveBeenCalled();
        });

        it('should refresh the page on success', async () => {
            store.toggleIsParkingPopupOpened = jest.fn();
            mockRootStore.queryParamsStore.buildHotelDetailsQuery = jest.fn().mockReturnValue('url');
            mockRootStore.bookingStore.validatePackage = jest.fn((_1, _2, _3, callback) => callback());

            await store.validateParking(selectedAirportParking, jest.fn());

            expect(store.toggleIsParkingPopupOpened).toHaveBeenCalled();
            expect(mockRootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith('url');
        });
    });

    describe('setSelectedAirportParking', () => {
        it('should set selected airport parking', () => {
            store.setSelectedAirportParking(null);
            expect(store.selectedAirportParking).toEqual(null);

            store.setSelectedAirportParking(selectedAirportParking);
            expect(store.selectedAirportParking).toEqual(selectedAirportParking);
        });
    });

    describe('toggleIsParkingPopupOpened', () => {
        it('should toggle isParkingPopupOpened from false to true', () => {
            expect(store.isParkingPopupOpened).toBe(false);

            store.toggleIsParkingPopupOpened();

            expect(store.isParkingPopupOpened).toBe(true);
        });

        it('should toggle isParkingPopupOpened from true to false', () => {
            store.isParkingPopupOpened = true;

            expect(store.isParkingPopupOpened).toBe(true);

            store.toggleIsParkingPopupOpened();

            expect(store.isParkingPopupOpened).toBe(false);
        });
    });

    describe('clearAirportParking', () => {
        it('should remove selected airport parking', () => {
            store.selectedAirportParking = selectedAirportParking;

            store.clearAirportParking();

            expect(store.selectedAirportParking).toEqual(null);
        });

        it('should remove airport parking list', () => {
            store.airportParkings = [selectedAirportParking];

            store.clearAirportParking();

            expect(store.airportParkings).toEqual(null);
        });

        it('should set false the isAirportParkingsInitialized', () => {
            store.isAirportParkingsInitialized = true;

            store.clearAirportParking();

            expect(store.isAirportParkingsInitialized).toEqual(false);
        });
    });

    describe('setIsSelectedParkingUnavailableError', () => {
        it('should set isSelectedParkingUnavailableError from false to true', () => {
            expect(store.isSelectedParkingUnavailableError).toBe(false);

            store.setIsSelectedParkingUnavailableError(true);

            expect(store.isSelectedParkingUnavailableError).toBe(true);
        });

        it('should set isSelectedParkingUnavailableError from true to false', () => {
            store.isSelectedParkingUnavailableError = true;

            expect(store.isSelectedParkingUnavailableError).toBe(true);

            store.setIsSelectedParkingUnavailableError(false);

            expect(store.isSelectedParkingUnavailableError).toBe(false);
        });
    });

    describe('clearSelectedAirportParkingAndUpdateUrl', () => {
        it('should clear selected parking', async () => {
            store.setSelectedAirportParking = jest.fn();
            await store.clearSelectedAirportParkingAndUpdateUrl();

            expect(store.setSelectedAirportParking).toHaveBeenCalledWith(null);
        });

        it('should update the URL if parkingCodeFromUrl exists', async () => {
            mockRootStore.queryParamsStore.parkingCodeFromUrl = 'TEST1';
            mockRootStore.queryParamsStore.buildHotelDetailsQuery = jest.fn().mockReturnValue('url');

            await store.clearSelectedAirportParkingAndUpdateUrl();

            expect(mockRootStore.queryParamsStore.buildHotelDetailsQuery).toHaveBeenCalledWith(undefined, {
                [QueryParamName.AirportParkingCode]: '',
            });
            expect(mockRootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith('url', true);
        });

        it('should NOT update the URL if parkingCodeFromUrl is undefined', async () => {
            await store.clearSelectedAirportParkingAndUpdateUrl();

            expect(mockRootStore.routerStore.updateCurrentPage).not.toHaveBeenCalled();
        });
    });
});
