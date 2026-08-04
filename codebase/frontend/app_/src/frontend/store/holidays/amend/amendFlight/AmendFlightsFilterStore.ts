import { action, observable, toJS } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { formatDateL10n, isTimeInTimeSlots } from 'frontend/utils/date.utils';
import {
    buildAirportsFilterOptionsFromOffers,
    buildTimeFilterOptions,
    getTimeFiltersCounts,
} from 'frontend/utils/filter.utils';
import { compare } from 'frontend/utils/sort.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import {
    IFilterOption,
    IFilterOrderSetting,
    IFilters,
    ISelectedFilter,
    ITimeFilterOptionSetting,
} from 'models/data/IFilters';
import { IOffer } from 'models/data/IOffer';
import { ITimeSlot } from 'models/data/ITimeSlot';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export class AmendFlightsFilterStore {
    @observable filters: IFilters[] = [];
    @observable selectedFilters: ISelectedFilter[] = [];
    @observable activeFilterCode: FilterGroupCodes = FilterGroupCodes.NoFilter;

    private orderSettings: Nullable<IFilterOrderSetting[]>;
    private timeFilters: Nullable<ITimeFilterOptionSetting[]>;

    constructor(public rootStore: HolidaysRootStore) {}

    private filterByOutboundRoute = (item: IOffer, filters: string[]) =>
        filters.some(depCode =>
            item.transport.routes.find(
                ({ depPt, direction }) => direction === RouteDirection.Outbound && depPt === depCode,
            ),
        );

    private filterByRouteTime = (item: IOffer, filters: ITimeSlot[], routeDirection: RouteDirection) =>
        item.transport.routes.some(
            ({ depDate, direction }) =>
                direction === routeDirection && isTimeInTimeSlots(formatDateL10n(depDate, DATE_FORMATS.time), filters),
        );

    private findSelectedFilterIndex = (filter: IFilterOption): number =>
        this.selectedFilters.findIndex(el => el.code === filter.code && el.groupCode === filter.groupCode);

    @action setTimesFilters = (optionsSettings: Nullable<ITimeFilterOptionSetting[]>, alternativeOffers: IOffer[]) => {
        if (optionsSettings?.length) {
            this.setTimeFilter(
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                optionsSettings,
                SitecoreDictionary.AlternativeFlightsFiltersLabelsOutboundDepartureTimePill,
                alternativeOffers,
            );
            this.setTimeFilter(
                FilterGroupCodes.AltFlightsInboundDepartureTime,
                optionsSettings,
                SitecoreDictionary.AlternativeFlightsFiltersLabelsInboundDepartureTimePill,
                alternativeOffers,
            );
        }
    };

    @action setTimeFilter = (
        groupCode: FilterGroupCodes,
        optionsSettings: ITimeFilterOptionSetting[],
        pillDictionary: SitecoreDictionary,
        offers: IOffer[],
    ) => {
        const pillLabel = this.rootStore.layoutStore.getPhrase(pillDictionary);
        const options = buildTimeFilterOptions(
            optionsSettings,
            groupCode,
            optionName => Tokenizer.replaceToken(pillLabel, Tokens.Time, optionName.toLocaleLowerCase()) || optionName,
        );
        this.filters.push({ code: groupCode, options, name: groupCode });
        this.setTimeFiltersCounts(groupCode, offers);
    };

    @action setTimeFiltersCounts = (groupCode: FilterGroupCodes, offers: IOffer[]): void => {
        const filters = this.getFiltersGroup(groupCode);

        if (filters) {
            filters.options = getTimeFiltersCounts(filters, groupCode, offers);
        }
    };

    @action setFiltersOrder = (orderSettings: Nullable<IFilterOrderSetting[]>) => {
        const sortedFilters: IFilters[] = [];

        orderSettings?.forEach(item => {
            const code = item.fields?.Code?.value;
            const filterGroup = code ? this.getFiltersGroup(code) : null;

            filterGroup && sortedFilters.push(filterGroup);
        });

        this.filters = sortedFilters;
    };

    collectFiltersByGroupCode = () =>
        this.selectedFilters.reduce((acc, filter) => {
            let itemValue;
            switch (filter.groupCode) {
                case FilterGroupCodes.AltFlightsDepartureAirports:
                    itemValue = filter.code;
                    break;
                case FilterGroupCodes.AltFlightsOutboundDepartureTime:
                case FilterGroupCodes.AltFlightsInboundDepartureTime:
                    itemValue = toJS(filter.timeSlot);
                    break;
            }

            return {
                ...acc,
                [filter.groupCode]: [...(acc[filter.groupCode] || []), itemValue].filter(filter => !!filter),
            };
        }, {});

    onFilterItem = (item: IOffer, type: FilterGroupCodes, filters: (string | ITimeSlot)[]): boolean => {
        switch (type) {
            case FilterGroupCodes.AltFlightsDepartureAirports: {
                return this.filterByOutboundRoute(item, filters as string[]);
            }
            case FilterGroupCodes.AltFlightsOutboundDepartureTime: {
                return this.filterByRouteTime(item, filters as ITimeSlot[], RouteDirection.Outbound);
            }
            case FilterGroupCodes.AltFlightsInboundDepartureTime: {
                return this.filterByRouteTime(item, filters as ITimeSlot[], RouteDirection.Inbound);
            }

            default:
                return true;
        }
    };

    getFilteredOffers = (offers: IOffer[]) => {
        const selectedGroupedFilters = this.collectFiltersByGroupCode();

        return offers.filter(offer =>
            Object.entries(selectedGroupedFilters).every(([groupCode, values]) =>
                this.onFilterItem(offer, groupCode as FilterGroupCodes, values as (string | ITimeSlot)[]),
            ),
        );
    };

    getFiltersGroup(groupCode: FilterGroupCodes): Nullable<IFilters> {
        return this.filters.find(el => el.code === groupCode);
    }

    getSelectedFiltersByGroupCode(groupCode: FilterGroupCodes): ISelectedFilter[] {
        return (this.selectedFilters || []).filter(el => el.groupCode === groupCode) || [];
    }

    @action
    addFilterOptionsToGroup = (groupCode: FilterGroupCodes, options: IFilterOption[]) => {
        const isGroupFilterExists = this.filters.find(groupFilter => groupFilter.code === groupCode);

        if (!isGroupFilterExists) {
            this.filters = [...this.filters, { code: groupCode, options, name: groupCode }];

            return;
        }

        this.filters = this.filters.map(groupFilter => {
            if (groupFilter.code !== groupCode) {
                return groupFilter;
            }

            const optionsByName = options.reduce((accum, el) => ({ ...accum, [el.name]: el }), {});
            const newOptions = options.filter(opt => groupFilter.options.every(gOpt => gOpt.name !== opt.name));

            return {
                ...groupFilter,
                options: [...groupFilter.options.map(gOption => optionsByName[gOption.name] ?? gOption), ...newOptions],
            };
        });
    };

    isFilterGroupDisabled = (filters: IFilters): boolean => !filters.options?.length;

    isFilterSelected = (filter: IFilterOption): boolean => this.findSelectedFilterIndex(filter) !== -1;

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
        if (!filters?.groupCode) {
            return;
        }

        const filtersIndex = this.findSelectedFilterIndex(filters);

        if (filtersIndex !== -1) {
            this.selectedFilters.splice(filtersIndex, 1);
        } else {
            this.addSelectedFilter(filters);
        }

        this.selectedFilters = [...this.selectedFilters];
    };

    @action onSelectFilterGroup = (filterCode: FilterGroupCodes) => {
        this.activeFilterCode = this.activeFilterCode !== filterCode ? filterCode : FilterGroupCodes.NoFilter;
    };

    @action onRemoveSelectedFilter = (groupCode: string, code: string) => {
        const index = this.findSelectedFilterIndex({ code, groupCode } as IFilterOption);

        if (index !== -1) {
            this.selectedFilters.splice(index, 1);
        }

        this.selectedFilters = [...this.selectedFilters];
    };

    @action onClearAllSelectedFilters = () => {
        this.selectedFilters = [];
    };

    setInitiateFilters = (offers: IOffer[], { setDepartureFilter }: Partial<{ setDepartureFilter: boolean }> = {}) => {
        if (setDepartureFilter) {
            this.setDepartureFilters(offers);
        }

        this.setTimesFilters(this.timeFilters, offers);
        this.setFiltersOrder(this.orderSettings);
    };

    @action setDepartureFilters = (offers: IOffer[]) => {
        const prevDepartureFilter = this.getFiltersGroup(FilterGroupCodes.AltFlightsDepartureAirports);
        const options: IFilterOption[] = buildAirportsFilterOptionsFromOffers(
            offers,
            FilterGroupCodes.AltFlightsDepartureAirports,
        );

        if (options.length) {
            const disabledOptions = (
                prevDepartureFilter?.options.filter(option => !options.find(opt => opt.name === option.name)) || []
            ).map(option => ({
                ...option,
                count: 0,
            }));

            this.addFilterOptionsToGroup(
                FilterGroupCodes.AltFlightsDepartureAirports,
                [...options, ...disabledOptions].sort((a, b) => compare(a, b, 'name')),
            );
        }
    };

    set filterSettings({
        orderSettings,
        timeFilters,
    }: {
        orderSettings: Nullable<IFilterOrderSetting[]>;
        timeFilters: Nullable<ITimeFilterOptionSetting[]>;
    }) {
        this.orderSettings = orderSettings;
        this.timeFilters = timeFilters;
    }
}
