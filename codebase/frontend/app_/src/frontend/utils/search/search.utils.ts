import { toJS } from 'mobx';

import { ONE, TWO } from 'code/commonNumbers';
import { DATE_FORMATS, DayjsLocale } from 'code/dates';
import { BaseLayoutStore } from 'frontend/store/base';
import { DEFAULT_HOTEL_CODE_LENGTH } from 'frontend/store/base/search/constants';
import {
    formatDateL10n,
    getDaysDifferenceRoundedFloor,
    isDateInCurrentMonth,
    isDateInRangeOfPastMonths,
    parseDateL10n,
} from 'frontend/utils/date.utils';
import { getDestinationOrChildrenByCode } from 'frontend/utils/destinations.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IDestinationFields, IRegionsFields, IResortsFields } from 'models/data/IDestinationFields';
import { IDisplayValue } from 'models/data/IDisplayValue';
import { IUnit } from 'models/data/IOffer';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';
import { ISavedSearchParams } from 'models/data/ISavedSearchParams';
import { MarketCode } from 'models/data/MarketSettings';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { DestinationType } from 'models/enum/DestinationType';
import { GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { RoomAllocation } from 'models/RoomAllocation';
import {
    getAdultsQuantityForRecent,
    getChildrenQuantityForRecent,
    getInfantsQuantityForRecent,
} from 'models/RoomAllocation.utils';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import { IAirport } from 'models/sitecore/IAirportsData';
import { ISortOrderItem } from 'models/sitecore/ISortOrderItem';
import { ISortConfig, sortConfig } from 'frontend/components/renderings/SearchResults/sort.config';

export const bracketsRegex = /[()]/g;

export const SINGLE_SELECTABLE_DESTINATION_TYPES = [
    DestinationType.Hotel,
    DestinationType.Resort,
    DestinationType.VirtualResort,
];

const createRoomAllocation = (
    roomParams: {
        adults: number;
        children: number;
        infants: number;
        roomCode: string | undefined;
    },
    isTradePortal: boolean,
    getChildAge?: (index: number) => number | undefined,
): RoomAllocation => {
    const room = new RoomAllocation();

    new Array(roomParams.adults).fill(0).forEach(() => room.addAdult(isTradePortal));
    new Array(roomParams.infants).fill(0).forEach(() => room.addInfant());
    new Array(roomParams.children).fill(0).forEach((_, index) => {
        const childAge = getChildAge?.(index);

        room.addChild(childAge);
    });

    room.setRoomCode(roomParams.roomCode);

    return room;
};

/**
 * Converts QueryRoom to RoomAllocation
 * @param queryRoom
 */
export const getRoomAllocationFromQueryRoom = (queryRoom: IQueryRoom, isTradePortal: boolean = false): RoomAllocation =>
    createRoomAllocation(
        {
            adults: queryRoom.adults,
            infants: queryRoom.infants,
            children: queryRoom.children,
            roomCode: queryRoom.roomCode,
        },
        isTradePortal,
        index => queryRoom.childrenAges?.[index],
    );

export const cloneRoomAllocationArray = (
    roomsAllocation: RoomAllocation[],
    isTradePortal: boolean = false,
): RoomAllocation[] =>
    roomsAllocation.map(roomAllocation =>
        createRoomAllocation(
            {
                adults: roomAllocation.adults.length,
                infants: roomAllocation.infants.length,
                children: roomAllocation.children.length,
                roomCode: roomAllocation.roomCode,
            },
            isTradePortal,
            index => roomAllocation.children[index].age,
        ),
    );

/**
 * Converts IUnit to RoomAllocation
 * @param unit
 */
export const getRoomAllocationFromUnit = (isTradePortal: boolean, unit: IUnit): RoomAllocation => {
    const childrenAges = toJS(unit.occupation.childAges) || [];

    return createRoomAllocation(
        {
            adults: unit.occupation.adults || 0,
            infants: unit.occupation.infants || 0,
            children: unit.occupation.children || 0,
            roomCode: unit.code,
        },
        isTradePortal,
        index => childrenAges?.[index],
    );
};

export const createOriDisplayValueByCodes = (
    codes: string[],
    placesWithNames: IDestinationCountry[],
    availableOriginsCodes: string[] | null,
    getPhrase: BaseLayoutStore['getPhrase'],
    isAllAirportsEnabled: boolean = false,
    marketCode?: MarketCode,
): IDisplayValue => {
    const titles: string[] = [];
    const groups: string[] = [];

    if (availableOriginsCodes?.length && availableOriginsCodes.every(x => codes.includes(x)) && isAllAirportsEnabled) {
        return { main: getPhrase(SitecoreDictionary.SearchPodLabelsAllCities) };
    }

    const getTitle = (placeWithName: IDestinationCountry): string =>
        marketCode &&
        placeWithName.originCountry?.code &&
        placeWithName.originCountry.code !== marketCode &&
        marketCode !== MarketCode.UK
            ? `(${placeWithName.originCountry.name}) ${placeWithName.name}`
            : placeWithName.name;

    const handleChildren = (
        children: IDestinationCountry[],
        code: string,
    ): {
        foundName: string;
        unselectedCount: number;
    } => {
        const filteredChildren = children.filter(({ code }) =>
            !availableOriginsCodes ? true : availableOriginsCodes.includes(code),
        );

        let unselectedCount = filteredChildren.length;
        let foundName = '';

        for (const child of filteredChildren) {
            if (child.code === code) {
                foundName = child.name;
            }

            if (codes.includes(child.code)) {
                unselectedCount--;
            }
        }

        return {
            foundName,
            unselectedCount,
        };
    };

    codes
        .filter(code => !availableOriginsCodes || availableOriginsCodes.includes(code))
        .forEach(code => {
            for (const placeWithName of placesWithNames) {
                if (placeWithName.code === code) {
                    const title = getTitle(placeWithName);

                    titles.push(title);
                    break;
                }

                if (!placeWithName.children) {
                    continue;
                }

                const groupCodes = placeWithName.children.map(child => child.code);

                if (!groupCodes.includes(code)) {
                    continue;
                }

                //remove unavailable airports from city
                const { unselectedCount, foundName } = handleChildren(placeWithName.children, code);

                if (unselectedCount === 0) {
                    if (!groups.includes(placeWithName.name)) {
                        groups.push(placeWithName.name);
                    }

                    break;
                }

                if (foundName) {
                    titles.push(foundName);
                    break;
                }
            }
        });

    const result: IDisplayValue = { main: '' };
    let resultAdd: number = 0;

    if (groups.length > 0) {
        const sumLength = groups.length + titles.length;
        result.main = groups[0];

        if (sumLength > 1) {
            resultAdd += sumLength - 1;
        }
    } else if (titles.length > 0) {
        result.main = titles[0];

        if (titles.length > 1) {
            resultAdd += titles.length - 1;
        }
    }

    if (resultAdd > 0) {
        result.add = '+' + resultAdd;
    }

    return result;
};

export const getAdultsCountPhrase = (count: number, getPhrase: BaseLayoutStore['getPhrase']): string =>
    `${count} ${
        count < TWO
            ? getPhrase(SitecoreDictionary.GlobalsLabelsAdult)
            : getPhrase(SitecoreDictionary.GlobalsLabelsAdults)
    }`;

export const getChildrenCountPhrase = (count: number, getPhrase: BaseLayoutStore['getPhrase']): string =>
    `${count} ${
        count < TWO
            ? getPhrase(SitecoreDictionary.GlobalsLabelsChild)
            : getPhrase(SitecoreDictionary.GlobalsLabelsChildren)
    }`;

export const getInfantsCountPhrase = (count: number, getPhrase: (key) => string): string =>
    `${count} ${
        count < TWO
            ? getPhrase(SitecoreDictionary.GlobalsLabelsInfant)
            : getPhrase(SitecoreDictionary.GlobalsLabelsInfants)
    }`;

export const getWhoField = (
    { adults, children, infants }: { adults: number; children: number; infants: number },
    rooms: number,
    isAutoAllocation: boolean,
    getPhrase: BaseLayoutStore['getPhrase'],
    ages?: number[],
    isPromoPage?: boolean,
): string => {
    const result: string[] = [];
    const childrenAges =
        ages &&
        ` (${
            ages.length > ONE
                ? getPhrase(SitecoreDictionary.GlobalLabelAged)
                : getPhrase(SitecoreDictionary.GlobalLabelAge)
        } ${ages.join(', ')})`;

    adults && result.push(getAdultsCountPhrase(adults, getPhrase));
    children &&
        result.push(`${getChildrenCountPhrase(children, getPhrase)}${isPromoPage && childrenAges ? childrenAges : ''}`);
    infants && result.push(getInfantsCountPhrase(infants, getPhrase));
    result.push(
        `${rooms} ${
            rooms < TWO
                ? getPhrase(SitecoreDictionary.GlobalsLabelsRoom)
                : getPhrase(SitecoreDictionary.GlobalsLabelsRooms)
        }`,
    );

    if (isAutoAllocation && rooms === 1) {
        result.pop();
    }

    return result.join(', ');
};

/**
 * Check if main search fields are equal
 */
export const shallowCompareSearches = (element1: IPrefilledSearchParams, element2: IPrefilledSearchParams): boolean =>
    element1.startDate === element2.startDate &&
    JSON.stringify(element1.durations) === JSON.stringify(element2.durations) &&
    element1.departure === element2.departure &&
    element1.dest === element2.dest &&
    JSON.stringify(element1.rooms) === JSON.stringify(element2.rooms);

/**
 * Checks if search is expired
 * @param item
 */
export const isRecentSearchItemExpired = (params: ISavedSearchParams, expirationMonths: number): boolean => {
    const { createdAt, startDate, isMonthSearch } = params;
    const parsedCreatedAtDate = parseDateL10n(createdAt);
    const parsedStartDate = parseDateL10n(startDate);
    const isDateExpired = !!parsedStartDate && getDaysDifferenceRoundedFloor(new Date(), parsedStartDate) > 0;
    const isDateOutsideCurrentMonth = !!parsedStartDate && !isDateInCurrentMonth(parsedStartDate);

    return (
        (!!parsedCreatedAtDate && !isDateInRangeOfPastMonths(parsedCreatedAtDate, expirationMonths)) ||
        (isDateExpired && (!isMonthSearch || isDateOutsideCurrentMonth))
    );
};

export const getValidSearches = (
    recentSearches: ISavedSearchParams[],
    marketDepartureAirports: string[],
    expirationMonths: number,
    isMonthSearchEnabled: boolean,
): ISavedSearchParams[] =>
    recentSearches.reduce((accumulator, currentValue) => {
        const isDateValid = !isRecentSearchItemExpired(currentValue, expirationMonths);
        const departureAirports = currentValue.departure.split(',');

        const isValidAirport = departureAirports.every(departureAirport =>
            marketDepartureAirports.includes(departureAirport),
        );
        const isAllowedByMonthSearchSetting =
            isMonthSearchEnabled || (!isMonthSearchEnabled && !currentValue.isMonthSearch);

        if (isDateValid && isValidAirport && isAllowedByMonthSearchSetting) {
            return [...accumulator, currentValue];
        }

        return accumulator;
    }, []);

/**
 * Get Regions Codes that related to  Virtual Region
 * @param fields - virtual region sitecore fields
 */
export const getRegionsCodesRelatedToVirtual = (fields: Nullable<IRegionsFields>): string[] =>
    (fields?.Regions || []).map(region => region.fields?.Code?.value).filter(Boolean);

export const getResortsCodesRelatedToVirtual = (fields: Nullable<IResortsFields>): string[] =>
    (fields?.Resorts || []).map(region => region.fields?.Code?.value).filter(Boolean);

export const getRelatedDestinationsCodes = (
    fields: Nullable<{
        Regions?: ISitecoreCompositeField<IDestinationFields>[];
        Resorts?: ISitecoreCompositeField<IDestinationFields>[];
    }>,
    isVirtualRegionBrowsePage: boolean,
    isVirtualResortBrowsePage: boolean,
): string[] => {
    if (isVirtualRegionBrowsePage) {
        return getRegionsCodesRelatedToVirtual(fields);
    }

    if (isVirtualResortBrowsePage) {
        return getResortsCodesRelatedToVirtual(fields);
    }

    return [];
};

export const getSortItemBySitecoreConfig = (item: ISortOrderItem | undefined): Nullable<ISortConfig> => {
    const code = item?.fields?.Code?.value;

    return code ? sortConfig.find(c => c.code === code) : null;
};

/**
 * Checks if this is a single hotel search
 * @param accCodes
 */
export const isSingleHotelSearch = (accCodes: string[]): boolean =>
    accCodes.length > 1 && accCodes.every(code => code.length === DEFAULT_HOTEL_CODE_LENGTH);

export const sortDepartureAirportsAlphabetically = (airports: IAirport[]): IAirport[] =>
    [...airports].sort((a, b) => a.name.replace(bracketsRegex, '').localeCompare(b.name.replace(bracketsRegex, '')));

export const getFirstAndLastTitles = (
    destinationCountries: IDestinationCountry[],
    maxMainAmount = 1,
): IDisplayValue => {
    const result: IDisplayValue = { main: '' };
    const virtualRegionOrResort = destinationCountries.filter(
        country => country.type === DestinationType.VirtualRegion || country.type === DestinationType.VirtualResort,
    );

    const titlesWithoutRelatedDestinations = destinationCountries.filter(destination => {
        const isRelatedDestination = virtualRegionOrResort.some(({ relatedResorts, relatedRegions }) => {
            const relatedCodes = relatedResorts ?? relatedRegions;

            return relatedCodes?.includes(destination.code);
        });

        return !isRelatedDestination;
    });

    const titlesWithoutRelatedDestinationsLength = titlesWithoutRelatedDestinations.length;

    if (titlesWithoutRelatedDestinationsLength) {
        result.main = destinationCountries
            .slice(0, maxMainAmount)
            .map(x => x.name)
            .join(', ');

        if (titlesWithoutRelatedDestinationsLength > maxMainAmount) {
            result.add = '+' + (titlesWithoutRelatedDestinationsLength - maxMainAmount);
        }
    }

    return result;
};

export const isSelectionValid = (selectedCodes: string[], availableCodes: string[] | null): boolean => {
    if (selectedCodes.length === 0) {
        return false;
    }

    if (selectedCodes.some(code => code === GEOGRAPHY_ALL_CODE)) {
        return true;
    }

    if (availableCodes) {
        if (availableCodes.length === 0) {
            return false;
        }

        for (const code of selectedCodes) {
            if (availableCodes.indexOf(code) !== -1) {
                return true;
            }
        }

        return false;
    }

    return true;
};

export const getDestinationItemNamesByCodes = (
    codes: string[],
    destinationsWithNames: IDestinationCountry[],
): string[] => {
    const findItemName = (code: string): string => {
        if (code === GEOGRAPHY_ALL_CODE) return DestinationType.Anywhere;

        const dest = getDestinationOrChildrenByCode(code, destinationsWithNames);

        return dest?.itemName || dest?.name || code;
    };

    return codes.map(findItemName);
};

export const getAirportsItemNamesByCodes = (codes: string[], airports: Map<string, IAirport>): string[] =>
    codes.map(code => airports.get(code)).map(obj => obj?.itemName || obj?.name || obj?.code || '');

export const getResentSearchTrackingData = (
    search: IPrefilledSearchParams,
    allDestinations: IDestinationCountry[],
    allAirports: Map<string, IAirport>,
): { date: string; direction: string; who: string } => {
    const departureCodes = search.departure.split(',');
    const searchedAirports = getAirportsItemNamesByCodes(departureCodes, allAirports).join(', ');

    const destinationCodes = search.dest.split(',');
    const destinations = getDestinationItemNamesByCodes(destinationCodes, allDestinations).join(', ');

    const direction = `${searchedAirports} - ${destinations}`;

    const date = `${formatDateL10n(
        search.startDate,
        search.isMonthSearch ? DATE_FORMATS.fullMonthAndYear : DATE_FORMATS.fullDate,
        DayjsLocale.En,
    )}, ${search.durations[0]} Nights`;

    const adults = getAdultsQuantityForRecent(search.rooms);
    const children = getChildrenQuantityForRecent(search.rooms);
    const infants = getInfantsQuantityForRecent(search.rooms);

    const who = `${adults} Adult, ${children} Child, ${infants} Infant`;

    return { direction, date, who };
};

// For resorts with VirtualCountry parents e.g. Edinburgh
export const getParentVirtualCountry = (destination: IDestination): IDestination | undefined => {
    if (destination?.type !== DestinationType.Resort) {
        return undefined;
    }

    return destination.parents?.find(parent => parent.type === DestinationType.VirtualCountry);
};

export const getCheapestMonthItemQuery = (destination: IDestination): (string | undefined)[] => {
    const result: (string | undefined)[] = [];

    const parentVirtualCountry = getParentVirtualCountry(destination);

    if (parentVirtualCountry) {
        result.push(parentVirtualCountry.parents?.[0].code, parentVirtualCountry.relatedRegions?.[0], destination.code);
    }

    if (destination.type === DestinationType.VirtualCountry) {
        result.push(destination.parents?.[0].code, (destination.relatedRegions ?? []).join('|'));
    }

    if (destination.type === DestinationType.Region) {
        result.push(destination.parents?.[0].code, destination.code);
    }

    if (destination.type === DestinationType.Country) {
        result.push(
            (destination.children?.length
                ? destination.children.map(({ code }) => `${destination.code},${code}`)
                : [destination.code]
            ).join(';'),
        );
    }

    return result;
};

export const getSelectedVirtualRegionQuery = (destinations: IDestination[]): string => {
    const { virtualRegion, relatedDestinationsWithoutVirtualRegion } = getVirtualRegionDestinationData(destinations);

    if (!virtualRegion) {
        return '';
    }

    return `${virtualRegion?.parents?.[0].code},${relatedDestinationsWithoutVirtualRegion
        .map(({ code }) => code)
        .join('|')}`;
};

export const getVirtualRegionDestinationData = (
    destinations: IDestination[],
): {
    areOnlyRelatedRegionsSelected: boolean;
    destinationsWithoutVirtualRegion: IDestination[];
    relatedDestinationsWithoutVirtualRegion: IDestination[];
    virtualRegion: IDestination | undefined;
} => {
    const virtualRegion = destinations.find(destination => destination.type === DestinationType.VirtualRegion);

    const destinationsWithoutVirtualRegion = destinations.filter(({ code }) => code !== virtualRegion?.code);

    const relatedDestinationsWithoutVirtualRegion = destinationsWithoutVirtualRegion.filter(({ code }) =>
        virtualRegion?.relatedRegions?.includes(code),
    );

    const areOnlyRelatedRegionsSelected =
        !!virtualRegion && relatedDestinationsWithoutVirtualRegion.length === destinationsWithoutVirtualRegion.length;

    return {
        virtualRegion,
        destinationsWithoutVirtualRegion,
        relatedDestinationsWithoutVirtualRegion,
        areOnlyRelatedRegionsSelected,
    };
};

export const getCheapestMonthQuery = (destinations: IDestination[]): string => {
    const virtualRegionQuery = getSelectedVirtualRegionQuery(destinations);

    if (virtualRegionQuery) {
        return virtualRegionQuery;
    }

    const destinationCodes = destinations.map(getCheapestMonthItemQuery);

    return destinationCodes.map(codes => codes.join(',')).join(';');
};

export const getAvailableCountriesWithRegions = (
    countriesWithRegions: IDestinationCountry[],
    availableDestinationsCodes: string[] | null,
): IDestinationCountry[] => {
    if (!countriesWithRegions?.length || !availableDestinationsCodes?.length) {
        return countriesWithRegions || [];
    }

    return countriesWithRegions
        .filter(country => availableDestinationsCodes.includes(country.code))
        .map(country => ({
            ...country,
            children: country.children?.filter(region => availableDestinationsCodes.includes(region.code)),
        }));
};
