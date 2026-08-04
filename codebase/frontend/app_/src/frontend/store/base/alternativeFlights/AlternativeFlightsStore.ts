import { action, computed, makeObservable, observable } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { TRootStore } from 'frontend/store/IStores';
import { getAirportByCode } from 'frontend/utils/airports.utils';
import { formatDateL10n, isTimeInTimeSlots } from 'frontend/utils/date.utils';
import { buildTimeFilterOptions, getTimeFiltersCounts } from 'frontend/utils/filter.utils';
import { getRoute } from 'frontend/utils/route.utils';
import { compare, getSelectValueFromSortOrder, sortFlights } from 'frontend/utils/sort.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import {
    IFilterOption,
    IFilterOrderSetting,
    IFilters,
    ISelectedFilter,
    ITimeFilterOptionSetting,
} from 'models/data/IFilters';
import { ISelectOption } from 'models/data/ISelectOption';
import { ITimeSlot } from 'models/data/ITimeSlot';
import { AlternativeFlightsSortBy, TAlternativeFlightsSortOrderItem } from 'models/enum/AlternativeFlightsSortBy';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IAirportCountry } from 'models/sitecore/IAirportsData';

export class AlternativeFlightsStore {
    // Filters
    @observable filters: IFilters[] = [];
    @observable selectedFilters: ISelectedFilter[] = [];
    @observable activeFilterCode: FilterGroupCodes = FilterGroupCodes.NoFilter;

    @observable sortBy: AlternativeFlightsSortBy = AlternativeFlightsSortBy.PriceLowToHigh;
    @observable sortOptions: ISelectOption[] = [];

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    @computed get hasSelectedFilters(): boolean {
        return this.selectedFilters.length > 0;
    }

    @computed get selectedAirportsCodes(): string[] {
        return this.getSelectedFiltersByGroupCode(FilterGroupCodes.AltFlightsDepartureAirports).map(a => a.code);
    }

    @computed get selectedOutboundDepTimes(): ITimeSlot[] {
        return this.getSelectedTimeSlots(FilterGroupCodes.AltFlightsOutboundDepartureTime);
    }

    @computed get selectedInboundDepTimes(): ITimeSlot[] {
        return this.getSelectedTimeSlots(FilterGroupCodes.AltFlightsInboundDepartureTime);
    }

    @computed get departureAirportsQuery(): string {
        return this.selectedAirportsCodes.join(',') || this.rootStore.bookingStore.getOriginsWithOtherRoutes();
    }

    @computed get selectedSortOption(): Nullable<ISelectOption> {
        return this.sortOptions.find(o => o.value === this.sortBy);
    }

    @action clearStore = () => {
        this.filters = [];
        this.selectedFilters = [];
        this.activeFilterCode = FilterGroupCodes.NoFilter;
        this.sortBy = AlternativeFlightsSortBy.PriceLowToHigh;
    };

    @action initFilters = (
        orderSettings: IFilterOrderSetting[],
        timeOptionsSettings: ITimeFilterOptionSetting[],
        airports: IAirportCountry[],
        sortOrder: Nullable<TAlternativeFlightsSortOrderItem[]>,
        sortDefault: Nullable<TAlternativeFlightsSortOrderItem>,
    ) => {
        // init only if filters have been not init yet
        if (!this.filters.length) {
            this.setAirportsFilter(airports);
            this.setTimesFilters(timeOptionsSettings);
            this.setFiltersOrder(orderSettings);
        }

        if (!this.sortOptions.length) {
            this.setSortByInitially(sortOrder, sortDefault);
        }
    };

    @action setFilterOptionsCounts = (offers: IAlternativeOffer[]) => {
        this.setAirportsFilterCounts(offers);
        this.setTimeFiltersCounts(FilterGroupCodes.AltFlightsOutboundDepartureTime, offers);
        this.setTimeFiltersCounts(FilterGroupCodes.AltFlightsInboundDepartureTime, offers);
    };

    @action setSortByInitially = (
        sortOrder: Nullable<TAlternativeFlightsSortOrderItem[]>,
        sortDefault: Nullable<TAlternativeFlightsSortOrderItem>,
    ) => {
        this.sortBy = sortDefault?.fields?.Code?.value || AlternativeFlightsSortBy.PriceLowToHigh;
        this.sortOptions = sortOrder?.map(getSelectValueFromSortOrder) || [];
    };

    @action setAirportsFilter = (airports: IAirportCountry[]) => {
        const { origins } = this.rootStore.searchStore.searchFrom;

        // Don't show Airport Filter, if there is only single departure airport in search
        if (origins && origins.length <= 1) {
            return;
        }

        const options: IFilterOption[] = (origins || []).map(code => {
            const airport = getAirportByCode(code, airports);

            return {
                code: code,
                name: airport?.name || '',
                groupCode: FilterGroupCodes.AltFlightsDepartureAirports,
                count: 0,
            };
        });

        this.filters.push({
            code: FilterGroupCodes.AltFlightsDepartureAirports,
            options: options.sort((a, b) => compare(a, b, 'name')),
            name: FilterGroupCodes.AltFlightsDepartureAirports,
        });
    };

    @action setAirportsFilterCounts = (offers: IAlternativeOffer[]) => {
        const filters = this.getFiltersGroup(FilterGroupCodes.AltFlightsDepartureAirports);

        filters?.options.forEach(option => {
            option.count = offers.filter(offer => {
                const route = getRoute(offer, RouteDirection.Outbound);

                return route?.depPt === option.code;
            }).length;
        });
    };

    @action setTimesFilters = (optionsSettings: ITimeFilterOptionSetting[]) => {
        if (optionsSettings.length > 0) {
            this.setTimeFilter(
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                optionsSettings,
                SitecoreDictionary.AlternativeFlightsFiltersLabelsOutboundDepartureTimePill,
            );
            this.setTimeFilter(
                FilterGroupCodes.AltFlightsInboundDepartureTime,
                optionsSettings,
                SitecoreDictionary.AlternativeFlightsFiltersLabelsInboundDepartureTimePill,
            );
        }
    };

    @action setTimeFilter = (
        groupCode: FilterGroupCodes,
        optionsSettings: ITimeFilterOptionSetting[],
        pillDictionary: SitecoreDictionary,
    ) => {
        const pillLabel = this.rootStore.layoutStore.getPhrase(pillDictionary);
        const options = buildTimeFilterOptions(
            optionsSettings,
            groupCode,
            optionName => Tokenizer.replaceToken(pillLabel, Tokens.Time, optionName.toLocaleLowerCase()) || optionName,
        );
        this.filters.push({ code: groupCode, options, name: groupCode });
    };

    @action setTimeFiltersCounts = (groupCode: FilterGroupCodes, offers: IAlternativeOffer[]): void => {
        const filters = this.getFiltersGroup(groupCode);

        if (filters) {
            filters.options = getTimeFiltersCounts(filters, groupCode, offers);
        }
    };

    @action setFiltersOrder = (orderSettings: IFilterOrderSetting[]) => {
        const sortedFilters: IFilters[] = [];

        orderSettings.forEach(item => {
            const code = item.fields?.Code?.value;
            const filterGroup = code ? this.getFiltersGroup(code) : null;

            filterGroup && sortedFilters.push(filterGroup);
        });

        this.filters = sortedFilters;
    };

    @action setSortBy = (sortBy: AlternativeFlightsSortBy) => {
        this.sortBy = sortBy;
    };

    filterFlights = (flights: IAlternativeOffer[]): IAlternativeOffer[] => {
        if (!this.selectedFilters.length) {
            return flights;
        }

        // Return only flights that satisfy the applied filters
        return flights.filter(flight => this.isFlightFitSelectedFilters(flight));
    };

    isFlightFitSelectedFilters = (flight: IAlternativeOffer): boolean => {
        const outRoute = getRoute(flight, RouteDirection.Outbound);
        const inRoute = getRoute(flight, RouteDirection.Inbound);
        const airport = outRoute?.depPt;
        const outDepTime = outRoute ? formatDateL10n(outRoute.depDate, DATE_FORMATS.time) : '';
        const inDepTime = inRoute ? formatDateL10n(inRoute.depDate, DATE_FORMATS.time) : '';

        return (
            (!this.selectedAirportsCodes.length || (!!airport && this.selectedAirportsCodes.includes(airport))) &&
            (!this.selectedOutboundDepTimes.length || isTimeInTimeSlots(outDepTime, this.selectedOutboundDepTimes)) &&
            (!this.selectedInboundDepTimes.length || isTimeInTimeSlots(inDepTime, this.selectedInboundDepTimes))
        );
    };

    sortAndFilterFlights = (flights: IAlternativeOffer[]) => sortFlights(this.filterFlights(flights), this.sortBy);

    @action addSelectedFilter = (filters: IFilterOption) => {
        this.selectedFilters.push({
            code: filters.code,
            name: filters.pillLabel || filters.name,
            groupCode: filters.groupCode!,
            timeSlot: filters.timeSlot,
        });
    };

    @action onCloseFilters = () => (this.activeFilterCode = FilterGroupCodes.NoFilter);

    @action onSelectFilter = (filters?: IFilterOption) => {
        if (!filters?.groupCode) return;

        const filtersIndex = this.findSelectedFilterIndex(filters);
        const isSelectAction = filtersIndex === -1;

        if (isSelectAction) {
            this.addSelectedFilter(filters);
        } else {
            this.selectedFilters.splice(filtersIndex, 1);
        }

        this.selectedFilters = [...this.selectedFilters];

        this.rootStore.trackingStore.trackAlternativeFlightFiltersUpdate(isSelectAction, filters);
    };

    @action onSelectFilterGroup = (groupCode: FilterGroupCodes) => {
        this.activeFilterCode = this.activeFilterCode !== groupCode ? groupCode : FilterGroupCodes.NoFilter;
    };

    @action removeSelectedFilter = (groupCode: FilterGroupCodes, code: string) => {
        const index = this.findSelectedFilterIndex({ code, groupCode } as IFilterOption);

        if (index !== -1) {
            const name = this.selectedFilters[index].name;

            this.selectedFilters.splice(index, 1);

            this.rootStore.trackingStore.trackAlternativeFlightFiltersUpdate(false, {
                name,
                groupCode,
            });
        }
    };

    @action clearSelectedFilters = () => {
        this.selectedFilters = [];

        this.rootStore.trackingStore.trackAlternativeFlightFiltersUpdate(false);
    };

    isFilterGroupDisabled = (filters: IFilters): boolean => !filters.options?.length;

    isFilterSelected = (filter: IFilterOption): boolean => this.findSelectedFilterIndex(filter) !== -1;

    private getFiltersGroup(groupCode: FilterGroupCodes): Nullable<IFilters> {
        return this.filters.find(el => el.code === groupCode);
    }

    private getSelectedFiltersByGroupCode(groupCode: FilterGroupCodes): ISelectedFilter[] {
        return (this.selectedFilters || []).filter(el => el.groupCode === groupCode) || [];
    }

    private getSelectedTimeSlots(groupCode: FilterGroupCodes): ITimeSlot[] {
        return this.getSelectedFiltersByGroupCode(groupCode)
            .map(f => f.timeSlot)
            .filter(t => t?.start && t.end) as ITimeSlot[];
    }

    private findSelectedFilterIndex = (filter: IFilterOption): number =>
        this.selectedFilters.findIndex(el => el.code === filter.code && el.groupCode === filter.groupCode);
}
