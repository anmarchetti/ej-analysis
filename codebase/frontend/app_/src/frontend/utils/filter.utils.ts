import { DATE_FORMATS } from 'code/dates';
import {
    RECENTLY_USED_FILTERS_MAX_DISPLAY_LENGTH,
    RECENTLY_USED_FILTERS_MAX_LENGTH,
} from 'frontend/store/base/search/BaseSearchFilterStore';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IFilterOption, IFilters, ISelectedFilter, ITimeFilterOptionSetting } from 'models/data/IFilters';
import { FilterTypes } from 'models/data/IFiltersTypes';
import { IOffer } from 'models/data/IOffer';
import { MarketCode } from 'models/data/MarketSettings';
import { FilterGroupCodes, RANGE_FILTER_CODES } from 'models/enum/FilterGroupCodes';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { IAirport } from 'models/sitecore/IAirportsData';

import { sortDepartureAirportsAlphabetically } from './search/search.utils';
import { formatDateL10n, isTimeInRange } from './date.utils';
import { getRoute } from './route.utils';

export function getFilterTitle(code: string): string {
    return FilterTypes[code] || '';
}

/**
 *
 * @param boardFiltersOptions array filter options
 * Return filterOptions without the board groups and add option to its
 */
export function getBoardOptions(boardFiltersOptions: IFilterOption[]): IFilterOption[] {
    return boardFiltersOptions.reduce((res: IFilterOption[], code: IFilterOption) => {
        if (!!code.children?.length) {
            if (!code.boardGroup) {
                const filterIndex = res.findIndex(el => el.code === code.code);

                if (filterIndex <= -1) {
                    res.push(code);
                }
            } else {
                const { boardGroup, ...rest } = code;
                res.push({ ...boardGroup, ...rest });
            }
        }

        return res;
    }, [] as IFilterOption[]);
}

export function findFilterOptionByCode(options: IFilterOption[], code: string): Nullable<IFilterOption> {
    for (const opt of options) {
        const filter = opt.code === code ? opt : opt.children?.find(ch => ch.code === code);

        if (filter) {
            return filter;
        }
    }

    return null;
}

/**
 * Build IFilterOption[] by sitecore time options settings
 */
export function buildTimeFilterOptions(
    optionsSettings: ITimeFilterOptionSetting[],
    groupCode: FilterGroupCodes,
    buildPillLabel: (name: string) => string,
    timeFormat: string = DATE_FORMATS.timeFilter,
): IFilterOption[] {
    /** Format time value ignoring time zone */
    const getTime = (timeField: ISitecoreField<string>) => formatDateL10n(timeField?.value, timeFormat);

    const options: IFilterOption[] = [];

    optionsSettings.forEach(item => {
        if (!item.fields) return;

        const code = item.fields.Code?.value;
        const start = getTime(item.fields.StartTime);
        const end = getTime(item.fields.EndTime);
        const name = item.fields.Name.value || '';

        if (code && start && end) {
            options.push({
                groupCode,
                code,
                name,
                pillLabel: buildPillLabel(name),
                count: 0,
                timeSlot: { start, end },
            });
        }
    });

    return options;
}

export const buildAirportsFilterOptionsFromOffers = (
    offers: IOffer[],
    groupCode: FilterGroupCodes,
): IFilterOption[] => {
    const filtersByCode: Record<string, IFilterOption> = {};

    offers.forEach(offer => {
        const route = getRoute(offer, RouteDirection.Outbound);

        if (route) {
            const code = route.depPt;
            filtersByCode[code] = filtersByCode[code] || {
                code,
                name: route.depName,
                groupCode,
                count: 0,
            };

            filtersByCode[code].count += 1;
        }
    });

    return Object.values(filtersByCode);
};

export const getSelectedPriceRangeDictionary = (
    minPrice: number | null,
    maxPrice: number | null,
    isPerPerson: boolean,
): Nullable<string> => {
    if (!minPrice && !maxPrice) {
        return null;
    }

    if (minPrice && maxPrice) {
        return isPerPerson
            ? SitecoreDictionary.SearchPodFiltersSelectedPricePerPersonFromTo
            : SitecoreDictionary.SearchPodFiltersSelectedPriceTotalFromTo;
    }

    if (maxPrice) {
        return isPerPerson
            ? SitecoreDictionary.SearchPodFiltersSelectedPricePerPersonUnder
            : SitecoreDictionary.SearchPodFiltersSelectedPriceTotalUnder;
    }

    return isPerPerson
        ? SitecoreDictionary.SearchPodFiltersSelectedPricePerPersonFrom
        : SitecoreDictionary.SearchPodFiltersSelectedPriceTotalFrom;
};

export const getDepartureAirportsWithCountryName = (
    filtersToShow: IFilterOption[],
    originsWithNames: IDestinationCountry[],
    marketCode: MarketCode,
): IAirport[] => {
    const airports = filtersToShow.map(filter => {
        // if the name is empty, fallback to the code. https://easyjet.atlassian.net/browse/INS-902
        const filterNameToShow = filter.name || filter.code;
        const originCountry = originsWithNames.find(origin => origin.code === filter.code)?.originCountry;

        if (originCountry && originCountry.code !== marketCode && marketCode !== MarketCode.UK) {
            return { ...filter, name: `(${originCountry.name}) ${filterNameToShow}` };
        }

        return { ...filter, name: filterNameToShow };
    });

    return sortDepartureAirportsAlphabetically(airports);
};

export const isExclusiveFilterDisabled = (filter: IFilterOption, selectedFilters: ISelectedFilter[]): boolean => {
    const codeFilters = filter.groupCode;

    if (!FilterGroupCodes.HotelTypes.includes(codeFilters)) {
        return false;
    }

    const filters = selectedFilters.filter(f => f.groupCode.indexOf(codeFilters) !== -1);

    return filters.some(f => (!f.isExclusive && filter.isExclusive) || (f.isExclusive && f.code !== filter.code));
};

export const isLabelHidden = (code: FilterGroupCodes, getSetting: (key: SiteSettings) => string) => {
    const isFromHiddenList = [
        FilterGroupCodes.Flights,
        FilterGroupCodes.Duration,
        FilterGroupCodes.AltFlightsDepartureAirports,
        FilterGroupCodes.AltFlightsOutboundDepartureTime,
        FilterGroupCodes.AltFlightsInboundDepartureTime,
    ].includes(code);

    const isBoardType = !!(
        code === FilterGroupCodes.BoardType && getSetting(SiteSettings.NewAlternativeBoardsFilterIsActive)
    );

    return isFromHiddenList || isBoardType;
};

/**
 * Get the count of each time filter option based on the provided offers.
 *
 * @param filters - The filters object containing the options to update.
 * @param groupCode - The group code of the filters to update.
 * @param offers - The list of offers to filter and count.
 * @returns The updated filter options with counts.
 */
export const getTimeFiltersCounts = (
    filters: Nullable<IFilters>,
    groupCode: FilterGroupCodes,
    offers: (IOffer | IAlternativeOffer)[],
): IFilterOption[] => {
    const direction =
        groupCode === FilterGroupCodes.AltFlightsOutboundDepartureTime
            ? RouteDirection.Outbound
            : RouteDirection.Inbound;

    const updatedOptions = filters?.options.map(option => {
        const count = offers.filter(offer => {
            const time = formatDateL10n(getRoute(offer, direction)?.depDate, DATE_FORMATS.time);

            return time && option.timeSlot && isTimeInRange(time, option.timeSlot.start, option.timeSlot.end);
        }).length;

        return { ...option, count };
    });

    return updatedOptions || [];
};

export const normalizeRecentlyUsedFilters = (
    filters: IFilterOption[],
    incomingOption?: IFilterOption,
): IFilterOption[] => {
    // place incoming option first (if provided), then append existing filters deduped
    const candidates = incomingOption ? [incomingOption, ...filters] : filters;

    const seen = new Set<string>();

    // remove duplications within recently used filters list
    const uniqueFilters = candidates.filter(f => {
        const key = `${f.code}:${f.groupCode}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });

    return uniqueFilters.slice(0, RECENTLY_USED_FILTERS_MAX_LENGTH);
};

export const filterPillOptions = (
    code: FilterGroupCodes.RecentlyUsed | FilterGroupCodes.Recommended,
    filter: IFilters,
    orderArray: FilterGroupCodes[],
    filters: IFilters[],
): IFilters => {
    const filteredOptions = filter.options.filter(option => {
        const groupCodeForChecking = getQuickFilterOptionGroupCode(code, option);

        // Keep only options present in orderArray, excluding range filters
        if (
            !groupCodeForChecking ||
            !orderArray.includes(groupCodeForChecking) ||
            [...RANGE_FILTER_CODES, FilterGroupCodes.Destination, FilterGroupCodes.Flights].includes(
                groupCodeForChecking,
            )
        ) {
            return false;
        }

        const actualOption = getFilterOptionByCode(filters, groupCodeForChecking, option, true);

        //for recentlyUsed keep only options that exist in rendered Options
        return code === FilterGroupCodes.RecentlyUsed ? !!actualOption : true;
    });

    return {
        ...filter,
        options:
            code === FilterGroupCodes.RecentlyUsed
                ? filteredOptions.slice(0, RECENTLY_USED_FILTERS_MAX_DISPLAY_LENGTH)
                : filteredOptions,
    };
};

export const getFilterCode = (code: FilterGroupCodes): FilterGroupCodes => {
    if ([FilterGroupCodes.OutboundDepartureTime, FilterGroupCodes.InboundDepartureTime].includes(code)) {
        return FilterGroupCodes.FlightTimes;
    }

    return code;
};

export const getQuickFilterOptionGroupCode = (
    code: FilterGroupCodes.RecentlyUsed | FilterGroupCodes.Recommended,
    option: IFilterOption,
): FilterGroupCodes | undefined => {
    const { filterCode, groupCode } = option;
    //for recommended filter the options include filterCode field that maps to the same value as groupCode in other filters
    const groupCodeForChecking = code === FilterGroupCodes.Recommended ? filterCode : groupCode;

    return groupCodeForChecking ? getFilterCode(groupCodeForChecking) : groupCodeForChecking;
};

export const findParentFilter = (destinationFilters: IFilterOption[], childCode: string): IFilterOption | undefined =>
    destinationFilters.find(parent => parent.children?.some(ch => ch.code === childCode));

export const getFilterByGroupCode = (filters: IFilters[], code: FilterGroupCodes): IFilters | undefined => {
    const filterCode = getFilterCode(code);

    return filters.find(filter => filter.code === filterCode);
};

export const getFilterOptionByCode = (
    filters: IFilters[],
    groupCode: FilterGroupCodes,
    option: IFilterOption,
    shouldCheckParentName?: boolean,
): IFilterOption | undefined => {
    const filter = getFilterByGroupCode(filters, groupCode);

    if (shouldCheckParentName) {
        const actualOptions = filter?.options.flatMap(o => [
            o,
            ...(o.children?.map(child => {
                if (o.name === 'Inbound Departure Time') {
                    child.groupCode = FilterGroupCodes.InboundDepartureTime;
                }

                if (o.name === 'Outbound Departure Time') {
                    child.groupCode = FilterGroupCodes.OutboundDepartureTime;
                }

                return child;
            }) || []),
        ]);

        return actualOptions?.find(
            o => o.code === option.code && (o.groupCode ? o.groupCode === option.groupCode : true),
        );
    }

    return filter?.options.flatMap(o => [o, ...(o.children || [])]).find(o => o.code === option.code);
};
