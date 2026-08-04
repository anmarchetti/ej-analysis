import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { LayoutStore } from 'frontend/store/holidays/layout/LayoutStore';
import { isBookingFlow } from 'frontend/utils/buildSitecorePath';
import isBackend from 'frontend/utils/isBackend';
import { submitForm } from 'frontend/utils/submitForm';
import { buildFlightPlusHotelUrl, parseUrl } from 'frontend/utils/url.utils';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import { SitePath } from 'models/enum/SitePath';
import { SubmitPayload } from 'models/enum/SubmitPayload';

import { RouterStore } from './RouterStore';

jest.mock('frontend/utils/viewBooking.utils');

jest.mock('frontend/utils/submitForm');
const mockedSubmitForm = submitForm as jest.MockedFn<typeof submitForm>;

jest.mock('frontend/utils/isBackend');
const mockedIsBackend = isBackend as jest.MockedFn<typeof isBackend>;

jest.mock('frontend/utils/url.utils');
const mockedParseUrl = parseUrl as jest.MockedFn<typeof parseUrl>;
const mockedBuildFlightPlusHotelUrl = buildFlightPlusHotelUrl as jest.MockedFn<typeof buildFlightPlusHotelUrl>;

jest.mock('frontend/utils/buildSitecorePath');
const mockIsBookingFlow = isBookingFlow as jest.MockedFn<typeof isBookingFlow>;

const mockedLocationReplace = jest.fn();
Object.defineProperty(window, 'location', {
    value: {
        replace: mockedLocationReplace,
    },
});

describe('RouterStore', () => {
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
                buildMediaCenterFiltersQuery: jest.fn(topic => `?topic=${topic}`),
                parseAndSyncQuery: jest.fn(),
                buildHotelDetailsQuery: jest.fn(),
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
                clearAncillaries: jest.fn(),
                clearPromoCode: jest.fn(),
                promoCode: {
                    clearPromocodeError: jest.fn(),
                },
            },
            viewBookingStore: {
                booking: {},
            },
            amendTransfersStore: {
                selectedTransfer: {},
                resetAmendTransferStore: jest.fn(),
            },
            amendFlightsStore: {
                selectedFlight: {},
                resetSelectedFlight: jest.fn(),
            },
            notificationsStore: {
                trackUrl: jest.fn(),
            },
            seatMapStore: {
                setSeatMapOpened: jest.fn(),
            },
        } as any);
    let rootStore: HolidaysRootStore;

    beforeEach(() => {
        rootStore = createRootStore();
    });

    describe('mediaPressReleasesUrl', () => {
        it('should build press releases url with topic query', () => {
            const store = new RouterStore(rootStore);

            expect(store.mediaPressReleasesUrl('test')).toBe(`${SitePath.PressReleases}?topic=test`);
            expect(rootStore.queryParamsStore.buildMediaCenterFiltersQuery).toHaveBeenCalledWith('test');
        });

        it('should build press releases url without query', () => {
            const store = new RouterStore(rootStore);

            expect(store.mediaPressReleasesUrl()).toBe(SitePath.PressReleases);
            expect(rootStore.queryParamsStore.buildMediaCenterFiltersQuery).not.toBeCalled();
        });
    });

    describe('switchToNewLanguage', () => {
        it('Should reload current page in new language', () => {
            const store = new RouterStore(rootStore);
            jest.spyOn(store, 'search', 'get').mockReturnValue('query=1');

            store.switchToNewLanguage('ch-fr');

            expect(mockedLocationReplace).toHaveBeenCalledWith('https://easyjet.com/ch-fr/holidays/page-ch-fr?query=1');
        });

        it('Should load home page when no current page in new language', () => {
            rootStore.layoutStore.getPageUrlInLang = jest.fn(() => undefined);
            const store = new RouterStore(rootStore);
            jest.spyOn(store, 'search', 'get').mockReturnValue('query=1');

            store.switchToNewLanguage('ch-fr');

            expect(mockedLocationReplace).toHaveBeenCalledWith('https://easyjet.com/ch-fr/holidays');
        });

        it('Should submit form if current page has payload', () => {
            const store = new RouterStore(rootStore);
            const payload = { name: SubmitPayload.BookingInfo, body: {} };
            jest.spyOn(store, 'getCurrentPagePayload').mockReturnValue(payload);

            store.switchToNewLanguage('ch-fr');

            expect(mockedSubmitForm).toHaveBeenCalledWith(
                'https://easyjet.com/ch-fr/holidays/page-ch-fr',
                payload.name,
                payload.body,
            );
        });

        it('Should load custom page in new language if customPath is provided', () => {
            const store = new RouterStore(rootStore);
            jest.spyOn(store, 'search', 'get').mockReturnValue('');

            store.switchToNewLanguage('ch-fr', '/custom-page');

            expect(mockedLocationReplace).toHaveBeenCalledWith('https://easyjet.com/ch-fr/holidays/custom-page');
        });
    });

    describe('getCurrentPagePayload', () => {
        const mockPayload = { test: 'test' } as any;

        it('Should return null if no payload', () => {
            const store = new RouterStore(rootStore);

            expect(store.getCurrentPagePayload()).toBeNull();
        });

        it('Should return payload on Payment Page', () => {
            rootStore.bookingStore = { guestsInfoPayload: mockPayload } as any;
            const store = new RouterStore(rootStore);
            jest.spyOn(store, 'pathname', 'get').mockReturnValue(SitePath.Payment);

            expect(store.getCurrentPagePayload()).toEqual({
                name: SubmitPayload.GuestsInfo,
                body: rootStore.bookingStore.guestsInfoPayload,
            });
        });

        it('Should return payload on PayBalance', () => {
            rootStore.payBalanceStore = { payBalancePayload: mockPayload } as any;
            const store = new RouterStore(rootStore);
            jest.spyOn(store, 'pathname', 'get').mockReturnValue(SitePath.PayBalance);

            expect(store.getCurrentPagePayload()).toEqual({
                name: SubmitPayload.PayBalanceInfo,
                body: rootStore.payBalanceStore.payBalancePayload,
            });
        });

        it('Should return payload on AmendPayment', () => {
            rootStore.amendPaymentStore = { amendPaymentPayload: mockPayload } as any;
            const store = new RouterStore(rootStore);
            jest.spyOn(store, 'pathname', 'get').mockReturnValue(SitePath.AmendPayment);

            expect(store.getCurrentPagePayload()).toEqual({
                name: SubmitPayload.AmendPaymentInfo,
                body: rootStore.amendPaymentStore.amendPaymentPayload,
            });
        });

        it('Should return payload on Booking Confirmation Page', () => {
            rootStore.bookingStore = { bookingInfoPayload: mockPayload } as any;
            const store = new RouterStore(rootStore);
            jest.spyOn(store, 'pathname', 'get').mockReturnValue(SitePath.BookingConfirmation);

            expect(store.getCurrentPagePayload()).toEqual({
                name: SubmitPayload.BookingInfo,
                body: rootStore.bookingStore.bookingInfoPayload,
            });
        });

        it('Should return payload on View Booking Page', () => {
            (getBookingPayload as jest.MockedFn<typeof getBookingPayload>).mockReturnValue(mockPayload);
            const store = new RouterStore(rootStore);
            jest.spyOn(store, 'pathname', 'get').mockReturnValue(SitePath.ViewBooking);

            expect(store.getCurrentPagePayload()).toEqual({
                name: SubmitPayload.ViewBookingInfo,
                body: mockPayload,
            });
        });
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
        let routerStore: RouterStore;

        beforeEach(() => {
            router = createRouter();
            router.events.on.mockImplementation((_, handler) => {
                handler('url', {});
            });
            mockedIsBackend.mockReturnValue(false);
            mockedParseUrl.mockReturnValue({ hash: '', pathname: '', search: '' });

            routerStore = new RouterStore(rootStore);
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should update routeChangeComplete, routeChangeError events', () => {
            mockedIsBackend.mockReturnValue(false);
            routerStore.router = router;

            routerStore.handleRouteUpdate();

            expect(router.events.on).toHaveBeenCalledWith('routeChangeComplete', routerStore.turnOffRedirectionLoading);
            expect(router.events.on).toHaveBeenCalledWith('routeChangeError', routerStore.turnOffRedirectionLoading);
        });

        it('should set isRedirectionLoading to true during routeChangeStart', () => {
            mockedIsBackend.mockReturnValue(false);
            routerStore.router = router;

            routerStore.handleRouteUpdate();

            expect(routerStore.isRedirectionLoading).toBe(true);
        });

        it('should NOT proceed function execution when isBackend() returns true', () => {
            mockedIsBackend.mockReturnValue(true);

            const store = new RouterStore(rootStore);
            store.router = router;
            const mockListenToPopState = jest.spyOn(store, 'listenToPopState');

            store.handleRouteUpdate();

            expect(mockedParseUrl).not.toHaveBeenCalled();
            expect(mockListenToPopState).not.toHaveBeenCalled();
            expect(store.router?.events.on).not.toHaveBeenCalled();
        });

        it('should NOT proceed function execution when router is undefined', () => {
            const store = new RouterStore(rootStore);
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

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.searchStore.setPrevPageNumber).not.toHaveBeenCalled();
        });

        it('should NOT invoke setPrevPageNumber when previous path equals current path', () => {
            mockedParseUrl
                .mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' })
                .mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' });

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.searchStore.setPrevPageNumber).not.toHaveBeenCalled();
        });

        it('should invoke setPrevPageNumber', () => {
            mockedParseUrl
                .mockReturnValueOnce({ hash: '', pathname: SitePath.Search, search: '' })
                .mockReturnValueOnce({ hash: '', pathname: SitePath.ViewBooking, search: '' });

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.searchStore.setPrevPageNumber).toHaveBeenCalledWith(rootStore.searchStore.page);
        });

        it('should invoke startTransactionOnPageLoad, setFullUrl, parseAndSyncQuery', () => {
            const search = 'search';

            mockIsBookingFlow.mockReturnValue(true);
            mockedParseUrl.mockReturnValue({ hash: '', pathname: '', search });

            const store = new RouterStore(rootStore);
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
            } as LayoutStore;

            const store = new RouterStore(rootStore);
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
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearPromoCode).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearPromoCode when isPaymentPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isExtrasPage: false,
                isGuestDetailsPage: false,
                isPaymentPage: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
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
                isPaymentPage: false,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearPromoCode).toHaveBeenCalled();
        });

        it('should invoke clearPromocodeError on all route changes', () => {
            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.promoCode.clearPromocodeError).toHaveBeenCalled();
        });

        it('should close seat map on view booking page', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isViewBookingPage: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;

            store.handleRouteUpdate();

            expect(rootStore.seatMapStore.setSeatMapOpened).toHaveBeenCalledWith(false);
        });

        it('should NOT invoke clearAncillaries when isHotelDetailsBookPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearAncillaries).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearAncillaries when isExtrasPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: false,
                isExtrasPage: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearAncillaries).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearAncillaries when isGuestDetailsPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: false,
                isExtrasPage: false,
                isGuestDetailsPage: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearAncillaries).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearAncillaries when isPaymentPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: false,
                isExtrasPage: false,
                isPaymentPage: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearAncillaries).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearAncillaries when viewBookingStore.booking is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: false,
                isExtrasPage: false,
                isPaymentPage: false,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearAncillaries).not.toHaveBeenCalled();
        });

        it('should NOT invoke clearAncillaries when isBookingsListPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: false,
                isExtrasPage: false,
                isPaymentPage: false,
                isBookingsListPage: true,
            } as LayoutStore;
            rootStore.viewBookingStore.booking = undefined;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearAncillaries).not.toHaveBeenCalled();
        });

        it('should invoke clearAncillaries', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isHotelDetailsBookPage: false,
                isExtrasPage: false,
                isGuestDetailsPage: false,
                isPaymentPage: false,
                isBookingsListPage: false,
            } as LayoutStore;
            rootStore.viewBookingStore.booking = undefined;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.bookingStore.clearAncillaries).toHaveBeenCalled();
        });

        it('should NOT invoke resetAmendTransferStore when amendTransfersStore.selectedTransfer is undefined', () => {
            rootStore.amendTransfersStore.selectedTransfer = undefined;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.amendTransfersStore.resetAmendTransferStore).not.toHaveBeenCalled();
        });

        it('should NOT invoke resetAmendTransferStore when isAmendTransfersPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isAmendTransfersPage: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.amendTransfersStore.resetAmendTransferStore).not.toHaveBeenCalled();
        });

        it('should NOT invoke resetAmendTransferStore when isAmendPaymentPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isAmendTransfersPage: false,
                isAmendPaymentPage: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.amendTransfersStore.resetAmendTransferStore).not.toHaveBeenCalled();
        });

        it('should invoke resetAmendTransferStore and handleNewOfferError', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isAmendTransfersPage: false,
                isAmendPaymentPage: false,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.comparePricesCalendarStore.handleNewOfferError).toHaveBeenCalled();
            expect(rootStore.amendTransfersStore.resetAmendTransferStore).toHaveBeenCalledWith(true);
        });

        it('should NOT invoke resetSelectedFlight when amendFlightsStore.selectedFlight is undefined', () => {
            rootStore.amendFlightsStore.selectedFlight = undefined;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.amendFlightsStore.resetSelectedFlight).not.toHaveBeenCalled();
        });

        it('should NOT invoke resetSelectedFlight when isAmendFlightsPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isAmendFlightsPage: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.amendFlightsStore.resetSelectedFlight).not.toHaveBeenCalled();
        });

        it('should NOT invoke resetSelectedFlight when isAmendPaymentPage is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isAmendFlightsPage: false,
                isAmendPaymentPage: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.amendFlightsStore.resetSelectedFlight).not.toHaveBeenCalled();
        });

        it('should invoke resetSelectedFlight', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                isAmendFlightsPage: false,
                isAmendPaymentPage: false,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.amendFlightsStore.resetSelectedFlight).toHaveBeenCalled();
        });

        it('should NOT invoke trackUrl when shouldTrackUrl is false', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                shouldTrackUrl: false,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.notificationsStore.trackUrl).not.toHaveBeenCalled();
        });

        it('should invoke trackUrl when shouldTrackUrl is true', () => {
            rootStore.layoutStore = {
                ...rootStore.layoutStore,
                shouldTrackUrl: true,
            } as LayoutStore;

            const store = new RouterStore(rootStore);
            store.router = router;
            jest.spyOn(store, 'listenToPopState').mockImplementation(jest.fn());

            store.handleRouteUpdate();

            expect(rootStore.notificationsStore.trackUrl).toHaveBeenCalledWith('?');
        });
    });

    describe('redirectToShortlistNoResultsPage', () => {
        it('should call redirect', () => {
            const store = new RouterStore(rootStore);
            store.redirectTo = jest.fn();
            store.redirectToShortlistNoResultsPage();
            expect(store.redirectTo).toBeCalledWith(SitePath.ShortlistsNoResults);
        });
    });

    describe('redirectToShortlistPage', () => {
        it('should call redirect', () => {
            const store = new RouterStore(rootStore);
            store.redirectTo = jest.fn();
            store.redirectToShortlistPage();
            expect(store.redirectTo).toBeCalledWith(SitePath.Shortlists);
        });
    });

    describe('redirectToAmendDatesPage', () => {
        it('should call redirectTo', () => {
            const store = new RouterStore(rootStore);
            store.redirectTo = jest.fn();

            store.redirectToAmendDatesPage();

            expect(store.redirectTo).toHaveBeenCalledWith(SitePath.AmendDates, undefined, undefined, undefined, true);
        });
    });

    it('redirectToAmendHotelPage should call redirectTo with AmendHotel path', () => {
        const store = new RouterStore(rootStore);
        store.redirectTo = jest.fn();
        store.redirectToAmendHotelPage();
        expect(store.redirectTo).toBeCalledWith(SitePath.AmendHotel, undefined, undefined, undefined, true);
    });

    describe('redirectToViewBookingPage', () => {
        it('should redirect to view booking page with flight plus hotel url when isFlightPlusHotelFunnel is true', () => {
            const store = new RouterStore(rootStore);
            store.redirectTo = jest.fn();
            jest.spyOn(store as any, 'buildUrl').mockReturnValue('/en/holidays/view-booking');
            mockedBuildFlightPlusHotelUrl.mockReturnValue('/en/holidays/view-booking?ecp=fph');
            Object.defineProperty(rootStore.queryParamsStore, 'isFlightPlusHotelFunnel', {
                get: () => true,
                configurable: true,
            });

            store.redirectToViewBookingPage();

            expect(mockedBuildFlightPlusHotelUrl).toHaveBeenCalledWith('/en/holidays/view-booking');
            expect(store.redirectTo).toHaveBeenCalledWith('/en/holidays/view-booking?ecp=fph');
        });

        it('should redirect to view booking page without flight plus hotel url when isFlightPlusHotelFunnel is false', () => {
            const store = new RouterStore(rootStore);
            store.redirectTo = jest.fn();
            jest.spyOn(store as any, 'buildUrl').mockReturnValue('/en/holidays/view-booking');
            Object.defineProperty(rootStore.queryParamsStore, 'isFlightPlusHotelFunnel', {
                get: () => false,
                configurable: true,
            });

            store.redirectToViewBookingPage();

            expect(mockedBuildFlightPlusHotelUrl).not.toHaveBeenCalled();
            expect(store.redirectTo).toHaveBeenCalledWith('/en/holidays/view-booking');
        });
    });
});
