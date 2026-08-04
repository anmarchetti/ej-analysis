import Axios, { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, runInAction, when } from 'mobx';

import settings from 'code/settings';
import shortlistService from 'frontend/services/shortlist.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { isIE } from 'frontend/utils/browser.utils';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import { getOfferAccomCode, isShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import { getWebStorageItem, removeWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IBreadcrumb } from 'models/data/IBreadcrumb';
import { IImage } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { IRecentShortlistedItem, IShortlistStatus } from 'models/data/IShortlistOffers';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { DataStatus } from 'models/enum/DataStatus';
import HttpsStatusCodes from 'models/enum/HttpStatusCodes';
import { ShortlistType } from 'models/enum/ShortlistType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

export class ShortlistStore {
    @observable take: number = settings.Shortlist.itemsPerPage;
    @observable page: number = 1;
    @observable offers: IOffer[] = [];
    @observable totalOffers: number;
    @observable selectedOffers: IOffer[] = [];
    @observable offersStatus: DataStatus = DataStatus.NotLoaded;
    @observable isShortlistEditMode: boolean = false;

    // If status is null, that means it's not loaded
    @observable savedOffersCount: Nullable<number> = null;
    @observable isShortlistStatusLoading: boolean = false;

    @observable isShortlistRemoving: boolean = false;
    @observable isRemovePopupShown: boolean = false;
    @observable isRedirectPopupShown: boolean = false;
    @observable isRemoveShortlistFailed: boolean = false;

    @observable shortlistHeroImage: Nullable<IImage>;

    @observable isShowBookingInShortlistPopup: boolean = false;
    @observable isShowLoginPopup: boolean = false;
    @observable candidate: IOffer | null;
    @observable isShortlistAdding: boolean = false;
    @observable recentShortlistedItem: Nullable<IRecentShortlistedItem> = null;
    @observable isRedirectToShortlistPage: boolean = false;
    @observable prevPageBreadcrumb: Nullable<IBreadcrumb> = null;
    private offersCancelSource: Nullable<CancelTokenSource>;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);

        if (
            getWebStorageItem(WebStorageKeys.NeedShowBookingInShortlistModal, true) &&
            !getWebStorageItem(WebStorageKeys.IsOfferWasAddedToShortlist, true, sessionStorage)
        ) {
            this.isShowBookingInShortlistPopup = true;
            this.setNeedShowBookingInShortlistModal(false);
            this.setShortlistFlagToStorage();
        }
    }

    @computed get isShortlistEnabled(): boolean {
        return !!this.rootStore.layoutStore.getSetting(SiteSettings.IsShortlistEnabled);
    }

    @computed get isAnyShortlistMultiplePersonOfferNotExpired(): boolean {
        return this.offers.some(offer => offer.price !== offer.pricePP && offer.price !== 0);
    }

    @action clearShortlist = (): void => {
        this.clearSelectedOffers();
        this.page = 1;
        this.totalOffers = 0;
        this.offers = [];
        this.isShortlistEditMode = false;
        this.isShortlistRemoving = false;
        this.isRemoveShortlistFailed = false;
    };

    @action clearSelectedOffers = (): void => {
        this.selectedOffers = [];
    };

    /** Log out and open login form (login page or popup) on unauthorized error */
    handleUnauthorizedError = async (): Promise<void> => {
        await this.rootStore.userStore.onLogout(true);

        if (this.rootStore.layoutStore.isShortlistPage) {
            this.rootStore.routerStore.redirectToLoginPage(true);

            return;
        }

        this.toggleShowLoginPopup(true);
    };

    @action initializeShortlists = async (): Promise<void> => {
        const { userStore, routerStore, layoutStore } = this.rootStore;
        const isLoggedIn = await userStore.checkIfUserLoggedIn();

        if (!this.isShortlistEnabled || !isLoggedIn) {
            this.redirectToLoginPage();

            return;
        }

        if (this.isShortlistStatusLoading) {
            await when(() => !this.isShortlistStatusLoading);
        }

        if (layoutStore.isMaintenance && layoutStore.isShortlistPage) {
            routerStore.redirectToShortlistNoResultsPage();

            return;
        }

        if (layoutStore.isShortlistNoResultsPage && this.savedOffersCount) {
            routerStore.redirectToShortlistPage();

            return;
        }

        if (layoutStore.isShortlistPage) {
            await this.processOnShortlistPage();
        }
    };

    private redirectToLoginPage(): void {
        const redirectUrl = this.isShortlistEnabled
            ? this.rootStore.queryParamsStore.buildRedirectUrlToShortlistPage()
            : undefined;

        this.rootStore.routerStore.redirectToLoginPage(true, redirectUrl);
    }

    private async processOnShortlistPage(): Promise<void> {
        if (this.savedOffersCount === 0) {
            this.rootStore.routerStore.redirectToShortlistNoResultsPage();

            return;
        }

        try {
            this.clearShortlist();
            await this.fetchShortlistOffers();
        } catch (e) {
            if (e.response?.status === HttpsStatusCodes.Unauthorized) {
                await this.handleUnauthorizedError();
            }
        }
    }

    @action fetchShortlistOffers = async (): Promise<void> => {
        this.offersStatus = DataStatus.Loading;
        try {
            if (this.offersCancelSource) {
                this.offersCancelSource.cancel();
            }

            this.offersCancelSource = Axios.CancelToken.source();
            const response = await shortlistService.fetchShortlistOffers(this.take, this.page, this.offersCancelSource);

            runInAction(() => {
                this.offers = response?.offers || [];
                this.totalOffers = response?.status?.total || 0;
                this.setShortlistedCount(this.totalOffers);
                this.updateHeroImage();
                this.offersStatus = DataStatus.Loaded;
            });
        } catch (e) {
            if (!Axios.isCancel(e)) {
                runInAction(() => (this.offersStatus = DataStatus.Error));
            }
        }
    };

    @action setPageNumber = (page: number): void => {
        this.page = page;
    };

    @action updateHeroImage = (): void => {
        // hero image is the first image of the first hotel of the list
        if (this.page === 1 || !this.shortlistHeroImage) {
            this.shortlistHeroImage = (this.offers?.length && this.offers[0]?.hotel?.images?.[0]) || null;
        }
    };

    /** If offer is available, set offer and search params for BookingStore  */
    @action selectShortlistOfferForBooking = (offer: IOffer): void => {
        if (this.isOfferFromAnotherMarket(offer)) {
            this.selectedOffers = [offer];
            this.toggleRedirectPopup(true);

            return;
        }

        if (isShortlistOfferUnavailable(offer)) {
            return;
        }

        this.rootStore.bookingStore.resetBookingStore();
        this.rootStore.bookingStore.setOfferAndSearchValues(offer);
    };

    @action startEditMode = (): void => {
        this.isShortlistEditMode = true;
    };

    @action cancelEditMode = (): void => {
        this.clearSelectedOffers();
        this.isShortlistEditMode = false;
    };

    @action toggleOfferSelection = (offer: IOffer): void => {
        const indexOfSelected = this.findSelectedOfferIndex(offer);

        if (indexOfSelected === -1) {
            this.selectedOffers.push(offer);
        } else {
            this.selectedOffers.splice(indexOfSelected, 1);
        }

        this.selectedOffers = [...this.selectedOffers];
    };

    isOfferSelected = (offer: IOffer): boolean => this.findSelectedOfferIndex(offer) !== -1;

    private readonly findSelectedOfferIndex = (offer: IOffer): number =>
        this.selectedOffers.findIndex(o => o.shortlist?.id === offer.shortlist?.id);

    /** Remove offers from shortlist  */
    @action toggleRemovePopup = (state: boolean): void => {
        this.isRemovePopupShown = state;
        this.isRemoveShortlistFailed = false;
    };

    /** Redirect to another market */
    @action toggleRedirectPopup = (state: boolean): void => {
        this.isRedirectPopupShown = state;
    };

    @action deleteShortlistedItems = async (offers: IOffer[], onSuccess?: () => void): Promise<void> => {
        const ids = offers.map(o => o.shortlist?.id).filter(Boolean) as string[];

        if (ids.length < 1) {
            return;
        }

        try {
            this.isShortlistRemoving = true;
            this.isRemoveShortlistFailed = false;
            const res = await shortlistService.deleteShortlistedItems(ids);

            runInAction(() => {
                this.rootStore.trackingStore.trackShortlistEvent(false, offers);
                this.setShortlistedCount(res?.savedOffersCount);
                onSuccess?.();
            });
        } catch (e) {
            if (e.response?.status === HttpsStatusCodes.Unauthorized) {
                this.toggleRemovePopup(false);
                await this.handleUnauthorizedError();
            } else {
                runInAction(() => (this.isRemoveShortlistFailed = true));
            }
        } finally {
            runInAction(() => (this.isShortlistRemoving = false));
        }
    };

    @action onRemoveItemFromShortlist = (offer: IOffer): void => {
        if (this.rootStore.layoutStore.isShortlistPage) {
            this.selectedOffers = [offer];
        } else {
            this.candidate = offer;
        }

        this.toggleRemovePopup(true);
    };

    @action toggleShowBookingInShortlistPopup = (state: boolean): void => {
        this.isShowBookingInShortlistPopup = state;
    };

    @action toggleShowLoginPopup = (state: boolean): void => {
        this.isShowLoginPopup = state;
    };

    @action toggleShortlistAdding = (state: boolean): void => {
        this.isShortlistAdding = state;
    };

    addOfferToShortlist = async (offer: IOffer): Promise<IShortlistStatus | undefined> => {
        const packageId = offer.accom?.packageId;

        if (!packageId) {
            return;
        }

        const [outboundRoute, inboundRoute] = offer.transport?.routes || [];

        const rooms = offer.accom.unit || [];
        const roomsQuery: Omit<IQueryRoom, 'childrenAges'>[] = rooms.map(r => ({
            adults: r.occupation.adults,
            children: r.occupation.children,
            infants: r.occupation.infants,
            roomCode: r.code,
        }));
        const childAges = rooms.reduce((ages, r) => ages.concat(r.occupation.childAges), [] as number[]);

        return await shortlistService.addOfferToShortlist({
            startDate: formatDateToQuery(offer.date),
            flexDays: this.rootStore.searchStore.searchWhen.flexDays,
            duration: [offer.stay],
            departure: outboundRoute?.depPt,
            room: roomsQuery,
            childAges: childAges.join(','),
            accommodationId: offer.accom.id,
            outboundRouteId: outboundRoute?.id,
            inboundRouteId: inboundRoute?.id,
            packageId,
            iDepAirport: outboundRoute?.depPt,
            iArrAirport: outboundRoute?.arrPt,
            iTheme: offer.accom.theme?.code || '',
            boardType: rooms.length ? rooms[0].board : '',
            transfer: offer.transfers?.length ? offer.transfers[0].code : '',
            geography: this.rootStore.searchStore.searchTo.selectedDestinationCodesQuery,
            isExt: offer.accom.isExt,
        });
    };

    addHotelToShortlist = async (offer: IOffer): Promise<undefined | IShortlistStatus> => {
        const giataCode = this.candidate?.hotel?.giataCode;

        if (!giataCode) {
            return;
        }

        const typeCode = offer.accom?.type?.code || offer.hotel?.type?.code || '';

        return await shortlistService.addHotelToShortlist(giataCode, typeCode);
    };

    /* AB Test - EHD-169 >>>> */
    addCandidateToShortlist = async (offers: IOffer[], showOverlay = true): Promise<void> => {
        try {
            if (!this.candidate || !this.rootStore.userStore.isLoggedIn) {
                return;
            }

            this.toggleShowLoginPopup(false);
            /* AB Test - EHD-169 >>>> */
            showOverlay && this.toggleShortlistAdding(true);

            const result =
                this.candidate.shortlist?.type === ShortlistType.Hotel
                    ? await this.addHotelToShortlist(this.candidate)
                    : await this.addOfferToShortlist(this.candidate);

            if (result) {
                this.setShortlistedCount(result.savedOffersCount);
                this.saveCandidateToRecentShortlisted(result.createdID);

                if (!getWebStorageItem(WebStorageKeys.IsOfferWasAddedToShortlist, true, sessionStorage)) {
                    this.toggleShowBookingInShortlistPopup(true);
                    this.setShortlistFlagToStorage();
                }

                if (this.rootStore.layoutStore.isShortlistPage) {
                    this.initializeShortlists();
                }

                this.rootStore.trackingStore.trackShortlistEvent(true, offers);
            }
        } catch (e) {
            if (e.response?.status === HttpsStatusCodes.Unauthorized) {
                await this.handleUnauthorizedError();
            } else {
                this.setCandidate();
            }
        } finally {
            this.toggleShortlistAdding(false);
        }
    };

    removeCandidateFromShortlist = async (): Promise<void> => {
        if (!this.candidate) return;

        await this.deleteShortlistedItems([this.candidate], () => {
            this.onShortlistItemDeleted();
        });
    };

    onShortlistItemDeleted = (): void => {
        this.saveCandidateToRecentShortlisted(undefined);
        this.toggleRemovePopup(false);

        if (this.rootStore.layoutStore.isShortlistPage) {
            this.initializeShortlists();
        }
    };

    updateCandidateInShortlist = async (): Promise<void> => {
        if (this.candidate?.shortlist?.id) {
            await this.removeCandidateFromShortlist();
        } else {
            const params = this.candidate?.accom?.code ? [this.candidate] : [];
            await this.addCandidateToShortlist(params);
        }
    };

    setShortlistFlagToStorage = (): void => {
        setWebStorageItem(WebStorageKeys.IsOfferWasAddedToShortlist, JSON.stringify(true), sessionStorage);
    };

    /**
     * Save candidate and its new shortListId as recent shortlisted item.
     * @param shortListId - new shortListId (it's undefined if candidate was removed from shortlist, string - if was added)
     */
    @action saveCandidateToRecentShortlisted = (shortListId: string | undefined): void => {
        if (this.candidate) {
            this.recentShortlistedItem = {
                accomCode: getOfferAccomCode(this.candidate),
                packageId: this.candidate.accom?.packageId,
                shortListId: shortListId,
                shortListType: this.candidate.shortlist?.type || ShortlistType.Offer,
                shortListLang: this.candidate.shortlist?.language,
                shortListMarketCode: this.candidate.shortlist?.marketCode,
            };
            this.setCandidate(null);
        }

        // INS-1203: removed offer should be added to recentShortlistedItem so that the ShortlistButton state updates correctly on the Shortlist page
        if (this.rootStore.layoutStore.isShortlistPage && !shortListId && this.selectedOffers.length === 1) {
            this.recentShortlistedItem = {
                accomCode: getOfferAccomCode(this.selectedOffers[0]),
                packageId: this.selectedOffers[0].accom?.packageId,
                shortListId: shortListId,
                shortListType: this.selectedOffers[0].shortlist?.type || ShortlistType.Offer,
                shortListLang: this.selectedOffers[0].shortlist?.language,
                shortListMarketCode: this.selectedOffers[0].shortlist?.marketCode,
            };
        }
    };

    @action resetRecentShortlistedItem = (): void => {
        this.recentShortlistedItem = null;
    };

    @action setCandidate = (offer?: IOffer | null): void => {
        this.candidate = offer || null;
    };

    /*AB Test - EHD-169 >>>> */
    @action onAddToShortlist = (offer: IOffer, showOverLay = true): void => {
        this.candidate = offer;

        if (this.rootStore.userStore.isLoggedIn) {
            this.isShowLoginPopup && this.toggleShowLoginPopup(false);
            this.addCandidateToShortlist([offer], showOverLay);
        } else {
            this.toggleShowLoginPopup(true);
        }
    };

    /* <<<< AB Test - EHD-169*/

    @action getHotelShortlistId = async (giataCode: string): Promise<string | undefined> => {
        if (giataCode) {
            try {
                const res = await shortlistService.getHotelShortlistStatus(giataCode);

                return res?.createdID || undefined;
            } catch {}
        }

        return undefined;
    };

    @action getShortlistStatus = async (): Promise<void> => {
        try {
            this.isShortlistStatusLoading = true;
            const result = await shortlistService.getShortlistStatus();

            this.setShortlistedCount(result.savedOffersCount);
        } catch (e) {
            this.setShortlistedCount(null);
        } finally {
            runInAction(() => (this.isShortlistStatusLoading = false));
        }
    };

    @action setShortlistedCount = (count: number | null): void => {
        this.savedOffersCount = count;
    };

    @action setRedirectToShortlistPage = (state: boolean): void => {
        this.isRedirectToShortlistPage = state;
    };

    @action savePrevPage = (pageBreadcrumb: Nullable<IBreadcrumb>): void => {
        this.prevPageBreadcrumb = pageBreadcrumb;
    };

    @action savePageBreadcrumbs = (): void => {
        const { layoutStore, routerStore } = this.rootStore;

        if (layoutStore.isPromoPage || layoutStore.isSearchResultsPage) {
            this.savePrevPage(
                layoutStore.isPromoPage
                    ? { key: layoutStore.pageName, value: routerStore.pathname }
                    : {
                          key: layoutStore.getPhrase(SitecoreDictionary.PathBreadcrumbsLabelsSearchResults),
                          value: routerStore.backToSearchUrl,
                      },
            );
        }
    };

    setNeedShowBookingInShortlistModal = (state: boolean): void => {
        if (!isIE()) {
            return;
        }

        state
            ? setWebStorageItem(WebStorageKeys.NeedShowBookingInShortlistModal, JSON.stringify(true))
            : removeWebStorageItem(WebStorageKeys.NeedShowBookingInShortlistModal);
    };

    isOfferFromAnotherMarket = (offer: IOffer): boolean => {
        if (!offer.shortlist || !this.rootStore.layoutStore.isShortlistPage) {
            return false;
        }

        const { language, marketCode } = offer.shortlist;

        return !!(
            (marketCode && marketCode !== this.rootStore.marketStore.marketSettings?.Code) ||
            (language && language !== this.rootStore.marketStore.marketSettings?.Language)
        );
    };

    getShortlistHotelLink = (offer: IOffer): string => {
        const { routerStore, queryParamsStore } = this.rootStore;
        const { hotelDetailsBrowseUrl, hotelDetailsUrl } = routerStore;
        const { buildShortlistHotelQuery } = queryParamsStore;

        if (offer.shortlist?.type === ShortlistType.Hotel) {
            return hotelDetailsBrowseUrl(offer.hotel);
        }

        const query = buildShortlistHotelQuery(offer);
        const url = isShortlistOfferUnavailable(offer)
            ? hotelDetailsBrowseUrl(offer.hotel, query)
            : hotelDetailsUrl(offer.hotel, query);

        return url || '';
    };
}
