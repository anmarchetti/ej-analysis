import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import {
    filterPillOptions,
    findFilterOptionByCode,
    findParentFilter,
    getBoardOptions,
    getDepartureAirportsWithCountryName,
    getFilterByGroupCode,
    getSelectedPriceRangeDictionary,
    isExclusiveFilterDisabled,
    normalizeRecentlyUsedFilters,
} from 'frontend/utils/filter.utils';
import { buildKeyBasedOnMarket } from 'frontend/utils/market.utils';
import { compare } from 'frontend/utils/sort.utils';
import { containsSubstring } from 'frontend/utils/string.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getRangeFilterTrackingValue } from 'frontend/utils/tracking/filters.utils';
import { getWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IFilterOption, IFilters, ISelectedFilter } from 'models/data/IFilters';
import { ExperimentVariants } from 'models/enum/cro/Experiment';
import { isLoadingStatus } from 'models/enum/DataStatus';
import { DestinationType, VIRTUAL_DESTINATION_TYPES } from 'models/enum/DestinationType';
import {
    FilterGroupCodes,
    FLIGHT_DURATION_FILTER_CODE,
    PRICE_RANGE_FILTER_CODE,
    QUICK_FILTER_CODES,
    TQuickFilterType,
    WEATHER_FILTER_CODE,
} from 'models/enum/FilterGroupCodes';
import { DEPARTURE_ALL_CODE } from 'models/enum/RequestConstants';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { RangeFilterTrackingUnits } from 'models/enum/tracking/RangeFilterTrackingUnits';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import useSelectedFilters from 'frontend/components/common/LeftHandFilter/FilterContent/FilterContentWrapper/useSelectedFilters';

export const MIN_FLIGHT_DURATION = 0.5;
export const MAX_FLIGHT_DURATION = 6;
export const MIN_TOTAL_ITEMS = 5;
export const RECENTLY_USED_FILTERS_MAX_LENGTH = 10;
export const RECENTLY_USED_FILTERS_MAX_DISPLAY_LENGTH = 5;

export abstract class BaseSearchFilterStore implements ISssrStore<any> {
    @observable public filters: IFilters[] = [];
    @observable public selectedFilters: ISelectedFilter[] = [];
    @observable public selectedFilterGroups: Set<FilterGroupCodes> = new Set();
    @observable public recentlyUsedFilters: IFilterOption[] = [];

    @observable public filtersChanged: boolean = false;
    @observable public pageNumberChanged: boolean = false;
    @observable public isModalDisplayed: boolean = false;
    @observable public isMapModalDisplayed: boolean = false;

    // todo: dead code ?
    // ==================
    @observable public activeFilterCode: FilterGroupCodes = FilterGroupCodes.NoFilter;
    // ==================
    @observable public isFiltersLoaded: boolean = false;
    @observable public isKidsGoFree: boolean = false;
    @observable public filterPriceFrom: number | null;
    @observable public filterPriceTo: number | null;
    @observable public isPriceFilterPerPerson: boolean = true;
    @observable public isPresetDestinationFilter: boolean = false;
    @observable public isPresetDurationFilter: boolean = false;
    @observable public isFiltersLoadingScreenEnabled: boolean = true;
    @observable public flightDurationFrom: number = MIN_FLIGHT_DURATION;
    @observable public flightDurationTo: number = MAX_FLIGHT_DURATION;
    @observable public isCountHidden: boolean = false;
    @observable public weatherFrom: number | null;
    @observable public weatherTo: number | null;
    @observable public minAvailableTemp: number | null = null;
    @observable public maxAvailableTemp: number | null = null;

    // Filters from URL
    @observable themesCodesFromUrl: Nullable<string[]>;
    @observable boardsFromUrl: Nullable<string[]>;
    @observable facilitiesFromUrl: Nullable<string[]>;
    @observable starRatingFromUrl: Nullable<string[]>;
    @observable tripAdvisorRatingFromUrl: Nullable<string>;
    @observable inboundFlightNumberFromUrl: Nullable<string>;
    @observable outboundFlightNumberFromUrl: Nullable<string>;

    // CRO experiment variants
    @observable recommendedFilterExperimentTestVariant: string | undefined;
    @observable recentlyUsedFilterExperimentTestVariant: string | undefined;

    constructor(public rootStore: TRootStore) {
        makeObservable(this);

        this.onClearAllSelectedFilters();

        if (this.rootStore?.layoutStore?.isOffersPriceViewTotal) {
            this.setIsPriceFilterPerPerson(!this.rootStore.layoutStore.isOffersPriceViewTotal);
        }
    }

    serialize = () => ({
        filters: toJS(this.filters),
        selectedFilters: toJS(this.selectedFilters),
        filterPriceFrom: this.filterPriceFrom,
        filterPriceTo: this.filterPriceTo,
        flightDurationFrom: this.flightDurationFrom,
        flightDurationTo: this.flightDurationTo,
        isPriceFilterPerPerson: this.isPriceFilterPerPerson,
        isPresetDestinationFilter: this.isPresetDestinationFilter,
        weatherFrom: this.weatherFrom,
        weatherTo: this.weatherTo,
    });

    deserialize = (initialState?: any): void => {
        runInAction(() => {
            this.filters = initialState.filters || [];
            this.selectedFilters = initialState.selectedFilters || [];
            this.filterPriceFrom = initialState.filterPriceFrom || null;
            this.filterPriceTo = initialState.filterPriceTo || null;
            this.flightDurationFrom = initialState.flightDurationFrom || MIN_FLIGHT_DURATION;
            this.flightDurationTo = initialState.flightDurationTo || MAX_FLIGHT_DURATION;
            this.isPriceFilterPerPerson = initialState.isPriceFilterPerPerson !== false;
            this.isPresetDestinationFilter = !!initialState.isPresetDestinationFilter;
            this.weatherFrom = initialState.weatherFrom ?? null;
            this.weatherTo = initialState.weatherTo ?? null;
        });
    };

    @action saveFilters = (filters: IFilters[], reorderFilters: boolean = false): void => {
        if (filters.length === 0) {
            this.filters = [];
        } else {
            const filtersToProcess = [...filters];

            if (
                this.rootStore.layoutStore.isSearchResultsPage &&
                this.rootStore.layoutStore.filtersOrder.includes(FilterGroupCodes.RecentlyUsed)
            ) {
                filtersToProcess.unshift({
                    code: FilterGroupCodes.RecentlyUsed,
                    name: FilterGroupCodes.RecentlyUsed,
                    options: this.recentlyUsedFilters,
                });
            }

            const orderedFilters = this.buildOrderedFilterList(filtersToProcess, reorderFilters);
            this.filters = this.setGroupCodeToFilters(orderedFilters);
        }

        this.presetFilterValues();
        this.selectFiltersFromUrl();
        this.isFiltersLoaded = true;
    };

    private readonly buildOrderedFilterList = (filters: IFilters[], reorderFilters: boolean): IFilters[] => {
        const filterMap = new Map(filters.map(item => [item.code, item]));
        const orderedFilters: IFilters[] = [];
        const orderArraySC = this.rootStore.layoutStore.filtersOrder;
        const orderArrayBE = Array.from(filterMap.keys());

        let orderArray = reorderFilters ? orderArrayBE : orderArraySC;

        // move RecentlyUsed filter to the top if it exists
        if (orderArray.includes(FilterGroupCodes.RecentlyUsed)) {
            orderArray = [
                FilterGroupCodes.RecentlyUsed,
                ...orderArray.filter(code => code !== FilterGroupCodes.RecentlyUsed),
            ];
        }

        const filterMapping: Record<string, Nullable<IFilters>> = {
            [FilterGroupCodes.FlightTimes]: filterMap.get(FilterGroupCodes.FlightTimes),
            [FilterGroupCodes.BoardType]: this.getBoardsFilter(filterMap.get(FilterGroupCodes.BoardType) as IFilters),
            [FilterGroupCodes.Destination]: this.getDestination(filterMap.get(FilterGroupCodes.Destination)),
            [FilterGroupCodes.StarRating]: this.getRatingFilter(filterMap, FilterGroupCodes.StarRating),
            [FilterGroupCodes.TripAdvisorRating]: this.getRatingFilter(filterMap, FilterGroupCodes.TripAdvisorRating),
            [FilterGroupCodes.PackageTheme]: this.getThemeFilter(filterMap.get(FilterGroupCodes.PackageTheme)),
            [FilterGroupCodes.Flights]: filterMap.get(FilterGroupCodes.Flights),
            [FilterGroupCodes.Facilities]: filterMap.get(FilterGroupCodes.Facilities),
            [FilterGroupCodes.Duration]: this.getDurationFilters(filterMap.get(FilterGroupCodes.Duration)),
            [FilterGroupCodes.PriceRange]: this.getPriceRangeFilter(filterMap.get(FilterGroupCodes.PriceRange)),
            [FilterGroupCodes.Offers]: filterMap.get(FilterGroupCodes.Offers),
            [FilterGroupCodes.HotelTypes]: filterMap.get(FilterGroupCodes.HotelTypes),
            [FilterGroupCodes.FlightDuration]: this.getFlightDurationFilter(
                filterMap.get(FilterGroupCodes.FlightDuration),
            ),
            [FilterGroupCodes.Weather]: this.getWeatherFilter(filterMap.get(FilterGroupCodes.Weather)),
            [FilterGroupCodes.PromoCollection]: filterMap.get(FilterGroupCodes.PromoCollection),
            ...(this.recommendedFilterExperimentTestVariant === ExperimentVariants.VariantB && {
                [FilterGroupCodes.Recommended]: filterMap.get(FilterGroupCodes.Recommended),
            }),
            ...(this.recentlyUsedFilterExperimentTestVariant === ExperimentVariants.VariantB && {
                [FilterGroupCodes.RecentlyUsed]: filterMap.get(FilterGroupCodes.RecentlyUsed),
            }),
        };

        orderArray.forEach(code => {
            const shouldInclude = !reorderFilters || filterMap.has(code);

            if (!shouldInclude) {
                return;
            }

            const filter = filterMapping[code] ?? null;

            if (!filter) {
                return;
            }

            // Disabling duration filter for promo pages in CMS order mode. Will be implemented in next sprints.
            if (code === FilterGroupCodes.Duration && this.rootStore.layoutStore.isPromoPage) {
                return;
            }

            if (QUICK_FILTER_CODES.includes(code)) {
                const quickFilter = filterPillOptions(
                    code as FilterGroupCodes.RecentlyUsed | FilterGroupCodes.Recommended,
                    filter,
                    orderArray,
                    filters,
                );

                if (quickFilter.options.length === 0) {
                    return;
                }

                orderedFilters.push(quickFilter);

                return;
            }

            orderedFilters.push(filter);
        });

        return orderedFilters;
    };

    @action hydrateRecentlyUsedFilters = (): void => {
        const recentlyUsedFiltersKey = buildKeyBasedOnMarket(
            WebStorageKeys.RecentlyUsedFilters,
            this.rootStore.marketStore.marketCode,
        );
        const recentlyUsedFiltersFromStorage = getWebStorageItem(recentlyUsedFiltersKey, true) || [];
        const normalizedFilters = normalizeRecentlyUsedFilters(recentlyUsedFiltersFromStorage);

        if (normalizedFilters.length !== recentlyUsedFiltersFromStorage.length) {
            setWebStorageItem(recentlyUsedFiltersKey, normalizedFilters);
        }

        this.recentlyUsedFilters = normalizedFilters;
    };

    /**
     * Preset filter values
     *  *Destinations
     *  *Departure airports
     *  *Duration
     */
    private readonly presetFilterValues = (): void => {
        if (!this.isPresetDestinationFilter) {
            /** Preset filter codes for destinations */
            this.presetDestinationFilter();
        }

        /** Should be executed only in case if it was not done before or if selected duration filters are empty. */
        if (
            !this.isPresetDurationFilter ||
            !this.selectedFilters.some(el => el.groupCode === FilterGroupCodes.Duration)
        ) {
            /** Preset filter codes for duration */
            this.presetDurationFilter();
        }
    };

    private readonly getPriceRangeFilter = (
        priceFilter: Nullable<IFilters> = {
            options: [] as IFilterOption[],
            code: FilterGroupCodes.PriceRange,
            name: FilterGroupCodes.PriceRange,
        },
    ): IFilters | null => {
        /** Set fake filter options if filter options not set and number of hotels more then 0 */
        /** Price filter using max/min price for filtering from status object */
        if ((!priceFilter || (priceFilter.options || []).length === 0) && this.rootStore.hotelsStore.hasHotels) {
            priceFilter = {
                options: [
                    {
                        code: PRICE_RANGE_FILTER_CODE,
                        name: `${FilterGroupCodes.PriceRange}_FilterName`,
                        count: 0,
                    },
                ] as IFilterOption[],
                code: FilterGroupCodes.PriceRange,
                name: FilterGroupCodes.PriceRange,
            };
        }

        return priceFilter;
    };

    private readonly getFlightDurationFilter = (
        flightDurationFilter: Nullable<IFilters> = {
            options: [] as IFilterOption[],
            code: FilterGroupCodes.FlightDuration,
            name: FilterGroupCodes.FlightDuration,
        },
    ): Nullable<IFilters> => {
        if (
            (!flightDurationFilter || (flightDurationFilter.options || []).length === 0) &&
            this.rootStore.hotelsStore.hasHotels
        ) {
            flightDurationFilter = {
                options: [
                    {
                        code: FLIGHT_DURATION_FILTER_CODE,
                        name: `${FilterGroupCodes.FlightDuration}_FilterName`,
                        count: 0,
                    },
                ] as IFilterOption[],
                code: FilterGroupCodes.FlightDuration,
                name: FilterGroupCodes.FlightDuration,
            };
        }

        return flightDurationFilter;
    };

    private readonly getWeatherFilter = (
        weatherFilter: Nullable<IFilters> = {
            options: [] as IFilterOption[],
            code: FilterGroupCodes.Weather,
            name: FilterGroupCodes.Weather,
        },
    ): Nullable<IFilters> => {
        if (weatherFilter?.options?.length) {
            const maxTemp = weatherFilter.options[0]?.maxTemp ?? null;
            const minTemp = weatherFilter.options[0]?.minTemp ?? null;
            this.setMinAvailableTemp(minTemp);
            this.setMaxAvailableTemp(maxTemp);

            return {
                options: [
                    {
                        code: WEATHER_FILTER_CODE,
                        name: `${FilterGroupCodes.Weather}_FilterName`,
                        count: 0,
                        maxTemp,
                        minTemp,
                    },
                ] as IFilterOption[],
                code: FilterGroupCodes.Weather,
                name: FilterGroupCodes.Weather,
            };
        }

        return weatherFilter;
    };

    getRatingFilterName(starAmount: number, code: FilterGroupCodes): string {
        const phrase =
            starAmount === 1
                ? SitecoreDictionary.FilterTypesNamesStarRatingSingular
                : SitecoreDictionary.FilterTypesNamesStarRatingPlural;
        let name = Tokenizer.replaceToken(
            this.rootStore.layoutStore.getPhrase(phrase),
            Tokens.Amount,
            String(starAmount),
        );

        if (code === FilterGroupCodes.TripAdvisorRating) {
            name += ` ${
                starAmount === 5
                    ? this.rootStore.layoutStore.getPhrase(SitecoreDictionary.SearchPodFiltersLabelsOnly)
                    : this.rootStore.layoutStore.getPhrase(SitecoreDictionary.SearchPodFiltersLabelsAndUp)
            }`;
        }

        return name;
    }

    private readonly getRatingFilter = (
        filterMap: Map<FilterGroupCodes, IFilters>,
        code: FilterGroupCodes,
    ): IFilters => {
        const filter = filterMap.get(code) || ({ options: [] as IFilterOption[] } as IFilters);

        if (filter.options.length === 0) {
            return filter;
        }

        Array(5)
            .fill('')
            .forEach((_, i) => {
                const starAmount = `${i + 1}`;
                let foundOption = filter.options.find(option => option.code === starAmount);
                const name = this.getRatingFilterName(i + 1, code);

                if (!foundOption) {
                    foundOption = {
                        code: starAmount,
                        name,
                        count: 0,
                        groupCode: code,
                    };
                    filter.options.push(foundOption);
                } else {
                    foundOption.name = name;
                    foundOption.groupCode = code;
                }
            });

        return filter;
    };

    private readonly getThemeFilter = (themes: Nullable<IFilters>) => {
        if (themes) {
            this.sortFilterOptionsAlphabetically(themes.options);
            themes.options.forEach(theme => {
                this.sortFilterOptionsAlphabetically(theme.children);
            });
        }

        return themes;
    };

    private readonly getDestination = (destinations: Nullable<IFilters>) => {
        const firstAPIDestination = this.filters.find(filter => filter.code === FilterGroupCodes.Destination);

        // Don't reinitialize the destinations, if new list contains less items then initial.
        // It happens on Promo Page, when a country/region is selected, API returns only this country instead of all initial countries.
        if (firstAPIDestination && destinations && firstAPIDestination.options.length > destinations.options.length) {
            return firstAPIDestination;
        }

        if (destinations) {
            this.sortFilterOptionsAlphabetically(destinations.options);

            destinations.options.forEach(destination => {
                this.sortFilterOptionsAlphabetically(destination.children);

                // if we are on promo page, we remove not selected destinations
                if (this.rootStore.layoutStore.isPromoPage) {
                    const promoDestinationsCodes = this.rootStore.promoPageStore.defaultDestinationsCodes;

                    // if we don't have preselected destinations, we shouldn't remove anything
                    if (promoDestinationsCodes.length) {
                        // if country was selected, no need to check children
                        if (promoDestinationsCodes.indexOf(destination.code) === -1 && destination.children) {
                            destination.children = destination.children.filter(d => {
                                if (promoDestinationsCodes.indexOf(d.code) > -1) {
                                    return true;
                                }

                                if (d.destinationInfo?.type === DestinationType.VirtualRegion) {
                                    return (d.destinationInfo?.relatedRegions || []).every(
                                        rl => promoDestinationsCodes.indexOf(rl) > -1,
                                    );
                                }

                                return false;
                            });
                        }
                    }
                }
            });
        }

        return destinations;
    };

    /**
     * Returns duration filter options.
     */
    private readonly getDurationFilters = (durations: Nullable<IFilters>): Nullable<IFilters> => {
        let finalFilters: IFilterOption[];

        if (!durations) {
            /** Return empty result if no duration filter found at all. */
            return;
        }

        const filteredDurations = durations.options?.filter(x => x.count > 0);
        const currentDuration = this.rootStore.searchStore.searchWhen.selectedNumberOfNights;
        const currentDurationIndex = filteredDurations?.findIndex(x => x.code == `${currentDuration}`);

        if (!filteredDurations || currentDurationIndex == null || currentDurationIndex < 0) {
            /** Return undefined if current duration is not found. */
            return {
                code: FilterGroupCodes.Duration,
                options: [],
                name: FilterGroupCodes.Duration,
            };
        }

        if (currentDurationIndex < 2) {
            /**
             * Show all filters from beaning if current duration index is less then 2.
             * Current duration: 4.
             * Avoidable duration: 1,4,5,6,7
             * Will show: 1,4,5,6,7
             */
            finalFilters = filteredDurations.slice(0, 8);
        } else {
            /**
             * Current duration: 6.
             * Avoidable duration: 1,4,5,6,7
             * Will show: 4,5,6,7
             */
            finalFilters = filteredDurations.slice(currentDurationIndex - 2, currentDurationIndex + 6);
        }

        durations.options = finalFilters.map(x => ({
            ...x,
            name: Tokenizer.replaceToken(
                +x.code > 1
                    ? this.rootStore.layoutStore.getPhrase(SitecoreDictionary.FilterTypesNamesNumberOfNights)
                    : this.rootStore.layoutStore.getPhrase(SitecoreDictionary.FilterTypesNamesNumberOfNight),
                Tokens.Number,
                String(x.code),
            ),
            preChecked: !!x.selected,
        }));

        return durations;
    };

    private readonly getBoardsFilter = (boards: IFilters) => {
        // boards in memory
        const currentBoardFilters = this.filters.find(filter => filter.code === FilterGroupCodes.BoardType);

        if (currentBoardFilters && boards) {
            /**
             * Generate new boards which are based on current one from memory
             * So we should keep all initial properties
             * But current search return us only boards which are in response, not all we have
             */

            const boardFilters: IFilters = {
                ...currentBoardFilters,
                options: [
                    ...currentBoardFilters.options.map(currentOption => {
                        // new board option object
                        const boardFiltersOption = { ...currentOption };

                        // board option from search response
                        const newOption = boards?.options.find(option => option.code === currentOption.code);

                        if (newOption) {
                            // if new option exists then update counter for option in memory
                            boardFiltersOption.count = newOption.count;
                        } else {
                            // if new option doesn't come from search then set counter to 0
                            boardFiltersOption.count = 0;
                        }

                        return boardFiltersOption;
                    }),
                    // concat new filters
                    ...boards.options.filter(
                        newOption => !currentBoardFilters.options.find(option => option.code === newOption.code),
                    ),
                ],
            };

            const boardOptions = getBoardOptions(boardFilters.options);

            boards.options = [...boardOptions];
        } else if (boards) {
            const boardOptions = getBoardOptions(boards.options);

            boards.options = [...boardOptions];
        }

        return boards;
    };

    private readonly setGroupCodeToFilters = (filters: IFilters[]): IFilters[] => {
        if (!filters?.length) {
            return filters;
        }

        return filters.map(filter => ({
            ...filter,
            options:
                filter.code === FilterGroupCodes.Recommended
                    ? this.setGroupCodeToRecommendedOptions(filter.options)
                    : this.setGroupCodeToFilterOptions(filter.code, filter.options),
        }));
    };

    private readonly setGroupCodeToFilterOptions = (
        groupCode: FilterGroupCodes,
        options: IFilterOption[],
    ): IFilterOption[] => {
        // For recently used filters we already have the groupCode pre-assigned for options, so we should skip this step
        if (!options?.length || groupCode === FilterGroupCodes.RecentlyUsed) {
            return options;
        }

        return options.map(opt => ({
            ...opt,
            groupCode,
            ...(opt.children && {
                children: this.setGroupCodeToFilterOptions(groupCode, opt.children),
            }),
        }));
    };

    setGroupCodeToRecommendedOptions = (options?: IFilterOption[]): IFilterOption[] => {
        if (!options?.length) {
            return [];
        }

        return options.flatMap(({ filterCode, ...opt }) => {
            if (!filterCode) {
                return opt;
            }

            if (filterCode === FilterGroupCodes.FlightTimes && opt.children) {
                return opt.children.map(el => ({
                    ...el,
                    groupCode: containsSubstring(opt.name, RouteDirection.Inbound)
                        ? FilterGroupCodes.InboundDepartureTime
                        : FilterGroupCodes.OutboundDepartureTime,
                }));
            }

            if (
                (filterCode === FilterGroupCodes.PackageTheme || filterCode === FilterGroupCodes.Facilities) &&
                opt.children &&
                filterCode
            ) {
                return opt.children.map(el => ({
                    ...el,
                    groupCode: filterCode,
                }));
            }

            return {
                ...opt,
                groupCode: filterCode,
            };
        });
    };

    private readonly sortFilterOptionsAlphabetically = (options?: IFilterOption[]): void => {
        if (options?.length) {
            options.sort((leftTheme, rightTheme) => compare(leftTheme, rightTheme, 'name'));
        }
    };

    private findSelectedFilterIndex = (filter: IFilterOption): number =>
        this.selectedFilters.findIndex(el => el.code === filter.code && el.groupCode === filter.groupCode);

    private findSelectedParentThemeIndex = (filter: IFilterOption): number => {
        const parentCode = this.getThemeFilterParentCode(filter);

        if (parentCode) {
            return this.selectedFilters.findIndex(
                el => el.code === parentCode && el.groupCode === FilterGroupCodes.PackageTheme,
            );
        }

        return -1;
    };

    private findParentThemeFilter = (filter: IFilterOption): IFilterOption | undefined => {
        const parentCode = this.getThemeFilterParentCode(filter);

        if (parentCode) {
            const themes = this.filters.find(el => el.code === FilterGroupCodes.PackageTheme);

            return (themes?.options || []).find(el => el.code === parentCode);
        }

        return undefined;
    };

    private getThemeFilterParentCode = (filter: IFilterOption): Nullable<string> =>
        filter.code.length > 1 ? filter.code[0] : null;

    /**
     * Check if all selected regions belong to country with only one region
     */
    isSelectedRegionsBelongToOneRegionCountry = (): boolean => {
        const destinations = this.filters.find(el => el.code === FilterGroupCodes.Destination)?.options || [];

        const regions = this.rootStore.searchStore.searchTo.selectedDestinationCodes
            /** region code have length 4 */
            .filter(code => code.length === 4);

        if (!regions?.length) {
            return false;
        }

        return regions.every(code =>
            destinations.find(dest =>
                (dest.children || []).find(region => {
                    if (dest.destinationInfo?.type === DestinationType.VirtualCountry) {
                        return (
                            (dest.children || []).length === 1 &&
                            dest.destinationInfo?.relatedRegions.length &&
                            dest.destinationInfo?.relatedRegions.some(rc => rc === code)
                        );
                    }

                    return region.code === code && (dest.children || []).length === 1;
                }),
            ),
        );
    };

    /**
     * @params destinationCountry - filter destination country option
     * Check if all selected regions belong to country with only one region or we selected country
     */
    isSelectedCountry = (destinationCountry: IFilterOption): string | undefined =>
        this.rootStore.searchStore.searchTo.selectedDestinationCodes.find(
            code =>
                destinationCountry.code === code ||
                (destinationCountry.children || []).find(
                    region => region.code === code && (destinationCountry.children || []).length === 1,
                ),
        );

    /**
     * Preset destination filter values.
     * Destination parent (Country/Region) should be selected if every child(region/resort) under country/region is selected.
     */
    @action presetDestinationFilter = (): void => {
        const destinations = this.filters.find(el => el.code === FilterGroupCodes.Destination)?.options || [];

        const checkIfMatchInQuery = (destinationChild: IFilterOption, parent: IFilterOption): boolean => {
            if (!destinationChild.code) {
                return false;
            }

            const selectedDestinationCodes = new Set(
                this.rootStore.searchStore.searchTo.selectedDestinationCodesQuery.split(/[|,]/),
            );

            // regions in Virtual Country are resorts, and the are not in selectedDestinationCodesQuery, so need to check parent code
            if (parent.destinationInfo?.type === DestinationType.VirtualCountry) {
                if (!parent.children?.some(ch => selectedDestinationCodes.has(ch.code))) {
                    return parent.destinationInfo?.relatedRegions.some(code => selectedDestinationCodes.has(code));
                }
            }

            const childCodeIsInQuery = selectedDestinationCodes.has(destinationChild.code);

            if (childCodeIsInQuery) {
                return true;
            }

            if (this.rootStore.layoutStore.isPromoPage) {
                return selectedDestinationCodes.has(parent.code);
            }

            return false;
        };

        /** If user select several countries and regions, which is from one region country, we don't need make selection of them */
        if (!this.isSelectedRegionsBelongToOneRegionCountry()) {
            let totalRegions = 0;
            const selectedQueue: IFilterOption[] = [];

            destinations.forEach(destinationParent => {
                (destinationParent.children || []).forEach(destinationChild => {
                    // virtual region will be already selected if related regions are selected
                    if (destinationChild.destinationInfo?.type === DestinationType.VirtualRegion) {
                        return;
                    }

                    totalRegions++;

                    const isMatchInQuery = checkIfMatchInQuery(destinationChild, destinationParent);

                    if (isMatchInQuery && this.findSelectedFilterIndex(destinationChild) === -1) {
                        selectedQueue.push(destinationChild);
                    }
                });
            });

            // no need to pre-check regions if all regions in all countries are selected
            if (totalRegions !== selectedQueue.length) {
                selectedQueue.forEach(r => {
                    this.onSelectDestinationFilter({
                        ...r,
                        preChecked: true,
                    });
                });
            }
        }

        this.changeIsPresetDestinationFilter(true);
    };

    /**
     * Preset duration filters.
     */
    @action presetDurationFilter = (): void => {
        try {
            const durations = this.filters.find(el => el.code === FilterGroupCodes.Duration)?.options || [];
            const currentDuration =
                this.selectedFilters.find(el => el.groupCode === FilterGroupCodes.Duration)?.code ||
                this.rootStore.searchStore.searchWhen.selectedNumberOfNights;
            let selectedDuration = durations.find(el => el.code == currentDuration);

            if (selectedDuration) {
                /** Should preset filter for default duration  */
                selectedDuration = {
                    ...selectedDuration,
                    preChecked: true,
                };
                this.addSelectedFilter(selectedDuration);
            }
        } finally {
            this.changeIsPresetDurationFilter(true);
        }
    };

    @action changeIsPresetDestinationFilter = (isPreset: boolean): void => {
        this.isPresetDestinationFilter = isPreset;
    };

    @action changeIsPresetDurationFilter = (isPreset: boolean): void => {
        this.isPresetDurationFilter = isPreset;
    };

    public isFilterGroupSelected = (filter: IFilterOption): boolean => {
        if (filter.groupCode === FilterGroupCodes.Destination && filter.children && filter.children.length > 0) {
            return filter.children.every(ch => this.findSelectedFilterIndex(ch) > -1);
        }

        const isSelected = this.findSelectedFilterIndex(filter) > -1;

        // Package type is selected if its parent selected. For Promo Page need check if this type is enabled.
        if (
            filter.groupCode === FilterGroupCodes.PackageTheme &&
            !isSelected &&
            (!this.rootStore.layoutStore.isPromoPage ||
                this.rootStore.promoPageStore.isPackageThemeEnabledOnPromoPage(filter.code))
        ) {
            return this.findSelectedParentThemeIndex(filter) > -1;
        }

        return isSelected;
    };

    private getApplyFiltersByCode(filterCode: FilterGroupCodes): Nullable<string> {
        if (this.areFiltersSelected) {
            return this.selectedFilters
                .filter(el => el.groupCode === filterCode)
                .map(el => el.code)
                .join(',');
        }

        return undefined;
    }

    private getApplyDepartureTimeFiltersByCode(
        filterCode: FilterGroupCodes.InboundDepartureTime | FilterGroupCodes.OutboundDepartureTime,
    ): Nullable<string> {
        if (this.areFiltersSelected) {
            return this.selectedFilters
                .filter(el => el.groupCode === filterCode)
                .map(el => el.atcomCode)
                .join(',');
        }

        return null;
    }

    @computed get offersFilters(): Nullable<string[]> {
        return (this.selectedFilters || []).filter(el => el.groupCode === FilterGroupCodes.Offers).map(el => el.code);
    }

    @computed get durationFilters(): Nullable<string[]> {
        return (this.selectedFilters || []).filter(el => el.groupCode === FilterGroupCodes.Duration).map(el => el.code);
    }

    @computed get boardTypeFilters(): string | undefined {
        return this.getApplyFiltersByCode(FilterGroupCodes.BoardType) || this.boardsFromUrl?.join(',') || undefined;
    }

    @computed get facilitiesFilters(): string | undefined {
        return (
            this.getApplyFiltersByCode(FilterGroupCodes.Facilities) || this.facilitiesFromUrl?.join(',') || undefined
        );
    }

    @computed get flightsFilters(): string | undefined {
        return this.getApplyFiltersByCode(FilterGroupCodes.Flights) || undefined;
    }

    @computed get starRatingFilters(): string | undefined {
        return (
            this.getApplyFiltersByCode(FilterGroupCodes.StarRating) || this.starRatingFromUrl?.join(',') || undefined
        );
    }

    @computed get tripAdvisorRatingFilters(): string | undefined {
        return (
            this.getApplyFiltersByCode(FilterGroupCodes.TripAdvisorRating) || this.tripAdvisorRatingFromUrl || undefined
        );
    }

    @computed get themeFilters(): string | undefined {
        return (
            this.getApplyFiltersByCode(FilterGroupCodes.PackageTheme) || this.themesCodesFromUrl?.join(',') || undefined
        );
    }

    @computed get inboundDepartureTimeFilters(): Nullable<string> {
        return this.getApplyDepartureTimeFiltersByCode(FilterGroupCodes.InboundDepartureTime);
    }

    @computed get outboundDepartureTimeFilters(): Nullable<string> {
        return this.getApplyDepartureTimeFiltersByCode(FilterGroupCodes.OutboundDepartureTime);
    }

    @computed get outboundFlightNumber(): string | undefined {
        return this.outboundFlightNumberFromUrl || undefined;
    }

    @computed get inboundFlightNumber(): string | undefined {
        return this.inboundFlightNumberFromUrl || undefined;
    }

    /** All destinations filters as filter objects */
    @computed get allDestinationFilters(): IFilterOption[] {
        const destinationFilter = getFilterByGroupCode(this.filters, FilterGroupCodes.Destination);

        return destinationFilter ? destinationFilter.options || [] : [];
    }

    /** All selected destinations filters as filter objects */
    @computed get selectedDestinationFilters(): ISelectedFilter[] {
        return (this.selectedFilters || []).filter(el => el.groupCode === FilterGroupCodes.Destination);
    }

    @computed get destinationFiltersWithParents(): string {
        if (!this.selectedDestinationFilters.length) {
            return '';
        }

        const countries = new Set();
        const regions = new Set();
        const resorts = new Set();

        this.selectedDestinationFilters.forEach(selectedFilter => {
            const parent = findParentFilter(this.allDestinationFilters, selectedFilter.code);

            if (!parent && selectedFilter.destinationInfo?.type !== DestinationType.Region) {
                return;
            }

            /* The parent doesn’t exist when regions are rendered on the page without resorts
             *  and the user selects a region rather than a resort. In this case we can’t resolve the parent,
             *  because in the filters response the region is the highest destination level available
             */
            const { destinationInfo: parentDestinationInfo } = parent || {};
            const destinationParentType = parentDestinationInfo?.type as DestinationType;
            const destinationSelectedType = selectedFilter.destinationInfo?.type as DestinationType;
            const isSelectedVirtualType = VIRTUAL_DESTINATION_TYPES.includes(destinationSelectedType);
            const isParentVirtualType = VIRTUAL_DESTINATION_TYPES.includes(destinationParentType);

            countries.add(parent ? parentDestinationInfo?.parent : selectedFilter.destinationInfo?.parent);

            if (!isParentVirtualType) {
                regions.add(parent ? parent.code : selectedFilter.code);
            }

            if (destinationParentType === DestinationType.VirtualCountry) {
                regions.add(parentDestinationInfo?.relatedRegions?.[0]);
            }

            if (!isSelectedVirtualType && parent) {
                resorts.add(selectedFilter?.code);
            }
        });

        return [countries, regions, resorts]
            .map(filters => Array.from(filters).filter(Boolean).join('|'))
            .filter(Boolean)
            .join(',');
    }

    @computed get hotelTypesFilters(): Nullable<string> {
        return this.getApplyFiltersByCode(FilterGroupCodes.HotelTypes);
    }

    @computed get promoCollectionFilters(): Nullable<string> {
        return this.getApplyFiltersByCode(FilterGroupCodes.PromoCollection);
    }

    @computed get priceFilterLabel(): string {
        const dictionary = getSelectedPriceRangeDictionary(
            this.filterPriceFrom,
            this.filterPriceTo,
            this.isPriceFilterPerPerson,
        );

        if (!dictionary) {
            return '';
        }

        const template = this.rootStore.layoutStore.getPhrase(dictionary);

        return Tokenizer.replaceTokens(template, {
            [Tokens.MinPrice]: this.rootStore.marketStore.formatMoney(this.filterPriceFrom || 0, {
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            }),
            [Tokens.MaxPrice]: this.rootStore.marketStore.formatMoney(this.filterPriceTo || 0, {
                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
            }),
        });
    }

    @computed get priceFilterLabelForTracking(): string {
        const minPrice = this.isPriceFilterPerPerson
            ? this.rootStore.hotelsStore.minPricePp
            : this.rootStore.hotelsStore.minPrice;
        const maxPrice = this.isPriceFilterPerPerson
            ? this.rootStore.hotelsStore.maxPricePp
            : this.rootStore.hotelsStore.maxPrice;

        const formatMoneyOptions = {
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        };

        const fromValue = this.rootStore.marketStore.formatMoney(
            this.filterPriceFrom ?? minPrice ?? 0,
            formatMoneyOptions,
        );
        const toValue = this.rootStore.marketStore.formatMoney(this.filterPriceTo ?? maxPrice ?? 0, formatMoneyOptions);

        return `${getRangeFilterTrackingValue(fromValue, toValue)}${this.isPriceFilterPerPerson ? ' pp' : ''}`;
    }

    @computed get weatherFilterLabel(): string {
        if (this.weatherFrom === null && this.weatherTo === null) {
            return '';
        }

        const template = this.rootStore.layoutStore.getPhrase(SitecoreDictionary.SearchPodFiltersLabelsWeatherFromTo);

        return Tokenizer.replaceTokens(template, {
            [Tokens.MinTemp]: (this.weatherFrom ?? this.minAvailableTemp ?? 0).toString(),
            [Tokens.MaxTemp]: (this.weatherTo ?? this.maxAvailableTemp ?? 0).toString(),
        });
    }

    @computed get weatherFilterLabelForTracking(): string {
        if (this.weatherFrom === null && this.weatherTo === null) {
            return '';
        }

        return getRangeFilterTrackingValue(
            (this.weatherFrom ?? this.minAvailableTemp ?? 0).toString(),
            (this.weatherTo ?? this.maxAvailableTemp ?? 0).toString(),
            RangeFilterTrackingUnits.Celsius,
        );
    }

    @computed get flightDurationFilterLabel(): Nullable<string> {
        const { flightDurationFrom: from, flightDurationTo: to } = this;

        if (from === MIN_FLIGHT_DURATION && to === MAX_FLIGHT_DURATION) return null;

        const { getPhrase } = this.rootStore.layoutStore;

        const template = getPhrase(SitecoreDictionary.SearchPodFiltersSelectedFlightDuration);

        return Tokenizer.replaceTokens(template, {
            [Tokens.From]: from.toString(),
            [Tokens.To]: to === MAX_FLIGHT_DURATION ? `${to}+` : to.toString(),
        });
    }

    @computed get flightDurationFilterLabelForTracking(): Nullable<string> {
        const { flightDurationFrom: from, flightDurationTo: to } = this;

        if (from === MIN_FLIGHT_DURATION && to === MAX_FLIGHT_DURATION) return null;

        return getRangeFilterTrackingValue(
            from.toString(),
            to === MAX_FLIGHT_DURATION ? `${to}+` : to.toString(),
            RangeFilterTrackingUnits.Hour,
            RangeFilterTrackingUnits.Hours,
            true,
        );
    }

    // re-using existing logic from SearchPodFiltersVariantA,
    // todo: should be refactored
    @computed get countableFilters(): ISelectedFilter[] {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useSelectedFilters(this.filters, [
            ...this.selectedFilters,
            ...(!!this.priceFilterLabel ? [{ groupCode: FilterGroupCodes.PriceRange }] : []),
            ...(!!this.flightDurationFilterLabel ? [{ groupCode: FilterGroupCodes.FlightDuration }] : []),
            ...(this.weatherFilterLabel ? [{ groupCode: FilterGroupCodes.Weather }] : []),
        ]);
    }

    @computed get isFilterActive(): boolean {
        return !!this.countableFilters.length;
    }

    @computed get areFiltersCollapsed(): boolean {
        return this.rootStore.hotelsStore.numberOfHotels <= MIN_TOTAL_ITEMS;
    }

    @computed get hideClearAllBtn(): boolean {
        return !!this.rootStore.layoutStore.layout.sitecore.route.fields?.HideClearAllButton?.value;
    }

    /**
     * Changing filters
     */

    @action setPriceFiltersValue = (
        priceFrom: number | null,
        priceTo: number | null,
        isPricePerPerson: boolean | null,
        needToTrack?: boolean,
    ): void => {
        this.filterPriceFrom = priceFrom;
        this.filterPriceTo = priceTo;

        if (isPricePerPerson !== null) {
            this.isPriceFilterPerPerson = isPricePerPerson;
        }

        if (needToTrack) {
            this.rootStore.trackingStore.trackSearchFiltersUpdate(true, {
                groupCode: FilterGroupCodes.PriceRange,
                name: this.priceFilterLabelForTracking,
            });
        }
    };

    @action clearPriceFiltersValue = (needToTrack?: boolean): void => {
        if (needToTrack) {
            this.rootStore.trackingStore.trackSearchFiltersUpdate(false, {
                groupCode: FilterGroupCodes.PriceRange,
                name: this.priceFilterLabelForTracking,
            });
        }

        this.filterPriceFrom = null;
        this.filterPriceTo = null;
    };

    @action setFlightDurationValue = (values: number[], needToTrack?: boolean): void => {
        this.flightDurationFrom = values[0];
        this.flightDurationTo = values[1];

        if (needToTrack) {
            this.rootStore.trackingStore.trackSearchFiltersUpdate(true, {
                groupCode: FilterGroupCodes.FlightDuration,
                name: this.flightDurationFilterLabelForTracking ?? '',
            });
        }
    };

    @action clearFlightDurationValue = (needToTrack?: boolean): void => {
        if (needToTrack) {
            this.rootStore.trackingStore.trackSearchFiltersUpdate(false, {
                groupCode: FilterGroupCodes.FlightDuration,
                name: this.flightDurationFilterLabelForTracking ?? '',
            });
        }

        this.flightDurationFrom = MIN_FLIGHT_DURATION;
        this.flightDurationTo = MAX_FLIGHT_DURATION;
    };

    @action setWeatherValue = (values: (number | null)[], needToTrack?: boolean): void => {
        this.weatherFrom = values[0];
        this.weatherTo = values[1];

        if (needToTrack) {
            this.rootStore.trackingStore.trackSearchFiltersUpdate(true, {
                groupCode: FilterGroupCodes.Weather,
                name: this.weatherFilterLabelForTracking ?? '',
            });
        }
    };

    @action setMinAvailableTemp = (value: number | null): void => {
        this.minAvailableTemp = value;
    };

    @action setMaxAvailableTemp = (value: number | null): void => {
        this.maxAvailableTemp = value;
    };

    @action clearWeatherValue = (needToTrack?: boolean): void => {
        if (needToTrack) {
            this.rootStore.trackingStore.trackSearchFiltersUpdate(false, {
                groupCode: FilterGroupCodes.Weather,
                name: this.weatherFilterLabelForTracking ?? '',
            });
        }

        this.weatherFrom = null;
        this.weatherTo = null;
    };

    @action clearFlightNumberValues = (): void => {
        this.inboundFlightNumberFromUrl = null;
        this.outboundFlightNumberFromUrl = null;
    };

    // todo: dead code ?
    @action onSelectFilterGroup = (filterCode: FilterGroupCodes) => {
        this.activeFilterCode = this.activeFilterCode !== filterCode ? filterCode : FilterGroupCodes.NoFilter;
    };

    @action setIsPriceFilterPerPerson = (isPriceFilterPerPerson: boolean): void => {
        this.isPriceFilterPerPerson = isPriceFilterPerPerson;
    };

    // todo: dead code ?
    @action onCloseFilters = () => (this.activeFilterCode = FilterGroupCodes.NoFilter);

    @action onClearAllFilters = (): void => {
        this.filters = [];
        this.onCloseFilters();
        this.changeIsPresetDestinationFilter(false);
        this.onClearAllSelectedFilters();
        this.clearPriceFiltersValue();
    };

    @action onClearAllSelectedFilters = (needToTrack?: boolean): void => {
        this.selectedFilters = [];

        this.clearPriceFiltersValue();
        this.clearFlightDurationValue();
        this.clearWeatherValue();
        this.clearFlightNumberValues();

        needToTrack && this.rootStore.trackingStore.trackSearchFiltersUpdate(false);
    };

    @action onRemoveSelectedFilter = (filterGroupCode: string, filterCode: string, needToTrack?: boolean): void => {
        if (filterGroupCode === FilterGroupCodes.PriceRange) {
            return this.clearPriceFiltersValue(needToTrack);
        }

        if (filterGroupCode === FilterGroupCodes.FlightDuration) {
            return this.clearFlightDurationValue(needToTrack);
        }

        if (filterGroupCode === FilterGroupCodes.Weather) {
            return this.clearWeatherValue(needToTrack);
        }

        const filter = { code: filterCode, groupCode: filterGroupCode } as IFilterOption;
        const filterIndexToRemove = this.findSelectedFilterIndex(filter);

        if (filterIndexToRemove === -1) return;

        if (needToTrack) {
            this.rootStore.trackingStore.trackSearchFiltersUpdate(false, this.selectedFilters[filterIndexToRemove]);
        }

        if (filterGroupCode === FilterGroupCodes.Destination) {
            // if country, remove all children
            const removeCountry = this.allDestinationFilters.find(el => el.code === filterCode);

            if (removeCountry) {
                this.onSelectDestinationFilter(removeCountry);

                return;
            }

            // if it's virtual region, remove all related regions
            let virtualRegion: IFilterOption | undefined;

            this.allDestinationFilters.some(c =>
                c.children?.some(ch => {
                    if (ch.destinationInfo?.type === DestinationType.VirtualRegion && ch.code == filterCode) {
                        virtualRegion = ch;

                        return true;
                    }

                    return false;
                }),
            );

            if (virtualRegion) {
                this.onSelectDestinationFilter(virtualRegion);

                return;
            }
        }

        if (filterGroupCode === FilterGroupCodes.BoardType) {
            this.onSelectBoardsFilter(filter);

            return;
        }

        this.removeSelectedFilterByIndex(filterIndexToRemove);

        // Preset default destinations filter values, if no destinations filters are currently selected
        if (
            filterGroupCode === FilterGroupCodes.Destination &&
            !this.selectedFilters.some(filter => filter.groupCode === FilterGroupCodes.Destination)
        ) {
            this.presetDestinationFilter();
        }
    };

    @action private addSelectedFilter = (filters: IFilterOption) => {
        this.selectedFilters.push({
            ...(filters.atcomCode ? { atcomCode: filters.atcomCode } : {}),
            code: filters.code,
            name: filters.name,
            groupCode: filters.groupCode!,
            preChecked: filters.preChecked!,
            destinationInfo: filters.destinationInfo,
            isExclusive: filters.isExclusive,
        });
    };

    @action private removeSelectedFilterByIndex = (index: number) => {
        this.selectedFilters.splice(index, 1);
    };

    @action onSelectFilters = (
        filter?: IFilterOption,
        needToTrack?: boolean,
        quickFilterType?: TQuickFilterType,
    ): void => {
        // Clear flights filters to avoid inconsistencies in search criteria provoking 0 results
        this.clearFlightNumberValues();

        if (!filter?.groupCode) {
            return;
        }

        const filterIndex = this.findSelectedFilterIndex(filter);
        let isSelectAction = filterIndex === -1;

        switch (filter.groupCode) {
            case FilterGroupCodes.TripAdvisorRating:
            case FilterGroupCodes.Duration: {
                // isSelectAction is always true for radio filters because previously selected filter
                // will be always removed and new one will be added
                this.onSelectRadioFilter(filter);
                break;
            }

            case FilterGroupCodes.PackageTheme: {
                isSelectAction = this.onSelectThemeFilter(filter);
                break;
            }

            case FilterGroupCodes.Destination: {
                isSelectAction = this.onSelectDestinationFilter(filter);
                break;
            }

            case FilterGroupCodes.BoardType: {
                isSelectAction = this.onSelectBoardsFilter(filter);
                break;
            }

            default:
                if (isSelectAction) {
                    this.addSelectedFilter(filter);
                } else {
                    this.removeSelectedFilterByIndex(filterIndex);
                }
        }

        if (isSelectAction && this.rootStore.layoutStore.isSearchResultsPage) {
            this.saveRecentlyUsedFilterToLocalStage(filter);
        }

        if (needToTrack) {
            this.rootStore.trackingStore.trackSearchFiltersUpdate(isSelectAction, filter, quickFilterType);
        }
    };

    @action private readonly saveRecentlyUsedFilterToLocalStage = (filter: IFilterOption): void => {
        if ([FilterGroupCodes.Destination, FilterGroupCodes.Flights].includes(filter.groupCode)) {
            // Do not save destination and flight filters to recently used filters because of big variety of these filters and to avoid confusions for users
            return;
        }

        const recentlyUsedFiltersKey = buildKeyBasedOnMarket(
            WebStorageKeys.RecentlyUsedFilters,
            this.rootStore.marketStore.marketCode,
        );

        const recentlyUsedFiltersFromLocalStorage = getWebStorageItem(recentlyUsedFiltersKey, true) || [];
        const validFilters = normalizeRecentlyUsedFilters(recentlyUsedFiltersFromLocalStorage, filter);

        setWebStorageItem(recentlyUsedFiltersKey, validFilters);
    };

    @action onSelectRadioFilter = (filter: IFilterOption): void => {
        const filterIndex = this.selectedFilters.findIndex(el => el.groupCode === filter.groupCode);

        if (filterIndex > -1) {
            this.removeSelectedFilterByIndex(filterIndex);
        }

        this.addSelectedFilter(filter);
    };

    @action onSelectThemeFilter = (filter: IFilterOption): boolean => {
        const filterIndex = this.findSelectedFilterIndex(filter);
        const parentFilter = this.findParentThemeFilter(filter);
        const parentIndex = !!parentFilter && filterIndex === -1 ? this.findSelectedParentThemeIndex(filter) : -1;
        const { isPromoPage } = this.rootStore.layoutStore;
        let isSelectAction = false;

        if (filterIndex > -1) {
            // Deselect filter
            this.removeSelectedFilterByIndex(filterIndex);
        } else if (parentIndex > -1) {
            // Deselect parent theme filter
            this.removeSelectedFilterByIndex(parentIndex);
            // Select current filter siblings
            (parentFilter?.children || []).forEach(
                ch =>
                    ch.code !== filter.code &&
                    (!isPromoPage || this.rootStore.promoPageStore.isPackageThemeEnabledOnPromoPage(ch.code)) &&
                    this.addSelectedFilter(ch),
            );
        } else {
            isSelectAction = true;

            const needAddParent =
                parentFilter &&
                parentFilter.count > 0 &&
                parentFilter.count ===
                    parentFilter.children?.reduce(
                        (total, ch) => (total += this.findSelectedFilterIndex(ch) > -1 ? ch.count : 0),
                        filter.count,
                    );

            const filterToAdd = needAddParent ? parentFilter : filter;

            // Select filter
            this.addSelectedFilter(filterToAdd);
            // Deselect filter children
            (filterToAdd.children || []).forEach(ch => {
                const i = this.findSelectedFilterIndex(ch);
                i > -1 && this.removeSelectedFilterByIndex(i);
            });
        }

        return isSelectAction;
    };

    /**
     * Filters on select boards filters.
     * Will add/remove filters with board group, when board group equal selected filter code.
     */
    @action onSelectBoardsFilter = (filter: IFilterOption): boolean => {
        const filterIndex = this.findSelectedFilterIndex(filter);
        const isSelectAction = filterIndex === -1;
        const boardFilters = this.filters.find(filter => filter.code === FilterGroupCodes.BoardType)?.options || [];
        const boardGroup = boardFilters.filter(el => el.boardGroup?.code === filter.code) || [];
        const filterChildren = boardFilters.find(el => el.code === filter.code)?.children || [];

        if (isSelectAction) {
            this.addSelectedFilter(filter);
            [...boardGroup, ...filterChildren].forEach(el => {
                const i = this.findSelectedFilterIndex(el);
                i === -1 && this.addSelectedFilter(el);
            });
        } else {
            this.removeSelectedFilterByIndex(filterIndex);
            [...boardGroup, ...filterChildren].forEach(el => {
                const i = this.findSelectedFilterIndex(el);
                i !== -1 && this.removeSelectedFilterByIndex(i);
            });
        }

        return isSelectAction;
    };

    @action onSelectDestinationFilter = (filter: IFilterOption): boolean => {
        // if it's a country (has children) add/remove it's children
        if (filter.children && filter.children.length > 0) {
            const isDestinationSelected = this.isFilterGroupSelected(filter);
            const isAllCountryDestinationPreChecked = filter.children
                .filter(ch => ch.destinationInfo?.type !== DestinationType.VirtualRegion) // no need to check virtual regions, as it will be checked if related checked
                .every(ch => {
                    const index = this.findSelectedFilterIndex(ch);

                    return index > -1 && this.selectedFilters[index].preChecked;
                });

            (filter.children || []).forEach(childFilter => {
                const i = this.findSelectedFilterIndex(childFilter);

                if (isDestinationSelected) {
                    i > -1 &&
                        (!this.selectedFilters[i].preChecked || isAllCountryDestinationPreChecked) &&
                        this.removeSelectedFilterByIndex(i);
                } else {
                    i === -1 && this.addSelectedFilter(childFilter);
                }
            });

            this.selectVirtualRegionIfAllRelatedSelected();
        }

        // if it's virtual region add/remove all related regions
        if (filter.destinationInfo?.type === DestinationType.VirtualRegion) {
            this.toggleRelatedDestinationFilters(filter, filter.destinationInfo.relatedRegions);
        }

        // if it's virtual resort add/remove all related resorts
        if (filter.destinationInfo?.type === DestinationType.VirtualResort) {
            this.toggleRelatedDestinationFilters(filter, filter.destinationInfo.relatedResorts ?? []);
        }

        const filterIndex = this.findSelectedFilterIndex(filter);
        const isSelectAction = filterIndex === -1;

        if (isSelectAction) {
            this.addSelectedFilter(filter);
        } else {
            this.removeSelectedFilterByIndex(filterIndex);
        }

        if (!filter.children) {
            this.onSelectDestinationCountryFilter();

            if (filter.destinationInfo?.type !== DestinationType.VirtualRegion) {
                this.selectVirtualRegionIfAllRelatedSelected();
            }
        }

        const isHaveDestination = this.selectedFilters.filter(el => el.groupCode === FilterGroupCodes.Destination);

        if (!isHaveDestination.length) {
            this.changeIsPresetDestinationFilter(false);
            this.presetDestinationFilter();
        }

        return isSelectAction;
    };

    private readonly toggleRelatedDestinationFilters = (filters: IFilterOption, relatedCodes: string[]): void => {
        const parent = findParentFilter(this.allDestinationFilters, filters.code);

        if (!parent) return;

        const relatedChildren = parent.children?.filter(ch => relatedCodes.includes(ch.code)) || [];
        const isDestinationSelected = this.isFilterGroupSelected(filters);

        relatedChildren.forEach(childFilter => {
            const i = this.findSelectedFilterIndex(childFilter);

            if (isDestinationSelected) {
                i > -1 && this.removeSelectedFilterByIndex(i);
            } else {
                i === -1 && this.addSelectedFilter(childFilter);
            }
        });
    };

    /** Selected virtual region if all it's related regions are selected */
    @action selectVirtualRegionIfAllRelatedSelected = (): void => {
        const virtualRegionsDestinations: IFilterOption[] = [];

        this.allDestinationFilters.forEach(c => {
            const virtual = c.children?.filter(ch => ch.destinationInfo?.type === DestinationType.VirtualRegion);
            virtualRegionsDestinations.push(...(virtual || []));
        });

        const allSelected = virtualRegionsDestinations.filter(vc =>
            vc.destinationInfo?.relatedRegions.every(
                ch => this.selectedFilters.findIndex(el => el.code === ch && el.groupCode === vc.groupCode) > -1,
            ),
        );

        allSelected.forEach(r => {
            this.findSelectedFilterIndex(r) === -1 && this.addSelectedFilter(r);
        });

        const i = this.selectedFilters.findIndex(
            el =>
                el.groupCode === FilterGroupCodes.Destination &&
                el.destinationInfo?.type === DestinationType.VirtualRegion &&
                !allSelected.find(c => c.code === el.code),
        );
        i > -1 && this.removeSelectedFilterByIndex(i);
    };

    @action onSelectDestinationCountryFilter = (): void => {
        const filtersDestination = this.filters.find(el => el.code === FilterGroupCodes.Destination);

        if (filtersDestination) {
            const destinationSelectedCountry = filtersDestination.options.filter(
                el =>
                    el.children &&
                    el.children.length > 0 &&
                    el.children.every(ch => this.findSelectedFilterIndex(ch) > -1),
            );

            if (destinationSelectedCountry.length) {
                destinationSelectedCountry.forEach(country => {
                    this.findSelectedFilterIndex(country) === -1 && this.addSelectedFilter(country);
                });
            }

            const i = this.selectedFilters.findIndex(
                el =>
                    el.groupCode === FilterGroupCodes.Destination &&
                    el.destinationInfo?.type === DestinationType.Country &&
                    !destinationSelectedCountry.find(country => country.code === el.code),
            );
            i > -1 && this.removeSelectedFilterByIndex(i);
        }
    };

    @action clearFilterStoreValues = (): void => {
        this.onCloseFilters();
        this.onClearAllSelectedFilters();
    };

    public isFilterGroupDisabled = (group: IFilters): boolean => {
        const { code, options } = group;

        /** Disable all filters if user on the No Search Results page and came from iframe in easyjet.com EJH-8824 */
        if (this.rootStore.queryParamsStore.isReferer && !this.rootStore.hotelsStore.hasOffers) {
            return true;
        }

        if (code === FilterGroupCodes.HotelTypes) {
            const hotelTypesOption = this.getPreparedGroupContent(code);

            return !hotelTypesOption.some(el => el.count > 0);
        }

        if (!options?.length) {
            return true;
        }

        /** Destination should be disabled if all resorts under country is selected on filters */
        if ([FilterGroupCodes.Destination, FilterGroupCodes.Flights].indexOf(code) > -1) {
            return !this.rootStore.hotelsStore.numberOfHotels && this.isAllFilterGroupItemsSelected(group, code);
        }

        if (
            code !== FilterGroupCodes.PriceRange &&
            code !== FilterGroupCodes.FlightDuration &&
            code !== FilterGroupCodes.Weather
        ) {
            /** specific logic for the price filter, because it based on max/min price. */

            return !options.some(el => el.count > 0);
        }

        return false;
    };

    public isFilterGroupActive = (group: IFilters): boolean => this.selectedFilterGroups.has(group.code);

    /**
     * Should return true if all filters under filter group are selected
     */
    private isAllFilterGroupItemsSelected = (filters: IFilters, groupCode: FilterGroupCodes) => {
        const selectedFilters = this.selectedFilters.filter(el => el.groupCode === groupCode);

        return filters.options.every(
            el =>
                !!selectedFilters.find(x => x.code === el.code) &&
                (el.children || []).every(e => !!selectedFilters.find(x => x.code === e.code)),
        );
    };

    /**
     * Save filters params from URL. (It's used when the URL is generated for requested price search.)
     */
    @action public getFiltersParamsFromQueryParamsStore = (): void => {
        this.boardsFromUrl = this.rootStore.queryParamsStore.boardTypeFromUrl?.split(',');
        this.facilitiesFromUrl = this.rootStore.queryParamsStore.facilitiesFromUrl;
        this.themesCodesFromUrl = this.rootStore.queryParamsStore.themesCodesFromUrl;
        this.starRatingFromUrl = this.rootStore.queryParamsStore.starRatingFromUrl;
        this.tripAdvisorRatingFromUrl = this.rootStore.queryParamsStore.tripAdvisorRatingFromUrl;
        this.outboundFlightNumberFromUrl = this.rootStore.queryParamsStore.outboundFlightNumber;
        this.inboundFlightNumberFromUrl = this.rootStore.queryParamsStore.inboundFlightNumber;
    };

    @action clearFiltersFromUrl = (): void => {
        this.boardsFromUrl = null;
        this.facilitiesFromUrl = null;
        this.themesCodesFromUrl = null;
        this.starRatingFromUrl = null;
        this.tripAdvisorRatingFromUrl = null;
    };

    /** Select all filters that stored in url. */
    @action selectFiltersFromUrl = (): void => {
        this.selectFilterGroupFromUrl(FilterGroupCodes.BoardType, this.boardsFromUrl);
        this.selectFilterGroupFromUrl(FilterGroupCodes.Facilities, this.facilitiesFromUrl);
        this.selectFilterGroupFromUrl(FilterGroupCodes.PackageTheme, this.themesCodesFromUrl);
        this.selectFilterGroupFromUrl(FilterGroupCodes.StarRating, this.starRatingFromUrl);
        !!this.tripAdvisorRatingFromUrl &&
            this.selectFilterGroupFromUrl(FilterGroupCodes.TripAdvisorRating, [this.tripAdvisorRatingFromUrl]);
        this.selectDestinationFilterFromUrl();

        this.clearFiltersFromUrl();
    };

    @action selectFilterGroupFromUrl = (groupCode: FilterGroupCodes, valuesFromUrl: Nullable<string[]>): void => {
        const options = this.filters.find(el => el.code === groupCode)?.options;

        if (!valuesFromUrl?.length || !options?.length) return;

        valuesFromUrl.forEach(code => {
            const filterToSelect = findFilterOptionByCode(options, code);
            filterToSelect && this.addSelectedFilter(filterToSelect);
        });
    };

    @action selectDestinationFilterFromUrl = () => {
        // Select the destination from url on Promo Page
        const destinationFromUrl =
            (this.rootStore.layoutStore.isPromoPage && this.rootStore.promoPageStore.destinationFromUrl) || null;

        if (destinationFromUrl) {
            const filterToSelect = findFilterOptionByCode(this.allDestinationFilters, destinationFromUrl);

            if (filterToSelect && !this.isFilterGroupSelected(filterToSelect)) {
                this.onSelectDestinationFilter(filterToSelect);
            }

            // remove destination from url filter after first search by dates
            if (this.rootStore.searchStore.searchWhen.selectedNumberOfNights > 0) {
                this.rootStore.promoPageStore.resetDestinationsFromUrl();
            }
        }
    };

    @computed get isFiltersLoadingScreenDisplayed(): boolean {
        return (
            isLoadingStatus(this.rootStore.hotelsStore.status) &&
            this.rootStore.layoutStore.isPromoPage &&
            this.isFiltersLoadingScreenEnabled
        );
    }

    @action hideAllFilter = (hide: boolean, availableFilters: IFilters[]): void => {
        const filterCodes = hide
            ? this.selectedFilterGroups
            : availableFilters.filter(filter => !this.selectedFilterGroups.has(filter.code)).map(filter => filter.code);

        filterCodes.forEach(code => this.onSelectGroup(code));
    };

    @action onSelectGroup = (filterCode: FilterGroupCodes): void => {
        this.selectedFilterGroups.has(filterCode)
            ? this.selectedFilterGroups.delete(filterCode)
            : this.selectedFilterGroups.add(filterCode);
    };

    @action onRemoveFilterGroup = (filterGroupCode: FilterGroupCodes): void => {
        if (filterGroupCode === FilterGroupCodes.PriceRange) {
            return this.clearPriceFiltersValue();
        }

        if (filterGroupCode === FilterGroupCodes.FlightDuration) {
            return this.clearFlightDurationValue();
        }

        if (filterGroupCode === FilterGroupCodes.Weather) {
            return this.clearWeatherValue();
        }

        if (filterGroupCode === FilterGroupCodes.FlightTimes) {
            this.selectedFilters = this.selectedFilters.filter(
                el =>
                    el.groupCode !== FilterGroupCodes.InboundDepartureTime &&
                    el.groupCode !== FilterGroupCodes.OutboundDepartureTime,
            );

            return;
        }

        if (filterGroupCode === FilterGroupCodes.StarRating || filterGroupCode === FilterGroupCodes.TripAdvisorRating) {
            this.selectedFilters = this.selectedFilters.filter(
                el =>
                    el.groupCode !== FilterGroupCodes.StarRating && el.groupCode !== FilterGroupCodes.TripAdvisorRating,
            );

            return;
        }

        if (filterGroupCode === FilterGroupCodes.HotelTypes) {
            this.selectedFilters = this.selectedFilters.filter(
                el => el.groupCode !== filterGroupCode && el.groupCode !== FilterGroupCodes.PromoCollection,
            );

            return;
        }

        if (
            filterGroupCode === FilterGroupCodes.Destination &&
            this.rootStore.layoutStore.isPromoPage &&
            !this.rootStore.layoutStore.isPreviewMode
        ) {
            this.rootStore.promoPageStore.resetDestinationsFromUrl();
        }

        this.selectedFilters = this.selectedFilters.filter(el => el.groupCode !== filterGroupCode);
    };

    // new api
    //===================

    @computed get filterGroups(): IFilters[] {
        const excludedCodes = [FilterGroupCodes.PromoCollection];

        const starRatingIndex = this.filters.findIndex(f => f.code === FilterGroupCodes.StarRating);
        const tripAdvisorIndex = this.filters.findIndex(f => f.code === FilterGroupCodes.TripAdvisorRating);

        const hasStarRating = starRatingIndex !== -1;
        const hasTripAdvisor = tripAdvisorIndex !== -1;

        let ratingCodeToExclude: Nullable<FilterGroupCodes> = null;

        if (hasStarRating && hasTripAdvisor) {
            ratingCodeToExclude =
                starRatingIndex < tripAdvisorIndex ? FilterGroupCodes.TripAdvisorRating : FilterGroupCodes.StarRating;
        }

        if (ratingCodeToExclude) {
            excludedCodes.push(ratingCodeToExclude);
        }

        return this.filters.filter(el => !excludedCodes.includes(el.code));
    }

    @computed get weatherFilter(): IFilters | undefined {
        return this.filters.find(item => item.code === FilterGroupCodes.Weather && item.options?.length > 0);
    }

    @computed get filterData(): Map<FilterGroupCodes, IFilters> {
        return new Map(this.filters.map(item => [item.code, item]));
    }

    @action onClear = (code: FilterGroupCodes) => {
        this.onRemoveFilterGroup(code);
        this.loadContent();
    };

    @action onChange = (filter?: IFilterOption, quickFilterType?: TQuickFilterType): void => {
        //INS-1445: Reset destinations from URL after interaction with Pre-selected filter to be able unselect the filter from url on promo page
        if (
            this.rootStore.layoutStore.isPromoPage &&
            filter?.groupCode === FilterGroupCodes.Destination &&
            !this.rootStore.layoutStore.isPreviewMode
        ) {
            const { destinationFromUrl } = this.rootStore.promoPageStore;
            const parent = findParentFilter(this.allDestinationFilters, filter.code);

            const isDestinationFromUrlChanged =
                filter?.code === destinationFromUrl || parent?.code === destinationFromUrl;

            if (isDestinationFromUrlChanged) {
                this.rootStore.promoPageStore.resetDestinationsFromUrl();
            }
        }

        this.onSelectFilters(filter, true, quickFilterType);
        this.onApply();
    };

    @action setIsCountHidden = (isHidden: boolean): void => {
        this.isCountHidden = isHidden;
    };

    @action onTitleClick = (code: FilterGroupCodes) => {
        const group = this.filterData.get(code);

        if (!group) return;

        const isDisabled = this.isFilterGroupDisabled(group);

        if (!isDisabled) {
            this.onSelectGroup(code);
        }
    };

    @computed get areFiltersSelected(): boolean {
        return !!this.selectedFilters.length || this.filterPriceFrom != null || this.filterPriceTo != null;
    }

    @action onChangeSearchFilterStore = <T>({
        key,
        value,
        cb,
    }: {
        cb?: (ctx: SearchFilterStore) => void;
        key?: string;
        value?: string | boolean | Set<T>;
    }) => {
        if (typeof cb === 'function') {
            cb(this);

            return;
        }

        if (!key) return;

        if (key in this) {
            this[key] = value;
        }
    };

    getGroupContent = (code: FilterGroupCodes): IFilterOption[] => {
        const group = this.filterData.get(code);

        return group?.options ?? [];
    };

    isOptionDisabled = (count: number, code: FilterGroupCodes, option?: IFilterOption): boolean => {
        if (code === FilterGroupCodes.Flights) {
            const content = this.getGroupContent(code);

            if (this.rootStore.layoutStore.isPromoPage) {
                return !count;
            }

            return !count || content.length === 1 || content.filter(el => el.count).length === 1;
        }

        if (code === FilterGroupCodes.HotelTypes && option) {
            return isExclusiveFilterDisabled(option, this.selectedFilters) || !count;
        }

        if (code === FilterGroupCodes.Destination && option) {
            return this.isLastSelectDestination(option);
        }

        return !count;
    };

    getPreparedGroupContent = (code: FilterGroupCodes): IFilterOption[] => {
        const content = this.getGroupContent(code);

        // all exceptions below should be filtered on BE

        if (code === FilterGroupCodes.Flights && content.length) {
            return getDepartureAirportsWithCountryName(
                content.filter(f => f.code !== DEPARTURE_ALL_CODE),
                this.rootStore.searchStore.originsWithNames,
                this.rootStore.marketStore.marketCode,
            ) as IFilterOption[];
        }

        if (code === FilterGroupCodes.Facilities && content.length) {
            const { ShowFacilityFilterGroupList: facilityList } = this.rootStore.layoutStore;

            return facilityList ? content.filter(option => facilityList.includes(option.name)) : [];
        }

        if (code === FilterGroupCodes.BoardType && content.length) {
            return content.filter(o => !o.boardGroup);
        }

        if (code === FilterGroupCodes.HotelTypes) {
            const promoCollectionContent = this.getGroupContent(FilterGroupCodes.PromoCollection);

            return [...promoCollectionContent, ...content];
        }

        return content;
    };

    isLastSelectDestination = (option: IFilterOption): boolean => {
        const destinationSelected = this.selectedFilters.filter(el => el.groupCode === FilterGroupCodes.Destination);

        // disable Destination checkbox regions and countries
        if (!option.count) return true;

        const {
            layoutStore: { isPromoPage },
            searchStore: {
                searchTo: { selectedDestinationCodesQuery },
            },
        } = this.rootStore;

        if (isPromoPage) return false;

        const query = new Set(selectedDestinationCodesQuery.split(','));

        // no need to disable last virtual region when we are on promo page
        if (option.destinationInfo?.type === DestinationType.VirtualRegion) {
            const selectedVirtual = destinationSelected.filter(
                d => d.destinationInfo?.type === DestinationType.VirtualRegion,
            );

            if (selectedVirtual.length === 1 && selectedVirtual[0].code === option.code) {
                const allInVirtualInQuery = option.destinationInfo?.relatedRegions.every(r => query.has(r));

                if (allInVirtualInQuery) {
                    // if all virtual in query we should disable virtual if only regions in virtual currently selected
                    return option.destinationInfo?.relatedRegions.length + 1 === destinationSelected.length;
                }
            }

            return !option.count;
        }

        // we might need to disable checkbox if only last remains
        if (destinationSelected.length === 1 && destinationSelected[0].code === option.code) {
            const destinationFilters = this.getGroupContent(FilterGroupCodes.Destination);
            // if all countries was initially selected, than we don't need to disabled the last filter
            const areAllCountriesSelected = destinationFilters.every(c => {
                // if one child of virtual in query, it means that not all virtual country is selected
                if (c.destinationInfo?.type === DestinationType.VirtualCountry) {
                    return !c.children?.some(ch => query.has(ch.code));
                }

                return (
                    c.children?.every(ch => {
                        if (query.has(ch.code)) return true;

                        if (ch.destinationInfo?.type === DestinationType.VirtualRegion) {
                            return (ch.destinationInfo?.relatedRegions || []).every(code => query.has(code));
                        }

                        return false;
                    }) || c.children?.every(ch => !query.has(ch.code))
                );
            });

            return !areAllCountriesSelected;
        }

        return false;
    };
    //===================

    //overridable options in subclasses
    onClearAll = action(() => {
        const { searchStore, layoutStore, promoPageStore } = this.rootStore;

        if (layoutStore.isDynamicPromoPage) {
            this.onClearAllSelectedFilters(true);
            promoPageStore.updateSearchParamsAndExecuteSearch(false);
            searchStore.setPageNumber(1);

            return;
        }

        if (this.isMapModalDisplayed) {
            this.onClearAllSelectedFilters(true);
            this.rootStore.hotelsStore.getFilteredHotels();
        } else {
            this.onClearAllSelectedFilters(true);
            this.rootStore.routerStore.clearIsClickBackToSearch();
            this.changeIsPresetDestinationFilter(false);
            this.rootStore.hotelsStore.defaultLoadResults();
        }
    });

    onApply = action(() => {
        this.rootStore.routerStore.clearIsClickBackToSearch();
        this.loadContent();
    });

    loadContent = action(() => {
        if (this.rootStore.layoutStore.isDynamicPromoPage) {
            this.rootStore.promoPageStore.updateSearchParamsAndExecuteSearch(false);

            return;
        }

        if (this.isMapModalDisplayed) {
            this.rootStore.hotelsStore.getFilteredHotels();
        } else {
            this.rootStore.hotelsStore.defaultLoadResults();
        }
    });

    @action setRecommendedFilterExperimentTestVariant = (value: string | undefined): void => {
        this.recommendedFilterExperimentTestVariant = value;
    };

    @action setRecentlyUsedFilterExperimentTestVariant = (value: string | undefined): void => {
        this.recentlyUsedFilterExperimentTestVariant = value;
    };
}
