import { getDestinationHierarchy } from 'frontend/utils/destinations.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { SearchPodGenericValues } from 'models/data/tracking/SearchPodEvent';
import { DestinationType } from 'models/enum/DestinationType';

interface IRegionLists {
    allRegions: string[];
    selectedRegions: string[];
}

const EMPTY_REGION_LISTS: IRegionLists = { allRegions: [], selectedRegions: [] };

const getDestinationName = (destination: IDestination): string => destination.itemName || destination.name;

export const formatDestinationName = (
    destination: IDestination,
    isDisabledItem: (item: IDestination) => boolean,
): string => {
    const name = getDestinationName(destination);

    return isDisabledItem(destination) ? `${name}(unavailable)` : name;
};

const createRegionLists = (destName: string): IRegionLists => ({
    allRegions: [destName],
    selectedRegions: [destName],
});

const findRegionByCode = (code: string, countriesWithRegions: IDestinationCountry[]): IDestination | undefined =>
    countriesWithRegions.flatMap(c => c.children || []).find(r => r.code === code);

const findParentByType = (parents: IDestination[], type: DestinationType): IDestination | undefined =>
    parents.find(p => p.type === type);

export const findParentCountryForRegion = (
    regionParent: IDestination,
    countriesWithRegions: IDestinationCountry[],
): IDestinationCountry | undefined =>
    countriesWithRegions.find(c => c.code === regionParent.code || c.relatedRegions?.includes(regionParent.code));

export const getAllChildrenFromParent = (
    parent: IDestinationCountry,
    isDisabledItem: (item: IDestination) => boolean,
): string[] => (parent.children || []).map(child => formatDestinationName(child, isDisabledItem));

const processChildren = (children: IDestination[], isDisabledItem: (item: IDestination) => boolean): IRegionLists =>
    children.reduce<IRegionLists>(
        (acc, child) => {
            const formattedName = formatDestinationName(child, isDisabledItem);
            acc.allRegions.push(formattedName);

            if (!isDisabledItem(child)) {
                acc.selectedRegions.push(getDestinationName(child));
            }

            return acc;
        },
        { allRegions: [], selectedRegions: [] },
    );

export const processCountryOrVirtualCountry = (
    dest: IDestination,
    countriesWithRegions: IDestinationCountry[],
    isDisabledItem: (item: IDestination) => boolean,
): IRegionLists => {
    const country = countriesWithRegions.find(c => c.code === dest.code);

    if (!country?.children) {
        return EMPTY_REGION_LISTS;
    }

    return processChildren(country.children, isDisabledItem);
};

export const processVirtualRegion = (
    dest: IDestination,
    countriesWithRegions: IDestinationCountry[],
    isDisabledItem: (item: IDestination) => boolean,
): IRegionLists => {
    const region = findRegionByCode(dest.code, countriesWithRegions);

    if (!region?.relatedRegions) {
        return EMPTY_REGION_LISTS;
    }

    return region.relatedRegions.reduce<IRegionLists>(
        (acc, relatedCode) => {
            const relatedRegion = findRegionByCode(relatedCode, countriesWithRegions);

            if (relatedRegion) {
                const formattedName = formatDestinationName(relatedRegion, isDisabledItem);
                acc.allRegions.push(formattedName);

                if (!isDisabledItem(relatedRegion)) {
                    acc.selectedRegions.push(getDestinationName(relatedRegion));
                }
            }

            return acc;
        },
        { allRegions: [], selectedRegions: [] },
    );
};

const processParentCountry = (
    parentCountry: IDestinationCountry,
    destName: string,
    isDisabledItem: (item: IDestination) => boolean,
): IRegionLists => {
    const allRegions = getAllChildrenFromParent(parentCountry, isDisabledItem);

    return { allRegions, selectedRegions: [destName] };
};

export const processIndividualRegionOrResort = (
    dest: IDestination,
    countriesWithRegions: IDestinationCountry[],
    isDisabledItem: (item: IDestination) => boolean,
): IRegionLists => {
    const destName = getDestinationName(dest);

    if (!dest.parents) {
        return createRegionLists(destName);
    }

    // First try to find a Region parent
    const regionParent = findParentByType(dest.parents, DestinationType.Region);

    if (regionParent) {
        const parentCountry = findParentCountryForRegion(regionParent, countriesWithRegions);

        if (parentCountry) {
            return processParentCountry(parentCountry, destName, isDisabledItem);
        }
    }

    // If no Region parent, try VirtualCountry or Country
    const virtualCountryParent = findParentByType(dest.parents, DestinationType.VirtualCountry);
    const parentToFind = virtualCountryParent || findParentByType(dest.parents, DestinationType.Country);

    if (!parentToFind) {
        return createRegionLists(destName);
    }

    const country = countriesWithRegions.find(c => c.code === parentToFind.code);

    if (!country) {
        return createRegionLists(destName);
    }

    return processParentCountry(country, destName, isDisabledItem);
};

export const buildDestinationRegionLists = (
    dest: IDestination,
    countriesWithRegions: IDestinationCountry[],
    isDisabledItem: (item: IDestination) => boolean,
): IRegionLists => {
    const { type } = dest;

    if (type === DestinationType.Country || type === DestinationType.VirtualCountry) {
        return processCountryOrVirtualCountry(dest, countriesWithRegions, isDisabledItem);
    }

    if (type === DestinationType.VirtualRegion) {
        return processVirtualRegion(dest, countriesWithRegions, isDisabledItem);
    }

    if (type === DestinationType.Region || type === DestinationType.Resort) {
        return processIndividualRegionOrResort(dest, countriesWithRegions, isDisabledItem);
    }

    return EMPTY_REGION_LISTS;
};

const findParentName = (dest: IDestination): string => {
    if (!dest.parents?.length) {
        return dest.itemName || dest.name;
    }

    const hierarchy = getDestinationHierarchy(dest);

    // Priority: Region > VirtualCountry > Country
    return (
        hierarchy[DestinationType.Region] ||
        hierarchy[DestinationType.VirtualCountry] ||
        hierarchy[DestinationType.Country] ||
        dest.itemName ||
        dest.name
    );
};

export const buildDestinationTitles = (selectedDestinations: IDestination[]): string[] =>
    selectedDestinations.map(dest => {
        if ((dest.type === DestinationType.Region || dest.type === DestinationType.Resort) && dest.parents) {
            return findParentName(dest);
        }

        return dest.itemName || dest.name;
    });

export const hasGroupSelectionsInDestinations = (selectedDestinations: IDestination[]): boolean =>
    selectedDestinations.some(
        dest =>
            dest.type === DestinationType.Country ||
            dest.type === DestinationType.VirtualCountry ||
            dest.type === DestinationType.VirtualRegion,
    );

export const hasIndividualSelectionsInDestinations = (selectedDestinations: IDestination[]): boolean =>
    selectedDestinations.some(dest => dest.type === DestinationType.Region || dest.type === DestinationType.Resort);

export const determineDestinationSelectionType = (selectedDestinations: IDestination[]): string => {
    const hasGroupSelections = hasGroupSelectionsInDestinations(selectedDestinations);
    const hasIndividualSelections = hasIndividualSelectionsInDestinations(selectedDestinations);

    if (hasGroupSelections && hasIndividualSelections) {
        return SearchPodGenericValues.DestinationRegionAllSingle;
    }

    if (hasGroupSelections) {
        return SearchPodGenericValues.DestinationRegionAll;
    }

    return SearchPodGenericValues.DestinationRegionSingle;
};

interface IFooterTrackingData {
    allRegionsList: string[];
    destinationTitles: string[];
    selectedRegionsList: string[];
}

export const buildFooterTrackingData = (
    selectedDestinations: IDestination[],
    countriesWithRegions: IDestinationCountry[],
    isDisabledItem: (item: IDestination) => boolean,
): IFooterTrackingData => {
    const destinationTitles = buildDestinationTitles(selectedDestinations);

    const { allRegionsList, selectedRegionsList } = selectedDestinations.reduce<{
        allRegionsList: string[];
        selectedRegionsList: string[];
    }>(
        (acc, dest) => {
            const { allRegions, selectedRegions } = buildDestinationRegionLists(
                dest,
                countriesWithRegions,
                isDisabledItem,
            );
            acc.allRegionsList.push(...allRegions);
            acc.selectedRegionsList.push(...selectedRegions);

            return acc;
        },
        { allRegionsList: [], selectedRegionsList: [] },
    );

    return {
        allRegionsList,
        destinationTitles,
        selectedRegionsList,
    };
};
