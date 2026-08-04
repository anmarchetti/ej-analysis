import { TradePortalLayoutStore } from 'frontend/store/tradePortal';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { isBookingFlow } from 'frontend/utils/buildSitecorePath';
import isBackend from 'frontend/utils/isBackend';
import { parseUrl } from 'frontend/utils/url.utils';
import { removeWebStorageItem } from 'frontend/utils/webStorage.utils';
import { GuestType } from 'models/enum/GuestType';
import { SitePath } from 'models/enum/SitePath';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { TradePortalRouterStore } from './TradePortalRouterStore';

jest.mock('frontend/utils/isBackend');
const mockedIsBackend = isBackend as jest.MockedFn<typeof isBackend>;

jest.mock('frontend/utils/url.utils');
const mockedParseUrl = parseUrl as jest.MockedFn<typeof parseUrl>;

jest.mock('frontend/utils/buildSitecorePath');
const mockIsBookingFlow = isBookingFlow as jest.MockedFn<typeof isBookingFlow>;

jest.mock('frontend/utils/webStorage.utils');

describe('TradePortalRouterStore', () => {
    const createRootStore = () =>
        ({
            comparePricesCalendarStore: {
                handleNewOfferError: jest.fn(),
            },
            layoutStore: {
                basePath: '/en/holidays',
                getPageUrlInLang: jest.fn(lang => `/page-${lang}`),
                getSitePathInLang: jest.fn(lang => `https://easyjet.com/${lang}/holidays`),
                setFullUrl: jest.fn(),
            },
            queryParamsStore: {
                buildHotelDetailsQuery: jest.fn(() => '?hotel-details-query'),
                buildMediaCenterFiltersQuery: jest.fn(topic => `?topic=${topic}`),
                parseAndSyncQuery: jest.fn(),
            },
            searchStore: {
                page: 1,
                setPrevPageNumber: jest.fn(),
                clearSearchValues: jest.fn(),
                updateSearchValuesFromQuery: jest.fn(),
                setPageNumber: jest.fn(),
            },
            paymentStore: {
                startTransactionOnPageLoad: jest.fn(),
            },
            bookingStore: {
                clearPromoCode: jest.fn(),
                promoCode: {
                    clearPromocodeError: jest.fn(),
                },
            },
            seatMapStore: {
                clearValidatedSeats: jest.fn(),
            },
            viewBookingStore: {
                booking: {},
            },
            notificationsStore: {
                trackUrl: jest.fn(),
            },
            guestDetailsStore: {
                removeGuestDetailsFromSessionStorage: jest.fn(),
                clearGuestDetails: jest.fn(),
                guestsDetails: [{ type: GuestType.Adult, firstName: 'FirstName' }],
            },
        } as any);
    let rootStore: TradePortalRootStore = createRootStore();

    beforeEach(() => {
        rootStore = createRootStore();
        sessionStorage.clear();
    });

    it('should redirect to Confirm Page', () => {
        const store = new TradePortalRouterStore(rootStore);
        const mockRedirectTo = jest.spyOn(store, 'redirectTo');

        store.redirectToConfirmPage();

        expect(mockRedirectTo).toHaveBeenCalledWith(`${SitePath.Confirm}?hotel-details-query`);
    });

    it('should redirectToAmendPaymentPage', () => {
        const store = new TradePortalRouterStore(rootStore);
        const mockRedirectTo = jest.spyOn(store, 'redirectTo');

        store.redirectToAmendPaymentPage();

        expect(mockRedirectTo).toHaveBeenCalledWith(SitePath.AmendPayment);
    });

    describe('handleRouteUpdate', () => {
        const createRouter = () => ({
            query: {},
            pathname: '/',
            asPath: '/',
            events: {
                emit: jest.fn(),
                on: jest.fn(),
                off: jest.fn(),
            },
            push: jest.fn(() => Promise.resolve(true)),
            prefetch: jest.fn(() => Promise.resolve(true)),
            replace: jest.fn(() => Promise.resolve(true)),
        });

        let router;

        beforeEach(() => {
            router = createRouter();
            mockedIsBackend.mockReturnValue(false);
            router.events.on.mockImplementation((event, handler) => {
                handler('url', {});
            });
            mockedParseUrl.mockReturnValue({ hash: '', pathname: '', search: '' });
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should NOT proceed function execution when isBackend() returns true', () => {
            mockedIsBackend.mockReturnValue(true);

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            const mockListenToPopState = jest.spyOn(store, 'listenToPopState');

            store.handleRouteUpdate();

            expect(mockedParseUrl).not.toHaveBeenCalled();
            expect(mockListenToPopState).not.toHaveBeenCalled();
            expect(store.router?.events.on).not.toHaveBeenCalled();
        });

        it('should NOT proceed function execution when router is undefined', () => {
            const store = new TradePortalRouterStore(rootStore);
            store.router = undefined;
            const mockListenToPopState = jest.spyOn(store, 'listenToPopState');

            store.handleRouteUpdate();

            expect(mockedParseUrl).not.toHaveBeenCalled();
            expect(mockListenToPopState).not.toHaveBeenCalled();
        });

        it('should NOT invoke setPrevPageNumber when previous path does not equal SitePath.Search', () => {
            mockedParseUrl
                .mockReturnValueOnce({ hash: '', pathname: SitePath.ViewBooking, search: '' })
                .mockReturnValueOnce({ hash: '', pathname: '', search: '' });

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.searchStore.setPrevPageNumber).not.toHaveBeenCalled();
        });

        it('should NOT invoke setPrevPageNumber when previous path equals current path', () => {
            mockedParseUrl
                .mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' })
                .mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' });

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.searchStore.setPrevPageNumber).not.toHaveBeenCalled();
        });

        it('should invoke setPrevPageNumber', () => {
            mockedParseUrl
                .mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' })
                .mockReturnValueOnce({ hash: '', pathname: SitePath.ViewBooking, search: '' });

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.searchStore.setPrevPageNumber).toHaveBeenCalledWith(rootStore.searchStore.page);
        });

        it('should invoke startTransactionOnPageLoad, setFullUrl, parseAndSyncQuery', () => {
            const search = 'search';

            mockIsBookingFlow.mockReturnValue(true);
            mockedParseUrl.mockReturnValue({ hash: '', pathname: '', search });

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.paymentStore.startTransactionOnPageLoad).toHaveBeenCalled();
            expect(rootStore.layoutStore.setFullUrl).toHaveBeenCalledWith('url');
            expect(rootStore.queryParamsStore.parseAndSyncQuery).toHaveBeenCalledWith(search, true);
        });

        it('should NOT invoke clearPromoCode when isExtrasPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isExtrasPage: true,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearPromoCode).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearPromoCode when isGuestDetailsPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isExtrasPage: false,
                isGuestDetailsPage: true,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearPromoCode).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearPromoCode when isConfirmPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isExtrasPage: false,
                isGuestDetailsPage: false,
                isConfirmPage: true,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearPromoCode).not.toHaveBeenCalled();
        });

        it('should invoke clearPromoCode', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isExtrasPage: false,
                isGuestDetailsPage: false,
                isConfirmPage: false,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearPromoCode).toHaveBeenCalled();
        });

        it('should invoke clearPromocodeError on all route changes', () => {
            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.promoCode.clearPromocodeError).toHaveBeenCalled();
        });

        it('should NOT invoke removeGuestDetailsFromSessionStorage and clearGuestDetails when isTradePortal is false', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isTradePortal: false,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.guestDetailsStore.removeGuestDetailsFromSessionStorage).not.toHaveBeenCalled();
            expect(rootStore.guestDetailsStore.clearGuestDetails).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearGuestDetails when guestsDetails is empty', () => {
            rootStore.guestDetailsStore.guestsDetails = [];
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isTradePortal: true,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.guestDetailsStore.clearGuestDetails).not.toHaveBeenCalled();
        });

        it('should invoke removeGuestDetailsFromSessionStorage, clearGuestDetails and handleNewOfferError', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isTradePortal: true,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.guestDetailsStore.removeGuestDetailsFromSessionStorage).toHaveBeenCalled();
            expect(rootStore.guestDetailsStore.clearGuestDetails).toHaveBeenCalled();
            expect(rootStore.comparePricesCalendarStore.handleNewOfferError).toHaveBeenCalled();
        });

        it('should NOT invoke removeWebStorageItem when isConfirmationPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isConfirmationPage: true,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(removeWebStorageItem).not.toHaveBeenCalled();
        });

        it('should NOT invoke removeWebStorageItem when isConfirmPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isConfirmationPage: false,
                isConfirmPage: true,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(removeWebStorageItem).toHaveBeenCalledTimes(1);
        });

        it('should invoke removeWebStorageItem when isConfirmPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isConfirmationPage: false,
                isConfirmPage: false,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(removeWebStorageItem).toHaveBeenNthCalledWith(2, WebStorageKeys.BookingPayload);
        });

        it('should NOT invoke trackUrl when shouldTrackUrl is false', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                shouldTrackUrl: false,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.notificationsStore.trackUrl).not.toHaveBeenCalled();
        });

        it('should invoke trackUrl when shouldTrackUrl is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                shouldTrackUrl: true,
            } as TradePortalLayoutStore;

            const store = new TradePortalRouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.notificationsStore.trackUrl).toHaveBeenCalledWith('?');
        });
    });

    describe('redirectToViewBookingPage', () => {
        it('should redirect to View Booking Page when it is called', async () => {
            const store = new TradePortalRouterStore(rootStore);
            const mockRedirectTo = jest.spyOn(store, 'redirectTo');

            await store.redirectToViewBookingPage();

            expect(mockRedirectTo).toHaveBeenCalledWith(SitePath.TradePortalViewBooking);
        });
    });
});
