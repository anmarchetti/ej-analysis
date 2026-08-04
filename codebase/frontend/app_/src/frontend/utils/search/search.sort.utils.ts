import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { TSortOrder } from 'models/data/sort/TSortOrder';
import { DestinationType } from 'models/enum/DestinationType';

/**
 * Sort destination by relevance
 * @param a
 * @param b
 */
export const sortDestinationsByRelevance = (a: IDestination, b: IDestination): TSortOrder => {
    const isFirstAnywhere = a.type === DestinationType.Anywhere;
    const isSecondAnywhere = b.type === DestinationType.Anywhere;
    const isFirstCountry = a.type === DestinationType.Country;
    const isSecondCountry = b.type === DestinationType.Country;
    const isFirstVirtualRegion = a.type === DestinationType.VirtualRegion;
    const isSecondVirtualRegion = b.type === DestinationType.VirtualRegion;

    if (isFirstAnywhere) {
        return -1;
    }

    if (isSecondAnywhere) {
        return 1;
    }

    if (isFirstCountry && !isSecondCountry) {
        return -1;
    }

    if (!isFirstCountry && isSecondCountry) {
        return 1;
    }

    if (isFirstVirtualRegion && !isSecondVirtualRegion) {
        return -1;
    }

    if (!isFirstVirtualRegion && isSecondVirtualRegion) {
        return 1;
    }

    return 0;
};

/**
 * Sort destinations fot typeahead component
 * @param a
 * @param b
 */
export const sortAnywhereFirst = (a: IDestinationCountry, b: IDestinationCountry): TSortOrder => {
    const isFirstAnywhere = a.type === DestinationType.Anywhere;
    const isSecondAnywhere = b.type === DestinationType.Anywhere;

    if (isFirstAnywhere) {
        return -1;
    }

    if (isSecondAnywhere) {
        return 1;
    }

    return 0;
};
