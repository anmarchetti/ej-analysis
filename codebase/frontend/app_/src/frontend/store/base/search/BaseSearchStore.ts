import { trackingApi } from '@sitecore-jss/sitecore-jss-nextjs';
import dayjs from 'dayjs';
import { parse } from 'flatted';
import { action, computed, observable, runInAction, toJS, when } from 'mobx';

import { TWO } from 'code/commonNumbers';
import { notificationsUrls } from 'code/endpoints';
import { trackingApiOptions, TrackingGoals } from 'code/tracking.config';
import notificationsService from 'frontend/services/notifications.service';
import offersService from 'frontend/services/offers.service';
import { BaseQueryParamsGetters } from 'frontend/store/base';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { haveSameElements } from 'frontend/utils/array.utils';
import { formatDateL10n, isValidDate, parseDateL10n } from 'frontend/utils/date.utils';
import {
    getDestinationOrChildrenByCode,
    getIDestinationByCode,
    removeRelatedRegions,
} from 'frontend/utils/destinations.utils';
import isBackend from 'frontend/utils/isBackend';
import { getDefaultContractCode, getParentDestination } from 'frontend/utils/offer.utils';
import {
    getParentVirtualCountry,
    getRoomAllocationFromQueryRoom,
    getSortItemBySitecoreConfig,
    getVirtualRegionDestinationData,
    isSelectionValid,
    isSingleHotelSearch,
} from 'frontend/utils/search/search.utils';
import { getChangedQueryParamNames } from 'frontend/utils/url.utils';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';
import { ISearchBarErrorMessage } from 'models/data/ISearchBarErrorMessage';
import { MarketCode } from 'models/data/MarketSettings';
import { SearchPodValidationFields } from 'models/data/tracking/SearchPodEvent';
import { DestinationType } from 'models/enum/DestinationType';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import { QueryParamName } from 'models/enum/QueryParamName';
import { DEPARTURE_ALL_CODE, GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { RoomAllocation } from 'models/RoomAllocation';
import { destructRoom } from 'models/RoomAllocation.utils';
import { IAirportCountry } from 'models/sitecore/IAirportsData';
import { ISortOrderItem } from 'models/sitecore/ISortOrderItem';
import { ISortConfig } from 'frontend/components/renderings/SearchResults/sort.config';

import { ISearchFromInitialState, ISearchFromStore, SearchFromStore } from './SearchFromStore';
import { ISearchToInitialState, ISearchToStore, SearchToStore } from './SearchToStore';
import { ISearchWhenInitialState, ISearchWhenStore, SearchWhenStore } from './SearchWhenStore';
import { ISearchWhoInitialState, ISearchWhoStore, SearchWhoStore } from './SearchWhoStore';

export interface ISortItem extends ISortConfig {
    title: string;
}

export interface ISearchStoreInitialState {
    searchFrom: ISearchFromInitialState;
    searchTo: ISearchToInitialState;
    searchWhen: ISearchWhenInitialState;
    searchWho: ISearchWhoInitialState;
    orderBy?: OrderBy;
    orderDirection?: OrderDirection;
    page?: number;
    sortConfig?: ISortItem[];
    take?: number;
}

const CHEAPEST_MONTH_SEARCH_DURATION_DEFAULT = 7;

export abstract class BaseSearchStore implements ISssrStore<ISearchStoreInitialState> {
    public searchFrom: ISearchFromStore;
    public searchTo: ISearchToStore;
    public searchWhen: ISearchWhenStore;
    public searchWho: ISearchWhoStore;

    public selectedOfferIndex: number = -1;
    public isSingleSelectableDestination: boolean = false;

    public originsWithNames: IDestinationCountry[] = [];

    @observable public take: number;
    @observable public page: number;
    @observable public prevPage: Nullable<number> = null;
    @observable public orderBy: OrderBy;
    @observable public orderDirection: OrderDirection;
    @observable public errorMessages: ISearchBarErrorMessage | null = null; // TO DO should be renamed to singular

    @observable isSearchPodExpanded: boolean = false;

    @observable isOldParamSet: Nullable<boolean>;
    @observable oldOrigins: Nullable<string[]>;
    @observable oldSelectedDestinations: Nullable<IDestination[]>;
    @observable oldFrom: Nullable<Date>;
    @observable oldTo: Nullable<Date>;
    @observable oldIsFlexible: number;
    @observable oldIsMonthSearch: boolean;
    @observable oldMonthSearchDuration: number;
    @observable oldRooms: RoomAllocation[] = [];
    @observable oldIsAutoAllocation: boolean;
    @observable isNeedOpenWhenField: boolean = false;
    @observable isNeedOpenWhoField: boolean = false;
    @observable isSeachPerformWithNewParams: boolean = false;
    @observable sortConfig: ISortItem[] = [];

    /** variable to indicate that search pod has just been prefilled, so some components should re-render */
    @observable hasPrefilledSearchPod: boolean = false;

    @observable isSelectedPackageFromMap: boolean = false;

    abstract setCountriesWithRegions: (destinations: IDestinationCountry[]) => void;

    constructor(public rootStore: TRootStore) {
        // splitting base-store into sub-stores, the main idea is having a separate small store for each field (from, to, when, who)
        this.searchFrom = new SearchFromStore(rootStore);
        this.searchTo = new SearchToStore(rootStore);
        this.searchWhen = new SearchWhenStore(rootStore);
        this.searchWho = new SearchWhoStore(rootStore);
    }

    @computed get filteredDestinations(): Nullable<IDestination[]> {
        const destinations = [...this.searchTo.selectedDestinations];

        if (this.searchTo.isAnywhereSelected) return null;

        return removeRelatedRegions(destinations);
    }

    @computed get selectedDestinationsQuery(): Nullable<string[]> {
        if (!this.filteredDestinations) return null;

        return this.filteredDestinations.map(d => `${d.type?.toLowerCase()}:${d.code}`);
    }

    serialize = (): ISearchStoreInitialState => ({
        take: this.take,
        page: this.page,
        orderBy: this.orderBy,
        orderDirection: this.orderDirection,
        sortConfig: toJS(this.sortConfig),
        searchFrom: this.searchFrom.serialize(),
        searchTo: this.searchTo.serialize(),
        searchWhen: this.searchWhen.serialize(),
        searchWho: this.searchWho.serialize(),
    });

    deserialize = (initialState?: ISearchStoreInitialState): void => {
        if (!initialState) {
            return;
        }

        this.take = initialState.take ?? this.rootStore.layoutStore.numberOfResultsPerPage;
        this.page = initialState.page ?? 1;
        this.orderBy = initialState.orderBy || OrderBy.Recommended;
        this.orderDirection = initialState.orderDirection || OrderDirection.Default;

        this.sortConfig = initialState.sortConfig || [];

        if (initialState.searchFrom) {
            this.searchFrom.deserialize(initialState.searchFrom);
        }

        if (initialState.searchTo) {
            this.searchTo.deserialize(initialState.searchTo);
        }

        if (initialState.searchWhen) {
            this.searchWhen.deserialize(initialState.searchWhen);
        }

        if (initialState.searchWho) {
            this.searchWho.deserialize(initialState.searchWho);
        }
    };

    @action setSeachPerformWithNewParams = (state: boolean): void => {
        this.isSeachPerformWithNewParams = state;
    };

    @action public clearSortDropdown = (): void => {
        this.orderBy = this.sortConfig?.[0]?.orderBy || OrderBy.Recommended;
        this.orderDirection = this.sortConfig?.[0]?.orderDirection || OrderDirection.Default;
    };

    @action public getValuesFromQueryParamsStore = (forceQuery: boolean = false): void => {
        //searchFrom store
        this.updateOriginsFromQueryParamsStore(forceQuery);

        //searchTo store
        this.updateDestinationCodesFromQueryParamsStore(forceQuery);
        this.updateAccommodationCodesFromQueryParamsStore(forceQuery);

        //searchWhen store
        this.updateSearchDateParamsFromQueryParamsStore(forceQuery);

        this.searchWho.updateRoomsAllocationFromQueryParamsStore(forceQuery);

        this.updatePaginationFromQueryParamsStore(forceQuery);
        this.updateSortingFromQueryParamsStore();
    };

    @action private readonly updateOriginsFromQueryParamsStore = (forceQuery: boolean): void => {
        const { originFromUrl } = this.rootStore.queryParamsStore;

        this.searchFrom.setNormalOrigins(
            (!forceQuery && this.searchFrom.origins?.length && this.searchFrom.origins) || originFromUrl || [],
        );
    };

    @action private readonly updateDestinationCodesFromQueryParamsStore = (forceQuery: boolean): void => {
        const { selectedDestinationCodesFromUrl, selectedDestinationCodesQueryFromUrl } =
            this.rootStore.queryParamsStore;

        this.searchTo.setSelectedDestinationCodes(
            (!forceQuery && this.searchTo.selectedDestinationCodes?.length && this.searchTo.selectedDestinationCodes) ||
                selectedDestinationCodesFromUrl ||
                [],
        );
        this.searchTo.selectedDestinationCodesQuery =
            (!forceQuery && this.searchTo.selectedDestinationCodesQuery) || selectedDestinationCodesQueryFromUrl || '';

        this.searchTo.selectedParentDestinationCodesQuery = getParentDestination(
            this.searchTo.selectedDestinationCodesQuery,
        );
    };

    @action private readonly updateAccommodationCodesFromQueryParamsStore = (forceQuery: boolean): void => {
        const { selectedAccommodationCodesFromUrl, isPromotingIframe, accommodationIdFromUrl } =
            this.rootStore.queryParamsStore;

        this.searchTo.setSelectedAccommodationCodes(
            (!forceQuery && this.searchTo.selectedAccommodationCodes) ||
                selectedAccommodationCodesFromUrl ||
                (isPromotingIframe() && accommodationIdFromUrl) ||
                '',
        );
    };

    @action private readonly updateSearchDateParamsFromQueryParamsStore = (forceQuery: boolean): void => {
        const { fromDateFromUrl, toDateFromUrl, flexDaysFromUrl, monthSearchDurationFromUrl, isMonthSearchFromUrl } =
            this.rootStore.queryParamsStore;

        if (!this.rootStore.layoutStore.isMonthSearchEnabled && isMonthSearchFromUrl) {
            this.rootStore.routerStore.redirectToHomePage();

            return;
        }

        const fromValue = (!forceQuery && this.searchWhen.from) || fromDateFromUrl || null;
        this.searchWhen.from = fromValue;

        const toValue = (!forceQuery && this.searchWhen.to) || toDateFromUrl || null;
        this.searchWhen.to = toValue;

        const flexDaysValue = (!forceQuery && this.searchWhen.flexDays) || flexDaysFromUrl;
        this.searchWhen.flexDays = flexDaysValue;

        const monthSearchDuration = (!forceQuery && this.searchWhen.monthSearchDuration) || monthSearchDurationFromUrl;
        this.searchWhen.setMonthSearchDuration(monthSearchDuration);

        const isMonthSearch = (!forceQuery && this.searchWhen.isMonthSearch) || isMonthSearchFromUrl;
        this.searchWhen.setIsMonthSearch(isMonthSearch);
    };

    @action private readonly updatePaginationFromQueryParamsStore = (forceQuery: boolean): void => {
        const { pageNumberFromUrl, itemsPerPageFromUrl } = this.rootStore.queryParamsStore;

        this.page = (!forceQuery && this.page) || pageNumberFromUrl;
        this.take = (!forceQuery && this.take) || itemsPerPageFromUrl;
    };

    @action private readonly updateSortingFromQueryParamsStore = (): void => {
        const { orderByFromUrl, orderDirectionFromUrl } = this.rootStore.queryParamsStore;
        const sortItem: ISortItem = this.sortConfig?.[0];

        // order from url takes precedence for correct work of back button
        this.orderBy = (orderByFromUrl ? (orderByFromUrl as OrderBy) : this.orderBy) || sortItem?.orderBy || '';
        this.orderDirection =
            (orderDirectionFromUrl ? (orderDirectionFromUrl as OrderDirection) : this.orderDirection) ||
            sortItem?.orderDirection ||
            '';
    };

    @computed get isAllSearchParametersSelected(): boolean {
        if (this.rootStore.layoutStore.isPromoPage) {
            return true;
        }

        return (
            (this.searchFrom.origins || []).length > 0 &&
            ((this.searchTo.selectedDestinationCodes && !!this.searchTo.selectedDestinationCodes.length) ||
                !!this.searchTo.selectedAccommodationCodes ||
                !!this.rootStore.queryParamsStore.selectedDestinationCodesFromUrl?.length) &&
            !!this.searchWhen.from &&
            !!this.searchWhen.to
        );
    }

    @computed get isAnySearchParametersSelected(): boolean {
        if (this.rootStore.layoutStore.isPromoPage) {
            return true;
        }

        return (
            (!!this.searchFrom.origins && this.searchFrom.origins.length > 0) ||
            (this.searchTo.selectedDestinationCodes && !!this.searchTo.selectedDestinationCodes.length) ||
            !!this.searchTo.selectedAccommodationCodes ||
            !!this.searchWhen.from ||
            !!this.searchWhen.to
        );
    }

    // resorts in virtual country (the should be treated as regions)
    @computed get resortsInVirtual(): string[] {
        if (!this.searchTo.countriesWithRegions) {
            return [];
        }

        const resorts: string[] = [];

        this.searchTo.countriesWithRegions
            .filter(c => c.type === DestinationType.VirtualCountry)
            .forEach(c => {
                resorts.push(...(c.children || []).map(child => child.code));
            });

        return resorts;
    }

    /**
     * Special Filters
     */
    @action public setSpecialFilters = (specialFilter: string, value: boolean): void => {
        this[specialFilter] = value;
    };

    @computed get anywhereWord(): string {
        return this.rootStore.layoutStore.getPhrase(SitecoreDictionary.SearchPodLabelsAnywhere) || 'Anywhere';
    }

    @computed get isHotelBookSelectedDestination(): boolean {
        const hotelCode = this.rootStore.bookingStore.selectedOffer?.accom?.id;

        return !!hotelCode && this.searchTo.selectedDestinations.some(dst => dst.code === hotelCode);
    }

    @action setSortConfig = (sortOrder: ISortOrderItem[]): void => {
        this.sortConfig = (sortOrder || [])
            .map(s => {
                const configItem = getSortItemBySitecoreConfig(s);

                if (!configItem) {
                    return null;
                }

                return {
                    ...configItem,
                    title: s.fields?.Title?.value ?? '',
                };
            })
            .filter(s => !!s) as ISortItem[];
    };

    @action setSelectedOfferIndex = (index: number): void => {
        this.selectedOfferIndex = index;
    };

    @action originsUpdated = async (): Promise<void> => {
        //cos position of calendar will be reset on reopen
        this.searchWhen.resetDateAvailabilityInterval();

        this.searchTo.typeAheadDestinations = null;

        this.searchFrom.updateOriginsDisplayValue();
        this.searchTo.updateAvailableDstCodes();

        this.searchWhen.updateAvailableDates(true);
    };

    /** Set current booking hotel as selected destination */
    @action selectHotelBookAsDestination = (): void => {
        const selectedOffer = this.rootStore.bookingStore.selectedOffer;

        if (selectedOffer?.accom) {
            this.searchTo.selectSingleDestination({
                code: selectedOffer.accom.id,
                name: selectedOffer.hotel?.name || '',
                type: DestinationType.Hotel,
            });
        }
    };

    getSelectedVirtualResortRelatedResorts = async (): Promise<IDestination[]> => {
        const virtualResortWithRelatedResorts = this.searchTo.selectedDestinations.find(
            destination => destination.type === DestinationType.VirtualResort && !!destination.relatedResorts?.length,
        );

        if (!virtualResortWithRelatedResorts) {
            return [];
        }

        return offersService.fetchDestinationsByCodes(virtualResortWithRelatedResorts.relatedResorts ?? [], true);
    };

    /**
     * Add additional regions to select
     * returns unavailable regions, that should be added to search (but not selected)
     */
    @action manageVirtualRegions = (): IDestination[] | void => {
        const allRegions = (this.searchTo.countriesWithRegions || []).reduce((res, c) => {
            const children = toJS(c.children || []);
            children.forEach(child => (child.parents = [c]));

            return res.concat(children);
        }, [] as IDestination[]);

        /** get virtual regions to select if all related regions was selected before */
        const relatedRegions = allRegions
            .filter(x => x.type === DestinationType.VirtualRegion || x.type === DestinationType.VirtualCountry)
            .filter(x => {
                const relatedCount = (x.relatedRegions || []).length;
                let selectedCount = 0;
                let disabledCount = 0;

                (x.relatedRegions || []).forEach(code => {
                    if (!this.searchTo.isDestinationAvailable(code)) {
                        disabledCount++;
                    } else if (this.searchTo.selectedDestinations.some(d => d.code === code)) {
                        selectedCount++;
                    }
                });

                // should not select virtual region if zero or one region selected (http://jra.europe.easyjet.local/browse/EJH-9473)
                if (selectedCount <= 1) {
                    return false;
                }

                // if all regions either selected or disabled then select virtual if it's not already selected
                if (selectedCount + disabledCount === relatedCount) {
                    return !this.searchTo.selectedDestinations.some(d => d.code === x.code);
                }

                return false;
            });

        this.searchTo.setSelectedDestinations([...this.searchTo.selectedDestinations.concat(relatedRegions)]);

        if (this.searchTo.selectedDestinations.some(x => x.type === DestinationType.VirtualRegion)) {
            /** Add related regions which was not added */
            const virtualRegions = this.searchTo.selectedDestinations.reduce((res, x) => {
                if (
                    (x.type === DestinationType.VirtualRegion || x.type === DestinationType.VirtualCountry) &&
                    x.relatedRegions?.length
                ) {
                    const regionsToAdd = (x.relatedRegions || []).filter(
                        y => !this.searchTo.selectedDestinations.find(d => d.code === y),
                    );
                    res = res.concat(regionsToAdd);
                }

                return res;
            }, [] as string[]);

            if (virtualRegions.length) {
                const allVirtualRelated = virtualRegions.map(x => allRegions.find(y => y.code === x));

                // available related regions, should be added to selected destinations anyway
                const regionsToAdd = allVirtualRelated.filter(
                    x => !!x && this.searchTo.isDestinationAvailable(x.code),
                ) as IDestination[];

                // related, but unavailable regions, should be appeared as selected, but we should search for them anyway for correct filters work
                const regionsToNotAddButSearch = allVirtualRelated.filter(
                    x => !!x && !this.searchTo.isDestinationAvailable(x.code),
                ) as IDestination[];

                this.searchTo.setSelectedDestinations(this.searchTo.selectedDestinations.concat(regionsToAdd));

                return regionsToNotAddButSearch;
            }
        }

        return undefined;
    };

    // Retrieve search params if search was not executed
    @action retreiveSearchParameters = (isBackToSearch: boolean = false): void => {
        if (this.rootStore.layoutStore.isPromoPage) {
            const promopageLocalStorageItem = getWebStorageItem(WebStorageKeys.Promopage, false);

            // prefill search params from localstorage
            if (promopageLocalStorageItem !== undefined && typeof promopageLocalStorageItem !== 'object') {
                const { searchStore } = parse(promopageLocalStorageItem);

                this.deserialize(searchStore);
            } else {
                // prefill search params from sitecore
                this.rootStore.promoPageStore.prefillSearchParameters();
            }
        } else {
            // for other pages retreive search params from URL
            if (
                !(
                    isBackToSearch &&
                    !!this.rootStore.bookingStore.flexDays &&
                    this.searchWhen.from &&
                    this.searchWhen.to
                )
            ) {
                const { fromDateFromUrl, toDateFromUrl } = this.rootStore.queryParamsStore;

                this.searchWhen.from = fromDateFromUrl || null;
                this.searchWhen.to = toDateFromUrl || null;
            }

            this.searchFrom.setNormalOrigins(this.rootStore.queryParamsStore.originFromUrl);
            this.searchTo.selectedDestinationCodesQuery =
                this.rootStore.queryParamsStore.selectedDestinationCodesQueryFromUrl;
            this.searchTo.setSelectedDestinationCodes(
                this.rootStore.queryParamsStore.selectedDestinationCodesFromUrl || [],
            );
        }
    };

    /**
     * Pagination
     */
    @action setPageNumber = (page: number): void => {
        //set prevPage only if user change page by using pagination
        if (this.page !== page) {
            this.setPrevPageNumber(this.page);
        }

        this.page = page;
    };

    @action setPrevPageNumber = (value: Nullable<number>): void => {
        this.prevPage = value;
    };

    @action updateOrder = (orderBy: OrderBy, orderDirection: OrderDirection): void => {
        this.orderBy = orderBy;
        this.orderDirection = orderDirection;
    };

    /**
     * Search can be disabled on Promo Pages, if 'When' or 'Who' field isn't valid
     * (user can interact only with these fields on Promo Pages)
     */
    @computed get isSearchSubmitDisabled(): boolean {
        const { isHotelDetailsBookPage, isHotelDetailsBrowsePage, isPromoPage } = this.rootStore.layoutStore;

        if (!this.rootStore.layoutStore.isTradePortal && (isHotelDetailsBookPage || isHotelDetailsBrowsePage)) {
            return false;
        }

        return (
            (this.isSearchValid !== undefined && !this.isSearchValid) ||
            (isPromoPage && (!this.searchWhen.isWhenParamsValid || !this.searchWho.isGuestsParametersValid))
        );
    }

    @computed get isToParamsValid(): string | true {
        return (
            (this.searchTo.selectedDestinationCodes && this.searchTo.selectedDestinationCodes.length > 0) ||
            this.searchTo.selectedAccommodationCodes
        );
    }

    @action validatePromoPageSearchParameters = (): boolean => {
        if (this.validateWhenParameters()) {
            return true;
        }

        return this.validateWhoParameters();
    };

    @action validateWhoParameters = (): boolean => {
        if (this.searchWho.validateGuestQuantity() || !this.searchWho.validateChildrenAge()) {
            this.rootStore.searchStore.focusInputError(SearchBarDropdown.Who);

            return true;
        }

        return false;
    };

    @action validateWhenParameters = (focusIfHasError = true): boolean => {
        if (this.searchWhen.isWhenParamsValid) {
            return false;
        }

        const message = this.searchWhen.from
            ? SitecoreDictionary.SearchPodErrorsNoReturnDateIsSelected
            : SitecoreDictionary.SearchPodErrorsNoDateIsSelected;
        this.errorMessages = {
            key: SearchBarDropdown.When,
            message,
        };
        focusIfHasError && this.focusInputError(SearchBarDropdown.When);

        this.rootStore.trackingStore.trackValidation(SearchPodValidationFields.EmptyWHENFieldError, message);

        return true;
    };

    /**
     * Validate search params and force UI errors
     * returns true when params INVALID and false when params VALID
     */
    // TO DO swap returning values for better readability
    @action validateSearchParameters = (): boolean => {
        const checkFrom = (): boolean => {
            if (!isSelectionValid(this.searchFrom.origins || [], this.searchFrom.availableOriginsCodes)) {
                this.errorMessages = {
                    key: SearchBarDropdown.From,
                    message: SitecoreDictionary.SearchPodErrorsNoDepartureIsEntered,
                };
                this.focusInputError(SearchBarDropdown.From);
                this.rootStore.trackingStore.trackValidation(
                    SearchPodValidationFields.EmptyFROMFieldError,
                    SitecoreDictionary.SearchPodErrorsNoDepartureIsEntered,
                );

                return true;
            }

            return false;
        };

        const checkTo = (): boolean => {
            const isValidByDestination = isSelectionValid(
                this.searchTo.selectedDestinationCodes,
                this.searchTo.availableDestinationsCodes,
            );
            const isChosenSingleCode =
                this.searchTo.selectedDestinationCodes &&
                this.searchTo.selectedDestinationCodes.length > 0 &&
                this.isSingleSelectableDestination;

            const isValid = isValidByDestination || this.searchTo.selectedAccommodationCodes || isChosenSingleCode;

            if (!isValid) {
                this.errorMessages = {
                    key: SearchBarDropdown.To,
                    message: SitecoreDictionary.SearchPodErrorsNoDestinationIsEntered,
                };
                this.focusInputError(SearchBarDropdown.To);
                this.rootStore.trackingStore.trackValidation(
                    SearchPodValidationFields.EmptyTOFieldError,
                    SitecoreDictionary.SearchPodErrorsNoDestinationIsEntered,
                );

                return true;
            }

            return false;
        };

        const checkWhen = (): boolean => this.validateWhenParameters();

        const checkWho = (): boolean => this.validateWhoParameters();

        return [checkFrom, checkTo, checkWhen, checkWho].some(callback => callback());
    };

    @action clearErrorMessage = (): void => {
        this.errorMessages = null;
    };

    hasErrorInField = (searchBarField: SearchBarDropdown): boolean => this.errorMessages?.key === searchBarField;

    getAvailableOriginsCodes = async (): Promise<string[] | null> => {
        if (!this.searchTo.selectedDestinationCodes?.length && !this.searchWhen.isWhenParamsValid) {
            return null;
        }

        const promoPageId = this.rootStore.layoutStore.isPromoPage ? this.rootStore.layoutStore.layoutId : undefined;

        const { fromParam, toParam, duration, flexDays } = this.searchWhen.whenParamsForRequest;

        const result = await offersService.getAvailableOrigins(
            this.searchTo.selectedDestinationCodes.join(','),
            fromParam,
            toParam,
            flexDays,
            promoPageId,
            duration,
        );

        return result.data;
    };

    loadPlacesTitlesByCodes = async (codes: string[], includeParents: boolean = false): Promise<IDestination[]> => {
        try {
            // If need to load destinations with parents, use POST /destination/search request
            const destinations = includeParents
                ? await offersService.fetchDestinationsByCodes(codes, true)
                : await offersService.loadPlacesTitlesByCodes(codes);

            if (destinations && Array.isArray(destinations) && destinations.length > 0) {
                this.searchTo.collectLoadedDestinationsTitles(destinations);

                return destinations;
            }

            return [];
        } catch {
            return [];
        }
    };

    /**
     * Load destinations with names for each recent search.
     */
    loadDestinationsForRecentSearches = async (items: IPrefilledSearchParams[]): Promise<IDestinationCountry[]> => {
        const destCodesSet = items.reduce((codes, item) => {
            const itemCodes = item.dest.split(',');

            // No need load destination if "Anywhere" selected
            if (itemCodes.includes(GEOGRAPHY_ALL_CODE)) return codes;

            /** Load one destination, if de-dupe (contract & external) hotel is selected (EJH-12747, EDI-151, EDI-183)
             * using the DC hotel code contract by default or the first code in the list if there is no DC code to get the destination name
             */
            if (isSingleHotelSearch(itemCodes)) {
                codes.add(getDefaultContractCode(itemCodes));
            } else {
                itemCodes.forEach(c => codes.add(c));
            }

            return codes;
        }, new Set<string>());

        await when(() => !this.searchTo.isLoadingDestinations);

        const missedCodes = Array.from(destCodesSet).filter(
            code => !getDestinationOrChildrenByCode(code, this.searchTo.destinationsWithNames),
        );

        if (missedCodes.length) {
            await this.loadPlacesTitlesByCodes(missedCodes, true);
        }

        return this.searchTo.destinationsWithNames;
    };

    @action collectOriginsTitles = (origins: IAirportCountry[]): void => {
        const newOriginsWithTitles: IDestinationCountry[] = [];

        if (origins) {
            origins.forEach(airportCountry => {
                if (airportCountry.airports) {
                    airportCountry.airports.forEach(item => {
                        if (!item.airports) {
                            if (
                                !this.originsWithNames.some(savedOrigin => !!item.code && savedOrigin.code == item.code)
                            ) {
                                newOriginsWithTitles.push({
                                    name: item.name,
                                    code: item.code,
                                    itemName: item.itemName,
                                    originCountry: {
                                        code: airportCountry.code as MarketCode,
                                        name: airportCountry.name,
                                    },
                                });
                            }
                        } else {
                            let group = this.originsWithNames.find(
                                savedOrigin => !!item.code && savedOrigin.code === item.code,
                            );

                            if (!group) {
                                group = {
                                    name: item.name,
                                    code: item.code,
                                    itemName: item.itemName,
                                    children: [],
                                    originCountry: {
                                        code: airportCountry.code as MarketCode,
                                        name: airportCountry.name,
                                    },
                                };
                                newOriginsWithTitles.push(group);
                            }

                            if (!group.children) {
                                group.children = [];
                            }

                            item.airports
                                .filter(
                                    airport =>
                                        !group!.children!.some(
                                            savedOrigin => !!airport.code && savedOrigin.code == airport.code,
                                        ),
                                )
                                .forEach(airport =>
                                    group!.children!.push({
                                        name: airport.name,
                                        code: airport.code,
                                        itemName: airport.itemName,
                                        originCountry: {
                                            code: airportCountry.code as MarketCode,
                                            name: airportCountry.name,
                                        },
                                    }),
                                );
                        }
                    });

                    airportCountry.airports
                        .filter(
                            airport =>
                                !airport.airports &&
                                !this.originsWithNames.some(
                                    savedOrigin => !!airport.code && savedOrigin.code == airport.code,
                                ),
                        )
                        .forEach(airport =>
                            newOriginsWithTitles.push({
                                name: airport.name,
                                code: airport.code,
                                itemName: airport.itemName,
                                originCountry: {
                                    code: airportCountry.code as MarketCode,
                                    name: airportCountry.name,
                                },
                            }),
                        );

                    airportCountry.airports
                        .filter(item => item.airports)
                        .forEach(airportsGroup => {
                            if (airportsGroup.airports) {
                                let group = this.originsWithNames.find(
                                    savedOrigin => !!airportsGroup.code && savedOrigin.code === airportsGroup.code,
                                );

                                if (!group) {
                                    group = {
                                        name: airportsGroup.name,
                                        code: airportsGroup.code,
                                        itemName: airportsGroup.itemName,
                                        children: [],
                                        originCountry: {
                                            code: airportCountry.code as MarketCode,
                                            name: airportCountry.name,
                                        },
                                    };
                                    newOriginsWithTitles.push(group);
                                }

                                if (!group.children) {
                                    group.children = [];
                                }

                                airportsGroup.airports
                                    .filter(
                                        airport =>
                                            !group!.children!.some(
                                                savedOrigin => !!airport.code && savedOrigin.code == airport.code,
                                            ),
                                    )
                                    .forEach(airport =>
                                        group!.children!.push({
                                            name: airport.name,
                                            code: airport.code,
                                            itemName: airport.itemName,
                                            originCountry: {
                                                code: airportCountry.code as MarketCode,
                                                name: airportCountry.name,
                                            },
                                        }),
                                    );
                            }
                        });
                }
            });
        }

        if (newOriginsWithTitles.length > 0) {
            this.originsWithNames = this.originsWithNames.concat(newOriginsWithTitles);
            this.searchFrom.updateOriginsDisplayValue();
        }
    };

    /**
     * resetDateValue - in the searchPod we have a StartNewSearch button
     * and for it we must reset the values ​​and not update
     */
    @action clearSearchValues = (noUpdate = false): void => {
        this.searchWhen.clearDates(true);
        this.searchFrom.onClearOrigins(true);
        this.searchFrom.updateOriginsDisplayValue();
        this.searchTo.clearDestinations({ noUpdate: true });
        this.searchWho.onClearRoom();
        this.searchWho.setIsAutoAllocationToDefaultValue();
        this.searchWhen.flexDays = 0;
        this.setPrevPageNumber(null);
        this.setPageNumber(1);
        this.searchWhen.setIsMonthSearch(false);
        this.clearSortDropdown();
        this.searchWhen.clearMonthsAvailability();

        // prevent all API calls below and call in one scope because clearDates, onClearOrigins and clearDestinations
        // cross-call each other's update, which is why availability requests are called several times
        if (!noUpdate) {
            this.searchWhen.resetDateAvailabilityInterval();
            this.searchTo.typeAheadDestinations = null;
            this.searchTo.updateAvailableDstCodes();
            this.searchTo.updateDestinationCodes();
        }
    };

    @action clearAvailableCodesAndDates = (): void => {
        this.searchFrom.setAvailableOrigins(null);
        this.searchTo.availableDestinationsCodes = null;
        this.searchWhen.availableDates = null;
        this.searchWhen.resetDateAvailabilityInterval();
    };

    @action setIsSearchPodExpanded = (state: boolean): void => {
        this.isSearchPodExpanded = state;
    };

    /**
     * need call setOldSearchParam when we click edit on search bar for remember first values on search.
     * So that we can return the first value for the search
     */
    @action public setOldSearchParam = (): void => {
        if (this.isOldParamSet) {
            return;
        }

        this.oldOrigins = this.searchFrom.origins?.length
            ? this.searchFrom.origins
            : this.rootStore.queryParamsStore.originFromUrl || [];

        // Set oldDestinations
        if (!this.oldSelectedDestinations?.length) {
            const prefilledDestinations = this.rootStore.queryParamsStore.destinationFromUrl.split(',');
            const filteredDestinations = prefilledDestinations.reduce((array: IDestination[], code: string) => {
                // filter unavailable destinations
                if (this.searchTo.availableDestinationsCodes?.indexOf(code) !== -1) {
                    // we need full names and dest types
                    const dest = getIDestinationByCode(
                        this.searchTo.countriesWithRegions?.length ? this.searchTo.countriesWithRegions : [],
                        code,
                    );

                    // filter undefined values
                    if (dest) {
                        array.push(dest);
                    }
                }

                return array;
            }, [] as IDestination[]);

            if (filteredDestinations.length) {
                this.oldSelectedDestinations = [...filteredDestinations];
            } else {
                this.oldSelectedDestinations = [...this.searchTo.selectedDestinations];
            }
        }

        this.oldIsAutoAllocation = this.searchWho.isAutoAllocation;
        this.oldFrom = this.searchWhen.from || this.rootStore.queryParamsStore.fromDateFromUrl || null;
        this.oldTo = this.searchWhen.to || this.rootStore.queryParamsStore.toDateFromUrl || null;
        this.oldIsFlexible = this.searchWhen.flexDays || this.rootStore.queryParamsStore.flexDaysFromUrl;
        this.oldIsMonthSearch = this.searchWhen.isMonthSearch || this.rootStore.queryParamsStore.isMonthSearchFromUrl;
        this.oldMonthSearchDuration =
            this.searchWhen.monthSearchDuration || this.rootStore.queryParamsStore.monthSearchDurationFromUrl;
        this.oldRooms = this.rootStore.queryParamsStore.roomsAllocationFromUrl.map(el =>
            getRoomAllocationFromQueryRoom(el, false),
        );
        this.isOldParamSet = true;
    };

    @action public clearOldSearchParam = (): void => {
        this.oldOrigins = null;
        this.oldSelectedDestinations = null;
        this.oldFrom = null;
        this.oldTo = null;
        this.oldRooms = [];
        this.isOldParamSet = false;
    };

    @action public setOldSearchParamToSearchParam = (): void => {
        const hasOriginsChanged = !haveSameElements<string>(this.searchFrom.origins || [], this.oldOrigins || []);

        const selectedDestinationCodes = this.searchTo.selectedDestinations.map(({ code }) => code);
        const selectedOldDestinationCodes = this.oldSelectedDestinations?.map(({ code }) => code) || [];
        const hasDestinationsChanged = !haveSameElements<string>(selectedDestinationCodes, selectedOldDestinationCodes);

        const hasDatesChanged =
            !dayjs(this.searchWhen.to).isSame(this.oldTo) || !dayjs(this.searchWhen.from).isSame(this.oldFrom);

        if (this.oldOrigins?.length && hasOriginsChanged) {
            this.searchFrom.setOrigins(this.oldOrigins, false);
        }

        if (this.oldSelectedDestinations?.length && hasDestinationsChanged) {
            this.searchTo.changeDestinations(this.oldSelectedDestinations, false, false);
        }

        if (this.oldTo && this.oldFrom && hasDatesChanged) {
            this.searchWhen.onChangeDates([this.oldFrom, this.oldTo], false);
        }

        if (this.oldIsFlexible !== this.searchWhen.flexDays) {
            this.searchWhen.onChangeFlexible(this.oldIsFlexible);
        }

        if (this.oldIsMonthSearch !== this.searchWhen.isMonthSearch) {
            this.searchWhen.setIsMonthSearch(this.oldIsMonthSearch);
        }

        if (this.oldMonthSearchDuration !== this.searchWhen.monthSearchDuration) {
            this.searchWhen.setMonthSearchDuration(this.oldMonthSearchDuration);
        }

        this.searchWho.setRoomsAllocation(
            this.rootStore.layoutStore.isTradePortal
                ? this.oldRooms
                : this.rootStore.queryParamsStore.roomsAllocationFromUrl.map(el =>
                      getRoomAllocationFromQueryRoom(el, this.rootStore.layoutStore.isTradePortal),
                  ),
        );
        // TO DO investigate why setRoomsAllocation calls twice (996 & 1005)
        this.searchWho.setRoomsAllocation(this.oldRooms);
        this.clearOldSearchParam();

        if (hasOriginsChanged || hasDatesChanged || hasDestinationsChanged) {
            this.searchWhen.updateAvailableDates(true);
            this.searchTo.updateAvailableDstCodes();
            this.searchFrom.updateAvailableOrigins();
        }
    };

    /** Check if search has changed from origin search or if any fields were deleted */
    @computed get isSearchValid(): boolean | undefined {
        if (!this.isOldParamSet || !this.oldOrigins || !this.oldSelectedDestinations) {
            return undefined;
        }

        if (
            !(this.searchFrom.origins || []).length ||
            !this.searchTo.selectedDestinations.length ||
            !this.searchWhen.from ||
            !this.searchWhen.to
        ) {
            return false;
        }

        const hasOriginsChanged = !haveSameElements<string>(toJS(this.searchFrom.origins || []), toJS(this.oldOrigins));

        const hasDestinationsChanged = !haveSameElements<string>(
            this.searchTo.selectedDestinations.map(item => item.code),
            this.oldSelectedDestinations.map(item => item.code),
        );

        const hasDatesChanged =
            !dayjs(this.searchWhen.to).isSame(this.oldTo, 'day') ||
            !dayjs(this.searchWhen.from).isSame(this.oldFrom, 'day');

        const hasMonthSearchDurationChanged =
            this.searchWhen.isMonthSearch && this.oldMonthSearchDuration !== this.searchWhen.monthSearchDuration;

        const hasRoomsChanged = !haveSameElements(
            destructRoom(this.searchWho.roomsAllocation),
            destructRoom(this.oldRooms),
        );

        const hasAutoAllocationChanges = this.oldIsAutoAllocation !== this.searchWho.isAutoAllocation;
        const hasFlexChanged = this.oldIsFlexible !== this.searchWhen.flexDays;

        return (
            hasOriginsChanged ||
            hasDestinationsChanged ||
            hasDatesChanged ||
            hasMonthSearchDurationChanged ||
            hasRoomsChanged ||
            hasAutoAllocationChanges ||
            hasFlexChanged
        );
    }

    /**
     * Prefills search params
     * force - if this is not a Home page, then we also execute the code
     */
    @action public prefillSearchParams = async (
        prefilledParams: IPrefilledSearchParams,
        force?: boolean,
    ): Promise<void> => {
        const isQueryParamUndefined = (param: QueryParamName): boolean => {
            const { query } = this.rootStore.queryParamsStore;

            return query[param] === undefined;
        };

        this.hasPrefilledSearchPod = false;

        // Set flexDays
        if (isQueryParamUndefined(QueryParamName.FlexDays) || force) {
            const flexDays = prefilledParams.flexDays ?? 0; // Temporary Placeholder to account for old searches
            this.searchWhen.onChangeFlexible(flexDays);
        }

        // Set dates
        if ((isQueryParamUndefined(QueryParamName.From) && isQueryParamUndefined(QueryParamName.To)) || force) {
            this.setPrefilledDates(prefilledParams);
        }

        // Set departures
        if (isQueryParamUndefined(QueryParamName.Origin) || force) {
            this.searchFrom.setOrigins(prefilledParams.departure.split(','), false);
            this.searchWhen.resetDateAvailabilityInterval();
            this.searchTo.typeAheadDestinations = null;

            this.searchFrom.updateOriginsDisplayValue();
            await this.searchTo.updateAvailableDstCodes();
        }

        // Set destinations
        const shouldPrefillDestinations = isQueryParamUndefined(QueryParamName.Destination) || force;

        if (shouldPrefillDestinations) {
            await this.searchTo.prefillDestinations(prefilledParams);
        }

        if (!shouldPrefillDestinations || this.rootStore.layoutStore.isTradePortal) {
            await this.searchWhen.updateAvailableDates(true);
        }

        // Set geog
        if ((isQueryParamUndefined(QueryParamName.Geog) && prefilledParams.geog) || force) {
            this.searchTo.setSelectedDestinationCodesQuery(prefilledParams.geog);
        }

        // Set rooms
        if (isQueryParamUndefined(QueryParamName.Rooms) || force) {
            this.searchWho.setRoomsAllocation(
                prefilledParams.rooms.map(el =>
                    getRoomAllocationFromQueryRoom(el, this.rootStore.layoutStore.isTradePortal),
                ),
            );
        }

        // Set autoAllocation
        if (isQueryParamUndefined(QueryParamName.AutoAllocation) || force) {
            if (prefilledParams.autoAllocation) {
                this.searchWho.onChangeRooms(-1);
            } else {
                this.searchWho.setIsAutoAllocation(false);
            }
        }

        this.hasPrefilledSearchPod = true;
    };

    private readonly setPrefilledDates = (prefilledParams: IPrefilledSearchParams): void => {
        if (prefilledParams.isMonthSearch) {
            const startDate = parseDateL10n(prefilledParams.startDate);
            const searchedMonthValue = startDate && dayjs(startDate);
            const endDate = isValidDate(searchedMonthValue) ? searchedMonthValue?.endOf('month').toDate() : undefined;

            if (endDate && startDate) {
                this.searchWhen.onChangeDates([startDate, endDate], false);
                this.searchWhen.setIsMonthSearch(prefilledParams.isMonthSearch);
                this.searchWhen.setMonthSearchDuration(+prefilledParams.durations[0]);
            }
        } else {
            this.updateDatesIfNeeded(prefilledParams);
            this.searchWhen.setIsMonthSearch(false);
        }
    };

    @action setNeedOpenWhenField = (state: boolean): void => {
        this.isNeedOpenWhenField = state;
    };

    @action setNeedOpenWhoField = (state: boolean): void => {
        this.isNeedOpenWhoField = state;
    };

    @action onAnywhereCheck = (onlyAdd: boolean = false): void => {
        const anywhereDest = {
            code: GEOGRAPHY_ALL_CODE,
            name: this.anywhereWord,
        };

        if (this.searchTo.isAnywhereSelected) {
            !onlyAdd && this.searchTo.removeDestination(anywhereDest);
        } else {
            this.searchTo.clearDestinations({ noUpdate: true });
            this.searchTo.addDestination(anywhereDest);
        }
    };

    @action setIsSelectedPackageFromMap = (value: boolean): void => {
        this.isSelectedPackageFromMap = value;
    };

    // sitecore tracking for user searches https://jira.build.easyjet.com/browse/EJH-12223
    @action trackUserSearch = (): void => {
        const { bookingStore, layoutStore } = this.rootStore;

        if (!layoutStore.getSettingAsBoolean(SiteSettings.EnableUserSearchesTracking)) {
            return;
        }

        const departure = bookingStore.origins || [DEPARTURE_ALL_CODE];

        if (
            departure.includes(DEPARTURE_ALL_CODE) ||
            bookingStore.selectedDestinationCodes.includes(GEOGRAPHY_ALL_CODE) ||
            (layoutStore.isPromoPage && (!bookingStore.origins.length || !bookingStore.selectedDestinationCodes.length))
        ) {
            return;
        }

        const userSearch = {
            from: departure,
            to: [...bookingStore.selectedDestinationCodes],
            startDate: formatDateL10n(bookingStore.from || this.searchWhen.from, 'DD/MM/YYYY'),
            endDate: formatDateL10n(bookingStore.to ?? this.searchWhen.to, 'DD/MM/YYYY'),
        };

        notificationsService.trackDataForNotification(notificationsUrls.trackUserSearch(), userSearch);
        trackingApi.trackEvent([{ goalId: TrackingGoals.UserSearch }], trackingApiOptions);
    };

    @action updateSearchValuesFromQuery = (search: string, prevSearch: string): void => {
        const changedQueryParams = getChangedQueryParamNames(search, prevSearch);

        /** change query as object */
        const changedQuery: { [key: string]: boolean } = {};

        changedQueryParams.forEach(q => {
            changedQuery[q] = true;
        });

        const queryGetter = new BaseQueryParamsGetters();
        queryGetter.parseBrowserQuery(search);

        let shouldUpdateDates = true;
        let shouldUpdateOrigins = true;

        /* selected filters shouldn't be cleared when back to search results with the same params (except for 'page' param) */
        if (!!changedQueryParams.length && changedQueryParams.some(el => el !== 'page')) {
            this.rootStore.searchFiltersStore.onClearAllFilters();
        }

        const updateToRun: (() => void)[] = [];

        if (changedQuery[QueryParamName.From]) {
            this.searchWhen.from = queryGetter.fromDateFromUrl ?? null;
        }

        if (changedQuery[QueryParamName.To]) {
            this.searchWhen.to = queryGetter.toDateFromUrl ?? null;
        }

        if (changedQuery[QueryParamName.To] && changedQuery[QueryParamName.From]) {
            shouldUpdateOrigins = false;
            updateToRun.push(this.searchWhen.dateUpdated);
        }

        if (changedQuery[QueryParamName.Origin]) {
            this.searchFrom.setNormalOrigins(queryGetter.originFromUrl);
            shouldUpdateDates = false;

            updateToRun.push(this.originsUpdated);
        }

        if (changedQuery[QueryParamName.Destination] || changedQuery[QueryParamName.Geog]) {
            this.searchTo.setSelectedDestinations([]);

            this.searchTo.setSelectedDestinationCodes(queryGetter.selectedDestinationCodesFromUrl || []);

            this.searchTo.setSelectedAccommodationCodes(
                queryGetter.selectedAccommodationCodesFromUrl ||
                    (queryGetter[QueryParamName.IsPromotingIframe] && queryGetter.accommodationIdFromUrl) ||
                    '',
            );

            this.searchTo.selectedDestinationCodesQuery = queryGetter.selectedDestinationCodesQueryFromUrl || '';

            this.searchTo.selectedParentDestinationCodesQuery = getParentDestination(
                this.searchTo.selectedDestinationCodesQuery,
            );

            const update = async (): Promise<void> => {
                await this.searchTo.syncDestinationItems();

                this.searchTo.updateDestinationCodes(shouldUpdateDates, shouldUpdateOrigins);
            };

            updateToRun.push(update);
        }

        this.searchWho.handleWhoQueryParams(changedQuery, queryGetter);

        if (changedQuery[QueryParamName.FlexDays]) {
            this.searchWhen.flexDays = queryGetter.flexDaysFromUrl;
        }

        if (changedQuery[QueryParamName.Page]) {
            this.setPrevPageNumber(this.page);
            this.setPageNumber(queryGetter.pageNumberFromUrl);
        }

        if (changedQuery[QueryParamName.Take]) {
            this.take = this.rootStore.queryParamsStore.itemsPerPageFromUrl;
        }

        if (changedQuery[QueryParamName.OrderDirection]) {
            this.orderDirection = queryGetter.orderDirectionFromUrl as OrderDirection;
        }

        if (changedQuery[QueryParamName.OrderBy]) {
            this.orderBy = queryGetter.orderByFromUrl as OrderBy;
        }

        /* make requests only after all store values have been updated */
        runInAction(() => {
            updateToRun.forEach(upd => upd());
        });
    };

    private readonly updateDatesIfNeeded = (prefilledParams: IPrefilledSearchParams): void => {
        const startDate = parseDateL10n(prefilledParams.startDate);
        const endDate = parseDateL10n(prefilledParams.startDate);

        if (endDate && startDate) {
            endDate.setDate(endDate.getDate() + parseInt(prefilledParams.durations[0])); // add number of days from duration param
            this.searchWhen.onChangeDates([startDate, endDate], false);
        }
    };

    private readonly focusInputError = (errorMessagesKey: SearchBarDropdown): void => {
        if (isBackend()) {
            return;
        }

        // TO DO values should be moved to constants and should be used in components and tests as constants too
        const errorMessages = {
            [SearchBarDropdown.From]: 'search-from',
            [SearchBarDropdown.To]: 'search-to',
            [SearchBarDropdown.When]: 'search-when',
            [SearchBarDropdown.Who]: 'search-who',
        };

        if (errorMessages[errorMessagesKey]) {
            const element = document.getElementById(errorMessages[errorMessagesKey]);
            element?.focus();
        }
    };

    isCheapestMonthAllowed = (selectedDestinations: IDestination[]): boolean => {
        const allowedDestinationTypes: (DestinationType | undefined)[] = [
            DestinationType.Region,
            DestinationType.VirtualRegion,
            DestinationType.VirtualCountry,
            DestinationType.Country,
        ];
        const { monthSearchDuration } = this.searchWhen;
        const { selectedAvailableOrigins } = this.searchFrom;

        const { adultsQuantity, isAutoAllocation, totalGuestsQuantity } = this.searchWho;
        const selectedMainDestination: IDestination | undefined = selectedDestinations[0];

        const parentVirtualCountry = getParentVirtualCountry(selectedMainDestination);

        const isDestinationTypeAllowed = allowedDestinationTypes.includes(selectedMainDestination?.type);
        const isGlobalOrigin = selectedAvailableOrigins[0] === DEPARTURE_ALL_CODE;

        const { areOnlyRelatedRegionsSelected } = getVirtualRegionDestinationData(selectedDestinations);

        const isAllowedByVirtualCountry = !!parentVirtualCountry;

        const isAllowedByDestination =
            (isDestinationTypeAllowed || isAllowedByVirtualCountry) &&
            !isGlobalOrigin &&
            (!!selectedDestinations.length || areOnlyRelatedRegionsSelected);
        const isAllowedByAllocation =
            isAutoAllocation && totalGuestsQuantity === TWO && adultsQuantity === totalGuestsQuantity;

        const isAllowedByOrigin = !!selectedAvailableOrigins.length;

        const isAllowedBySearchDuration = monthSearchDuration === CHEAPEST_MONTH_SEARCH_DURATION_DEFAULT;

        return isAllowedByOrigin && isAllowedByDestination && isAllowedByAllocation && isAllowedBySearchDuration;
    };
}
