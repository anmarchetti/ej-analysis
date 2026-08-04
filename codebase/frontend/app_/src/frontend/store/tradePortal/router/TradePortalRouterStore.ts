import { BaseRouterStore } from 'frontend/store/base';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { isBookingFlow } from 'frontend/utils/buildSitecorePath';
import isBackend from 'frontend/utils/isBackend';
import { parseUrl } from 'frontend/utils/url.utils';
import { removeWebStorageItem } from 'frontend/utils/webStorage.utils';
import SitePath, { TradePortalSitePath } from 'models/enum/SitePath';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export class TradePortalRouterStore extends BaseRouterStore {
    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);

        if (!isBackend()) {
            if (!this.rootStore.layoutStore.isConfirmationPage) {
                removeWebStorageItem(WebStorageKeys.BookingPayload);
            }
        }
    }

    async initialize(): Promise<void> {
        if (isBackend() || !this.router) return;

        await super.initialize();
        this.handleRouteUpdate();
    }

    handleRouteUpdate = (): void => {
        if (isBackend() || !this.router) return;

        const parsedUrl = parseUrl(this.router.asPath, this.rootStore.layoutStore.basePath);
        let prevPath: string = parsedUrl.pathname;
        let prevSearch: string = parsedUrl.search;

        this.router.events.on('routeChangeStart', (url: string, options: any) => {
            const {
                layoutStore,
                searchStore,
                paymentStore,
                queryParamsStore,
                bookingStore,
                notificationsStore,
                guestDetailsStore,
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
            if (!layoutStore.isExtrasPage && !layoutStore.isGuestDetailsPage && !layoutStore.isConfirmPage) {
                bookingStore.clearPromoCode();

                //Remove guest details from storage if not a booking flow
                if (layoutStore.isTradePortal) {
                    guestDetailsStore.removeGuestDetailsFromSessionStorage();
                    guestDetailsStore.guestsDetails.length && guestDetailsStore.clearGuestDetails();
                }
            }

            // Clear promo code error state on all route changes (invalid codes don't persist)
            bookingStore.promoCode.clearPromocodeError();

            if (!layoutStore.isConfirmationPage && !layoutStore.isConfirmPage) {
                removeWebStorageItem(WebStorageKeys.BookingPayload);
            }

            // track url (if needed) on page change (we do it after change rather than on load, so page will be tracked with latest query params)
            if (layoutStore.shouldTrackUrl) {
                notificationsStore.trackUrl(`${prevPath}?${prevSearch}`);
            }

            comparePricesCalendarStore.handleNewOfferError();

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

    redirectToConfirmPage = (): Promise<void> =>
        this.redirectTo(this.buildUrl(SitePath.Confirm, this.rootStore.queryParamsStore.buildHotelDetailsQuery()));

    redirectToTradePortalFindBookingPage = (): Promise<void> => this.redirectTo(SitePath.TradePortalFindBooking);

    redirectToAmendPaymentPage = (): Promise<void> => this.redirectTo(SitePath.AmendPayment);

    redirectToLoginPage = (hard = false, params?: string): void => {
        (hard ? this.updateUrl : this.redirectTo)(
            params ? TradePortalSitePath.Login + params : TradePortalSitePath.Login,
        );
    };

    redirectToViewBookingPage = (): void => {
        this.redirectTo(this.buildUrl(SitePath.TradePortalViewBooking));
    };
}

export default TradePortalRouterStore;
