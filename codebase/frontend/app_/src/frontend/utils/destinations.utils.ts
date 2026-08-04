import { TWO } from 'code/commonNumbers';
import { BaseLayoutStore } from 'frontend/store/base';
import { IDestination, IVirtualDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IDisplayValue } from 'models/data/IDisplayValue';
import { IUrlDestination } from 'models/data/IUrlDestination';
import { DestinationType } from 'models/enum/DestinationType';
import { GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

const COUNTRY_DESTINATION_CODE_LENGTH = 2;
const REGION_DESTINATION_CODE_LENGTH = 4;
const RESORT_DESTINATION_CODE_LENGTH = 6;
const HOTEL_DESTINATION_CODE_LENGTH = 8;

export type TDestinationHierarchy = {
    [K in DestinationType]?: string | undefined;
};

/**
 * Returns Destinations Object
 * Example:
 * geog=cty1|cty1
 * geog=cty1|cty1,cty2|cty2|cty2
 * geog=cty1|cty1,cty2|cty2|cty2,cty3
 * Where,
 * Cty1 = Country
 * Cty2 = Location
 * Cty3 = Resort
 * @param query
 */
export const getDestinationsFromQuery = (query: string): IUrlDestination => {
    const queryParts = query.split(',');
    let countries: string[] = [];
    let regions: string[] = [];
    let resorts: string[] = [];

    if (queryParts[0]) {
        countries = queryParts[0].split('|');
    }

    if (queryParts[1]) {
        regions = queryParts[1].split('|');
    }

    if (queryParts[2]) {
        resorts = queryParts[1].split('|');
    }

    return {
        countries,
        regions,
        resorts,
    };
};

/**
 * Check if a specific destination type exists
 * @param destinations - destinations to split
 */

export const checkDestinationTypeExists = (destinations: IDestination[], destinationType: DestinationType): boolean =>
    destinations.some(({ type }) => type === destinationType);

/**
 * Exclude regions that are included in a virtual region
 * @param destinations - destinations to split
 */

export const removeRelatedRegions = (destinations: IDestination[]): IDestination[] => {
    const { VirtualRegion } = DestinationType;
    const excludedLocations = destinations.reduce((acc, destination) => {
        if (destination.type === VirtualRegion) {
            const { relatedRegions } = destination as IVirtualDestination;

            return [...acc, ...relatedRegions];
        }

        return acc;
    }, [] as string[]);

    return destinations.filter(
        destination => !excludedLocations.some(excludedLocation => destination.code === excludedLocation),
    );
};

/**
 * Split destinations (including children) by types and set its codes into output arrays
 * @param destinations - destinations to split
 * @param countries - output countries
 * @param regions  - output regions
 * @param resorts  - output resorts
 * @param hotels  - output hotels
 */
export const manageDestinationCodes = (
    destinations: IDestination[],
    countries: string[],
    regions: string[],
    resorts: string[],
    hotels: string[],
): void => {
    // remove getAllDestinations wrapper after ATCOM fix the issue related to http://jra.europe.easyjet.local/browse/EJH-5242
    getAllDestinations(destinations).forEach(destination => {
        let targetArray: string[] = [];

        switch (destination.type) {
            case DestinationType.Country:
                targetArray = countries;
                break;
            case DestinationType.Region:
                targetArray = regions;
                break;
            case DestinationType.Resort:
                targetArray = resorts;
                break;
            case DestinationType.Hotel:
                targetArray = hotels;
                break;
        }

        // for geography we need only related regions of virtual country, not virtual country code itself
        if (destination.type === DestinationType.VirtualCountry) {
            targetArray = regions;

            destination.relatedRegions?.forEach(code => {
                if (targetArray.indexOf(code) === -1) {
                    targetArray.push(code);
                }
            });
        } else if (destination.code && targetArray.indexOf(destination.code) === -1) {
            targetArray.push(destination.code);
        }

        if (destination.type !== DestinationType.Hotel && !!destination.parents) {
            manageDestinationCodes(destination.parents, countries, regions, resorts, hotels);
        }
    });
};

/**
 * * Parse destination codes from url param values in to array of combined codes
 * @param destinationCodes - destinations param value from url
 * @param accommodationCodes - accommodations param value from url
 */
export const getCombinedDestinationCodes = (destinationCodes: string, accommodationCodes: string): string[] => {
    const { countries, regions, resorts } = getDestinationsFromQuery(destinationCodes);
    const hotelCodes = accommodationCodes ? accommodationCodes.split(',') : [];

    return countries.concat(regions).concat(resorts).concat(hotelCodes);
};

export const getIDestinationByKeyValue = (dcs: IDestinationCountry[], value: string, key: string): IDestination => {
    let result;
    const valueInUpperCase = value?.toUpperCase();

    const getParents = (
        parents: IDestinationCountry[],
    ): {
        code: string;
        itemName: string | undefined;
        name: string;
        type: DestinationType | undefined;
    }[] =>
        parents.map(parent => ({ code: parent.code, name: parent.name, type: parent.type, itemName: parent.itemName }));

    const isTargetValue = (value: Nullable<string>): boolean => value?.toUpperCase() === valueInUpperCase;

    const createDestinationInstance = (country: IDestinationCountry, withChildren: boolean = true): IDestination => ({
        code: country.code,
        name: country.name,
        itemName: country.itemName,
        type: country.type,
        // children prop should be removed after ATCOM fix the issue related to http://jra.europe.easyjet.local/browse/EJH-5242
        ...(withChildren ? { children: country.children } : {}),
        relatedRegions: country.relatedRegions,
        // add parent if any (it can be the case if it is a virtual country)
        ...(country.parents ? { parents: getParents(country.parents) } : {}),
    });

    for (const country of dcs) {
        if (isTargetValue(country[key])) {
            return createDestinationInstance(country);
        }

        if (country.children) {
            for (const region of country.children) {
                if (isTargetValue(region[key])) {
                    return {
                        code: region.code,
                        name: region.name,
                        itemName: region.itemName,
                        type: region.type,
                        relatedRegions: region.relatedRegions,
                        parents: [createDestinationInstance(country, false)],
                    };
                }
            }
        }
    }

    return result;
};

export const getIDestinationByCode = (dcs: IDestinationCountry[], destinationCode: string): IDestination =>
    getIDestinationByKeyValue(dcs, destinationCode, 'code');

export const getIDestinationByName = (dcs: IDestinationCountry[], destinationName: string): IDestination =>
    getIDestinationByKeyValue(dcs, destinationName, 'name');

// this func should be removed after ATCOM fix the issue related to http://jra.europe.easyjet.local/browse/EJH-5242
export const getAllDestinations = (destinations: IDestination[]): IDestination[] => {
    const hasRegions = destinations.some(destination => destination.type === DestinationType.Region);

    return destinations.reduce((acc, destination) => {
        const { type, children } = destination;

        if (hasRegions && type === DestinationType.Country && children?.length) {
            acc.push(
                ...children
                    .filter(r => (r.available !== undefined ? r.available : true))
                    .map(r => {
                        r.parents = [destination];

                        return r;
                    }),
            );
        } else {
            acc.push(destination);
        }

        return acc;
    }, [] as IDestination[]);
};

/*
 *
 * should return Parent Display Value
 * @params - selectedDestinations - array with selected destination
 * @params - selectedDestinationCodes - array with selected destination codes
 * @params - destinationsWithNames - array with destination country
 *
 */
export const createParentDstDisplayValueByCodes = (
    selectedDestinationCodes: string[],
    destinationsWithNames: IDestinationCountry[],
    getPhrase: BaseLayoutStore['getPhrase'],
): IDisplayValue => {
    const result: IDisplayValue = { main: '' };

    const destination = (selectedDestinationCodes || []).reduce((res, code, i, arr) => {
        if (arr.some(el => el.length > TWO) && code.length === COUNTRY_DESTINATION_CODE_LENGTH) {
            res.push(...res);
        } else {
            res.push(destinationsWithNames.find((el: IDestinationCountry) => el.code === code)?.name || '');
        }

        return res;
    }, [] as string[]);

    if (destination.length > 1) {
        const lastDestination = destination.pop();
        result.main =
            (destination || []).join(', ') +
                ` ${getPhrase(SitecoreDictionary.GlobalConjunctionsAnd)} ` +
                lastDestination || '';
    } else {
        result.main = (destination || [])[0] || '';
    }

    return result;
};

export const getDestinationOrChildrenByCode = (
    code: string,
    items: IDestinationCountry[],
): Nullable<IDestinationCountry> => {
    for (const item of items) {
        if (item.code === code) {
            return item;
        }

        const children = item.children?.find(ch => ch.code === code);

        if (children) {
            return children;
        }
    }

    return null;
};

export const getParentDestinationByCode = (code: string, items: IDestinationCountry[]): Nullable<IDestinationCountry> =>
    items.find(item => item.code === code || item.children?.some(ch => ch.code === code)) ?? null;

export const getDestinationTypeByCodeLength = (code: string): DestinationType | null => {
    switch (code.length) {
        case COUNTRY_DESTINATION_CODE_LENGTH:
            return DestinationType.Country;
        case REGION_DESTINATION_CODE_LENGTH:
            return DestinationType.Region;
        case RESORT_DESTINATION_CODE_LENGTH:
            return DestinationType.Resort;
        case HOTEL_DESTINATION_CODE_LENGTH:
            return DestinationType.Hotel;
    }

    return null;
};

export const getDestinationTypeByType = ({ type }: IDestination): DestinationType | undefined | string => {
    if (type === DestinationType.VirtualCountry) {
        return DestinationType.Country;
    }

    return type;
};

export const getDestinationHierarchy = (destination: IDestination): TDestinationHierarchy => {
    const hierarchy: TDestinationHierarchy = {};

    const destinationWithParents = [
        destination,
        ...(destination.parents ?? []),
        ...(destination.parents?.flatMap(parent => parent.parents ?? []) ?? []),
    ];

    for (const { type, itemName, name } of destinationWithParents) {
        if (type) {
            hierarchy[type] = itemName || name;
        }
    }

    return hierarchy;
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

// example Balearic Islands | VirtualRegion - Spain, Majorca | Region - Spain
// Hotel El Paso | Hotel - Salou, Costa Dorada - Spain
// Spain | Country - Spain
export const getDestinationsItemNameGroupedByParent = (selectedDestinations: IDestination[]): string => {
    const isAnywhere = (destination: IDestination): boolean => destination.code === GEOGRAPHY_ALL_CODE;

    // Deduplicate destinations by name and type combination to handle hotels with multiple codes
    const uniqueDestinations = selectedDestinations.filter((dest, index, self) => {
        const destKey = `${dest.type}-${dest.itemName}`;

        return isAnywhere(dest) || index === self.findIndex(d => `${d.type}-${d.itemName}` === destKey);
    });

    return uniqueDestinations
        .map((destination: IDestination): string => {
            const isAnywhereDest = isAnywhere(destination);
            const destName = isAnywhereDest ? DestinationType.Anywhere : destination.itemName;
            const destType = isAnywhereDest ? DestinationType.Anywhere : destination.type;

            if (destination.parents?.length) {
                const parentHierarchy = destination.parents.map(p => p.itemName).join(', ');

                return `${destName} | ${destType} - ${parentHierarchy}`;
            }

            return `${destName} | ${destType} - ${destName}`;
        })
        .join(', ');
};
