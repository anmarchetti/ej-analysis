import Axios, { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import { CurrencyCode } from 'code/currency';
import { logger } from 'frontend/services/logging';
import hotelsService from 'frontend/services/offers.service';
import BaseOffersStore from 'frontend/store/base/offers/BaseOffersStore';
import { DEFAULT_HOTEL_CODE_LENGTH } from 'frontend/store/base/search/constants';
import { IPromoPageDates } from 'frontend/store/holidays';
import { ISssrStore } from 'frontend/store/IStores';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { onlyUnique } from 'frontend/utils/array.utils';
import { addDays, formatDateL10n } from 'frontend/utils/date.utils';
import { getIDestinationByCode } from 'frontend/utils/destinations.utils';
import { buildLivePriceCodes } from 'frontend/utils/livePrice.utils';
import { buildKeyBasedOnMarket } from 'frontend/utils/market.utils';
import { swapOfferAccommodations } from 'frontend/utils/offer.utils';
import { getPromoPageDates } from 'frontend/utils/promoPageDates';
import { removeWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IDestination } from 'models/data/IDestination';
import { IFilterOption, IFilters } from 'models/data/IFilters';
import { ILivePrice, ILivePriceCriteria } from 'models/data/ILivePrice';
import { IAltBoard, IFetchOffersParams, IOffer, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { ISearchOffers } from 'models/data/ISearchOffers';
import { IGeoPoint } from 'models/data/map/IMap';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { Bd4TravelListIdTrade, Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { DataStatus } from 'models/enum/DataStatus';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import { DEPARTURE_ALL_CODE } from 'models/enum/RequestConstants';
import { SearchType } from 'models/enum/SearchType';
import SiteSettings from 'models/enum/SiteSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { IDestinationAvailability } from 'models/IDestinationsAvailability';

export interface ITradePortalOffersInitialState {
    offers?: IOffer[];
    status?: DataStatus;
}

export class TradePortalOffersStore extends BaseOffersStore implements ISssrStore<ITradePortalOffersInitialState> {
    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
        makeObservable(this);
    }

    public deserialize(initialState?: ITradePortalOffersInitialState): void {
        this.status = initialState?.status || DataStatus.NotLoaded;
        this.offers = initialState?.offers || [];
    }

    public serialize(): ITradePortalOffersInitialState {
        return {
            status: toJS(this.status),
            offers: toJS(this.offers),
        };
    }

    private offersSearchCancelSource: Nullable<CancelTokenSource>;
    private isLoadMoreOffers: boolean = false;
    private isLoadPreviousOffers: boolean = false;

    @observable offers: IOffer[] = [];
    @observable parentOffers: Nullable<IOffer[]>;
    @observable polyOffers: Nullable<IGeoPoint[]>;
    @observable hasDiscont: boolean = false;
    @observable showParentOffers: boolean = false;
    @observable specialRequestsTypesByCode: Record<string, string>;

    @computed
    get hasOffers(): boolean {
        return !!this.offers?.length;
    }

    @computed get currency(): CurrencyCode | undefined {
        return this.offers?.length > 0 ? this.offers[0].currency?.code : undefined;
    }

    @action changeShowParentOffers = (show: boolean): void => {
        this.showParentOffers = show;
    };

    @action resetOffersDataStatus = (): void => {
        this.updateOffersDataStatus(DataStatus.NotLoaded);
    };

    @action
    saveOffers = (offers: any[]): void => {
        this.offers = offers;
    };

    @action
    setHasDiscont = (value: boolean): void => {
        this.hasDiscont = value;
    };

    @action
    setSpecialRequestsTypesByCode = (value: Record<string, string>): void => {
        this.specialRequestsTypesByCode = value;
    };

    @action.bound
    selectSpecificOffer(offer: IOffer): void {
        this.rootStore.bookingStore.selectedOffer = offer;
        this.rootStore.bookingStore.defaultTransferFromUrl = offer?.transfers?.length ? offer.transfers[0].code : '';
        this.rootStore.bookingStore.selectedTransferFromUrl = offer?.transfers?.length ? offer.transfers[0].code : '';
    }

    setIsLoadMoreOffers = (state: boolean): void => {
        this.isLoadMoreOffers = state;
    };

    setIsLoadPreviousOffers = (state: boolean): void => {
        this.isLoadPreviousOffers = state;
    };

    private readonly fetchOffersWithParams = (params: IFetchOffersParams): Promise<ISearchOffers> => {
        const { searchFiltersStore, layoutStore, searchStore, promoPageStore } = this.rootStore;
        const { isPromoPage } = layoutStore;

        const placementId = isPromoPage ? Bd4TravelListIdTrade.PromoList : Bd4TravelListIdTrade.HotelsList;

        const destinations = isPromoPage
            ? promoPageStore.editorDestinationsQuery
            : searchStore.selectedDestinationsQuery;

        const flightDurationFrom = searchFiltersStore.flightDurationFrom * 60;

        return this.fetchOffersWithParamsBase(placementId, destinations, flightDurationFrom, params);
    };

    private readonly loadMoreOffers = async (params: IFetchOffersParams) => {
        const { searchStore } = this.rootStore;

        const response = await this.fetchOffersWithParams({
            ...params,
            page: searchStore.page,
        });

        return {
            offers: this.isLoadMoreOffers
                ? this.offers.concat(response.offers)
                : response.offers.concat(toJS(this.offers)),
            status: response.status,
            filters: response.filters,
        };
    };

    /**
     *
     * should call fetchOffers
     * @param destinationCodesQuery - string query with destination codes
     * @param withoutDestinationFilters - is used only for getting Parent offers
     * return allOffers
     *
     */
    private getAllOffers = async (
        destinationCodesQuery: string,
        withoutDestinationFilters?: boolean,
        cancelSource?: CancelTokenSource,
    ) => {
        const { searchStore, searchFiltersStore, bookingStore, layoutStore } = this.rootStore;

        let startDate = (bookingStore.from || searchStore.searchWhen.from) as Date;
        let endDate: Date | undefined;
        const initialTradeDurations: string[] = [
            bookingStore.selectedNumberOfNights?.toString() ||
                searchStore.searchWhen.selectedNumberOfNights?.toString(),
        ].filter(Boolean);
        let durations: string[] = initialTradeDurations;

        if (searchStore.searchWhen.isMonthSearch) {
            endDate = bookingStore.to || searchStore.searchWhen.to || undefined;
        }

        if (searchFiltersStore.durationFilters?.length) {
            /** Update duration field from filter values. */
            durations = searchFiltersStore.durationFilters;
        }

        // update the freeForKidsOnly value for the filter
        // Get Selected Offers filter
        const selectedOffers: Nullable<string[]> = searchFiltersStore.offersFilters;

        const initialTradeDeparture = bookingStore.origins.join(',') || DEPARTURE_ALL_CODE;
        const departure = searchFiltersStore.flightsFilters ? searchFiltersStore.flightsFilters : initialTradeDeparture;
        const rooms: IQueryRoom[] = bookingStore.roomsAllocation.map(el => ({
            adults: el.adults.length,
            children: el.children.length,
            infants: el.infants.length,
            roomCode: '', // should be empty on initial search
            childrenAges: el.children.map(c => c.age),
        }));
        let searchType = SearchType.Normal;

        if (this.rootStore.layoutStore.isPromoPage) {
            searchType = SearchType.Promo;
            const sitecoreFields = this.rootStore.layoutStore.layout?.sitecore?.route?.fields;

            if (bookingStore.selectedNumberOfNights === 0) {
                /** Check promo page info */
                const promoPagesDates = getPromoPageDates(this.rootStore.layoutStore.layout);

                if (promoPagesDates) {
                    const {
                        startDate: promoStartDate,
                        endDate: promoEndDate,
                        initialSearchDays,
                    }: IPromoPageDates = promoPagesDates;
                    startDate = promoStartDate;
                    endDate = promoEndDate;

                    if (initialSearchDays) {
                        const proposedEndDate = addDays(initialSearchDays, promoStartDate);

                        if (proposedEndDate < promoEndDate) endDate = proposedEndDate;
                    }
                }

                const defaultDuration = sitecoreFields?.DefaultDuration?.value;
                durations = defaultDuration ? defaultDuration.split(',') : [];
            }

            const isKidsFreePage = layoutStore.isApplySpecialFilter(SiteSettings.KidsGoFree, layoutStore.pageName);

            if (isKidsFreePage) {
                selectedOffers?.push(FilterGroupCodes.FreeForKidsOnly);
            }
        } else if (!withoutDestinationFilters) {
            const isVirtualResort = searchStore.searchTo.selectedDestinations.some(
                dest => dest.type === DestinationType.VirtualResort,
            );

            // prefill search params of non-promopages and non-parent offers
            this.savePrefillParams({
                startDate: formatDateL10n(startDate),
                durations: initialTradeDurations,
                departure: initialTradeDeparture,
                dest: bookingStore.selectedDestinationCodes.join(','),
                geog: destinationCodesQuery,
                rooms,
                autoAllocation: bookingStore.isAutoAllocation,
                flexDays: bookingStore.flexDays,
                isMonthSearch: searchStore.searchWhen.isMonthSearch,
                isVirtualResort,
            });
        }

        let allOffers;
        const offers: Nullable<string> = selectedOffers?.filter(onlyUnique).join(',');
        const commonParams = {
            startDate,
            durations,
            departure,
            destinationCodesQuery,
            rooms,
            withoutDestinationFilters,
            cancelSource,
            endDate,
            offers,
            searchType,
            ...(searchStore.searchWhen.isMonthSearch && {
                isMonthSearch: true,
            }),
        };

        if (
            (this.rootStore.layoutStore.isSearchResultsPage || this.rootStore.layoutStore.isPromoPage) &&
            !this.rootStore.appStore.isScreenSmall &&
            (this.isLoadMoreOffers || this.isLoadPreviousOffers)
        ) {
            allOffers = await this.loadMoreOffers(commonParams);
        } else {
            allOffers = await this.fetchOffersWithParams({
                ...commonParams,
                page: searchStore.page,
            });
        }

        return allOffers;
    };

    @action
    fetchOffers = async (
        force: boolean = false,
        clearFlow: boolean = true,
        parentSearch: boolean = false,
    ): Promise<void> => {
        const { searchStore, searchFiltersStore, bookingStore, layoutStore } = this.rootStore;

        const shouldLoad =
            force ||
            (this.status !== DataStatus.Loaded &&
                this.status !== DataStatus.Error &&
                this.status !== DataStatus.Loading);
        const canLoad = searchStore.isAllSearchParametersSelected || bookingStore.isAllSearchParametersSelected;

        if (!shouldLoad || !canLoad) {
            return;
        }

        // cancel previous request if there is one
        if (this.offersSearchCancelSource) {
            this.offersSearchCancelSource.cancel();
            this.offersSearchCancelSource = null;
        }

        if (clearFlow) {
            this.rootStore.bookingStore.clearBookingFlow();
            this.rootStore.paymentStore.clearPaymentStore();
            this.rootStore.priceGraphStore.clearAlternativeOffers();
        }

        if (this.isLoadMoreOffers) {
            this.updateOffersDataStatus(DataStatus.LoadingMore);
        } else if (this.isLoadPreviousOffers) {
            this.updateOffersDataStatus(DataStatus.LoadingPrevious);
        } else {
            this.updateOffersDataStatus(DataStatus.Loading);
        }

        try {
            this.offersSearchCancelSource = Axios.CancelToken.source();
            const allOffers = await this.getAllOffers(
                bookingStore.selectedDestinationCodesQuery,
                false,
                this.offersSearchCancelSource,
            );

            if (!allOffers) {
                this.rootStore.trackingStore.setBd4SortTracking(null);
                this.saveOffers([]);
                this.updateOffersDataStatus(DataStatus.Loaded);
                this.setTotalHotels(0);
                searchFiltersStore.saveFilters([]);

                return;
            }

            this.rootStore.trackingStore.setBd4SortTracking(allOffers.status?.tracking);
            this.saveOffers(allOffers.offers);
            this.setTotalHotels(allOffers.status.total);
            this.setPrices(
                allOffers.status?.minPrice,
                allOffers.status?.maxPrice,
                allOffers.status?.minPricePP,
                allOffers.status?.maxPricePP,
            );

            // check if new response list no longer has a discount property and update actual order value
            if (
                this.hasDiscont &&
                !allOffers.status.hasDiscont &&
                (searchStore.orderBy === OrderBy.DiscAmount || searchStore.orderBy === OrderBy.DiscPercent)
            ) {
                this.rootStore.searchStore.updateOrder(OrderBy.Price, OrderDirection.Asc);
            }

            this.setHasDiscont(allOffers.status.hasDiscont);

            let newFilters = allOffers.filters || [];

            if (!allOffers.filters && searchFiltersStore.selectedFilters?.length) {
                newFilters = searchFiltersStore.filters.map((el: IFilters) => {
                    el.options.forEach((option: IFilterOption) => {
                        option.count = 0;

                        if (option.children && option.children.length > 0) {
                            option.children.forEach((ch: IFilterOption) => (ch.count = 0));
                        }
                    });

                    return el;
                });
            }

            searchFiltersStore.saveFilters(newFilters, allOffers.reorderFilters);

            this.changeShowParentOffers(false);

            if (allOffers.status?.total > 0 && allOffers.status?.total <= 5) {
                await bookingStore.loadRecommendedHotels(
                    layoutStore.isPromoPage
                        ? Bd4TravelPlacementId.TradeFiveResultsOnPromo
                        : Bd4TravelPlacementId.TradeFiveResultsOnSearchResults,
                    this.offersSearchCancelSource,
                );
            }

            if (!allOffers.offers?.length && !parentSearch && !layoutStore.isMaintenance) {
                await this.handleOffersNoResults(this.offersSearchCancelSource);
            }

            this.updateOffersDataStatus(DataStatus.Loaded);
            this.rootStore.searchFiltersStore.onChangeSearchFilterStore({
                key: 'isFiltersLoadingScreenEnabled',
                value: true,
            });
        } catch (e) {
            if (!Axios.isCancel(e)) {
                this.updateOffersDataStatus(DataStatus.Error);
            }
        }
    };

    /**
     * Try to load extra offers (recommended hotels or parent offers) if main search has no results.
     * @param cancelSource - axios token that used for main offers search request (if main request is cancelled, need to cancel these ones as well)
     */
    handleOffersNoResults = async (cancelSource?: CancelTokenSource): Promise<void> => {
        const { layoutStore, bookingStore, priceGraphStore, searchStore, searchFiltersStore } = this.rootStore;

        if (searchFiltersStore.activeFilterCode === FilterGroupCodes.FlightTimes) {
            searchFiltersStore.onCloseFilters();
        }

        /** Load recommended hotels at first. */
        await bookingStore.loadRecommendedHotels(
            layoutStore.isPromoPage ? Bd4TravelPlacementId.TradePromoPage : Bd4TravelPlacementId.TradeSearchResults,
            cancelSource,
        );

        /**
         * Using .every method as here can be more than ONE hotel codes (external and contract hotel codes)
         */
        const isSingleHotelSearch = searchStore.searchTo.selectedAccommodationCodes
            .split(',')
            .every(code => code.length === DEFAULT_HOTEL_CODE_LENGTH);

        /** Load parent or alternative offers if recommended hotels not found or if it is single hotel search */
        if (!layoutStore.isPromoPage && (!bookingStore.recommendedHotels?.length || isSingleHotelSearch)) {
            searchStore.searchTo.selectedAccommodationCodes
                ? await priceGraphStore.loadAlternativeOffers(true, undefined, undefined, cancelSource)
                : await this.getParentOffers(cancelSource);
        }
    };

    /** Remove current market search params from LocalStorage */
    public clearPrefillParams = (): void => {
        const { marketCode } = this.rootStore.marketStore;
        const searchParamsKey = buildKeyBasedOnMarket(WebStorageKeys.SearchParams, marketCode);

        removeWebStorageItem(searchParamsKey);
    };

    @action cleanUpParentOffers = (): void => {
        this.parentOffers = null;
    };

    /* need call changeDestinations for change selectedDestination array when we click back in browser */
    updateSelectedDestination = (): void => {
        const { searchStore } = this.rootStore;
        const oldDestination: IDestination[] = [];
        !!searchStore.searchTo.countriesWithRegions?.length &&
            searchStore.searchTo.selectedDestinationCodes.forEach(el => {
                const destination = getIDestinationByCode(searchStore.searchTo.countriesWithRegions, el);
                oldDestination.push(destination);
            });
        !!oldDestination.filter(Boolean).length && searchStore.searchTo.changeDestinations(oldDestination);
    };

    /*
     *
     * Need for get array in Offers Carousel when we see no result page
     * should call fetchOffers with parent destination and set result to parentOffers array
     *
     */
    @action private getParentOffers = async (cancelSource?: CancelTokenSource) => {
        const { searchStore } = this.rootStore;

        if (!searchStore.isAllSearchParametersSelected) {
            return;
        }

        const allOffers = await this.getAllOffers(
            searchStore.searchTo.selectedParentDestinationCodesQuery || '',
            true,
            cancelSource,
        );

        if (allOffers?.offers.length) {
            runInAction(() => {
                this.parentOffers = allOffers.offers;
            });
            this.changeShowParentOffers(true);
            this.updateSelectedDestination();
        } else {
            this.cleanUpParentOffers();
        }
    };

    getDestinationsByCodes = async (codes: string[], includeRelatedItem?: boolean): Promise<IDestination[]> => {
        if (!codes.length) {
            return [];
        }

        try {
            const result = await hotelsService.fetchDestinationsByCodes(codes, includeRelatedItem);

            return result;
        } catch (e) {
            logger.error({ e });

            return [];
        }
    };

    getDestinationsForLoadingLivePrice = async (codes: string[]): Promise<string[]> => {
        // If there are no excluded destinations, return all codes.
        if (!this.rootStore.layoutStore.destinationWithoutLivePrice.length) {
            return codes;
        }

        const destinations = await this.getDestinationsByCodes(codes, true);

        return destinations
            .filter(dest => this.rootStore.layoutStore.isLivePriceEnabledForDestination(dest.code, dest.parents || []))
            .map(dest => dest.code);
    };

    /**
     * Get the live price codes only for items that allowed to get prices.
     */
    getLivePriceCodesByCriteria = async (criteriaList: ILivePriceCriteria[]): Promise<string[]> => {
        if (!criteriaList.length) return [];

        const { isLivePriceEnabledForDestination, destinationWithoutLivePrice } = this.rootStore.layoutStore;

        // If there are no excluded destinations, no need to check criteria items.
        if (!destinationWithoutLivePrice.length) {
            return buildLivePriceCodes(criteriaList);
        }

        const destCodes = criteriaList.map(c => c.destinationCode);
        // Need to load full destinations info to check parents.
        const destinations = await this.getDestinationsByCodes(destCodes, true);

        const validCriteriaItems = criteriaList.reduce((validItems, item) => {
            const destParents = destinations.find(d => d.code === item.destinationCode)?.parents || [];

            // Check if live price is allowed for destination and its parents
            if (isLivePriceEnabledForDestination(item.destinationCode, destParents, item.relatedRegions)) {
                validItems.push({
                    ...item,
                    relatedRegions: (item.relatedRegions || []).filter(c => isLivePriceEnabledForDestination(c, [])),
                });
            }

            return validItems;
        }, [] as ILivePriceCriteria[]);

        return buildLivePriceCodes(validCriteriaItems);
    };

    getLivePrice = async (
        codes: string[],
        isCheckDestinations?: boolean,
        round: boolean = true,
        promo: boolean = false,
    ): Promise<ILivePrice[]> => {
        if (!codes.length) {
            return [];
        }

        let validatedCodes = codes;

        if (isCheckDestinations) {
            validatedCodes = await this.getDestinationsForLoadingLivePrice(validatedCodes);

            if (!validatedCodes.length) {
                return [];
            }
        }

        try {
            const result = await hotelsService.getLivePrice(validatedCodes.join(','), round, promo);

            return result;
        } catch (e) {
            logger.error({ e });

            return [];
        }
    };

    getDestinationsAvailability = async (to: string): Promise<Nullable<IDestinationAvailability>> => {
        try {
            return await hotelsService.getDestinationsAvailability(to);
        } catch (e) {
            return null;
        }
    };

    /**
     * Updates offers on search page, sets store's selectedOffer & selectedOffer
     * @param offerToUpdate
     * @param board
     * @param altBoards
     * @param newOfferUnits
     */
    @action updateOffersWithSelectedBoard = (
        offerToUpdate: IOfferWithoutAltBoards,
        board: IAltBoard,
        altBoards: IAltBoard[],
        newOfferUnits: IUnit[],
    ): void => {
        const newIsExt = board.isExt ?? offerToUpdate.accom.isExt;
        let updatedOffer: Nullable<IOffer> = {
            ...offerToUpdate,
            price: board.price ?? 0,
            pricePP: board.pricePP ?? 0,
            priceExcludingTouristTax: board.priceExcludingTouristTax,
            pricePPExcludingTouristTax: board.pricePPExcludingTouristTax,
            altBoards,
            accom: {
                ...offerToUpdate.accom,
                unit: newOfferUnits,
                isExt: newIsExt,
            },
        };

        if (board.accommodationId !== updatedOffer.accom.id && updatedOffer.altAcc) {
            updatedOffer = swapOfferAccommodations<IOffer>(
                updatedOffer,
                updatedOffer.altAcc,
                board.accommodationId,
                board.packageId,
            );
        }

        if (this.rootStore.bookingStore.selectedOffer) {
            this.rootStore.bookingStore.selectedOffer = updatedOffer;
            this.rootStore.bookingStore.alternativeBoards = altBoards;
        }

        this.offers = this.offers.map(offer => (offer.id === updatedOffer?.id ? updatedOffer : offer));
    };

    @action defaultLoadResults = (): void => {
        const { searchStore, layoutStore, routerStore, searchFiltersStore } = this.rootStore;

        searchStore.setSeachPerformWithNewParams(true);
        searchStore.setPageNumber(1);
        //simulate the initial render of the page
        searchStore.setPrevPageNumber(null);

        this.fetchOffers(true);

        searchFiltersStore.onChangeSearchFilterStore({ key: 'filtersChanged', value: true });

        if (layoutStore.isSearchResultsPage) {
            routerStore.updateSearchResultsPage();
        }
    };
}
