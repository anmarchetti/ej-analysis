import { waitFor } from '@testing-library/dom';

import {
    createMockStores,
    mockAmendHotelOffer,
    mockBooking,
    mockHotel,
    mockPromoCodeBreakdown,
    mockTrackingHotelInitialData,
} from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { mockPendingObservablePromise } from 'frontend/utils/observerablePromise/mockedObservableFromPromise';
import { submitForm } from 'frontend/utils/submitForm';
import { IOffersStatus } from 'models/data/IOffersStatus';
import { AlternativeHotelsSortingOptions } from 'models/enum/AlternativeHotelsSortingOptions';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { ApiErrors } from 'models/enum/ApiErrors';
import { LocalStorageType } from 'models/enum/LocalStorageType';

import { AmendHotelStore } from './AmendHotelStore';

let rootStore: HolidaysRootStore;
let amendHotelStore: AmendHotelStore;

jest.mock('frontend/services/booking.service');
jest.mock('./AmendHotelStore.filters', () => ({
    AmendHotelStoreFilters: jest
        .fn()
        .mockImplementation(() => ({ saveFilters: jest.fn(), onClearAllSelectedFilters: jest.fn() })),
}));

const mockAxiosIsCancel = jest.fn();
jest.mock('axios', () => ({
    isCancel: () => mockAxiosIsCancel(),
    CancelToken: {
        source: jest.fn(() => ({ token: 'cancelToken', cancel: jest.fn() })),
    },
    isAxiosError: jest.fn(),
}));

jest.mock('frontend/utils/submitForm', () => ({
    __esModule: true,
    submitForm: jest.fn(),
}));

const mockSetWebStorageProps = jest.fn();
jest.mock('frontend/utils/webStorage.utils', () => ({
    __esModule: true,
    setWebStorageItem: (...props) => mockSetWebStorageProps(...props),
}));

describe('AmendHotelStore', () => {
    beforeEach(() => {
        rootStore = createMockStores({
            routerStore: {
                redirectToViewBookingPage: jest.fn(),
                redirectToAmendHotelSummaryPage: jest.fn(),
                router: {
                    asPath: 'new_path',
                },
            },
            appStore: {
                setAmendBookingItemPayload: jest.fn(),
            },
            viewBookingStore: {
                initBookingFromPayload: jest.fn(callback => {
                    callback(mockBooking);
                }),
            },
            layoutStore: {},
            trackingStore: {
                changeHotel: {
                    initialAmendHotelOffer: null,
                    trackingSecondaryProducts: [],
                    trackHotelConfirm: jest.fn(),
                    initializeFromPaymentPayload: jest.fn(),
                    updateInitialDataFromHotelOffer: jest.fn(),
                    trackLoadMoreAmendHotelList: jest.fn(),
                    trackSortHotelList: jest.fn(),
                },
            },
            queryParamsStore: {
                isFlightPlusHotelFunnel: false,
            },
        });
        amendHotelStore = new AmendHotelStore(rootStore);
        amendHotelStore.offersStatus = {
            hasDiscont: false,
            maxPrice: 0,
            maxPricePP: 0,
            minPrice: 0,
            minPricePP: 0,
            total: 0,
        } as IOffersStatus;
        (bookingService.getAlternativeAmendHotels as jest.Mock).mockResolvedValue({
            amendHotelOffers: [mockAmendHotelOffer],
            status: { total: 2 },
        });
    });

    it('should call dropRequest', () => {
        amendHotelStore.alternativeHotelsRequest = mockPendingObservablePromise();
        jest.spyOn(amendHotelStore.alternativeHotelsRequest, 'cancel');
        amendHotelStore.dropRequest();

        expect(amendHotelStore.alternativeHotelsRequest.cancel).toHaveBeenCalled();
    });

    describe('onAmendHotelButtonClick', () => {
        it('getInitialAlternativeHotels update alternativeHotels', async () => {
            amendHotelStore.getInitialAlternativeHotels = jest.fn(
                () =>
                    new Promise(res => {
                        amendHotelStore.alternativeHotels = [mockAmendHotelOffer];
                        res();
                    }),
            );
            amendHotelStore.setIsNoAvailabilityError = jest.fn();
            amendHotelStore.rootStore.routerStore.redirectToAmendHotelPage = jest.fn();

            await amendHotelStore.onAmendHotelButtonClick();

            expect(amendHotelStore.filters.onClearAllSelectedFilters).toHaveBeenCalled();
            expect(amendHotelStore.rootStore.routerStore.redirectToAmendHotelPage).toHaveBeenCalled();
            expect(amendHotelStore.setIsNoAvailabilityError).not.toHaveBeenCalled();
        });

        it('getInitialAlternativeHotels update alternativeHotels list by empty array', async () => {
            amendHotelStore.getInitialAlternativeHotels = jest.fn(
                () =>
                    new Promise(res => {
                        amendHotelStore.alternativeHotels = [];
                        res();
                    }),
            );
            amendHotelStore.setIsNoAvailabilityError = jest.fn();
            amendHotelStore.rootStore.routerStore.redirectToAmendHotelPage = jest.fn();

            await amendHotelStore.onAmendHotelButtonClick();

            expect(amendHotelStore.rootStore.routerStore.redirectToAmendHotelPage).not.toHaveBeenCalled();
            expect(amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalled();
        });

        it('getInitialAlternativeHotels throw the error', async () => {
            amendHotelStore.getInitialAlternativeHotels = jest.fn().mockRejectedValueOnce(new Error('Test error'));
            amendHotelStore.setIsNoAvailabilityError = jest.fn();
            amendHotelStore.rootStore.routerStore.redirectToAmendHotelPage = jest.fn();

            await amendHotelStore.onAmendHotelButtonClick();

            expect(amendHotelStore.rootStore.routerStore.redirectToAmendHotelPage).not.toHaveBeenCalled();
            expect(amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(true);
        });

        it('getInitialAlternativeHotels throw Axios cancel error', async () => {
            amendHotelStore.getInitialAlternativeHotels = jest.fn().mockRejectedValueOnce(new Error('Test error'));
            mockAxiosIsCancel.mockReturnValue(true);
            amendHotelStore.setIsNoAvailabilityError = jest.fn();
            amendHotelStore.rootStore.routerStore.redirectToAmendHotelPage = jest.fn();

            await amendHotelStore.onAmendHotelButtonClick();

            expect(amendHotelStore.rootStore.routerStore.redirectToAmendHotelPage).not.toHaveBeenCalled();
            expect(amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(false);
        });
    });

    it('should update isNoAvailabilityError value', () => {
        amendHotelStore.isNoAvailabilityError = true;

        amendHotelStore.setIsNoAvailabilityError(false);

        expect(amendHotelStore.isNoAvailabilityError).toBe(false);
    });

    it('should reset store by call clearStore', () => {
        amendHotelStore.setPrevSelectedHotelOffer = jest.fn();
        amendHotelStore.setIsNoAvailabilityError = jest.fn();
        amendHotelStore.clearHotelSearchResults = jest.fn();
        amendHotelStore.clearSelectedHotelDetails = jest.fn();

        amendHotelStore.clearStore();

        expect(amendHotelStore.setPrevSelectedHotelOffer).toHaveBeenCalledWith(null);
        expect(amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(false);
        expect(amendHotelStore.clearHotelSearchResults).toHaveBeenCalled();
        expect(amendHotelStore.clearSelectedHotelDetails).toHaveBeenCalled();
    });

    describe('fetchAlternativeHotels', () => {
        beforeEach(() => {
            amendHotelStore.dropRequest = jest.fn();
        });

        it('do not be called when no booking', async () => {
            amendHotelStore.rootStore.viewBookingStore.booking = null;

            await amendHotelStore.fetchAlternativeHotels();

            expect(amendHotelStore.rootStore.routerStore.redirectToViewBookingPage).toHaveBeenCalled();
            expect(bookingService.getAlternativeAmendHotels).not.toHaveBeenCalled();
        });

        it('throw the error from bookingService.getAlternativeAmendHotels', async () => {
            (bookingService.getAlternativeAmendHotels as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

            try {
                await amendHotelStore.fetchAlternativeHotels();
            } catch (e) {
                expect(e.message).toBe('Test error');
            }
        });
    });

    describe('getInitialAlternativeHotels', () => {
        beforeEach(() => {
            amendHotelStore.setAlternativeHotels = jest.fn();
            amendHotelStore.fetchAlternativeHotels = jest.fn().mockResolvedValue({
                amendHotelOffers: [mockAmendHotelOffer],
                status: { total: 3 },
            });
        });

        it('will NOT update alternativeHotels if fetchAlternativeHotels returns nothing', async () => {
            amendHotelStore.fetchAlternativeHotels = jest.fn();

            await amendHotelStore.getInitialAlternativeHotels();

            expect(amendHotelStore.setAlternativeHotels).toHaveBeenCalledWith([]);

            expect(amendHotelStore.setAlternativeHotels).toHaveBeenCalledTimes(1);
        });

        it('update alternative hotels data', async () => {
            const mockOnSuccess = jest.fn();

            await amendHotelStore.getInitialAlternativeHotels(mockOnSuccess);
            expect(amendHotelStore.setAlternativeHotels).toHaveBeenCalledWith([]);
            expect(amendHotelStore.fetchAlternativeHotels).toHaveBeenCalledWith();

            expect(amendHotelStore.setAlternativeHotels).toHaveBeenCalledWith([mockAmendHotelOffer]);
            expect(amendHotelStore.filters.saveFilters).toHaveBeenCalled();

            expect(mockOnSuccess).toHaveBeenCalledWith([mockAmendHotelOffer]);
        });

        it('throw the error when fetchAlternativeHotels throw it', async () => {
            jest.mocked(amendHotelStore.fetchAlternativeHotels).mockRejectedValueOnce(new Error('Test Error'));

            try {
                await amendHotelStore.getInitialAlternativeHotels();
            } catch (e) {
                expect(e.message).toBe('Test Error');
            }
        });
    });

    describe('getNextPageOfHotels', () => {
        beforeEach(() => {
            amendHotelStore.incrementPageNumber = jest.fn();
            amendHotelStore.decrementPageNumber = jest.fn();
            amendHotelStore.setAlternativeHotels = jest.fn();
            amendHotelStore.fetchAlternativeHotels = jest.fn().mockResolvedValue({
                amendHotelOffers: [mockAmendHotelOffer],
                status: { total: 3 },
            });
        });

        it('will NOT update alternativeHotels if fetchAlternativeHotels returns nothing', async () => {
            amendHotelStore.fetchAlternativeHotels = jest.fn();

            await amendHotelStore.getNextPageOfHotels();

            expect(amendHotelStore.incrementPageNumber).toHaveBeenCalled();
            expect(amendHotelStore.setAlternativeHotels).not.toHaveBeenCalled();
        });

        it('update alternative hotels data', async () => {
            amendHotelStore.alternativeHotels = [mockAmendHotelOffer];

            await amendHotelStore.getNextPageOfHotels();

            expect(amendHotelStore.incrementPageNumber).toHaveBeenCalled();
            expect(amendHotelStore.fetchAlternativeHotels).toHaveBeenCalled();
            expect(amendHotelStore.setAlternativeHotels).toHaveBeenCalledTimes(1);
            expect(amendHotelStore.setAlternativeHotels).toHaveBeenCalledWith([
                mockAmendHotelOffer,
                mockAmendHotelOffer,
            ]);
            expect(
                amendHotelStore.rootStore.trackingStore.changeHotel.trackLoadMoreAmendHotelList,
            ).toHaveBeenCalledWith([mockAmendHotelOffer]);
        });

        it('call decrementPageNumber when fetchAlternativeHotels throw it', async () => {
            jest.mocked(amendHotelStore.fetchAlternativeHotels).mockRejectedValueOnce(new Error('Test Error'));

            try {
                await amendHotelStore.getNextPageOfHotels();
            } catch (e) {
                expect(amendHotelStore.decrementPageNumber).toHaveBeenCalled();
                expect(e.message).toBe('Test Error');
            }
        });
    });

    describe('initializeHotelChangePage', () => {
        it('call getAlternativeHotels if alternativeHotels are empty, and NOT call redirectToViewBookingPage afterwards if getAlternativeHotels update alternativeHotels', async () => {
            amendHotelStore.alternativeHotels = [];
            const mockOnSuccess = jest.fn();
            const spy = jest.spyOn(amendHotelStore, 'getInitialAlternativeHotels').mockImplementation(
                () =>
                    new Promise(res => {
                        amendHotelStore.alternativeHotels = [mockAmendHotelOffer];

                        res();
                    }),
            );

            await amendHotelStore.initializeHotelChangePage(mockOnSuccess);

            expect(amendHotelStore.rootStore.routerStore.redirectToViewBookingPage).not.toHaveBeenCalled();
            expect(mockOnSuccess).toHaveBeenCalledWith(amendHotelStore.alternativeHotels);
            expect(spy).toHaveBeenCalled();
        });

        it('call getAlternativeHotels if alternativeHotels are empty, and redirectToViewBookingPage afterwards if getAlternativeHotels did not update alternativeHotels', async () => {
            amendHotelStore.alternativeHotels = [];
            const mockOnSuccess = jest.fn();

            const spy = jest.spyOn(amendHotelStore, 'getInitialAlternativeHotels').mockResolvedValue();

            await amendHotelStore.initializeHotelChangePage(mockOnSuccess);

            expect(spy).toHaveBeenCalled();
            expect(amendHotelStore.rootStore.routerStore.redirectToViewBookingPage).toHaveBeenCalled();
            expect(mockOnSuccess).not.toHaveBeenCalled();
        });

        it('do NOT call alternativeHotels or redirectToViewBookingPage, when alternativeHotels exist', async () => {
            amendHotelStore.alternativeHotels = [mockAmendHotelOffer];
            const spy = jest.spyOn(amendHotelStore, 'getInitialAlternativeHotels');

            await amendHotelStore.initializeHotelChangePage();

            expect(amendHotelStore.rootStore.routerStore.redirectToViewBookingPage).not.toHaveBeenCalled();
            expect(spy).not.toHaveBeenCalled();
        });
    });

    it('should clear store state', () => {
        amendHotelStore.alternativeHotels = [mockAmendHotelOffer as any];
        amendHotelStore.pageNumber = 4;
        amendHotelStore.offersStatus!.total = 5;
        amendHotelStore.selectedHotelDetails = mockAmendHotelOffer as any;
        amendHotelStore.prevSelectedHotelOffer = mockAmendHotelOffer;
        jest.spyOn(amendHotelStore, 'setPrevSelectedHotelOffer');

        amendHotelStore.clearStore();

        expect(amendHotelStore.alternativeHotels).toEqual([]);
        expect(amendHotelStore.pageNumber).toBe(1);
        expect(amendHotelStore.totalNumberOfHotels).toBe(0);
        expect(amendHotelStore.selectedHotelDetails).toEqual(null);
        expect(amendHotelStore.setPrevSelectedHotelOffer).toHaveBeenCalledWith(null);
    });

    it('clearHotelSearchResults should set alternativeHotels to empty, totalNumberOfHotels to 0 and pageNumber to 1', () => {
        amendHotelStore.alternativeHotels = [mockAmendHotelOffer];
        amendHotelStore.offersStatus!.total = 5;
        amendHotelStore.pageNumber = 4;
        amendHotelStore.selectedSortingOption = AlternativeHotelsSortingOptions.PriceHighToLow;
        amendHotelStore.clearHotelSearchResults();

        expect(amendHotelStore.alternativeHotels).toEqual([]);
        expect(amendHotelStore.filters.onClearAllSelectedFilters).toHaveBeenCalled();
        expect(amendHotelStore.totalNumberOfHotels).toBe(0);
        expect(amendHotelStore.pageNumber).toBe(1);
        expect(amendHotelStore.selectedSortingOption).toBe(AlternativeHotelsSortingOptions.TripAdvisor);
    });

    describe('selectNewHotel', () => {
        beforeEach(() => {
            amendHotelStore.setIsLoadingSummaryPage = jest.fn();
            amendHotelStore.setNewlySelectedHotelOffer = jest.fn();
        });

        it('Should call bookingService with bookingReference and hotelOffer, and set newlySelectedHotel, prevSelectedHotelOffer and redirect to summary page on success response', async () => {
            const mockAmendHotelOfferFromResponse = {
                ...mockAmendHotelOffer,
                hotel: {
                    ...mockAmendHotelOffer.hotel,
                    name: 'Mock_hotel_name',
                },
            };
            jest.spyOn(amendHotelStore, 'setPrevSelectedHotelOffer');
            (bookingService.validateAlternativeAmendHotel as jest.Mock).mockResolvedValue({
                amendHotelOffer: mockAmendHotelOfferFromResponse,
            });

            await amendHotelStore.selectNewHotel(mockAmendHotelOffer);

            expect(amendHotelStore.setIsLoadingSummaryPage).toHaveBeenCalledWith(true);
            expect(bookingService.validateAlternativeAmendHotel).toHaveBeenCalledWith(
                rootStore.viewBookingStore.booking!.bookingReference,
                mockAmendHotelOffer,
            );
            expect(amendHotelStore.setNewlySelectedHotelOffer).toHaveBeenCalledWith(mockAmendHotelOfferFromResponse);
            expect(amendHotelStore.setPrevSelectedHotelOffer).toHaveBeenCalledWith(mockAmendHotelOffer);
            expect(rootStore.routerStore.redirectToAmendHotelSummaryPage).toHaveBeenCalled();
            expect(amendHotelStore.setIsLoadingSummaryPage).toHaveBeenCalledWith(false);
        });

        it('Should redirect to view booking page when booking is not available', async () => {
            rootStore.viewBookingStore.booking = null;

            await amendHotelStore.selectNewHotel(mockAmendHotelOffer);

            expect(rootStore.routerStore.redirectToViewBookingPage).toHaveBeenCalled();
            expect(bookingService.validateAlternativeAmendHotel).not.toHaveBeenCalled();
        });

        it('Should set isHotelValidationError to true when AlternativeHotelCantBeValidated error is thrown by API call', async () => {
            amendHotelStore.setIsNoAvailabilityError = jest.fn();
            (bookingService.validateAlternativeAmendHotel as jest.Mock).mockRejectedValue({
                errorCode: ApiErrors.AlternativeHotelCantBeValidated,
            });

            await amendHotelStore.selectNewHotel(mockAmendHotelOffer);

            expect(amendHotelStore.setIsNoAvailabilityError).toHaveBeenCalledWith(true);
        });

        it('Update initial chosen package for tracking store', async () => {
            (bookingService.validateAlternativeAmendHotel as jest.Mock).mockResolvedValue({
                amendHotelOffer: mockAmendHotelOffer,
            });

            expect(amendHotelStore.rootStore.trackingStore.changeHotel.initialOfferData).toBe(undefined);

            await amendHotelStore.selectNewHotel(mockAmendHotelOffer);

            expect(
                amendHotelStore.rootStore.trackingStore.changeHotel.updateInitialDataFromHotelOffer,
            ).toHaveBeenCalledWith(mockAmendHotelOffer);
        });
    });

    describe('confirmChosenHotel', () => {
        it('Invoke submitForm function with correct params', () => {
            amendHotelStore.rootStore.viewBookingStore.booking = mockBooking;
            amendHotelStore.rootStore.trackingStore.changeHotel.initialOfferData = mockTrackingHotelInitialData;
            amendHotelStore.newlySelectedHotelOffer = mockAmendHotelOffer;
            amendHotelStore.confirmChosenHotel();

            expect(submitForm).toHaveBeenCalledWith(
                '/booking/amend-payment',
                'amend-payment-payload',
                expect.objectContaining({
                    amendHotelOffer: mockAmendHotelOffer,
                    trackingData: {
                        initialData: amendHotelStore.rootStore.trackingStore.changeHotel.initialOfferData,
                        secondaryProducts:
                            amendHotelStore.rootStore.trackingStore.changeHotel.trackingSecondaryProducts,
                    },
                }),
            );

            expect(amendHotelStore.rootStore.trackingStore.changeHotel.trackHotelConfirm).toBeCalled();
        });

        it('should append ?ecp=fph to amend-payment url when in FPH funnel', () => {
            (amendHotelStore.rootStore as any).queryParamsStore = {
                ...amendHotelStore.rootStore.queryParamsStore,
                isFlightPlusHotelFunnel: true,
            };
            amendHotelStore.rootStore.viewBookingStore.booking = mockBooking;
            amendHotelStore.rootStore.trackingStore.changeHotel.initialOfferData = mockTrackingHotelInitialData;
            amendHotelStore.newlySelectedHotelOffer = mockAmendHotelOffer;
            amendHotelStore.confirmChosenHotel();

            expect(submitForm).toHaveBeenCalledWith(
                '/booking/amend-payment?ecp=fph',
                'amend-payment-payload',
                expect.objectContaining({
                    amendHotelOffer: mockAmendHotelOffer,
                }),
            );
        });
    });

    describe('initializeSummaryPage', () => {
        it('Should call initializeSummaryPageFromPayload when amendBookingItemPayload is available', async () => {
            amendHotelStore.initializeSummaryPageFromPayload = jest.fn();

            rootStore.appStore.amendBookingItemPayload = { amendHotelOffer: mockAmendHotelOffer } as any;
            await amendHotelStore.initializeSummaryPage();

            expect(amendHotelStore.initializeSummaryPageFromPayload).toHaveBeenCalled();
        });

        it('Should redirect to view booking page when booking is not available', async () => {
            rootStore.viewBookingStore.booking = null;

            await amendHotelStore.initializeSummaryPage();

            expect(rootStore.routerStore.redirectToViewBookingPage).toHaveBeenCalled();
        });
    });

    describe('initializeSummaryPageFromPayload', () => {
        it('Should call initBookingFromPayload and set newlySelectedHotelOffer', async () => {
            const mockTrackingData = {
                secondaryProducts: [],
                initialAmendHotelOffer: mockAmendHotelOffer,
            };
            rootStore.appStore.amendBookingItemPayload = {
                amendHotelOffer: mockAmendHotelOffer,
                trackingData: mockTrackingData,
            } as any;
            bookingService.validateAlternativeAmendHotel = jest.fn().mockResolvedValue({
                amendHotelOffer: mockAmendHotelOffer,
            });
            jest.spyOn(amendHotelStore, 'setPrevSelectedHotelOffer');

            await amendHotelStore.initializeSummaryPageFromPayload();

            expect(rootStore.viewBookingStore.initBookingFromPayload).toHaveBeenCalled();
            expect(bookingService.validateAlternativeAmendHotel).toHaveBeenCalledWith(
                rootStore.viewBookingStore.booking!.bookingReference,
                mockAmendHotelOffer,
            );
            expect(amendHotelStore.newlySelectedHotelOffer).toEqual(mockAmendHotelOffer);
            expect(rootStore.appStore.setAmendBookingItemPayload).toHaveBeenCalledWith(undefined);
            expect(amendHotelStore.setPrevSelectedHotelOffer).toHaveBeenCalledWith(
                rootStore.appStore.amendBookingItemPayload!.amendHotelOffer,
            );

            expect(
                amendHotelStore.rootStore.trackingStore.changeHotel.initializeFromPaymentPayload,
            ).toHaveBeenCalledWith(mockTrackingData);
        });

        it('Should not set newlySelectedHotelOffer when amendBookingItemPayload is not available', async () => {
            rootStore.appStore.amendBookingItemPayload = undefined;

            await amendHotelStore.initializeSummaryPageFromPayload();

            expect(amendHotelStore.newlySelectedHotelOffer).toBeUndefined();
        });

        it('Should set isNoAvailabilityError and set newlySelectedHotelOffer to amendBookingItemPayload off when error is thrown by API call', async () => {
            rootStore.appStore.amendBookingItemPayload = { amendHotelOffer: mockAmendHotelOffer } as any;
            bookingService.validateAlternativeAmendHotel = jest.fn().mockRejectedValue(new Error('Error'));

            await amendHotelStore.initializeSummaryPageFromPayload();

            expect(amendHotelStore.isNoAvailabilityError).toBe(true);
            expect(amendHotelStore.newlySelectedHotelOffer).toEqual(
                rootStore.appStore.amendBookingItemPayload?.amendHotelOffer,
            );
        });
    });

    it('setAlternativeHotels should set alternativeHotels', () => {
        amendHotelStore.setAlternativeHotels([mockAmendHotelOffer] as any);

        expect(amendHotelStore.alternativeHotels).toEqual([mockAmendHotelOffer]);
    });

    it('setPageNumber should set pageNumber', () => {
        amendHotelStore.setPageNumber(5);

        expect(amendHotelStore.pageNumber).toBe(5);
    });

    it('incrementPageNumber should increment pageNumber', () => {
        amendHotelStore.pageNumber = 4;
        amendHotelStore.incrementPageNumber();

        expect(amendHotelStore.pageNumber).toBe(5);
    });

    it('decrementPageNumber should decrement pageNumber', () => {
        amendHotelStore.pageNumber = 4;
        amendHotelStore.decrementPageNumber();

        expect(amendHotelStore.pageNumber).toBe(3);
    });

    it('setTotalNumberOfHotels should set totalNumberOfHotels', () => {
        amendHotelStore.offersStatus!.total = 10;

        expect(amendHotelStore.totalNumberOfHotels).toBe(10);
    });

    it('setNewlySelectedHotelOffer should set newlySelectedHotelOffer', () => {
        amendHotelStore.setNewlySelectedHotelOffer(mockAmendHotelOffer);

        expect(amendHotelStore.newlySelectedHotelOffer).toEqual(mockAmendHotelOffer);
    });

    it('setIsLoadingSummaryPage should set isLoadingSummaryPage', () => {
        amendHotelStore.setIsLoadingSummaryPage(true);

        expect(amendHotelStore.isLoadingSummaryPage).toBe(true);
    });

    describe('amendCTAState', () => {
        it('Should return isVisible = true and isDisabled = false when change of hotel is allowed', () => {
            const { isVisible, isDisabled } = amendHotelStore.amendCTAState;

            expect(isVisible).toBe(true);
            expect(isDisabled).toBe(false);
        });

        it('Should return isVisible = false when the change of hotel is not allowed because of site settings', () => {
            rootStore.viewBookingStore.booking!.amendmentInfo!.isHotelChangeEnabled = false;
            (rootStore.viewBookingStore.amendBookingStatuses as AmendBookingStatus[] | undefined) = [
                AmendBookingStatus.AmendHotelDisabledOnSite,
            ];
            const { isVisible } = amendHotelStore.amendCTAState;

            expect(isVisible).toBe(false);
        });

        it('Should return isVisible = false when the change of hotel is not allowed because outbound flight departs too soon', () => {
            rootStore.viewBookingStore.booking!.amendmentInfo!.isHotelChangeEnabled = false;
            (rootStore.viewBookingStore.amendBookingStatuses as AmendBookingStatus[] | undefined) = [
                AmendBookingStatus.AmendHotelDisabledByTimeBound,
                AmendBookingStatus.AmendHotelDisabledByHavingMultipleRooms,
            ];
            const { isVisible } = amendHotelStore.amendCTAState;

            expect(isVisible).toBe(false);
        });

        it('Should return isVisible = false when the change of hotel is not allowed because of site settings and outbound flight departs too soon', () => {
            rootStore.viewBookingStore.booking!.amendmentInfo!.isHotelChangeEnabled = false;
            (rootStore.viewBookingStore.amendBookingStatuses as AmendBookingStatus[] | undefined) = [
                AmendBookingStatus.AmendHotelDisabledOnSite,
                AmendBookingStatus.AmendHotelDisabledByTimeBound,
            ];
            const { isVisible } = amendHotelStore.amendCTAState;

            expect(isVisible).toBe(false);
        });

        it('Should return isVisible = true and isDisabled = true when the change of hotel is not allowed because booking has multiple rooms', () => {
            rootStore.viewBookingStore.booking!.amendmentInfo!.isHotelChangeEnabled = false;
            (rootStore.viewBookingStore.amendBookingStatuses as AmendBookingStatus[] | undefined) = [
                AmendBookingStatus.AmendHotelDisabledByHavingMultipleRooms,
            ];
            const { isVisible, isDisabled } = amendHotelStore.amendCTAState;

            expect(isVisible).toBe(true);
            expect(isDisabled).toBe(true);
        });

        it('Should return isVisible = false when the change of hotel is not allowed because of site settings and the booking has sport equipment', () => {
            rootStore.viewBookingStore.booking!.amendmentInfo!.isHotelChangeEnabled = false;
            (rootStore.viewBookingStore.amendBookingStatuses as AmendBookingStatus[] | undefined) = [
                AmendBookingStatus.AmendHotelDisabledOnSite,
                AmendBookingStatus.AmendHotelDisabledBySportEquipment,
            ];
            const { isVisible } = amendHotelStore.amendCTAState;

            expect(isVisible).toBe(false);
        });

        it('Should return isVisible = true and isDisabled = true when the change of hotel is not allowed because booking has sport equipment', () => {
            rootStore.viewBookingStore.booking!.amendmentInfo!.isHotelChangeEnabled = false;
            (rootStore.viewBookingStore.amendBookingStatuses as AmendBookingStatus[] | undefined) = [
                AmendBookingStatus.AmendHotelDisabledBySportEquipment,
            ];
            const { isVisible, isDisabled } = amendHotelStore.amendCTAState;

            expect(isVisible).toBe(true);
            expect(isDisabled).toBe(true);
        });

        it('Should return isVisible = false when viewBookingStore has no booking', () => {
            rootStore.viewBookingStore.booking = null;
            const { isVisible } = amendHotelStore.amendCTAState;

            expect(isVisible).toBe(false);
        });

        it('Should return isVisible = false when viewBookingStore.booking has no amendmentInfo', () => {
            rootStore.viewBookingStore.booking!.amendmentInfo = undefined;
            const { isVisible } = amendHotelStore.amendCTAState;

            expect(isVisible).toBe(false);
        });
    });

    describe('isAmendCTADisabled', () => {
        it('Should return true when amendCTAState return isDisabled = true', () => {
            jest.spyOn(amendHotelStore, 'amendCTAState', 'get').mockReturnValueOnce({
                isVisible: true,
                isDisabled: true,
            });

            expect(amendHotelStore.isAmendCTADisabled).toBe(true);
        });
    });

    describe('isAmendCTAVisible', () => {
        it('Should return true when amendCTAState return isVisible = true', () => {
            jest.spyOn(amendHotelStore, 'amendCTAState', 'get').mockReturnValueOnce({
                isVisible: true,
                isDisabled: false,
            });

            expect(amendHotelStore.isAmendCTAVisible).toBe(true);
        });
    });

    it('totalNumberOfHotelsDisplayed should return length of alternativeHotels', () => {
        amendHotelStore.alternativeHotels.fill(mockAmendHotelOffer as any, undefined, 10);

        waitFor(() => expect(amendHotelStore.totalNumberOfHotelsDisplayed).toBe(10));
    });

    it('hasMoreHotelsToLoad should return true if totalNumberOfHotelsDisplayed is greater than totalNumberOfHotels', () => {
        amendHotelStore.alternativeHotels.fill(mockAmendHotelOffer as any, 0, 10);
        amendHotelStore.offersStatus!.total = 20;

        waitFor(() => expect(amendHotelStore.hasMoreHotelsToLoad).toBe(true));
    });

    it('hasMoreHotelsToLoad should return false if totalNumberOfHotelsDisplayed is equal to totalNumberOfHotels', () => {
        amendHotelStore.alternativeHotels.fill(mockAmendHotelOffer as any, 0, 10);
        amendHotelStore.offersStatus!.total = 10;

        waitFor(() => expect(amendHotelStore.hasMoreHotelsToLoad).toBe(false));
    });

    it('hasMoreHotelsToLoad should return false if totalNumberOfHotelsDisplayed is less than totalNumberOfHotels', () => {
        amendHotelStore.alternativeHotels.fill(mockAmendHotelOffer as any, 0, 10);
        amendHotelStore.offersStatus!.total = 5;

        waitFor(() => expect(amendHotelStore.hasMoreHotelsToLoad).toBe(false));
    });

    describe('setSortingOption ', () => {
        it('should set sorting option, reset pageNumber and request offers', () => {
            expect(amendHotelStore.selectedSortingOption).toBe(AlternativeHotelsSortingOptions.TripAdvisor);
            jest.spyOn(amendHotelStore, 'getInitialAlternativeHotels');

            amendHotelStore.setSortingOption(AlternativeHotelsSortingOptions.PriceHighToLow);

            expect(amendHotelStore.selectedSortingOption).toBe(AlternativeHotelsSortingOptions.PriceHighToLow);
            expect(amendHotelStore.pageNumber).toBe(1);
            expect(amendHotelStore.getInitialAlternativeHotels).toHaveBeenCalledWith(
                amendHotelStore.rootStore.trackingStore.changeHotel.trackSortHotelList,
            );
        });

        it('should not set the new option when the new option is the same', () => {
            const selectedOption = AlternativeHotelsSortingOptions.PriceHighToLow;

            amendHotelStore.selectedSortingOption = selectedOption;
            amendHotelStore.setPageNumber = jest.fn();
            amendHotelStore.getInitialAlternativeHotels = jest.fn();

            amendHotelStore.setSortingOption(selectedOption);

            expect(amendHotelStore.selectedSortingOption).toBe(selectedOption);
            expect(amendHotelStore.setPageNumber).not.toHaveBeenCalled();
            expect(amendHotelStore.getInitialAlternativeHotels).not.toHaveBeenCalled();
        });
    });

    describe('setInitialPageNumber', () => {
        it('should set page number to 1', () => {
            amendHotelStore.pageNumber = 3;

            amendHotelStore.setInitialPageNumber();

            expect(amendHotelStore.pageNumber).toBe(1);
        });
    });

    describe('totalPrice', () => {
        it('should return amendmentChargesInfo from newlySelectedHotelOffer', () => {
            amendHotelStore.newlySelectedHotelOffer = {
                ...mockAmendHotelOffer,
                amendmentChargesInfo: {
                    ...mockAmendHotelOffer.amendmentChargesInfo!,
                    fullAmendmentCharges: 12,
                },
            };

            expect(amendHotelStore.totalPrice).toEqual(12);
        });

        it('should return 0 when newlySelectedHotelOffer is not available', () => {
            amendHotelStore.newlySelectedHotelOffer = undefined;

            expect(amendHotelStore.totalPrice).toEqual(0);
        });
    });

    describe('promocodeBreakdown', () => {
        it('should return promocode breakdown from newlySelectedHotelOffer', () => {
            amendHotelStore.newlySelectedHotelOffer = mockAmendHotelOffer;

            expect(amendHotelStore.promocodeBreakdown).toEqual(mockPromoCodeBreakdown);
        });

        it('should return undefined when newlySelectedHotelOffer is not available', () => {
            amendHotelStore.newlySelectedHotelOffer = undefined;

            expect(amendHotelStore.promocodeBreakdown).toBeUndefined();
        });
    });

    describe('setSelectedHotelDetailsOffer', () => {
        Object.defineProperty(window, 'sessionStorage', { configurable: true, value: 'sessionStorage' });

        it('should set selectedHotelDetails with amendHotelOffer and hotel, and call setWebStorageItem', () => {
            Object.defineProperty(amendHotelStore.rootStore.layoutStore, 'isAmendHotelSummaryPage', {
                get: jest.fn().mockReturnValueOnce(true),
            });
            amendHotelStore.setSelectedHotelDetailsOffer(mockAmendHotelOffer, mockHotel, 'backLink');

            expect(amendHotelStore.selectedHotelDetails?.hotel).toStrictEqual(mockHotel);
            expect(amendHotelStore.selectedHotelDetails?.amendHotelOffer).toStrictEqual(mockAmendHotelOffer);
            expect(mockSetWebStorageProps).toHaveBeenCalledWith(
                LocalStorageType.HotelMobileBasket,
                {
                    backLink: 'backLink',
                    hotelOffer: mockAmendHotelOffer,
                    booking: amendHotelStore.rootStore.viewBookingStore.booking,
                    isOnlyGoBack: true,
                },
                'sessionStorage',
            );
        });

        it('should be called with default backLink param', () => {
            amendHotelStore.setSelectedHotelDetailsOffer(mockAmendHotelOffer, mockHotel);

            expect(mockSetWebStorageProps).toHaveBeenCalledWith(
                LocalStorageType.HotelMobileBasket,
                {
                    backLink: amendHotelStore.rootStore.routerStore.router!.asPath,
                    hotelOffer: mockAmendHotelOffer,
                    booking: amendHotelStore.rootStore.viewBookingStore.booking,
                    isOnlyGoBack: undefined,
                },
                'sessionStorage',
            );
        });

        it('clearSelectedHotelDetails should set SelectedHotelDetailsOffer to null', () => {
            amendHotelStore.setSelectedHotelDetailsOffer(mockAmendHotelOffer, mockHotel);

            amendHotelStore.clearSelectedHotelDetails();

            expect(amendHotelStore.selectedHotelDetails).toEqual(null);
        });
    });

    describe('setPrevSelectedHotelOffer', () => {
        it('should set new hotel offer', () => {
            amendHotelStore.prevSelectedHotelOffer = mockAmendHotelOffer;

            amendHotelStore.setPrevSelectedHotelOffer({
                ...mockAmendHotelOffer,
                hotel: {
                    ...mockAmendHotelOffer.hotel,
                    name: 'mock_name',
                },
            });

            expect(amendHotelStore.prevSelectedHotelOffer.hotel.name).toBe('mock_name');
        });
    });

    describe('feePP', () => {
        it('should return per person fee', () => {
            amendHotelStore.newlySelectedHotelOffer = mockAmendHotelOffer;

            expect(amendHotelStore.feePP).toBe(10);
        });
    });
});
