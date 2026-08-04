import Router, { NextRouter } from 'next/router';
import qs, { stringify } from 'qs';

import { TRootStore } from 'frontend/store/IStores';
import { buildHotelDetailsUrl } from 'frontend/utils/getHotelLocation';
import isBackend from 'frontend/utils/isBackend';
import { IParsedUrl, parseQuery, parseUrl } from 'frontend/utils/url.utils';
import { IHotel } from 'models/data/IHotel';
import { IOffer, IOfferWithHotelData } from 'models/data/IOffer';
import { FlightPlusHotelQueryParamName } from 'models/enum/FlightPlusHotelQueryParamName';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath, { FlightPlusHotelSitePath } from 'models/enum/SitePath';

interface IRouterPopState {
    as: string;
    options: any;
    url: string;
}

export class BaseRouterStore {
    isClickBackToSearch: Nullable<boolean>;
    router: NextRouter | undefined;
    prevUrl: string | undefined;
    referralUrl: string | undefined;

    constructor(public rootStore: TRootStore) {
        // Arrow functions don't support super(), i.e. cannot be extended in inherited classes.
        // Use regular functions and bind this.
        this.initialize = this.initialize.bind(this);

        if (!isBackend()) {
            const router = Router.router ?? undefined;
            this.router = router;
            let tick = 0;
            setTimeout(() => {
                // beforePopState is global, so we register any other beforePopState with listenToPopState
                router?.beforePopState(state => {
                    this.isPopState = true;
                    tick = 1;
                    let proceed = true;

                    this.popStateCallbacks.forEach(cb => {
                        proceed = proceed && cb(state);
                    });

                    return proceed;
                });
                router?.events.on('routeChangeStart', () => {
                    // skip first tick (immediately after beforePopState)
                    if (tick > 0) {
                        tick--;

                        return;
                    }

                    // clear isPopState on router change
                    tick = 0;
                    this.isPopState = false;
                });
                this.trackHistory();
            });
        }
    }

    isPopState = false;

    protected popStateCallbacks: any[] = [];

    listenToPopState = (cb: (state: IRouterPopState) => boolean): (() => void) => {
        this.popStateCallbacks.push(cb);

        return () => {
            this.popStateCallbacks = this.popStateCallbacks.filter(c => c !== cb);
        };
    };

    protected listenToPopStateUpdated(state: IRouterPopState, prevPath: string, prevSearch: string): boolean {
        const { basePath, isHotelDetailsBookPage, isHotelDetailsBookPagePrev, isSearchResultsPage } =
            this.rootStore.layoutStore;
        const { pathname: path, search } = parseUrl(state.as, basePath);

        // Set isClickBackToSearch, if user returned to Search from Hotel Details by clicking on Browser Back Button (action = POP)
        if (isHotelDetailsBookPage && path === SitePath.Search) {
            this.toggleIsClickBackToSearch(true);
        }

        if (path === SitePath.BookingConfirmation) {
            this.replace('/');

            return false;
        }

        if (prevPath !== path) {
            state.options.shallow = false;

            if (this.router) {
                this.router['_shallow'] = false;
            }
        }

        // clear booking flow if we currently on hotel details page and current path differs from previous
        // this is needed when select some hotel using map and then go back
        if (isHotelDetailsBookPage && isHotelDetailsBookPagePrev && prevPath !== path) {
            this.rootStore.bookingStore.clearBookingFlow();
        }

        /** Update search results based on new search. Fill fires only if back button was clicked. */
        if (path === prevPath && prevSearch !== search && isSearchResultsPage) {
            this.rootStore.searchStore.updateSearchValuesFromQuery(search, prevSearch);

            // we force getting values from query, as some values are not correct after clearSearchValues func (TODO: rewrite comment)
            this.rootStore.queryParamsStore.parseAndSyncQuery(search, true);

            this.rootStore.bookingStore.grabSearchValuesFromSearchStore();
            this.rootStore.hotelsStore.fetchOffers(true);

            // force next.js to think this is shallow redirect, to prevent loading layout once again
            state.options.shallow = true;

            if (this.router) {
                this.router['_shallow'] = true;
            }
        } else if (path === SitePath.Search) {
            this.rootStore.searchStore.clearSearchValues(true);
            this.rootStore.queryParamsStore.parseAndSyncQuery(search, true);
            this.rootStore.bookingStore.grabSearchValuesFromSearchStore();
        }

        return true;
    }

    protected buildUrl = (pathname: string, paramsFromStore?: string, paramsFromArg?: string): string =>
        `${pathname}${paramsFromArg || paramsFromStore || ''}`;

    // Next Router query, also contains "hidden" query params
    get state(): Nullable<any> {
        return this.router?.query;
    }

    get parsedCurrentUrl(): Nullable<IParsedUrl> {
        if (!this.router) {
            return undefined;
        }

        return parseUrl(this.router.asPath, this.rootStore.layoutStore.basePath);
    }

    get pathname(): string {
        return this.parsedCurrentUrl?.pathname || '';
    }

    get search(): string {
        return this.parsedCurrentUrl?.search || '';
    }

    get hash(): string {
        return this.parsedCurrentUrl?.hash || '';
    }

    // On the search results page ('mixedresultlist'),
    // we save the search parameters to local storage.
    // If we seek a hotel, in addition to mentioning in the URL,
    // there should also be a reference in the destinations ('dest').
    get isDirectHotelSearch(): boolean {
        const { selectedAccommodationCodesFromUrl } = this.rootStore.queryParamsStore;
        const destinations = this.rootStore.searchStore.searchTo.selectedDestinationCodes?.join(',');

        return !!destinations && destinations === selectedAccommodationCodesFromUrl && !this.hasPromo;
    }

    get isBackToPrevUrl(): boolean {
        return this.isDirectHotelSearch || this.rootStore.layoutStore.isShortlistPagePrev;
    }

    get backToSearchUrl(): string {
        if (this.rootStore.layoutStore.isDynamicPromoPagePrev) {
            return this.prevUrl ?? SitePath.Home;
        }

        const { promoPage, buildSearchQuery } = this.rootStore.queryParamsStore;
        const promo = promoPage();

        if (promo) {
            return promo;
        }

        if (this.isBackToPrevUrl) {
            return this.prevUrl ?? SitePath.Home;
        }

        const FALLBACK_ZOOM_LEVEL = 10;

        const accomId = this.rootStore.bookingStore.accommodationIdFromUrl;

        const isMapOpen = this.rootStore.searchStore.isSelectedPackageFromMap;

        return `${SitePath.Search}${buildSearchQuery(
            true,
            false,
            false,
            isMapOpen,
            accomId && isMapOpen
                ? {
                      zoomLevel: this.rootStore.queryParamsStore.mapZoomLevel ?? FALLBACK_ZOOM_LEVEL,
                      accomId,
                  }
                : undefined,
        )}`;
    }

    // Check if url contains promo page url
    get hasPromo(): boolean {
        const promo = this.rootStore.queryParamsStore.promoPage();

        return !!(promo && promo.length > 0);
    }

    async initialize(): Promise<void> {
        if (isBackend() || !this.router) return;

        window.addEventListener('beforeunload', () => {
            // don't forget to track url before user leaves the page
            if (this.rootStore.layoutStore.shouldTrackUrl) {
                this.rootStore.notificationsStore.trackUrl();
            }

            // replace history item before leaving webpage, so user can't access booking confirmation by going back
            if (this.isBookingConfirmationPage()) {
                this.replace('/', true);
            }
        });

        /** Disable the default browser behavior to restore scroll position when using the back button. */
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        const search = parseUrl(this.router.asPath)?.search ?? '';
        this.rootStore.queryParamsStore.parseBrowserQuery(search);

        this.rootStore.paymentStore.startTransactionOnPageLoad();
        await this.rootStore.bookingStore.fetchOfferOnPageLoad(true);
    }

    /** Track user previous url if they do a direct search from a promo page, destination page or search results page. */
    handleRouteChange = (url: string | undefined): void => {
        const {
            isPromoPage,
            isDestinationPage,
            isAllHolidayTypesPage,
            isHolidayTypePage,
            isDealsHubPage,
            isHotelDetailsBookPage,
            isHotelDetailsBrowsePage,
            isShortlistPage,
            isHotelDetailsBookPagePrev,
        } = this.rootStore.layoutStore;

        if (isHotelDetailsBookPagePrev) this.prevUrl = ''; // Create Prev url once navigation away from hotel details booking page

        if (isHotelDetailsBookPage || isHotelDetailsBrowsePage) return;

        const trackPrev =
            isPromoPage ||
            isDestinationPage ||
            isAllHolidayTypesPage ||
            (this.isSearchResultsPage() && !this.isDirectHotelSearch) ||
            isHolidayTypePage ||
            isDealsHubPage ||
            isShortlistPage;

        if (trackPrev) {
            this.prevUrl = url;
        } else if (!this.isSearchResultsPage() || !this.isDirectHotelSearch) {
            this.prevUrl = '';
        }

        this.referralUrl = url; // always track previous url from router path change for Google Analytics tracking
    };

    trackHistory = (): void => {
        this.handleRouteChange(this.router?.asPath);
        this.router?.events.on('routeChangeComplete', this.handleRouteChange);
    };

    isHotelDetailsPage = (): boolean => this.pathname === buildHotelDetailsUrl(this.rootStore.bookingStore.hotel);
    isExtrasPage = (): boolean => this.pathname === SitePath.Extras;
    isSearchResultsPage = (): boolean => this.pathname === SitePath.Search;
    isGuestDetailsPage = (): boolean => this.pathname === SitePath.GuestsDetails;
    isBookingConfirmationPage = (): boolean => this.pathname === SitePath.BookingConfirmation;

    getUrlWithBasePath = (url: string): string => {
        const { basePath } = this.rootStore.layoutStore;

        return url.startsWith(basePath) ? url : basePath + url;
    };

    /**
     * Redirect to the url and pass state.
     * Use async/await, because router.push() is Promise
     * and sometimes we need to call next functions only after complete redirect
     */
    redirectTo = async (
        url: string,
        state?: { [key: string]: string | boolean | number },
        shallow?: boolean,
        replace?: boolean,
        preventScrollRestoration?: boolean,
    ): Promise<void> => {
        const browserUrl = this.getUrlWithBasePath(url);
        let targetUrl = browserUrl;

        // here we can add state params as "hidden" query params
        // Next router can get query params from targetUrl, while user will see browserUrl in browser url tab
        if (state) {
            const stateParams = qs.stringify(state);
            targetUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + stateParams;
        }

        const options = {
            shallow: !!shallow,
        };

        if (replace) {
            await this.router?.replace(targetUrl, browserUrl, options);
        } else {
            await this.router?.push(targetUrl, browserUrl, options);
        }

        if (preventScrollRestoration) {
            window.scroll(0, 0);
        }
    };

    /**
     * Just updates url in browser (with no route change).
     * Use async/await, because router.replace() is Promise
     * and sometimes we need to call next functions only after complete redirect.
     */
    updateUrl = async (url: string): Promise<void> => {
        await this.router?.replace(this.getUrlWithBasePath(url), undefined, { shallow: true });
    };

    /**
     * Replace url (init route change).
     * Use async/await, because router.replace() is Promise
     * and sometimes we need to call next functions only after complete redirect.
     */
    replace = async (url: string, shallow?: boolean): Promise<void> => {
        const options = {
            shallow: !!shallow,
        };

        await this.router?.replace(this.getUrlWithBasePath(url), undefined, options);
    };

    hardSyncQueryStore = (): void => {
        const { queryParamsStore } = this.rootStore;
        queryParamsStore.parseBrowserQuery(this.search);
    };

    onClickBackButton = (url: string, state?: AnyObject): void => {
        // FIXME: what to do with state (?)
        if (state?.BackToPromoFromHotelDetails === false || !this.isClickBackToSearch) {
            this.toggleIsClickBackToSearch(true);
        }

        this.redirectTo(url, state);
    };

    clearIsClickBackToSearch = (): void => {
        this.toggleIsClickBackToSearch(false);
    };

    toggleIsClickBackToSearch = (state: boolean): void => {
        this.isClickBackToSearch = state;
    };

    updateCurrentPage = async (queryParams?: string, forceUpdateQueryStore?: boolean): Promise<void> => {
        await this.updateUrl(this.buildUrl(this.pathname, this.search, queryParams));

        // actualize queryParams store with new query, because updateUrl only change browser url value but not store value
        forceUpdateQueryStore && queryParams && this.rootStore.queryParamsStore.parseBrowserQuery(queryParams);
    };

    clearQuery = (): Promise<void> => this.replace(this.buildUrl(this.pathname), true);

    // Keep UTM params to help with analytic tracking - EJH-16264
    clearPromoQuery = (): void => {
        const { utmParams } = this.rootStore.queryParamsStore;
        const baseParamsUrl = this.buildUrl(this.pathname, stringify(utmParams, { addQueryPrefix: true }));
        const campaignQueryParamValue = parseQuery(this.search)[QueryParamName.Campaign];
        const queryParamSeparator: string = utmParams ? '&' : '?';
        const baseParamsUrlWithCampaignQueryParam = `${baseParamsUrl}${queryParamSeparator}${QueryParamName.Campaign}=${campaignQueryParamValue}`;

        // Directly construct the new URL with or without the campaign query parameter - WP-136
        const newUrl = campaignQueryParamValue ? baseParamsUrlWithCampaignQueryParam : baseParamsUrl;

        this.replace(newUrl, true);
    };

    // Search results page
    redirectToSearchResultsPage = (
        queryParams?: string,
        backToSearch: boolean = false,
        shouldIgnoreOrderParams: boolean = false,
    ): void => {
        this.toggleIsClickBackToSearch(backToSearch);
        this.rootStore.queryParamsStore.removeUtmParams();
        const url = this.buildUrl(
            SitePath.Search,
            this.rootStore.queryParamsStore.buildSearchQuery(true, shouldIgnoreOrderParams),
            queryParams,
        );

        if (this.isSearchResultsPage()) {
            this.redirectTo(url, undefined, true);
        } else {
            this.redirectTo(url);
        }
    };

    /** just save promoPage page number in history state so we can retrieve it on back button */
    paginatePromoPage = (page: number): void => {
        const url = this.getUrlWithBasePath(this.pathname);

        /** we use native pushState for pagination so be able to save promoPage in state params.
         *  We make pushState look like it's coming from next.js so, it will captured on popState
         *  Unfortunately Next.js router itself will not "push" history if query params are not changed
         */
        globalThis.history.pushState(
            {
                as: url,
                url,
                __N: true,

                options: { shallow: true, promoPage: page, previousPage: url },
            },
            '',
            url,
        );
    };

    updateSearchResultsPage = (queryParams?: string): void => {
        this.updateUrl(this.buildUrl(SitePath.Search, this.rootStore.queryParamsStore.buildSearchQuery(), queryParams));
    };

    // Hotel details page

    redirectToHotelDetailsPage = (
        offer: IOffer,
        params?: { [key: string]: string },
        replace: boolean = false,
    ): void => {
        const query = this.rootStore.queryParamsStore.buildHotelDetailsQuery(offer, params || {});
        const targetUrl = this.hotelDetailsUrl(offer.hotel, query);
        this.redirectTo(targetUrl, undefined, undefined, replace);
    };

    updateHotelDetailsPage = (queryParams?: string): Promise<void> =>
        this.updateUrl(this.hotelDetailsUrl(this.rootStore.bookingStore.hotel, queryParams));

    redirectToHotelBrowsPageByHotelInfo = (hotel: IHotel): void => {
        this.redirectTo(buildHotelDetailsUrl(hotel));
    };

    updateToHotelBrowsPageByHotelInfo = (hotel: IHotel): void => {
        this.updateUrl(buildHotelDetailsUrl(hotel));
    };

    hotelDetailsUrl = (hotel: Nullable<IHotel>, queryParams?: string): string => {
        const url = this.buildUrl(
            buildHotelDetailsUrl(hotel),
            this.rootStore.queryParamsStore.buildHotelDetailsQuery(),
            queryParams,
        );

        if (this.rootStore.queryParamsStore.isFlightPlusHotelFunnel) {
            const [path, search] = url.split('?');
            const parsed = qs.parse(search);

            delete parsed[QueryParamName.ExperienceContextProvider];
            delete parsed[FlightPlusHotelQueryParamName.DestinationAirport];
            delete parsed[FlightPlusHotelQueryParamName.SearchPodDepartureDate];
            delete parsed[FlightPlusHotelQueryParamName.SearchPodReturnDate];
            delete parsed[FlightPlusHotelQueryParamName.Pax];
            delete parsed[FlightPlusHotelQueryParamName.Discount];
            delete parsed[FlightPlusHotelQueryParamName.Signature];
            delete parsed[FlightPlusHotelQueryParamName.RoomAllocation1];
            delete parsed[FlightPlusHotelQueryParamName.RoomAllocation2];
            delete parsed[FlightPlusHotelQueryParamName.SelectedRef];
            delete parsed[FlightPlusHotelQueryParamName.SelectedBoardType];
            delete parsed[FlightPlusHotelQueryParamName.SelectedPackId];

            const stringified = qs.stringify(parsed);

            return stringified ? `${path}?${stringified}` : path;
        }

        return url;
    };

    // Hotel Browse Page can have query params when it's openeing from Shortlists
    hotelDetailsBrowseUrl = (hotel: Nullable<IHotel>, queryParams?: string): string =>
        this.buildUrl(buildHotelDetailsUrl(hotel), queryParams);

    extrasPageUrl = (queryParams?: string): string =>
        this.buildUrl(SitePath.Extras, this.rootStore.queryParamsStore.buildHotelDetailsQuery(), queryParams);

    bundlesPageUrl = (queryParams?: string): string =>
        this.buildUrl(SitePath.Bundles, this.rootStore.queryParamsStore.buildHotelDetailsQuery(), queryParams);

    searchResultsUrl = (queryParams?: string): string => this.buildUrl(SitePath.Search, queryParams);

    getMapCardLink = ({
        offer,
        url,
        isSelected,
    }: {
        isSelected: boolean;
        offer: IOfferWithHotelData;
        url: string;
    }): string => {
        if (!offer) return '';

        const {
            layoutStore: { basePath, isDestinationPage, isHotelDetailsBrowsePage },
            queryParamsStore: { buildHotelDetailsQuery },
        } = this.rootStore;

        if (isDestinationPage || (isHotelDetailsBrowsePage && !isSelected)) return `${basePath}${url}`;

        const transfer = offer.transfers?.length > 0 ? offer.transfers[0].code : '';
        const isExtras = isSelected && !isHotelDetailsBrowsePage;

        const query = buildHotelDetailsQuery(offer as IOffer, {
            [QueryParamName.Transfer]: transfer,
            [QueryParamName.DefaultTransfer]: offer.transfers?.length ? offer.transfers[0].code : '',
            // clear selected seats and luggage for not current hotel links
            ...(!isExtras && {
                [QueryParamName.SelectedSeats]: '',
                [QueryParamName.SelectedLuggage]: '',
                [QueryParamName.SelectedSportEquipment]: '',
                [QueryParamName.SelectedBagsOut]: '',
                [QueryParamName.SelectedBagsIn]: '',
            }),
        });

        const { hotel } = offer;

        return `${basePath}${isExtras ? this.extrasPageUrl(query) : this.hotelDetailsUrl(hotel, query) || ''}`;
    };

    // Extras page

    redirectToExtrasPage = (queryParams?: string): void => {
        // TODO:  clear promo code here
        this.redirectTo(this.extrasPageUrl(queryParams));
    };

    redirectToBundlesPage = (queryParams?: string): void => {
        this.redirectTo(this.bundlesPageUrl(queryParams));
    };

    updateExtrasPage = (queryParams?: string): Promise<void> =>
        this.updateUrl(
            this.buildUrl(SitePath.Extras, this.rootStore.queryParamsStore.buildHotelDetailsQuery(), queryParams),
        );

    getMicroAppPage = (sitePath: SitePath | FlightPlusHotelSitePath): string => {
        const postPath = sitePath.replace(
            '{bookingRef}',
            this.rootStore.viewBookingStore.booking?.bookingReference ?? '',
        );

        const isFlightPlusHotelPath = sitePath === FlightPlusHotelSitePath.ManageHub;

        const rootPath = isFlightPlusHotelPath
            ? this.rootStore.layoutStore.sitePath.replace(/\/holidays(?:\/trade-portal)?$/, '')
            : this.rootStore.layoutStore.sitePath.replace('/trade-portal', '');

        return `${rootPath}${postPath}`;
    };

    // Guests details page
    redirectToGuestDetails = (): Promise<void> =>
        this.redirectTo(
            this.buildUrl(SitePath.GuestsDetails, this.rootStore.queryParamsStore.buildHotelDetailsQuery()),
        );

    // Payment page

    redirectToPaymentPage = (): Promise<void> => this.redirectTo(SitePath.Payment);

    // Booking confirmation page

    redirectToBookingConfirmationPage = (): Promise<void> => this.redirectTo(SitePath.BookingConfirmation);

    redirectToHomePage = async (): Promise<void> => await this.redirectTo(SitePath.Home);

    redirectToQuestion = (questionCategory?: string, questionTag?: string): void => {
        const { queryParamsStore } = this.rootStore;
        this.updateUrl(this.pathname + queryParamsStore.buildHelpQuestionQuery(questionCategory, questionTag));
    };

    // Amend transfers page
    redirectToAmendTransferPage = (): void => {
        this.redirectTo(SitePath.AmendTransfer);
    };

    hardRedirectToViewBookingPage = (): void => {
        const { queryParamsStore } = this.rootStore;
        queryParamsStore.parseBrowserQuery(queryParamsStore.buildViewBookingQuery());
        this.replace(SitePath.Login + queryParamsStore.buildViewBookingQuery());
    };

    redirectToViewBookingsPage = (): void => {
        this.redirectTo(SitePath.ViewBookings);
    };

    redirectToDestinationPageWithParams = (url: string, params: { [key: string]: string }): void => {
        const { queryParamsStore } = this.rootStore;
        this.redirectTo(url + queryParamsStore.stringifyQuery(params));
    };

    redirectToMicroApp = (sitePath: SitePath): void => {
        const { booking } = this.rootStore.viewBookingStore;

        if (!booking) return;

        const microAppPagePath = this.getMicroAppPage(sitePath);

        globalThis.location.href = microAppPagePath;
    };

    redirectToManageHubPage = (): void => {
        const { booking } = this.rootStore.viewBookingStore;

        if (!booking) {
            return;
        }

        const isFlightAndHotelPackage =
            'isFlightAndHotelPackage' in this.rootStore.viewBookingStore &&
            this.rootStore.viewBookingStore.isFlightAndHotelPackage;

        const manageHubPath = isFlightAndHotelPackage ? FlightPlusHotelSitePath.ManageHub : SitePath.ManageHub;

        globalThis.location.href = this.getMicroAppPage(manageHubPath);
    };

    redirectToMicroAppChangeTransferPage = (): void => {
        this.redirectToMicroApp(SitePath.MicroAppChangeTransfer);
    };

    redirectToMicroAppChangeFlightPage = (): void => {
        this.redirectToMicroApp(SitePath.MicroAppChangeFlight);
    };

    redirectToMicroAppChangeHotelPage = (): void => {
        this.redirectToMicroApp(SitePath.MicroAppChangeHotel);
    };

    redirectToMicroAppChangeRoomAndBoardPage = (): void => {
        this.redirectToMicroApp(SitePath.MicroAppChangeRoomAndBoard);
    };

    redirectToMicroAppChangeSeatsPage = (): void => {
        this.redirectToMicroApp(SitePath.MicroAppChangeSeats);
    };

    redirectToMicroAppChangeNamePage = (): void => {
        this.redirectToMicroApp(SitePath.MicroAppChangeName);
    };

    redirectToMicroAppChangeDatePage = (): void => {
        this.redirectToMicroApp(SitePath.MicroAppChangeDate);
    };
}

export default BaseRouterStore;
