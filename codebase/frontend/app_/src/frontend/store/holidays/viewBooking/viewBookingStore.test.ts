import { mockBooking, mockFlightsOffers, mockTransfer } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { IBaseViewBookingStoreInitialState } from 'frontend/store/base/viewBooking/BaseViewBookingStore';
import { goPayRemainingBalance } from 'frontend/utils/payment.utls';
import { submitForm } from 'frontend/utils/submitForm';
import {
    getBookingPayload,
    getDaysBeforeDeparture,
    getViewBookingRedirectLink,
    matchGuestsToAssistedTravelRequest,
} from 'frontend/utils/viewBooking.utils';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { AmendmentType, DisruptionLevel, IBookingInfo } from 'models/data/IBookingInfo';
import { AmendBookingStatus } from 'models/enum/AmendBookingStatus';
import { ACCESS_TO_PRIVATE_BOOKING, BookingErrorCodes, BookingStatus, FRAUD_CODE } from 'models/enum/BookingStatus';
import SitePath from 'models/enum/SitePath';

import { ViewBookingStore } from './viewBookingStore';
import MockedFn = jest.MockedFn;
import { waitFor } from '@testing-library/dom';

import { mockAmendBookingPayload } from 'frontend/__mocks__/payloads';
import { FLIGHTS_PLUS_HOTEL_PROVIDER } from 'frontend/store/base/queryParams/constants';
import * as dateUtils from 'frontend/utils/date.utils';
import { buildFlightPlusHotelUrl, matchesPathname } from 'frontend/utils/url.utils';
import { QueryParamName } from 'models/enum/QueryParamName';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ViewBookingPageStates } from 'models/enum/ViewBookingPageStates';

jest.mock('frontend/utils/payment.utls');
jest.mock('frontend/services/booking.service');
jest.mock('frontend/utils/submitForm');
jest.mock('frontend/utils/viewBooking.utils');

jest.mock('frontend/utils/webStorage.utils', () => ({
    setWebStorageItem: jest.fn(),
    getWebStorageItem: jest.fn(),
}));
jest.mock('frontend/utils/url.utils', () => ({
    matchesPathname: jest.fn(),
    buildFlightPlusHotelUrl: jest.fn(value => `${value}?ecp=fph`),
}));

describe('ViewBookingStore', () => {
    const initialState = {
        viewBookingPayload: {
            bookingReference: 'test booking reference',
            date: 'test date',
            lastName: 'test last name',
        },
    } as IBaseViewBookingStoreInitialState;

    const createRootStore = () =>
        ({
            queryParamsStore: {
                buildQuery: jest.fn(),
                isFlightPlusHotelFunnel: false,
            },
            userStore: {
                isLoggedIn: true,
                userData: {},
                checkIfUserLoggedIn: jest.fn().mockReturnValue(true),
            },
            layoutStore: {
                basePath: '/en/holidays',
                bookingHoursPreTravelStarts: 0,
                bookingHoursPostTravelStarts: 0,
                viewBookingLinks: {},
            },
            routerStore: {
                router: { asPath: '' },
                isViewBookingPage: jest.fn().mockReturnValue(true),
                redirectToLoginPage: jest.fn(),
                redirectTo: jest.fn(),
                redirectToViewBookingPage: jest.fn(),
                redirectToViewBookingsPage: jest.fn(),
            },
            seatMapStore: {
                setValidatedSelectedSeats: jest.fn(),
                clearValidatedSeats: jest.fn(),
            },
            flightsPassengersStore: {
                setPassengersStore: jest.fn(),
            },
            amendFlightsStore: {
                setShowSeatDropPopup: jest.fn(),
                haveChosenSeatsBeenDropped: false,
                isAmendCTAVisible: true,
            },
            amendTransfersStore: {},
            amendSeatsStore: {},
            amendDatesStore: {},
            holidayCreditStore: {
                isCreditBookingEnabled: true,
                creditBalance: null,
                fetchMyCreditBalance: jest.fn(),
            },
            trackingStore: {
                trackTransferAmendment: jest.fn(),
                trackFlightAmendment: jest.fn(),
                trackBookingSpecialRequests: jest.fn(),
                trackBookingPrivacy: jest.fn(),
                setPreviousPage: jest.fn(),
            },
            payStore: {
                clearStore: jest.fn(),
            },
            appStore: {},
        } as any);

    let rootStore;
    let viewBookingStore;

    beforeEach(() => {
        rootStore = createRootStore();
        viewBookingStore = new ViewBookingStore(rootStore);
        viewBookingStore.booking = mockBooking;
    });

    describe('amendBookingSpecialRequests', () => {
        it('Should be prevented from execution when no booking in store', async () => {
            viewBookingStore.booking = null;

            await viewBookingStore.amendBookingSpecialRequests(['SR 1', 'SR 2']);

            expect(bookingService.amendBookingSpecialRequests).not.toHaveBeenCalled();
        });

        it('Should store booking be updated with a new one', async () => {
            viewBookingStore.updateBookingInfo = jest.fn();
            viewBookingStore.toggleLoading = jest.fn();
            (getBookingPayload as MockedFn<any>).mockReturnValue({
                bookingReference: 'new reference',
                date: '2020-09-11',
                lastName: 'Karl',
            });
            bookingService.amendBookingSpecialRequests = jest.fn().mockResolvedValue({ data: mockBooking });

            expect(viewBookingStore.isAmendSSRFailed).toBe(false);
            await viewBookingStore.amendBookingSpecialRequests(['SR 1', 'SR 2']);

            expect(bookingService.amendBookingSpecialRequests).toHaveBeenCalledWith(
                'new reference',
                '2020-09-11',
                'Karl',
                ['SR 1', 'SR 2'],
            );
            expect(viewBookingStore.rootStore.trackingStore.trackBookingSpecialRequests).toHaveBeenCalledWith(
                EventTypes.SpecialRequestPb,
                expect.objectContaining(mockBooking),
                mockBooking.specialRequests,
            );
            expect(viewBookingStore.updateBookingInfo).toHaveBeenCalledWith(expect.objectContaining(mockBooking));
            expect(viewBookingStore.isAmendSSRFailed).toBe(false);
        });

        it('Should set isAmendSSRFailed to true in case of error', async () => {
            bookingService.amendBookingSpecialRequests = jest.fn().mockRejectedValue(new Error());

            await viewBookingStore.amendBookingSpecialRequests(['SR 1', 'SR 2']);

            expect(viewBookingStore.isAmendSSRFailed).toBe(true);
        });
    });

    describe('getBooking', () => {
        it('Should get booking and update to the store with no any passed parameters', async () => {
            viewBookingStore.booking = null;
            viewBookingStore.updateBookingInfo = jest.fn();
            viewBookingStore.toggleLoading = jest.fn();
            bookingService.viewBooking = jest.fn().mockResolvedValue({ data: mockBooking });

            await viewBookingStore.getBooking();

            expect(viewBookingStore.updateBookingInfo).toHaveBeenCalledWith(mockBooking, undefined);
            expect(viewBookingStore.rootStore.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.ViewBooking);
            expect(viewBookingStore.toggleLoading).toHaveBeenCalled();
        });

        it('Should get booking and update to the store with payload parameter', async () => {
            viewBookingStore.booking = null;
            viewBookingStore.updateBookingInfo = jest.fn();
            viewBookingStore.guestBookingInfo.clearData = jest.fn();
            viewBookingStore.handleViewBookingRedirects = jest.fn();
            bookingService.viewBooking = jest.fn().mockResolvedValue({ data: mockBooking });
            const mockPayload = {
                ...mockAmendBookingPayload,
                isBackToPageClicked: true,
                hasAmendedFlights: true,
                hasAmendedTransfers: true,
                hasAmendedSeats: true,
            };

            await viewBookingStore.getBooking(mockPayload);

            expect(viewBookingStore.updateBookingInfo).toHaveBeenCalledWith(mockBooking, undefined);
            expect(viewBookingStore.guestBookingInfo.clearData).toHaveBeenCalled();
            expect(viewBookingStore.handleViewBookingRedirects).toHaveBeenCalled();
        });

        it('Should not call the handleViewBookingRedirects when isBookingReload is true', async () => {
            viewBookingStore.handleViewBookingRedirects = jest.fn();
            bookingService.viewBooking = jest.fn().mockResolvedValue({ data: mockBooking });

            await viewBookingStore.getBooking({}, true);

            expect(viewBookingStore.handleViewBookingRedirects).not.toHaveBeenCalled();
        });

        it('Should catch the error with FRAUD_CODE code', async () => {
            bookingService.viewBooking = jest.fn().mockRejectedValue({ errorCode: FRAUD_CODE });
            viewBookingStore.changeErrorMessage = jest.fn();

            await viewBookingStore.getBooking();

            expect(viewBookingStore.changeErrorMessage).toHaveBeenCalledWith(BookingErrorCodes.Fraud);
        });

        it('Should catch the error with ACCESS_TO_PRIVATE_BOOKING code', async () => {
            bookingService.viewBooking = jest.fn().mockRejectedValue({ errorCode: ACCESS_TO_PRIVATE_BOOKING });
            viewBookingStore.changeErrorMessage = jest.fn();

            await viewBookingStore.getBooking();

            expect(viewBookingStore.changeErrorMessage).toHaveBeenCalledWith(BookingErrorCodes.AccessToPrivateBooking);
        });

        it('Should catch the error with any other code and not redirect to login page if not on post booking page', async () => {
            bookingService.viewBooking = jest.fn().mockRejectedValue({ errorCode: 'Test' });
            viewBookingStore.changeErrorMessage = jest.fn();
            viewBookingStore.booking = mockBooking;
            viewBookingStore.rootStore.layoutStore.isViewBookingPage = false;

            await viewBookingStore.getBooking();

            expect(viewBookingStore.changeErrorMessage).toHaveBeenCalledWith(BookingErrorCodes.NotFound);
            expect(viewBookingStore.changeErrorMessage).toHaveBeenCalledWith(BookingErrorCodes.NotFound);
            expect(viewBookingStore.rootStore.routerStore.redirectToLoginPage).not.toHaveBeenCalled();
            expect(viewBookingStore.booking).toBeNull();
        });

        it('Should redirectToLoginPage to be called on error when user is on any post booking pages', async () => {
            viewBookingStore.rootStore.layoutStore.isViewBookingPage = true;
            bookingService.viewBooking = jest.fn().mockRejectedValue({ errorCode: 'Test' });

            const mockBuildQueryResult = '?viewmybooking=1';
            viewBookingStore.rootStore.queryParamsStore.buildQuery = jest
                .fn()
                .mockReturnValueOnce(mockBuildQueryResult);

            await viewBookingStore.getBooking();

            expect(viewBookingStore.rootStore.routerStore.redirectToLoginPage).toHaveBeenCalledWith(
                false,
                mockBuildQueryResult,
            );
            expect(viewBookingStore.rootStore.queryParamsStore.buildQuery).toHaveBeenCalledWith({
                viewmybooking: '1',
            });
        });

        it('should load credit balance if credit balance is empty', async () => {
            await viewBookingStore.getBooking();

            expect(viewBookingStore.rootStore.holidayCreditStore.fetchMyCreditBalance).toHaveBeenCalled();
        });

        it('should NOT load credit balance if credit balance is not empty', async () => {
            viewBookingStore.rootStore.holidayCreditStore.creditBalance = { balance: 200 };
            await viewBookingStore.getBooking();

            expect(viewBookingStore.rootStore.holidayCreditStore.fetchMyCreditBalance).not.toHaveBeenCalled();
        });

        it('should NOT load credit balance if user is not logged in', async () => {
            viewBookingStore.rootStore.userStore.isLoggedIn = false;
            await viewBookingStore.getBooking();

            expect(viewBookingStore.rootStore.holidayCreditStore.fetchMyCreditBalance).not.toHaveBeenCalled();
        });

        it('should NOT load credit balance if credit booking is not enabled', async () => {
            viewBookingStore.rootStore.holidayCreditStore.isCreditBookingEnabled = false;
            await viewBookingStore.getBooking();

            expect(viewBookingStore.rootStore.holidayCreditStore.fetchMyCreditBalance).not.toHaveBeenCalled();
        });
    });

    describe('clearBooking', () => {
        it('Should updateBookingInfo be called with null', () => {
            viewBookingStore.updateBookingInfo = jest.fn();
            viewBookingStore.clearBooking();

            expect(viewBookingStore.updateBookingInfo).toHaveBeenCalledWith(null);
        });
    });

    describe('toggleLoadingBookingPrivacy', () => {
        it('Should assign isLoadingBookingPrivacy passed value', () => {
            expect(viewBookingStore.isLoadingBookingPrivacy).toBe(false);

            viewBookingStore.toggleLoadingBookingPrivacy(true);

            expect(viewBookingStore.isLoadingBookingPrivacy).toBe(true);
        });
    });

    describe('deserialize', () => {
        it('should correctly deserialize store', () => {
            viewBookingStore.deserialize(initialState);

            expect(viewBookingStore.viewBookingPayload).toEqual(initialState.viewBookingPayload);
        });

        it('should not deserialize store', () => {
            viewBookingStore.deserialize(undefined);

            expect(viewBookingStore.viewBookingPayload).toEqual(undefined);
        });
    });

    describe('serialize', () => {
        it('should correctly serialize empty store', () => {
            const serializedData = viewBookingStore.serialize();

            expect(serializedData).toEqual({
                viewBookingPayload: undefined,
            });
        });

        it('should correctly serialize store', () => {
            viewBookingStore.deserialize(initialState);

            const serializedData = viewBookingStore.serialize();

            expect(serializedData).toEqual({
                viewBookingPayload: initialState.viewBookingPayload,
            });
        });
    });

    describe('clearGuestBookingInfo', () => {
        it('should correctly clear booking info', () => {
            viewBookingStore.booking = {} as IBookingInfo;

            const clearDataSpy = jest.spyOn(viewBookingStore.guestBookingInfo, 'clearData');
            const changeErrorMessageSpy = jest.spyOn(viewBookingStore, 'changeErrorMessage');

            viewBookingStore.clearGuestBookingInfo();

            expect(viewBookingStore.booking).toBe(null);
            expect(clearDataSpy).toHaveBeenCalled();
            expect(changeErrorMessageSpy).toHaveBeenCalled();
        });
    });

    describe('loadBooking', () => {
        it('Should getBookingPayload be called when booking exists in store', () => {
            viewBookingStore.deserialize(initialState);

            viewBookingStore.loadBooking(true);

            expect(getBookingPayload).toHaveBeenCalledWith(expect.objectContaining(mockBooking));
        });

        it('should load booking with data from booking payload', async () => {
            viewBookingStore.deserialize(initialState);

            const clearDataSpy = jest.spyOn(viewBookingStore.guestBookingInfo, 'clearData');
            const getBookingSpy = jest.spyOn(viewBookingStore, 'getBooking');

            viewBookingStore.loadBooking();
            await waitFor(() => expect(clearDataSpy).toHaveBeenCalled());

            expect(getBookingSpy).toHaveBeenCalledWith(initialState.viewBookingPayload, false);
        });

        it('should load booking with data from refresh booking payload when viewBookingPayload is empty', async () => {
            viewBookingStore.refreshBookingPayloadFromStorage = initialState.viewBookingPayload;
            viewBookingStore.viewBookingPayload = null;

            const getBookingSpy = jest.spyOn(viewBookingStore, 'getBooking');

            viewBookingStore.loadBooking();

            expect(getBookingSpy).toHaveBeenCalledWith(viewBookingStore.refreshBookingPayloadFromStorage, false);
        });

        it('should NOT load booking', () => {
            const clearDataSpy = jest.spyOn(viewBookingStore.guestBookingInfo, 'clearData');
            const getBookingSpy = jest.spyOn(viewBookingStore, 'getBooking');

            viewBookingStore.loadBooking();

            expect(rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
            expect(clearDataSpy).not.toHaveBeenCalled();
            expect(getBookingSpy).not.toHaveBeenCalled();
        });
    });

    describe('changeErrorMessage', () => {
        it('should correctly change error message', () => {
            viewBookingStore.changeErrorMessage(BookingErrorCodes.Canceled);

            expect(viewBookingStore.errorMessage).toBe(BookingErrorCodes.Canceled);
        });

        it('should clear error message', () => {
            viewBookingStore.changeErrorMessage(BookingErrorCodes.Canceled);
            viewBookingStore.changeErrorMessage(undefined);

            expect(viewBookingStore.errorMessage).toBe(null);
        });
    });

    describe('handleViewBookingRedirects', () => {
        describe('redirect to specific view booking page when redirects are enabled', () => {
            beforeEach(() => {
                rootStore.layoutStore.isViewBookingRedirectsEnabled = true;
                rootStore.layoutStore.viewBookingLinks = {
                    cancelled: 'cancelled',
                    inDestination: 'in-destination',
                    viewBooking: 'view-booking',
                    preTravel: 'pre-travel',
                    postTravel: 'post-travel',
                };
            });

            it('should redirect to cancelled booking page when booking is canceled', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                viewBookingStore.isBookingCanceled = true;

                viewBookingStore.handleViewBookingRedirects();

                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    rootStore.layoutStore.viewBookingLinks.cancelled,
                );
            });

            it('should redirect to pre-travel page', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                    ViewBookingPageStates.PreTravel,
                );

                jest.mocked(getViewBookingRedirectLink).mockReturnValue(
                    rootStore.layoutStore.viewBookingLinks.preTravel,
                );

                viewBookingStore.handleViewBookingRedirects();

                expect(getViewBookingRedirectLink).toHaveBeenCalledWith(
                    viewBookingStore.viewBookingPageState,
                    rootStore.layoutStore.viewBookingLinks,
                );

                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    rootStore.layoutStore.viewBookingLinks.preTravel,
                );
            });

            it('should redirect to in-destination page', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                    ViewBookingPageStates.InDestination,
                );
                jest.mocked(getViewBookingRedirectLink).mockReturnValue(
                    rootStore.layoutStore.viewBookingLinks.inDestination,
                );

                viewBookingStore.handleViewBookingRedirects();

                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    rootStore.layoutStore.viewBookingLinks.inDestination,
                );
            });

            it('should redirect to post-travel page', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                    ViewBookingPageStates.PostTravel,
                );
                jest.mocked(getViewBookingRedirectLink).mockReturnValue(
                    rootStore.layoutStore.viewBookingLinks.postTravel,
                );

                viewBookingStore.handleViewBookingRedirects();

                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    rootStore.layoutStore.viewBookingLinks.postTravel,
                );
            });

            it('should redirect to view booking page', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                    ViewBookingPageStates.ViewBooking,
                );
                jest.mocked(getViewBookingRedirectLink).mockReturnValue(
                    rootStore.layoutStore.viewBookingLinks.viewBooking,
                );

                viewBookingStore.handleViewBookingRedirects();

                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    rootStore.layoutStore.viewBookingLinks.viewBooking,
                );
            });

            it('should redirect to view booking page from router store when viewBookingPageState returns unknown state', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                    ViewBookingPageStates.Unknown,
                );
                jest.mocked(getViewBookingRedirectLink).mockReturnValue(
                    rootStore.layoutStore.viewBookingLinks.viewBooking,
                );

                viewBookingStore.handleViewBookingRedirects();

                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    rootStore.layoutStore.viewBookingLinks.viewBooking,
                );
            });

            it(`should NOT redirect to corresponding page if we are already on this page`, () => {
                const {
                    layoutStore: { viewBookingLinks, basePath },
                } = rootStore;
                const asPath = rootStore.routerStore.router.asPath;

                (matchesPathname as jest.MockedFn<typeof matchesPathname>).mockReturnValue(true);
                const pagePaths = Object.keys(viewBookingLinks);

                pagePaths.forEach(path => {
                    jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValueOnce(path);
                    jest.mocked(getViewBookingRedirectLink).mockReturnValue(viewBookingLinks[path]);

                    viewBookingStore.handleViewBookingRedirects();

                    expect(rootStore.routerStore.redirectTo).not.toHaveBeenCalled();

                    expect(matchesPathname).toHaveBeenCalledWith({
                        asPath,
                        pathname: viewBookingLinks[path],
                        basePath,
                    });
                });
            });

            it('should call buildFlightPlusHotelUrl when booking is a flight+hotel package', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                jest.spyOn(viewBookingStore, 'isFlightAndHotelPackage', 'get').mockReturnValue(true);
                jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                    ViewBookingPageStates.PreTravel,
                );
                jest.mocked(getViewBookingRedirectLink).mockReturnValue(
                    rootStore.layoutStore.viewBookingLinks.preTravel,
                );

                viewBookingStore.handleViewBookingRedirects();

                expect(buildFlightPlusHotelUrl).toHaveBeenCalledWith(rootStore.layoutStore.viewBookingLinks.preTravel);
                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    `${rootStore.layoutStore.viewBookingLinks.preTravel}?${QueryParamName.ExperienceContextProvider}=${FLIGHTS_PLUS_HOTEL_PROVIDER}`,
                );
            });

            it('should NOT append ecp=fph when booking is NOT a flight+hotel package', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                (matchesPathname as jest.MockedFn<typeof matchesPathname>).mockReturnValue(false);
                jest.spyOn(viewBookingStore, 'isFlightAndHotelPackage', 'get').mockReturnValue(false);
                jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                    ViewBookingPageStates.ViewBooking,
                );
                jest.mocked(getViewBookingRedirectLink).mockReturnValue(
                    rootStore.layoutStore.viewBookingLinks.viewBooking,
                );

                viewBookingStore.handleViewBookingRedirects();

                expect(buildFlightPlusHotelUrl).not.toHaveBeenCalled();
                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    rootStore.layoutStore.viewBookingLinks.viewBooking,
                );
            });

            it('should redirect when on correct page but ecp param is missing for FPH booking', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                rootStore.routerStore.router = { asPath: '/en/holidays/booking/my_bookings/pre-travel' };
                jest.spyOn(viewBookingStore, 'isFlightAndHotelPackage', 'get').mockReturnValue(true);
                jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                    ViewBookingPageStates.PreTravel,
                );
                jest.mocked(getViewBookingRedirectLink).mockReturnValue(
                    rootStore.layoutStore.viewBookingLinks.preTravel,
                );
                (matchesPathname as jest.MockedFn<typeof matchesPathname>).mockReturnValue(true);

                viewBookingStore.handleViewBookingRedirects();

                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    `${rootStore.layoutStore.viewBookingLinks.preTravel}?${QueryParamName.ExperienceContextProvider}=${FLIGHTS_PLUS_HOTEL_PROVIDER}`,
                );
            });

            it('should NOT redirect when on correct page and ecp param is already present', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                rootStore.routerStore.router = {
                    asPath: `/en/holidays/booking/my_bookings/pre-travel?${QueryParamName.ExperienceContextProvider}=${FLIGHTS_PLUS_HOTEL_PROVIDER}`,
                };
                jest.spyOn(viewBookingStore, 'isFlightAndHotelPackage', 'get').mockReturnValue(true);
                jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                    ViewBookingPageStates.PreTravel,
                );
                jest.mocked(getViewBookingRedirectLink).mockReturnValue(
                    rootStore.layoutStore.viewBookingLinks.preTravel,
                );
                (matchesPathname as jest.MockedFn<typeof matchesPathname>).mockReturnValue(true);

                viewBookingStore.handleViewBookingRedirects();

                expect(rootStore.routerStore.redirectTo).not.toHaveBeenCalled();
            });

            it('should append ecp=fph to cancelled booking redirect for FPH booking', () => {
                const viewBookingStore = new ViewBookingStore(rootStore);

                viewBookingStore.isBookingCanceled = true;
                jest.spyOn(viewBookingStore, 'isFlightAndHotelPackage', 'get').mockReturnValue(true);

                viewBookingStore.handleViewBookingRedirects();

                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    `${rootStore.layoutStore.viewBookingLinks.cancelled}?${QueryParamName.ExperienceContextProvider}=${FLIGHTS_PLUS_HOTEL_PROVIDER}`,
                );
            });
        });

        describe('redirect when redirects are disabled', () => {
            it('should redirect to ViewBooking with ecp=fph when FPH and redirects disabled', () => {
                rootStore.layoutStore.isViewBookingRedirectsEnabled = false;
                const viewBookingStore = new ViewBookingStore(rootStore);

                jest.spyOn(viewBookingStore, 'isFlightAndHotelPackage', 'get').mockReturnValue(true);

                viewBookingStore.handleViewBookingRedirects();

                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(
                    `${SitePath.ViewBooking}?${QueryParamName.ExperienceContextProvider}=${FLIGHTS_PLUS_HOTEL_PROVIDER}`,
                );
            });

            it('should redirect to ViewBooking without ecp when not FPH and redirects disabled', () => {
                rootStore.layoutStore.isViewBookingRedirectsEnabled = false;
                const viewBookingStore = new ViewBookingStore(rootStore);

                jest.spyOn(viewBookingStore, 'isFlightAndHotelPackage', 'get').mockReturnValue(false);

                viewBookingStore.handleViewBookingRedirects();

                expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith(SitePath.ViewBooking);
            });
        });
    });

    describe('showBooking', () => {
        it('should correctly show booking', () => {
            const booking = {
                bookingStatus: BookingStatus.Canceled,
            } as IBookingInfo;

            viewBookingStore.handleViewBookingRedirects = jest.fn();
            viewBookingStore.showBooking(booking);

            expect(viewBookingStore.handleViewBookingRedirects).toHaveBeenCalled();

            expect(viewBookingStore.isBookingCanceled).toBe(true);

            expect(viewBookingStore.booking).toEqual(booking);
        });

        it('should correctly calculate booking cancellation', () => {
            const booking = {
                bookingStatus: '',
            } as IBookingInfo;

            viewBookingStore.showBooking(booking);

            expect(viewBookingStore.isBookingCanceled).toBe(false);
            expect(rootStore.payStore.clearStore).toHaveBeenCalled();
        });

        it('should NOT clear payStore', () => {
            const viewBookingStore = new ViewBookingStore(rootStore);
            const booking = {
                bookingStatus: '',
            } as IBookingInfo;

            viewBookingStore.showBooking(booking, false);
            expect(rootStore.payStore.clearStore).not.toHaveBeenCalled();
        });

        it('should NOT update booking info if no booking', () => {
            viewBookingStore.updateBookingInfo = jest.fn();
            viewBookingStore.showBooking(null, false);
            expect(viewBookingStore.updateBookingInfo).not.toHaveBeenCalled();
        });
    });

    describe('updateBookingInfo', () => {
        it('should correctly proceed non empty booking', () => {
            const booking = {
                bookingStatus: BookingStatus.Canceled,
                seatSelection: undefined,
            } as IBookingInfo;
            viewBookingStore.baseUpdateBookingInfo = jest.fn();

            viewBookingStore.updateBookingInfo(booking);

            expect(viewBookingStore.baseUpdateBookingInfo).toBeCalledWith(booking);
        });

        it('should set successfulAmendmentStatus', () => {
            const booking = {} as IBookingInfo;
            viewBookingStore.successfulAmendmentStatus = null;

            viewBookingStore.updateBookingInfo(booking, AmendmentType.Dates);

            expect(viewBookingStore.successfulAmendmentStatus).toBe(AmendmentType.Dates);
        });
    });

    describe('toggleLoading', () => {
        it('should correctly change loading state', () => {
            viewBookingStore.toggleLoading(true);

            expect(viewBookingStore.isLoading).toBe(true);

            viewBookingStore.toggleLoading(false);

            expect(viewBookingStore.isLoading).toBe(false);
        });
    });

    describe('setIsViewBookingStatusPage', () => {
        it('should correctly change isViewBookingStatusPage state', () => {
            viewBookingStore.setIsViewBookingStatusPage(true);

            expect(viewBookingStore.isViewBookingStatusPage).toBe(true);

            viewBookingStore.setIsViewBookingStatusPage(false);

            expect(viewBookingStore.isViewBookingStatusPage).toBe(false);
        });
    });

    describe('payRemainingBalance', () => {
        it('should correctly pay remaining balance', () => {
            viewBookingStore.payRemainingBalance();

            expect(rootStore.trackingStore.setPreviousPage).toHaveBeenCalled();

            expect(goPayRemainingBalance).toHaveBeenCalledWith(
                viewBookingStore.booking,
                rootStore.userStore.userData,
                rootStore.layoutStore.basePath,
            );
        });
    });

    describe('continueToPay', () => {
        it('should not call submitForm', () => {
            viewBookingStore.booking = null;

            viewBookingStore.continueToPay();

            expect(submitForm).not.toBeCalled();
        });

        it('should call submitForm without selectedSeats', () => {
            viewBookingStore.booking = {} as IBookingInfo;
            rootStore.amendSeatsStore.newSelection = null;
            (getBookingPayload as MockedFn<any>).mockReturnValue({});

            viewBookingStore.continueToPay();

            expect(rootStore.trackingStore.setPreviousPage).toHaveBeenCalled();

            expect(submitForm).toBeCalledWith('/en/holidays/booking/amend-payment', 'amend-payment-payload', {
                billingInfo: {
                    address: undefined,
                    address2: undefined,
                    city: undefined,
                    fullName: 'undefined undefined',
                    postCode: undefined,
                },
                selectedFlight: undefined,
                selectedFlightFilters: undefined,
                selectedTransfer: undefined,
            });
        });

        it('should call submitForm with selectedSeats', () => {
            viewBookingStore.booking = {
                guests: [{}],
                package: {
                    transport: {
                        routes: [
                            {
                                fltNo: '1234',
                            },
                            {
                                fltNo: '1235',
                            },
                        ],
                    },
                } as any,
            } as IBookingInfo;
            rootStore.amendSeatsStore.newSelection = [
                {
                    sectorId: 'test',
                    seats: [],
                },
            ];

            viewBookingStore.continueToPay();

            expect(rootStore.trackingStore.setPreviousPage).toHaveBeenCalled();

            expect(submitForm).toBeCalledWith('/en/holidays/booking/amend-payment', 'amend-payment-payload', {
                billingInfo: {
                    address: undefined,
                    address2: undefined,
                    city: undefined,
                    fullName: 'undefined undefined',
                    postCode: undefined,
                },
                selectedFlight: undefined,
                selectedFlightFilters: undefined,
                selectedTransfer: undefined,
                selectedSeats: {
                    amendmentCharges: 0,
                    newSeatSelection: [
                        {
                            sectorId: 'test',
                            seats: [],
                        },
                    ],
                    guests: [{}],
                    inboundFlightNum: '1235',
                    outboundFlightNum: '1234',
                    prevSeatSelection: [],
                },
            });
        });

        it('should append ?ecp=fph to amend-payment url when in FPH funnel', () => {
            rootStore.queryParamsStore.isFlightPlusHotelFunnel = true;
            viewBookingStore.booking = {} as IBookingInfo;
            rootStore.amendSeatsStore.newSelection = null;
            (getBookingPayload as MockedFn<any>).mockReturnValue({});

            viewBookingStore.continueToPay();

            expect(submitForm).toBeCalledWith('/en/holidays/booking/amend-payment?ecp=fph', 'amend-payment-payload', {
                billingInfo: {
                    address: undefined,
                    address2: undefined,
                    city: undefined,
                    fullName: 'undefined undefined',
                    postCode: undefined,
                },
                selectedFlight: undefined,
                selectedFlightFilters: undefined,
                selectedTransfer: undefined,
            });
        });

        it('should show seat drop-off popup and do not submit form', () => {
            viewBookingStore.booking = {} as IBookingInfo;
            viewBookingStore.rootStore.amendFlightsStore.haveChosenSeatsBeenDropped = true;

            viewBookingStore.continueToPay();

            expect(submitForm).not.toBeCalled();
        });

        it('should submitForm be called when seat drop-off status return false', () => {
            viewBookingStore.booking = {} as IBookingInfo;
            viewBookingStore.rootStore.amendFlightsStore.haveChosenSeatsBeenDropped = false;

            viewBookingStore.continueToPay();

            expect(submitForm).toBeCalled();
        });
    });

    describe('isAmendSeatsDisabled', () => {
        it('Should return true when amendBookingStatus have appropriate statuses', () => {
            viewBookingStore.booking = mockBooking;

            viewBookingStore.booking.amendmentInfo.amendBookingStatus = [AmendBookingStatus.AmendSeatsDisabled];
            expect(viewBookingStore.isAmendSeatsDisabled).toBe(true);

            viewBookingStore.booking.amendmentInfo.amendBookingStatus = [AmendBookingStatus.AmendSeatsDisabledOnSite];
            expect(viewBookingStore.isAmendSeatsDisabled).toBe(true);

            viewBookingStore.booking.amendmentInfo.amendBookingStatus = [
                AmendBookingStatus.AmendSeatsDisabledByFlightDisruption,
            ];
            expect(viewBookingStore.isAmendSeatsDisabled).toBe(true);
        });

        it('Should return false', () => {
            viewBookingStore.booking = mockBooking;
            expect(viewBookingStore.isAmendSeatsDisabled).toBe(false);
        });
    });

    describe('isFlightAndHotelPackage', () => {
        it('should return true when booking has FlightAndHotel promo code', () => {
            viewBookingStore.booking = { ...mockBooking, promoCollections: ['fph'] };
            expect(viewBookingStore.isFlightAndHotelPackage).toBe(true);
        });

        it('should return false when booking has no FlightAndHotel promo code', () => {
            viewBookingStore.booking = { ...mockBooking, promoCollections: [] };
            expect(viewBookingStore.isFlightAndHotelPackage).toBe(false);
        });

        it('should return false when booking is null', () => {
            viewBookingStore.booking = null;
            expect(viewBookingStore.isFlightAndHotelPackage).toBe(false);
        });
    });

    describe('isBookingClearRequired', () => {
        const {
            AmendFlights,
            AmendTransfer,
            AmendHotel,
            PassengerDetails,
            AmendDates,
            ConfirmHolidayCredit,
            AmendRoomAndBoard,
            ViewBooking,
            AssistedTravel,
            ...restPaths
        } = SitePath;
        const pathsWithBookingRequired = [
            AmendFlights,
            AmendTransfer,
            AmendHotel,
            PassengerDetails,
            AmendDates,
            AmendRoomAndBoard,
            ConfirmHolidayCredit,
            ViewBooking,
        ];

        it('returns true if the page is not in the pathsWithBookingRequired list', () => {
            expect(
                Object.values(restPaths).every(path => {
                    rootStore.routerStore.pathname = path;

                    return viewBookingStore.isBookingClearRequired();
                }),
            ).toBeTruthy();
        });

        it('returns false if the page is in the pathsWithBookingRequired list', () => {
            expect(
                pathsWithBookingRequired.every(path => {
                    rootStore.routerStore.pathname = path;

                    return !viewBookingStore.isBookingClearRequired();
                }),
            ).toBeTruthy();
        });

        it('returns false if page is AmendHotel', () => {
            rootStore.routerStore.pathname = AmendHotel;

            expect(viewBookingStore.isBookingClearRequired()).toBeFalsy();
        });
    });

    describe('isBookingPayloadClearRequired', () => {
        const { ViewBooking, ...restPaths } = SitePath;

        it('returns true if the current page is not ViewBooking', () => {
            expect(
                Object.values(restPaths).every(path => {
                    rootStore.routerStore.pathname = path;

                    return viewBookingStore.isBookingPayloadClearRequired();
                }),
            ).toBeTruthy();
        });

        it('returns false if the current page is ViewBooking', () => {
            rootStore.routerStore.pathname = ViewBooking;
            expect(viewBookingStore.isBookingPayloadClearRequired()).toBeFalsy();
        });
    });

    describe('initBookingFromPayload', () => {
        it('Should redirectToViewBookingsPage be called when no payload', async () => {
            bookingService.viewBooking = jest.fn().mockResolvedValue({ data: mockBooking });

            await viewBookingStore.initBookingFromPayload();

            expect(viewBookingStore.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
            expect(bookingService.viewBooking).not.toHaveBeenCalled();
        });

        it('Should redirect to view booking page in case of an error', async () => {
            viewBookingStore.rootStore.appStore.amendBookingItemPayload = mockAmendBookingPayload;
            bookingService.viewBooking = jest.fn().mockRejectedValue(new Error());
            const successCallback = jest.fn();

            await viewBookingStore.initBookingFromPayload(successCallback);

            expect(viewBookingStore.rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });

        it('should correctly initialise booking from payload', async () => {
            viewBookingStore.rootStore.appStore.amendBookingItemPayload = mockAmendBookingPayload;
            bookingService.viewBooking = jest.fn().mockResolvedValue({
                data: mockBooking,
            });

            const successCallback = jest.fn();

            await viewBookingStore.initBookingFromPayload(successCallback);

            expect(viewBookingStore.booking).toEqual(mockBooking);

            expect(successCallback).toHaveBeenCalledWith(mockBooking);
        });

        it('should call redirectToViewBookingsPage if no booking', async () => {
            viewBookingStore.booking = null;
            viewBookingStore.rootStore.appStore.amendBookingItemPayload = mockAmendBookingPayload;
            bookingService.viewBooking = jest.fn().mockResolvedValue({
                data: null,
            });

            const successCallback = jest.fn();
            await viewBookingStore.initBookingFromPayload(successCallback);

            expect(viewBookingStore.booking).toEqual(null);

            expect(successCallback).not.toHaveBeenCalled();
            expect(rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });

        it('should call redirectToLoginPage if no user', async () => {
            viewBookingStore.booking = null;
            viewBookingStore.rootStore.appStore.amendBookingItemPayload = mockAmendBookingPayload;
            bookingService.viewBooking = jest.fn().mockResolvedValue({
                data: mockBooking,
            });
            rootStore.userStore.checkIfUserLoggedIn = jest.fn().mockReturnValue(false);

            const successCallback = jest.fn();
            await viewBookingStore.initBookingFromPayload(successCallback);

            expect(viewBookingStore.booking).toEqual(null);

            expect(successCallback).not.toHaveBeenCalled();
            expect(rootStore.routerStore.redirectToLoginPage).toHaveBeenCalled();
        });
    });

    describe('resetAmendSSR', () => {
        it('Should reset SSR properties', () => {
            viewBookingStore.isAmendSSRFailed = true;
            viewBookingStore.isAmendSSRLoading = true;

            viewBookingStore.resetAmendSSR();

            expect(viewBookingStore.isAmendSSRFailed).toBe(false);
            expect(viewBookingStore.isAmendSSRLoading).toBe(false);
        });
    });

    describe('toggleBookingPrivacy', () => {
        it('Should  not be called if no booking', async () => {
            viewBookingStore.booking = null;
            bookingService.toggleBookingPrivacy = jest.fn().mockResolvedValue({ data: mockBooking });

            await viewBookingStore.toggleBookingPrivacy();

            expect(bookingService.toggleBookingPrivacy).not.toHaveBeenCalled();
        });

        it('Should update booking and tracking methods be called', async () => {
            (getBookingPayload as MockedFn<any>).mockReturnValue({
                bookingReference: 'new reference',
                date: '2020-09-11',
                lastName: 'Karl',
            });
            viewBookingStore.toggleLoadingBookingPrivacy = jest.fn();
            bookingService.toggleBookingPrivacy = jest.fn().mockResolvedValue({ data: mockBooking });

            await viewBookingStore.toggleBookingPrivacy();

            expect(viewBookingStore.toggleLoadingBookingPrivacy).toHaveBeenCalledWith(true);
            expect(bookingService.toggleBookingPrivacy).toHaveBeenCalledWith(
                undefined,
                'new reference',
                'Karl',
                '2020-09-11',
            );
            expect(viewBookingStore.rootStore.trackingStore.trackBookingPrivacy).toHaveBeenCalledWith(false);
            expect(viewBookingStore.toggleLoadingBookingPrivacy).toHaveBeenCalledWith(false);
        });

        it('Should toggleBookingPrivacy be called with isPrivate parameter', async () => {
            (getBookingPayload as MockedFn<any>).mockReturnValue({
                bookingReference: 'new reference',
                date: '2020-09-11',
                lastName: 'Karl',
            });
            viewBookingStore.toggleLoadingBookingPrivacy = jest.fn();
            bookingService.toggleBookingPrivacy = jest
                .fn()
                .mockResolvedValue({ data: { ...mockBooking, isPrivate: true } });

            await viewBookingStore.toggleBookingPrivacy(true);

            expect(bookingService.toggleBookingPrivacy).toHaveBeenCalledWith(
                true,
                'new reference',
                'Karl',
                '2020-09-11',
            );
            expect(viewBookingStore.rootStore.trackingStore.trackBookingPrivacy).toHaveBeenCalledWith(true);
        });

        it('Should changeErrorMessage method be called in case of error', async () => {
            bookingService.toggleBookingPrivacy = jest.fn().mockRejectedValue(new Error());
            viewBookingStore.changeErrorMessage = jest.fn();

            await viewBookingStore.toggleBookingPrivacy(true);

            expect(viewBookingStore.changeErrorMessage).toHaveBeenCalledWith(BookingErrorCodes.Privacy);
        });
    });

    describe('handleSubmitBasket', () => {
        it('Should be called with transfers scenario', () => {
            viewBookingStore.rootStore.amendTransfersStore.selectedTransfer = mockTransfer;
            viewBookingStore.continueToPay = jest.fn();
            viewBookingStore.rootStore.amendTransfersStore.submitTransfer = jest.fn();
            viewBookingStore.rootStore.amendFlightsStore.submitFlightChangeSelection = jest.fn();

            viewBookingStore.handleSubmitBasket();

            expect(viewBookingStore.rootStore.amendTransfersStore.submitTransfer).toHaveBeenCalled();
            expect(viewBookingStore.rootStore.amendFlightsStore.submitFlightChangeSelection).not.toHaveBeenCalled();
            expect(viewBookingStore.continueToPay).not.toHaveBeenCalled();
        });

        it('Should be called with flights scenario', () => {
            viewBookingStore.rootStore.amendFlightsStore.selectedFlight = mockFlightsOffers[0];
            viewBookingStore.continueToPay = jest.fn();
            viewBookingStore.rootStore.amendTransfersStore.submitTransfer = jest.fn();
            viewBookingStore.rootStore.amendFlightsStore.submitFlightChangeSelection = jest.fn();

            viewBookingStore.handleSubmitBasket();

            expect(viewBookingStore.rootStore.amendTransfersStore.submitTransfer).not.toHaveBeenCalled();
            expect(viewBookingStore.rootStore.amendFlightsStore.submitFlightChangeSelection).toHaveBeenCalled();
            expect(viewBookingStore.continueToPay).not.toHaveBeenCalled();
        });

        it('Should be continueToPay be called when neither transfer, nor flights scenario', () => {
            viewBookingStore.continueToPay = jest.fn();
            viewBookingStore.rootStore.amendTransfersStore.submitTransfer = jest.fn();
            viewBookingStore.rootStore.amendFlightsStore.submitFlightChangeSelection = jest.fn();

            viewBookingStore.handleSubmitBasket();

            expect(viewBookingStore.rootStore.amendTransfersStore.submitTransfer).not.toHaveBeenCalled();
            expect(viewBookingStore.rootStore.amendFlightsStore.submitFlightChangeSelection).not.toHaveBeenCalled();
            expect(viewBookingStore.continueToPay).toHaveBeenCalled();
        });
    });

    describe('hasInventoryError', () => {
        it('Should return true when AmendPassengerDisabledByInventoryError status in list', () => {
            viewBookingStore.booking.amendmentInfo.amendBookingStatus = [
                AmendBookingStatus.AmendPassengerDisabledByInventoryError,
            ];

            expect(viewBookingStore.hasInventoryError).toBe(true);
        });

        it('Should return false when no appropriate status in list', () => {
            viewBookingStore.booking.amendmentInfo.amendBookingStatus = [
                AmendBookingStatus.AmendTransfersDisabledByTimeBound,
            ];

            expect(viewBookingStore.hasInventoryError).toBe(false);
        });
    });

    describe('allowanceRestrictions', () => {
        it('Should return true for byLeadPassenger', () => {
            viewBookingStore.booking.amendmentInfo.amendBookingStatus = [
                AmendBookingStatus.NotLoggedAsBookingLeadPassenger,
            ];

            expect(viewBookingStore.allowanceRestrictions.byLeadPassenger).toBe(true);
        });

        it('Should return true for booking made by external agency', () => {
            viewBookingStore.booking.isExternalAgency = true;

            expect(viewBookingStore.allowanceRestrictions.byExternalAgency).toBe(true);
        });
    });

    describe('viewBookingPageState', () => {
        beforeAll(() => {
            jest.useFakeTimers().setSystemTime(new Date('2020-02-15'));
        });

        it('should return unknown page state when booking startDate is not set', () => {
            viewBookingStore.booking.package.accom.startDate = '';
            viewBookingStore.booking.package.transport.routes = [{}, { arrDate: '' }];

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.Unknown);
        });

        it('should return unknown page state when booking routes are not defined', () => {
            viewBookingStore.booking.package.transport.routes = undefined;

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.Unknown);
        });

        it('should return unknown page state when only the booking arrDate is set', () => {
            viewBookingStore.booking.package.accom.startDate = '';
            viewBookingStore.booking.package.transport.routes = [{}, { arrDate: '2020-03-01T00:00:00' }];

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.Unknown);
        });

        it('should return unknown page state when arrDate is not set for travel end', () => {
            viewBookingStore.booking.package.accom.startDate = '2020-03-01';
            viewBookingStore.booking.package.transport.routes = [{}, { arrDate: '' }];

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.Unknown);
        });

        it('should return cancelled page state when booking is cancelled', () => {
            viewBookingStore.isBookingCanceled = true;

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.Cancelled);
        });

        it('should return viewBooking page state when the holiday is in the future and a preTravel start time is not set', () => {
            viewBookingStore.booking.package.accom.startDate = '2020-03-01';
            viewBookingStore.booking.package.transport.routes = [{}, { arrDate: '2020-04-01T00:00:00' }];

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.ViewBooking);
        });

        it('should return preTravel state when the current time is equal to or greater than the pre-departure countdown time when the travel starts', () => {
            rootStore.layoutStore.bookingHoursPreTravelStarts = 4;
            viewBookingStore.booking.package.accom.startDate = '2020-02-15';
            viewBookingStore.booking.package.transport.routes = [{}, { arrDate: '2020-02-25T00:00:00' }];

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.PreTravel);
        });

        it('should return postTravel state when the current time is equal to or greater than the arrival countdown time when the travel ends', () => {
            rootStore.layoutStore.bookingHoursPostTravelStarts = 25;
            viewBookingStore.booking.package.accom.startDate = '2020-02-10';
            viewBookingStore.booking.package.transport.routes = [{}, { arrDate: '2020-02-13T23:00:00' }];

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.PostTravel);
        });

        it('should return preTravel state when the current time is equal to the time when the travel starts', () => {
            viewBookingStore.booking.package.accom.startDate = '2020-02-15';
            viewBookingStore.booking.package.transport.routes = [{}, { arrDate: '2020-02-20T00:00:00' }];

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.PreTravel);
        });

        it('should return inDestination state when the current time is more then the time when the travel starts', () => {
            jest.useFakeTimers().setSystemTime(new Date('2020-02-15T00:01:00'));

            viewBookingStore.booking.package.accom.startDate = '2020-02-15';
            viewBookingStore.booking.package.transport.routes = [{}, { arrDate: '2020-02-20T00:00:00' }];

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.InDestination);
        });

        it('should return inDestination state when the current time is greater than arrival time but still less than postReturnTime', () => {
            rootStore.layoutStore.bookingHoursPostTravelStarts = 24;
            viewBookingStore.booking.package.accom.startDate = '2020-02-13';
            viewBookingStore.booking.package.transport.routes = [{}, { arrDate: '2020-02-15T23:59:00' }];

            expect(viewBookingStore.viewBookingPageState).toBe(ViewBookingPageStates.InDestination);
        });
    });

    describe('isPreTravelPage', () => {
        it('should return true when viewBookingPageState return PreTravel page state', () => {
            jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                ViewBookingPageStates.PreTravel,
            );

            expect(viewBookingStore.isPreTravelPage).toBeTruthy();
        });

        it('should return false when viewBookingPageState return not a PreTravel page state', () => {
            jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                ViewBookingPageStates.InDestination,
            );

            expect(viewBookingStore.isPreTravelPage).toBeFalsy();
        });
    });

    describe('isBookingCancellationAllowed', () => {
        it('should return true when amendmentInfo has appropriate statuses', () => {
            viewBookingStore.booking.amendmentInfo.canBookingCancelled = true;

            expect(viewBookingStore.isBookingCancellationAllowed).toBe(true);
        });

        it('should return false when amendmentInfo has appropriate statuses', () => {
            viewBookingStore.booking.amendmentInfo.canBookingCancelled = false;

            expect(viewBookingStore.isBookingCancellationAllowed).toBe(false);
        });
    });

    describe('isPostTravelPage', () => {
        it('should return true when viewBookingPageState return PostTravel page state', () => {
            jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                ViewBookingPageStates.PostTravel,
            );

            expect(viewBookingStore.isPostTravelPage).toBe(true);
        });

        it('should return false when viewBookingPageState return not a PostTravel page state', () => {
            jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                ViewBookingPageStates.InDestination,
            );

            expect(viewBookingStore.isPostTravelPage).toBe(false);
        });
    });

    describe('isInDestionationPage', () => {
        it('should return true when viewBookingPageState return InDestination page state', () => {
            jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                ViewBookingPageStates.InDestination,
            );

            expect(viewBookingStore.isInDestinationPage).toBe(true);
        });

        it('should return false when viewBookingPageState return not an InDestination page state', () => {
            jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                ViewBookingPageStates.PostTravel,
            );

            expect(viewBookingStore.isInDestinationPage).toBe(false);
        });
    });

    describe('isCancelledBookingPage', () => {
        it('should return true when viewBookingPageState return CancelledBooking page state', () => {
            jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                ViewBookingPageStates.Cancelled,
            );

            expect(viewBookingStore.isCancelledBookingPage).toBeTruthy();
        });

        it('should return false when viewBookingPageState return not a CancelledBooking page state', () => {
            jest.spyOn(viewBookingStore, 'viewBookingPageState', 'get').mockReturnValue(
                ViewBookingPageStates.InDestination,
            );

            expect(viewBookingStore.isCancelledBookingPage).toBeFalsy();
        });
    });

    describe('getBookingDisruptions', () => {
        it('should return booking disruption levels', () => {
            viewBookingStore.booking = {
                ...viewBookingStore.booking,
                ...{
                    disruptionInfo: {
                        itinerary: [
                            { flightKey: 'test123', disruptionLevel: DisruptionLevel.One },
                            { flightKey: 'test123', disruptionLevel: DisruptionLevel.One },
                            { flightKey: 'test124', disruptionLevel: DisruptionLevel.Two },
                            { flightKey: 'test124', disruptionLevel: DisruptionLevel.Two },
                            { flightKey: 'test125', disruptionLevel: '' },
                        ],
                    },
                },
            };

            const expected = [DisruptionLevel.One, DisruptionLevel.Two];

            expect(viewBookingStore.getBookingDisruptions).toEqual(expected);
        });

        it('should return an empty array when the disruptionInfo without the itinerary', () => {
            viewBookingStore.booking = {
                ...viewBookingStore.booking,
                ...{
                    disruptionInfo: {},
                },
            };

            expect(viewBookingStore.getBookingDisruptions).toEqual([]);
        });
    });

    it('should update isManageHolidayPopupOpened value when call setIsManageHolidayPopupOpened', () => {
        expect(viewBookingStore.isManageHolidayPopupOpened).toBe(false);

        viewBookingStore.setIsManageHolidayPopupOpened(true);

        expect(viewBookingStore.isManageHolidayPopupOpened).toBe(true);
    });

    describe('loadBookingTransfers', () => {
        it('should load booking transfers successfully', async () => {
            const mockTransfers = { data: { outbound: [], inbound: [] } };
            (bookingService.getBookingTransfers as MockedFn<any>).mockResolvedValue(mockTransfers);

            await viewBookingStore.loadBookingTransfers('booking-ref', 'Smith', '2026-05-01');

            expect(bookingService.getBookingTransfers).toHaveBeenCalledWith('booking-ref', 'Smith', '2026-05-01');
            expect(viewBookingStore.bookingTransfers).toEqual(mockTransfers.data);
        });

        it('should set isLoadingTransfers to true before calling service', async () => {
            let loadingDuringCall = false;
            (bookingService.getBookingTransfers as MockedFn<any>).mockImplementation(async () => {
                loadingDuringCall = viewBookingStore.isLoadingTransfers;

                return { data: { outbound: [], inbound: [] } };
            });

            await viewBookingStore.loadBookingTransfers('booking-ref', 'Smith', '2026-05-01');

            expect(loadingDuringCall).toBe(true);
        });

        it('should set isLoadingTransfers to false after successful load', async () => {
            const mockTransfers = { data: { outbound: [], inbound: [] } };
            (bookingService.getBookingTransfers as MockedFn<any>).mockResolvedValue(mockTransfers);

            await viewBookingStore.loadBookingTransfers('booking-ref', 'Smith', '2026-05-01');

            expect(viewBookingStore.isLoadingTransfers).toBe(false);
        });

        it('should set isLoadingTransfers to false when service call fails', async () => {
            (bookingService.getBookingTransfers as MockedFn<any>).mockRejectedValue(new Error('Network error'));

            await viewBookingStore.loadBookingTransfers('booking-ref', 'Smith', '2026-05-01');

            expect(viewBookingStore.isLoadingTransfers).toBe(false);
            expect(viewBookingStore.bookingTransfers).toBeNull();
        });
    });

    describe('toggleTransfersLoading', () => {
        it('should set isLoadingTransfers to true', () => {
            viewBookingStore.toggleTransfersLoading(true);

            expect(viewBookingStore.isLoadingTransfers).toBe(true);
        });

        it('should set isLoadingTransfers to false', () => {
            viewBookingStore.isLoadingTransfers = true;
            viewBookingStore.toggleTransfersLoading(false);

            expect(viewBookingStore.isLoadingTransfers).toBe(false);
        });
    });

    describe('isLoadingTransfers observable', () => {
        it('should initialize with false', () => {
            const freshStore = new ViewBookingStore(rootStore);

            expect(freshStore.isLoadingTransfers).toBe(false);
        });
    });

    describe('bookingTransfers observable', () => {
        it('should initialize with null', () => {
            expect(viewBookingStore.bookingTransfers).toBeNull();
        });

        it('should update bookingTransfers value', () => {
            const transfers = { outbound: [], inbound: [] };
            viewBookingStore.bookingTransfers = transfers as any;
            expect(viewBookingStore.bookingTransfers).toEqual(transfers);
        });
    });

    describe('markGuestAsRequested', () => {
        jest.spyOn(dateUtils, 'formatDateL10n').mockReturnValue('formatted-date');

        it('should mark the matching guest as requested', () => {
            const guest1 = {
                passenger: { firstName: 'Ann', lastName: 'Brown' },
                passengerName: 'Mrs Ann Brown',
                requestedAt: '',
            };
            const guest2 = {
                passenger: { firstName: 'John', lastName: 'Smith' },
                passengerName: 'Mr John Smith',
                requestedAt: '',
            };
            viewBookingStore.guestWithAssistedTravelRequest = [guest1, guest2];

            viewBookingStore.markGuestAsRequested('Ann Brown');

            expect(viewBookingStore.guestWithAssistedTravelRequest[0].requestedAt).toBe('formatted-date');
            expect(viewBookingStore.guestWithAssistedTravelRequest[1].requestedAt).toBe('');
        });

        it('should NOT change any guest when name does not match', () => {
            const guest1 = {
                passenger: { firstName: 'Ann', lastName: 'Brown' },
                passengerName: 'Mrs Ann Brown',
                requestedAt: '',
            };
            viewBookingStore.guestWithAssistedTravelRequest = [guest1];

            viewBookingStore.markGuestAsRequested('Unknown Name');

            expect(viewBookingStore.guestWithAssistedTravelRequest[0].requestedAt).toBe('');
        });

        it('should do nothing when guestWithAssistedTravelRequest is null', () => {
            viewBookingStore.guestWithAssistedTravelRequest = null;

            viewBookingStore.markGuestAsRequested('Ann Brown');

            expect(viewBookingStore.guestWithAssistedTravelRequest).toBeUndefined();
        });
    });

    describe('initializeBookingFromPayload', () => {
        it('should redirect to view bookings page when no payload in session storage', async () => {
            (getWebStorageItem as MockedFn<any>).mockReturnValue(null);

            await viewBookingStore.initializeBookingFromPayload();

            expect(rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });

        it('should fetch booking when booking is not in store', async () => {
            const mockPayload = { bookingReference: 'ref', date: 'date', lastName: 'name' };
            (getWebStorageItem as MockedFn<any>).mockReturnValue(mockPayload);
            viewBookingStore.booking = null;

            rootStore.viewBookingStore = {
                getBooking: jest.fn(),
                booking: mockBooking,
            };

            await viewBookingStore.initializeBookingFromPayload();

            expect(rootStore.viewBookingStore.getBooking).toHaveBeenCalledWith(mockPayload, true);
            expect(viewBookingStore.booking).toEqual(mockBooking);
        });

        it('should redirect when fetched booking is null', async () => {
            const mockPayload = { bookingReference: 'ref', date: 'date', lastName: 'name' };
            (getWebStorageItem as MockedFn<any>).mockReturnValue(mockPayload);
            viewBookingStore.booking = null;

            rootStore.viewBookingStore = {
                getBooking: jest.fn(),
                booking: null,
            };

            await viewBookingStore.initializeBookingFromPayload();

            expect(rootStore.routerStore.redirectToViewBookingsPage).toHaveBeenCalled();
        });

        it('should NOT fetch booking when booking already exists in store', async () => {
            const mockPayload = { bookingReference: 'ref', date: 'date', lastName: 'name' };
            (getWebStorageItem as MockedFn<any>).mockReturnValue(mockPayload);

            rootStore.viewBookingStore = {
                getBooking: jest.fn(),
                booking: null,
            };

            await viewBookingStore.initializeBookingFromPayload();

            expect(rootStore.viewBookingStore.getBooking).not.toHaveBeenCalled();
        });
    });

    describe('isPossibleToRequestAssistedTravel', () => {
        it('should return false when booking is null', () => {
            viewBookingStore.booking = null;

            expect(viewBookingStore.isPossibleToRequestAssistedTravel).toBe(false);
        });

        it('should return false when booking is from external agency', () => {
            viewBookingStore.booking = { ...mockBooking, isExternalAgency: true } as any;
            (getDaysBeforeDeparture as MockedFn<any>).mockReturnValue(100);
            rootStore.layoutStore.isAssistedTravelOnlineFormEnabled = true;
            rootStore.layoutStore.daysBeforeDepartureTravelAssistanceCanBeRequested = 0;
            rootStore.layoutStore.isConfirmationPage = false;
            rootStore.layoutStore.isSpecialAssistanceEnabled = true;

            expect(viewBookingStore.isPossibleToRequestAssistedTravel).toBe(false);
        });

        it('should return false when booking is canceled', () => {
            viewBookingStore.booking = { ...mockBooking, bookingStatus: BookingStatus.Canceled } as any;
            (getDaysBeforeDeparture as MockedFn<any>).mockReturnValue(100);
            rootStore.layoutStore.isAssistedTravelOnlineFormEnabled = true;
            rootStore.layoutStore.daysBeforeDepartureTravelAssistanceCanBeRequested = 0;
            rootStore.layoutStore.isConfirmationPage = false;
            rootStore.layoutStore.isSpecialAssistanceEnabled = true;

            expect(viewBookingStore.isPossibleToRequestAssistedTravel).toBe(false);
        });

        it('should return false when assisted travel online form is not enabled', () => {
            (getDaysBeforeDeparture as MockedFn<any>).mockReturnValue(100);
            rootStore.layoutStore.isAssistedTravelOnlineFormEnabled = false;
            rootStore.layoutStore.daysBeforeDepartureTravelAssistanceCanBeRequested = 0;
            rootStore.layoutStore.isConfirmationPage = false;
            rootStore.layoutStore.isSpecialAssistanceEnabled = true;

            expect(viewBookingStore.isPossibleToRequestAssistedTravel).toBe(false);
        });

        it('should return false when days before departure is less than required', () => {
            (getDaysBeforeDeparture as MockedFn<any>).mockReturnValue(5);
            rootStore.layoutStore.isAssistedTravelOnlineFormEnabled = true;
            rootStore.layoutStore.daysBeforeDepartureTravelAssistanceCanBeRequested = 10;
            rootStore.layoutStore.isConfirmationPage = false;
            rootStore.layoutStore.isSpecialAssistanceEnabled = true;

            expect(viewBookingStore.isPossibleToRequestAssistedTravel).toBe(false);
        });

        it('should return false when on confirmation page', () => {
            (getDaysBeforeDeparture as MockedFn<any>).mockReturnValue(100);
            rootStore.layoutStore.isAssistedTravelOnlineFormEnabled = true;
            rootStore.layoutStore.daysBeforeDepartureTravelAssistanceCanBeRequested = 0;
            rootStore.layoutStore.isConfirmationPage = true;
            rootStore.layoutStore.isSpecialAssistanceEnabled = true;

            expect(viewBookingStore.isPossibleToRequestAssistedTravel).toBe(false);
        });

        it('should return false when special assistance is NOT enabled', () => {
            (getDaysBeforeDeparture as MockedFn<any>).mockReturnValue(100);
            rootStore.layoutStore.isAssistedTravelOnlineFormEnabled = true;
            rootStore.layoutStore.daysBeforeDepartureTravelAssistanceCanBeRequested = 0;
            rootStore.layoutStore.isConfirmationPage = false;
            rootStore.layoutStore.isSpecialAssistanceEnabled = false;

            expect(viewBookingStore.isPossibleToRequestAssistedTravel).toBe(false);
        });

        it('should return true when all conditions are met', () => {
            (getDaysBeforeDeparture as MockedFn<any>).mockReturnValue(100);
            rootStore.layoutStore.isAssistedTravelOnlineFormEnabled = true;
            rootStore.layoutStore.daysBeforeDepartureTravelAssistanceCanBeRequested = 10;
            rootStore.layoutStore.isConfirmationPage = false;
            rootStore.layoutStore.isSpecialAssistanceEnabled = true;

            expect(viewBookingStore.isPossibleToRequestAssistedTravel).toBe(true);
        });
    });

    describe('initializeAssistedTravelRequestsFetch', () => {
        it('should redirect to cancelled page when booking is canceled', async () => {
            viewBookingStore.booking = { ...mockBooking, bookingStatus: BookingStatus.Canceled } as any;
            rootStore.layoutStore.viewBookingLinks = { cancelled: '/cancelled' };

            await viewBookingStore.initializeAssistedTravelRequestsFetch();

            expect(rootStore.routerStore.redirectTo).toHaveBeenCalledWith('/cancelled');
            expect(viewBookingStore.isAssistedTravelRequestsLoading).toBe(false);
        });

        it('should redirect to view bookings page when it is not possible to request assisted travel and redirectIfNotPossibleToFetchInfo is true', async () => {
            jest.spyOn(viewBookingStore, 'isPossibleToRequestAssistedTravel', 'get').mockReturnValue(false);

            await viewBookingStore.initializeAssistedTravelRequestsFetch(false, true);

            expect(rootStore.routerStore.redirectToViewBookingPage).toHaveBeenCalled();
            expect(viewBookingStore.isAssistedTravelRequestsLoading).toBe(false);
        });

        it('should redirect to view bookings page when user is NOT logged in as a lead passenger and redirectIfNotPossibleToFetchInfo is true', async () => {
            jest.spyOn(viewBookingStore, 'isPossibleToRequestAssistedTravel', 'get').mockReturnValue(true);
            viewBookingStore.booking = { ...mockBooking, isLoggedInAsLeadPassenger: false } as any;

            await viewBookingStore.initializeAssistedTravelRequestsFetch(false, true);

            expect(rootStore.routerStore.redirectToViewBookingPage).toHaveBeenCalled();
            expect(viewBookingStore.isAssistedTravelRequestsLoading).toBe(false);
        });

        it('shouldNOT redirect to view bookings page when user is NOT logged in as a lead passenger but redirectIfNotPossibleToFetchInfo is false', async () => {
            jest.spyOn(viewBookingStore, 'isPossibleToRequestAssistedTravel', 'get').mockReturnValue(true);
            viewBookingStore.booking = { ...mockBooking, isLoggedInAsLeadPassenger: false } as any;

            await viewBookingStore.initializeAssistedTravelRequestsFetch(false, false);

            expect(rootStore.routerStore.redirectToViewBookingPage).not.toHaveBeenCalled();
            expect(viewBookingStore.isAssistedTravelRequestsLoading).toBe(false);
        });

        it('should return early when booking is null', async () => {
            viewBookingStore.booking = null;

            await viewBookingStore.initializeAssistedTravelRequestsFetch();

            expect(bookingService.getAssistedTravelRequests).not.toHaveBeenCalled();
        });

        it('should return early when guestWithAssistedTravelRequest is already set', async () => {
            viewBookingStore.guestWithAssistedTravelRequest = [
                { passenger: {}, passengerName: 'test', requestedAt: '' },
            ];

            await viewBookingStore.initializeAssistedTravelRequestsFetch();

            expect(bookingService.getAssistedTravelRequests).not.toHaveBeenCalled();
        });

        it('should fetch assisted travel requests and set guestWithAssistedTravelRequest', async () => {
            jest.spyOn(viewBookingStore, 'isPossibleToRequestAssistedTravel', 'get').mockReturnValue(true);
            viewBookingStore.guestWithAssistedTravelRequest = null;
            const mockResult = { passengers: [] };
            const mockMappedGuests = [{ passenger: {}, passengerName: 'test', requestedAt: '' }];
            bookingService.getAssistedTravelRequests = jest.fn().mockResolvedValue(mockResult);
            (matchGuestsToAssistedTravelRequest as MockedFn<any>).mockReturnValue(mockMappedGuests);
            rootStore.layoutStore.getPhrase = jest.fn();

            await viewBookingStore.initializeAssistedTravelRequestsFetch();

            expect(bookingService.getAssistedTravelRequests).toHaveBeenCalledWith(mockBooking.bookingReference);
            expect(matchGuestsToAssistedTravelRequest).toHaveBeenCalledWith(
                mockBooking.guests,
                mockResult,
                rootStore.layoutStore.getPhrase,
            );
            expect(viewBookingStore.guestWithAssistedTravelRequest).toEqual(mockMappedGuests);
        });

        it('should set isAssistedTravelRequestsFailedToLoad to true on error', async () => {
            jest.spyOn(viewBookingStore, 'isPossibleToRequestAssistedTravel', 'get').mockReturnValue(true);
            viewBookingStore.guestWithAssistedTravelRequest = null;
            bookingService.getAssistedTravelRequests = jest.fn().mockRejectedValue(new Error('fail'));

            await viewBookingStore.initializeAssistedTravelRequestsFetch();

            expect(viewBookingStore.isAssistedTravelRequestsFailedToLoad).toBe(true);
        });

        it('should reset isAssistedTravelRequestsFailedToLoad before fetching', async () => {
            jest.spyOn(viewBookingStore, 'isPossibleToRequestAssistedTravel', 'get').mockReturnValue(true);
            viewBookingStore.guestWithAssistedTravelRequest = null;
            viewBookingStore.isAssistedTravelRequestsFailedToLoad = true;
            const mockResult = { passengers: [] };
            bookingService.getAssistedTravelRequests = jest.fn().mockResolvedValue(mockResult);
            (matchGuestsToAssistedTravelRequest as MockedFn<any>).mockReturnValue([]);
            rootStore.layoutStore.getPhrase = jest.fn();

            await viewBookingStore.initializeAssistedTravelRequestsFetch();

            expect(viewBookingStore.isAssistedTravelRequestsFailedToLoad).toBe(false);
        });
    });

    describe('clearAssistedTravelRequests', () => {
        it('should reset guestWithAssistedTravelRequest to null', () => {
            viewBookingStore.guestWithAssistedTravelRequest = [
                { passenger: {}, passengerName: 'test', requestedAt: '' },
            ];

            viewBookingStore.clearAssistedTravelRequests();

            expect(viewBookingStore.guestWithAssistedTravelRequest).toBeNull();
        });

        it('should reset isAssistedTravelRequestsFailedToLoad to false', () => {
            viewBookingStore.isAssistedTravelRequestsFailedToLoad = true;

            viewBookingStore.clearAssistedTravelRequests();

            expect(viewBookingStore.isAssistedTravelRequestsFailedToLoad).toBe(false);
        });
    });
});
