import { action, makeObservable, observable, runInAction } from 'mobx';

import { BaseRouterStore } from 'frontend/store/base';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { isBookingFlow } from 'frontend/utils/buildSitecorePath';
import isBackend from 'frontend/utils/isBackend';
import { submitForm } from 'frontend/utils/submitForm';
import { buildFlightPlusHotelUrl, parseUrl } from 'frontend/utils/url.utils';
import { getBookingPayload } from 'frontend/utils/viewBooking.utils';
import SitePath from 'models/enum/SitePath';
import { SubmitPayload } from 'models/enum/SubmitPayload';

export class RouterStore extends BaseRouterStore {
    @observable isRedirectionLoading = false;

    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);

        makeObservable(this);
    }

    async initialize(): Promise<void> {
        if (isBackend() || !this.router) return;

        await super.initialize();
        this.handleRouteUpdate();

        // see http://jra.europe.easyjet.local/browse/EJH-5618
        if (this.isViewBookingWithHash()) {
            this.redirectToViewBookingPage();
        }
    }

    @action turnOffRedirectionLoading = (): void => {
        this.isRedirectionLoading = false;
    };

    handleRouteUpdate = (): void => {
        if (isBackend() || !this.router) return;

        const parsedUrl = parseUrl(this.router.asPath, this.rootStore.layoutStore.basePath);
        let prevPath: string = parsedUrl.pathname;
        let prevSearch: string = parsedUrl.search;

        this.router.events.on('routeChangeComplete', this.turnOffRedirectionLoading);
        this.router.events.on('routeChangeError', this.turnOffRedirectionLoading);

        this.router.events.on('routeChangeStart', (url: string, options: any) => {
            runInAction(() => {
                this.isRedirectionLoading = true;
            });

            const {
                layoutStore,
                searchStore,
                paymentStore,
                queryParamsStore,
                bookingStore,
                viewBookingStore,
                seatMapStore,
                amendTransfersStore,
                amendFlightsStore,
                notificationsStore,
                comparePricesCalendarStore,
            } = this.rootStore;

            const { pathname: path, search } = parseUrl(url, layoutStore.basePath);

            // save previous page from search results if we are going away from SR. it later can be used when clicking om "back to search" button
            if (prevPath === SitePath.Search && path !== prevPath) {
                searchStore.setPrevPageNumber(searchStore.page);
            }

            paymentStore.startTransactionOnPageLoad();
            layoutStore.setFullUrl(url);

            // we force query for booking flow pages as all needed info for those pages is in search query
            queryParamsStore.parseAndSyncQuery(search, isBookingFlow(search));

            // Clear promo code if it's not Extras / GuestDetails / Payment page
            if (!layoutStore.isExtrasPage && !layoutStore.isGuestDetailsPage && !layoutStore.isPaymentPage) {
                bookingStore.clearPromoCode();
            }

            // Clear promo code error state on all route changes (invalid codes don't persist)
            bookingStore.promoCode.clearPromocodeError();

            if (layoutStore.isViewBookingPage) {
                seatMapStore.setSeatMapOpened(false);
            }

            // keep selected seats only on Hotel Details, Extras, Guest Details, Payment, View booking and Bookings List pages
            if (
                !layoutStore.isHotelDetailsBookPage &&
                !layoutStore.isExtrasPage &&
                !layoutStore.isGuestDetailsPage &&
                !layoutStore.isPaymentPage &&
                !viewBookingStore.booking && // isViewBookingPage is not working with redirects
                !layoutStore.isBookingsListPage
            ) {
                bookingStore.clearAncillaries();
            }

            // Clear the amend stores outside its amendment flow
            if (
                amendTransfersStore?.selectedTransfer &&
                !layoutStore.isAmendTransfersPage &&
                !layoutStore.isAmendPaymentPage
            ) {
                amendTransfersStore.resetAmendTransferStore(true);
            }

            if (
                amendFlightsStore?.selectedFlight &&
                !layoutStore.isAmendFlightsPage &&
                !layoutStore.isAmendPaymentPage
            ) {
                amendFlightsStore.resetSelectedFlight();
            }

            comparePricesCalendarStore.handleNewOfferError();

            // track url (if needed) on page change (we do it after change rather than on load, so page will be tracked with latest query params)
            if (layoutStore.shouldTrackUrl) {
                notificationsStore.trackUrl(`${prevPath}?${prevSearch}`);
            }

            // TODO: is this needed after moving to Next.js router (?)
            // go to home when go back to booking confirmation (options.shallow means it was just an update in url, not actual page change)
            if (options.shallow && path === SitePath.BookingConfirmation) {
                prevPath = path;
                this.replace('/');

                return;
            }

            prevPath = path;
            prevSearch = search;
        });

        // only on POP event
        this.listenToPopState(state => this.listenToPopStateUpdated(state, prevPath, prevSearch));
    };

    isPaymentPage = (): boolean => this.pathname === SitePath.Payment;
    isPayRemainingBalancePage = (): boolean => this.pathname === SitePath.PayBalance;
    isViewBookingPage = (): boolean => this.pathname === SitePath.ViewBooking;
    isViewBookingsPage = (): boolean => this.pathname === SitePath.ViewBookings;
    isHolidayCreditPage = (): boolean => this.pathname === SitePath.HolidayCredit;
    isInDestinationPage = (): boolean => this.pathname === SitePath.InDestination;
    isPostTravelPage = (): boolean => this.pathname === SitePath.PostTravel;
    isPreTravelPage = (): boolean => this.pathname === SitePath.PreTravel;

    // see http://jra.europe.easyjet.local/browse/EJH-5618
    isViewBookingWithHash = (): boolean => {
        const path = this.pathname;
        const hash = this.hash;

        // should start with 'booking' and has hash
        if (!(!!hash && (path === '/booking' || path.slice(0, -1) === '/booking'))) {
            return false;
        }

        // should start with 'booking' and has hash
        return hash.startsWith('#/my_booking');
    };

    redirectToViewBookingPage = (): void => {
        const url = this.buildUrl(SitePath.ViewBooking);
        this.redirectTo(this.rootStore.queryParamsStore.isFlightPlusHotelFunnel ? buildFlightPlusHotelUrl(url) : url);
    };

    redirectToLoginPage = (hard = false, params?: string): void => {
        (hard ? this.replace : this.redirectTo)(params ? SitePath.Login + params : SitePath.Login);
    };

    // Media Center
    mediaPressReleasesUrl = (topic?: string): string => {
        const query = topic ? this.rootStore.queryParamsStore.buildMediaCenterFiltersQuery(topic) : '';

        return this.buildUrl(SitePath.PressReleases, query);
    };

    redirectToMediaPressReleases = (): Promise<void> => this.redirectTo(SitePath.PressReleases);

    redirectToHolidayCreditPage = (): Promise<void> => this.redirectTo(SitePath.HolidayCredit);

    redirectToShortlistPage = (): Promise<void> => this.redirectTo(SitePath.Shortlists);
    redirectToShortlistNoResultsPage = (): Promise<void> => this.redirectTo(SitePath.ShortlistsNoResults);
    redirectToAmendFlightsPage = (): Promise<void> => this.redirectTo(SitePath.AmendFlights);
    redirectToAmendPassengerPage = (): Promise<void> => this.redirectTo(SitePath.PassengerDetails);
    redirectToAmendDatesPage = (): Promise<void> =>
        this.redirectTo(SitePath.AmendDates, undefined, undefined, undefined, true);

    redirectToAmendDatesSummaryPage = (): Promise<void> => this.redirectTo(SitePath.AmendDatesSummary);
    redirectToAmendDatesSeatsAndBagsPage = (): Promise<void> => this.redirectTo(SitePath.AmendDatesSeatsAndBags);
    redirectToAmendRoomAndBoardPage = (): Promise<void> => this.redirectTo(SitePath.AmendRoomAndBoard);
    redirectToAmendHotelPage = (): Promise<void> =>
        this.redirectTo(SitePath.AmendHotel, undefined, undefined, undefined, true);

    redirectToAmendHotelSummaryPage = (): Promise<void> => this.redirectTo(SitePath.AmendHotelSummary);

    redirectToHolidayInspirationPage = (): Promise<void> => this.redirectTo(SitePath.HolidayInspiration);

    // Reload current page in new language.
    switchToNewLanguage = (lang: string, customPath?: string): void => {
        const { getPageUrlInLang, getSitePathInLang } = this.rootStore.layoutStore;
        const sitePath = getSitePathInLang(lang);

        const pagePath = customPath ?? getPageUrlInLang(lang);
        const fullUrl = sitePath + pagePath + (this.search ? `?${this.search}` : '');

        // If page is not available in new language, redirect to home page
        if (!pagePath) {
            window.location.replace(sitePath);

            return;
        }

        // If page has payload (e.g. payment), submit form instead of redirecting
        const payload = this.getCurrentPagePayload();

        if (payload?.body) {
            submitForm(fullUrl, payload.name, payload.body);

            return;
        }

        window.location.replace(fullUrl);
    };

    // Get current page payload (the data that should be submitted on page reload)
    getCurrentPagePayload = (): { body: any; name: SubmitPayload } | null => {
        switch (this.pathname) {
            case SitePath.Payment:
                return {
                    name: SubmitPayload.GuestsInfo,
                    body: this.rootStore.bookingStore.guestsInfoPayload,
                };

            case SitePath.PayBalance:
                return {
                    name: SubmitPayload.PayBalanceInfo,
                    body: this.rootStore.payBalanceStore.payBalancePayload,
                };

            case SitePath.AmendPayment:
                return {
                    name: SubmitPayload.AmendPaymentInfo,
                    body: this.rootStore.amendPaymentStore.amendPaymentPayload,
                };

            case SitePath.BookingConfirmation:
                return {
                    name: SubmitPayload.BookingInfo,
                    body: this.rootStore.bookingStore.bookingInfoPayload,
                };

            case SitePath.ViewBooking: {
                const { booking } = this.rootStore.viewBookingStore;

                return {
                    name: SubmitPayload.ViewBookingInfo,
                    body: booking ? getBookingPayload(booking) : null,
                };
            }

            default:
                return null;
        }
    };
}

export default RouterStore;
