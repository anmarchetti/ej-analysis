import Axios, { CancelTokenSource } from 'axios';
import debounce from 'lodash/debounce';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { SIXTY } from 'code/commonNumbers';
import { logger } from 'frontend/services/logging';
import OffersService, { IFetchOffersArgs } from 'frontend/services/offers.service';
import { MAX_FLIGHT_DURATION, MIN_FLIGHT_DURATION } from 'frontend/store/base/search/BaseSearchFilterStore';
import { TRootStore } from 'frontend/store/IStores';
import { joinUniqueNonEmptyArrayValues } from 'frontend/utils/array.utils';
import {
    formatDateL10n,
    formatDateToQuery,
    isDateInCurrentMonth,
    isExpired,
    parseDateL10n,
} from 'frontend/utils/date.utils';
import { buildKeyBasedOnMarket } from 'frontend/utils/market.utils';
import { getPromoPackageThemesFilters } from 'frontend/utils/promoPage.utils';
import { isRecentSearchItemExpired, shallowCompareSearches } from 'frontend/utils/search/search.utils';
import { getWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IHotel } from 'models/data/IHotel';
import { IFetchOffersParams } from 'models/data/IOffer';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';
import { ISearchOffers } from 'models/data/ISearchOffers';
import { IGeoPoint, IPolyBounds } from 'models/data/map/IMap';
import { Bd4TravelListIdHolidays, Bd4TravelListIdTrade } from 'models/enum/Bd4TravelListId';
import { DataStatus } from 'models/enum/DataStatus';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import { DEPARTURE_ALL_CODE, GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import { SearchType } from 'models/enum/SearchType';
import SiteSettings from 'models/enum/SiteSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { getPolyQuery } from 'frontend/components/renderings/Map/utils/polyQuery';

interface IBaseOfferStore {
    activeOfferId: Nullable<string>;
    getSearchParamsFromLocalStorage: () => null | IPrefilledSearchParams;
    setActiveOfferId: (id: Nullable<string>) => void;
}

class BaseOffersStore implements IBaseOfferStore {
    @observable activeOfferId: Nullable<string>;
    @observable numberOfHotels: number = 0;

    @observable status: DataStatus = DataStatus.NotLoaded;

    @observable minPrice: number = 0;
    @observable maxPrice: number = 0;
    @observable minPricePp: number = 0;
    @observable maxPricePp: number = 0;

    // map points
    @observable hotels: Nullable<IGeoPoint[]>;

    private fetchHotelsCancelSource: Nullable<CancelTokenSource>;

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    @computed get originalGeography(): string {
        const {
            searchStore: {
                searchTo: { selectedDestinationCodesQuery },
            },
            queryParamsStore: { selectedDestinationCodesQueryFromUrl },
        } = this.rootStore;

        return selectedDestinationCodesQuery || selectedDestinationCodesQueryFromUrl || GEOGRAPHY_ALL_CODE;
    }

    @computed get geography(): string {
        const { destinationFiltersWithParents } = this.rootStore.searchFiltersStore;

        return destinationFiltersWithParents || this.originalGeography;
    }

    @action setActiveOfferId = (id: Nullable<string>): void => {
        this.activeOfferId = id;
    };

    @action setTotalHotels = (total: number): void => {
        this.numberOfHotels = total;
    };

    @computed get hasHotels(): boolean {
        return this.numberOfHotels > 0;
    }

    /** Get current market search params from LocalStorage  */
    getSearchParamsFromLocalStorage = (): null | IPrefilledSearchParams => {
        const { marketCode, isValidForMarketAirports } = this.rootStore.marketStore;
        const { isMonthSearchEnabled } = this.rootStore.layoutStore;
        const searchParamsKey = buildKeyBasedOnMarket(WebStorageKeys.SearchParams, marketCode);
        const searchParams = getWebStorageItem(searchParamsKey, true) as IPrefilledSearchParams;

        if (!searchParams) {
            return null;
        }

        const { startDate, durations, departure, dest, rooms, isMonthSearch } = searchParams;

        if (!startDate || !durations || !departure || !dest || !rooms) {
            return null;
        }

        const departureAirports = departure.split(',');

        const parsedStartDate = parseDateL10n(startDate);
        const isDateOfCurrentMonth = parsedStartDate && isDateInCurrentMonth(parsedStartDate);

        const isSearchParamsValid =
            isValidForMarketAirports(departureAirports) && // check if departure airport valid for market (can be not when user change lang manually in url)
            (!isMonthSearch || isMonthSearchEnabled) && //validate that month search is enabled when searching by month
            (!isExpired(startDate) || (isMonthSearch && isDateOfCurrentMonth)); // searches from the past should not be prefilled

        return isSearchParamsValid ? searchParams : null;
    };

    getFetchOfferParamsForPromoPage = (withoutDestinationFilters?: boolean): Partial<IFetchOffersArgs> => {
        const { searchFiltersStore, layoutStore, promoPageStore } = this.rootStore;

        const destFilters = withoutDestinationFilters
            ? promoPageStore.geographyFromUrl
            : (searchFiltersStore.destinationFiltersWithParents || promoPageStore.geographyFromUrl) ??
              promoPageStore.editorGeographyQuery;

        const params: Partial<IFetchOffersArgs> = {
            themes: getPromoPackageThemesFilters(
                searchFiltersStore.themeFilters?.split(',') || [],
                promoPageStore.pageThemeTypeCodes,
            ).join(','),
            hotelTypes: joinUniqueNonEmptyArrayValues(
                searchFiltersStore.hotelTypesFilters?.split(',') || [],
                promoPageStore.hotelTypes,
            ),
            initialThemes: promoPageStore.pageThemeTypeCodes?.join(','),
            destination: destFilters ?? '',
            initialPricePPFrom: promoPageStore.minPricePP,
            initialPricePPTo: promoPageStore.maxPricePP,
            initialTotalPriceFrom: promoPageStore.minTotalPrice,
            initialTotalPriceTo: promoPageStore.maxTotalPrice,
            isPromoPage: true,
            promc: joinUniqueNonEmptyArrayValues(
                searchFiltersStore.promoCollectionFilters?.split(',') || [],
                promoPageStore.promoCollections,
            ),
        };

        if (!layoutStore.isDynamicPromoPage || !promoPageStore.editorGeographyQuery) {
            params.promoPageId = layoutStore.layoutId;
        }

        return params;
    };

    getFetchOfferParams = (withoutDestinationFilters?: boolean) => {
        const { searchFiltersStore } = this.rootStore;

        return {
            themes: searchFiltersStore.themeFilters || undefined,
            hotelTypes: searchFiltersStore.hotelTypesFilters || undefined,
            promc: searchFiltersStore.promoCollectionFilters || undefined,
            destination: withoutDestinationFilters ? '' : searchFiltersStore.destinationFiltersWithParents,
            isPromoPage: false,
        };
    };

    fetchOffersWithParamsBase = (
        placementId: Bd4TravelListIdHolidays | Bd4TravelListIdTrade,
        destinations: Nullable<string[]>,
        flightDurationFrom: number | undefined,
        {
            startDate,
            durations,
            departure,
            destinationCodesQuery,
            rooms,
            page,
            withoutDestinationFilters,
            cancelSource,
            endDate,
            offers,
            searchType,
            isMonthSearch,
        }: IFetchOffersParams,
    ): Promise<ISearchOffers> => {
        const { searchStore, searchFiltersStore, layoutStore, appStore } = this.rootStore;
        const { isPromoPage, pageFields, pageName } = layoutStore;
        // TO DO need to investigate, as DiscountOnly is boolean
        const discountOnly = pageFields?.DiscountOnly?.value && pageFields?.DiscountOnly?.value == '1';

        const distressedFlightsOnly: boolean = layoutStore.isApplySpecialFilter(SiteSettings.ShowSuperDeals, pageName);

        const origins =
            searchStore.isOldParamSet && searchStore.oldOrigins
                ? searchStore.oldOrigins.join(',')
                : (searchStore.searchFrom.origins || []).join(',') || DEPARTURE_ALL_CODE;

        const additionalParams = isPromoPage
            ? this.getFetchOfferParamsForPromoPage(withoutDestinationFilters)
            : this.getFetchOfferParams(withoutDestinationFilters);

        return OffersService.fetchOffers({
            ...additionalParams,
            startDate,
            flexDays: searchStore.searchWhen.flexDays,
            duration: durations,
            dep: departure,
            geog: destinationCodesQuery,
            autoAllocation: searchStore.searchWho.isAutoAllocation,
            rooms,
            take: searchStore.take,
            page,
            orderBy: searchStore.orderBy === OrderBy.Recommended ? undefined : searchStore.orderBy,
            orderDirection:
                searchStore.orderDirection === OrderDirection.Default ? undefined : searchStore.orderDirection,
            boardType: searchFiltersStore.boardTypeFilters,
            facilities: searchFiltersStore.facilitiesFilters,
            flights: searchFiltersStore.flightsFilters ? origins : undefined,
            starRating: searchFiltersStore.starRatingFilters,
            tripAdvisorRating: searchFiltersStore.tripAdvisorRatingFilters,
            accomCodes: searchStore.searchTo.selectedAccommodationCodes,
            polyQuery: undefined,
            cancelSource,
            endDate,
            offers: offers,
            priceFrom: searchFiltersStore.filterPriceFrom,
            priceTo: searchFiltersStore.filterPriceTo,
            isPricePP: searchFiltersStore.isPriceFilterPerPerson,
            searchType,
            distressedFlightsOnly,
            minDisc: pageFields?.DiscountAmountMin?.value,
            maxDisc: pageFields?.DiscountAmountMax?.value,
            minDiscP: pageFields?.DiscountPercentsMin?.value,
            maxDiscP: pageFields?.DiscountPercentsMax?.value,
            discountOnly,
            placementId,
            inboundTimeSlots: searchFiltersStore.inboundDepartureTimeFilters || undefined,
            outboundTimeSlots: searchFiltersStore.outboundDepartureTimeFilters || undefined,
            inboundFlightNumber: searchFiltersStore.inboundFlightNumber,
            outboundFlightNumber: searchFiltersStore.outboundFlightNumber,
            destinations,
            flightDurationFrom,
            flightDurationTo:
                searchFiltersStore.flightDurationTo === MAX_FLIGHT_DURATION
                    ? undefined
                    : searchFiltersStore.flightDurationTo * SIXTY,
            mintemp: searchFiltersStore.weatherFrom,
            maxtemp: searchFiltersStore.weatherTo,
            isMonthSearch,
            deviceType: appStore.deviceType,
        });
    };

    fetchMapItem = async (id: string): Promise<ISearchOffers | IHotel> => {
        const { searchStore, searchFiltersStore, bookingStore, layoutStore, appStore } = this.rootStore;

        if (layoutStore.isDestinationPage) return OffersService.loadHotelInfo(id);

        const { isMonthSearch, selectedNumberOfNights, from, to } = searchStore.searchWhen;

        const duration = bookingStore.numberOfNightsFromOffer.toString() || selectedNumberOfNights.toString();
        const departure = bookingStore.origins.join(',') || DEPARTURE_ALL_CODE;

        let endDate: Date | undefined;
        let flexDays: number = bookingStore.flexDays;

        if (isMonthSearch) {
            endDate = bookingStore.to || to || undefined;
            flexDays = 0;
        }

        const baseParams = {
            accomCodes: id,
            endDate,
            flexDays,
            autoAllocation: bookingStore.isAutoAllocation,
            searchType: SearchType.Normal,
            take: 1,
            rooms: bookingStore.createRoomAllocation(),
            geog: DEPARTURE_ALL_CODE,
            isMonthSearch,
        };

        if (layoutStore.isHotelDetailsBookPage) {
            baseParams.endDate = undefined;

            return OffersService.fetchOffers({
                ...baseParams,
                startDate: new Date(bookingStore.selectedOffer?.date || from!),
                dep: departure,
                duration: [duration],
                deviceType: appStore.deviceType,
            });
        }

        return OffersService.fetchOffers({
            ...baseParams,
            startDate: (bookingStore.from || from) as Date,
            duration: [searchFiltersStore.durationFilters?.toString() || duration],
            dep: searchFiltersStore.flightsFilters ?? departure,
            distressedFlightsOnly: layoutStore.isApplySpecialFilter(SiteSettings.ShowSuperDeals, layoutStore.pageName),
            promc: searchFiltersStore.promoCollectionFilters,
            hotelTypes: searchFiltersStore.hotelTypesFilters || undefined,
            boardType: searchFiltersStore.boardTypeFilters,
            isPricePP: searchFiltersStore.isPriceFilterPerPerson,
            tripAdvisorRating: searchFiltersStore.tripAdvisorRatingFilters,
            starRating: searchFiltersStore.starRatingFilters,
            facilities: searchFiltersStore.facilitiesFilters,
            priceFrom: searchFiltersStore.filterPriceFrom,
            priceTo: searchFiltersStore.filterPriceTo,
            deviceType: appStore.deviceType,
            inboundTimeSlots: searchFiltersStore.inboundDepartureTimeFilters || undefined,
            outboundTimeSlots: searchFiltersStore.outboundDepartureTimeFilters || undefined,
            offers: searchFiltersStore.offersFilters?.join(','),
            flightDurationFrom:
                searchFiltersStore.flightDurationFrom === MIN_FLIGHT_DURATION
                    ? undefined
                    : searchFiltersStore.flightDurationFrom * SIXTY,
            flightDurationTo:
                searchFiltersStore.flightDurationTo === MAX_FLIGHT_DURATION
                    ? undefined
                    : searchFiltersStore.flightDurationTo * SIXTY,
            mintemp: searchFiltersStore.weatherFrom,
            maxtemp: searchFiltersStore.weatherTo,
        });
    };

    /**
     * Save current search params in LocalStorage
     * (used for prefilling the search pod the next time a user visits the site)
     */
    savePrefillParams = (params: IPrefilledSearchParams): void => {
        // Searches should be saved by market, as departure airports and destinations are relevant only for specific market.
        const { marketCode } = this.rootStore.marketStore;
        const searchParamsKey = buildKeyBasedOnMarket(WebStorageKeys.SearchParams, marketCode);
        const recentSearchesKey = buildKeyBasedOnMarket(WebStorageKeys.RecentSearches, marketCode);

        // Get saved recent searches
        let recentSearches = getWebStorageItem(recentSearchesKey, true) || [];

        const expirationMonthsCount = this.rootStore.layoutStore.getSettingAsNumber(
            SiteSettings.RecentSearchesExpirationMonths,
        );
        // Remove expired ones and search equal to the current params
        recentSearches = recentSearches.filter(
            item => !isRecentSearchItemExpired(item, expirationMonthsCount) && !shallowCompareSearches(item, params),
        );

        // Add current params to the beginning of recent searches
        recentSearches.unshift({ ...params, createdAt: formatDateL10n(new Date()) });

        // Save search params and resent searches in LocalStorage
        setWebStorageItem(searchParamsKey, params);

        const maxAmount = this.rootStore.layoutStore.getSettingAsNumber(SiteSettings.RecentSearchesMaxAmount);
        setWebStorageItem(recentSearchesKey, recentSearches.slice(0, maxAmount));
    };

    @action
    updateOffersDataStatus = (status: DataStatus) => {
        this.status = status;
    };

    @action
    setPrices = (minPrice: number, maxPrice: number, minPricePp: number, maxPricePp: number) => {
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;

        this.minPricePp = minPricePp;
        this.maxPricePp = maxPricePp;
    };

    // Map component
    // ===================

    @action cleanUpHotels = (): void => {
        this.hotels = null;
    };

    onCameraChanged = debounce(({ detail }) => {
        const polyBounds = {
            lt1: detail.bounds.north, // max lat
            ln1: detail.bounds.east, // max lng
            lt2: detail.bounds.south, // min lat
            ln2: detail.bounds.west, // min lng
        };

        this.getPolygonHotels(polyBounds);
    }, 500);

    @action getPolygonHotels = async (polygon: IPolyBounds): Promise<void> => {
        const { searchStore, searchFiltersStore, bookingStore } = this.rootStore;
        const { searchFrom, searchWhen, isAllSearchParametersSelected } = searchStore;

        if (!isAllSearchParametersSelected) return;

        // cancel previous request if there is one
        if (this.fetchHotelsCancelSource) {
            this.fetchHotelsCancelSource.cancel();
            this.fetchHotelsCancelSource = null;
        }

        try {
            this.fetchHotelsCancelSource = Axios.CancelToken.source();

            const data = await OffersService.fetchPolygonHotels(
                {
                    startDate: formatDateToQuery(new Date(bookingStore.selectedOffer?.date || searchWhen.from!)),
                    flexibleDays: searchWhen.isMonthSearch ? 0 : searchWhen.flexDays,
                    duration: bookingStore.numberOfNightsFromOffer || searchWhen.selectedNumberOfNights,
                    departure: bookingStore.origins.join(',') || searchFrom.origins?.join(','),
                    departureAirport: searchFiltersStore.flightsFilters || '',
                    geography: GEOGRAPHY_ALL_CODE,
                    rooms: bookingStore.createRoomAllocation(),
                    polygon: polygon && getPolyQuery(polygon),
                },

                this.fetchHotelsCancelSource,
            );

            runInAction(() => {
                if (data) {
                    this.hotels = data.features;
                } else {
                    this.cleanUpHotels();
                }
            });
        } catch (e) {
            logger.error({ e });
        }
    };

    @action getFilteredHotels = async (): Promise<void> => {
        const { searchStore, searchFiltersStore, bookingStore } = this.rootStore;

        if (!searchStore.isAllSearchParametersSelected) return;

        this.updateOffersDataStatus(DataStatus.Loading);

        // cancel previous request if there is one
        if (this.fetchHotelsCancelSource) {
            this.fetchHotelsCancelSource.cancel();
            this.fetchHotelsCancelSource = null;
        }

        try {
            this.fetchHotelsCancelSource = Axios.CancelToken.source();

            const { isMonthSearch, from, to, flexDays, selectedNumberOfNights } = searchStore.searchWhen;

            const startDate = formatDateToQuery(bookingStore.from || from);

            const origins = bookingStore.origins.join(',') || searchStore.searchFrom.origins?.join(',');
            const departure = searchFiltersStore.flightsFilters || origins;

            const duration =
                (searchFiltersStore.durationFilters?.length && searchFiltersStore.durationFilters) ||
                bookingStore.numberOfNightsFromOffer ||
                selectedNumberOfNights;

            const rooms = searchStore.searchWho.roomsAllocation.map(el => ({
                adults: el.adults.length,
                children: el.children.length,
                infants: el.infants.length,
                roomCode: '', // should be empty on initial search
                childrenAges: el.children.map(c => c.age),
            }));

            const flightDurationFrom =
                searchFiltersStore.flightDurationFrom === MIN_FLIGHT_DURATION
                    ? undefined
                    : searchFiltersStore.flightDurationFrom * 60;

            const flightDurationTo =
                searchFiltersStore.flightDurationTo === MAX_FLIGHT_DURATION
                    ? undefined
                    : searchFiltersStore.flightDurationTo * 60;

            const boardType =
                searchFiltersStore.boardTypeFilters && encodeURIComponent(searchFiltersStore.boardTypeFilters);

            const offers = searchFiltersStore.offersFilters?.join(',');

            const data = await OffersService.fetchFilteredHotels(
                {
                    startDate,
                    endDate: isMonthSearch ? formatDateToQuery(bookingStore.to || to || undefined) : undefined,
                    departure,
                    departureAirport: origins,
                    duration,
                    geography: this.geography,
                    originalGeography: this.originalGeography,
                    rooms,
                    flexibleDays: isMonthSearch ? 0 : flexDays,
                    tripAdvisorRating: searchFiltersStore.tripAdvisorRatingFilters,
                    starRating: searchFiltersStore.starRatingFilters,
                    accomCodes: searchStore.searchTo.selectedAccommodationCodes,
                    flightDurationFrom,
                    flightDurationTo,
                    PriceFrom: searchFiltersStore.filterPriceFrom,
                    PriceTo: searchFiltersStore.filterPriceTo,
                    boardType,
                    facilities: searchFiltersStore.facilitiesFilters,
                    offers,
                    hotelTypes: searchFiltersStore.hotelTypesFilters,
                    outboundTimeSlots: searchFiltersStore.outboundDepartureTimeFilters,
                    inboundTimeSlots: searchFiltersStore.inboundDepartureTimeFilters,
                    isPricePP: searchFiltersStore.isPriceFilterPerPerson,
                    automaticAllocation: searchStore.searchWho.isAutoAllocation,
                    mintemp: searchFiltersStore.weatherFrom,
                    maxtemp: searchFiltersStore.weatherTo,
                    promc: searchFiltersStore.promoCollectionFilters,
                    isMonthSearch,
                },

                this.fetchHotelsCancelSource,
            );

            runInAction(() => {
                if (data) {
                    this.setTotalHotels(data.status.total);
                    this.setPrices(
                        data.status?.minPrice,
                        data.status?.maxPrice,
                        data.status?.minPricePP,
                        data.status?.maxPricePP,
                    );

                    searchFiltersStore.saveFilters(data.filters || []);

                    this.hotels = data.geoOffers.features;
                } else {
                    this.cleanUpHotels();
                }

                this.updateOffersDataStatus(DataStatus.Loaded);
            });
        } catch (e) {
            logger.error({ e });
        }
    };
    // ===================
}

export default BaseOffersStore;
