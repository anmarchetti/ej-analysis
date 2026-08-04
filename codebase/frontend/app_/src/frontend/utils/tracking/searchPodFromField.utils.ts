import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

type TAirportGroupItem = IAirport & { airports: IAirport[] };

enum TGroupSelectionType {
    Group = 'group',
    Individual = 'individual',
    None = 'none',
}

interface IBuildDepartureTitlesAcc {
    selectedCountries: string[];
    titles: string[];
}

interface IDetermineSelectionTypeAcc {
    hasGroupSelections: boolean;
    hasIndividualSelections: boolean;
}

export const formatAirportName = (airport: IAirport, isDisabledItem: (airport: IAirport) => boolean): string => {
    const name = airport.itemName || '';

    return isDisabledItem(airport) ? `${name} (unavailable)` : name;
};

export const getDisplayGroupName = (groupName: string, airports: IAirport[]): string => {
    const isGroup = airports.length > 1;

    return isGroup ? `${groupName} (all)` : groupName;
};

export const processAirportGroup = (
    item: TAirportGroupItem,
    selectedOrigins: string[],
    isDisabledItem: (airport: IAirport) => boolean,
): { country: string; title: string } | null => {
    const groupAirports = item.airports;
    const selectedInGroup = groupAirports.filter((airport: IAirport) => selectedOrigins.includes(airport.code));

    if (selectedInGroup.length === 0) {
        return null;
    }

    const country = item.itemName || '';

    // Use same logic as changeGroupSelection: only consider available airports for "(all)" logic
    const availableAirports = groupAirports.filter((airport: IAirport) => !isDisabledItem(airport));
    const selectedAvailableAirports = selectedInGroup.filter((airport: IAirport) => !isDisabledItem(airport));

    // Show "(all)" if all available airports are selected AND there are multiple available airports
    // This matches the changeGroupSelection logic where only non-disabled airports are added to selection
    const title =
        selectedAvailableAirports.length === availableAirports.length && availableAirports.length > 1
            ? `${item.itemName}(all)`
            : item.itemName || '';

    return { country, title };
};

export const processIndividualAirport = (
    item: IAirport,
    selectedOrigins: string[],
): { country: string; title: string } | null => {
    if (!selectedOrigins.includes(item.code)) {
        return null;
    }

    return { country: item.itemName || '', title: item.itemName || '' };
};

const isAirportGroup = (item: IAirport): item is TAirportGroupItem =>
    item.airports !== undefined && Array.isArray(item.airports);

export const buildDepartureTitles = (
    countries: IAirportCountry[],
    selectedOrigins: string[],
    isDisabledItem: (airport: IAirport) => boolean,
): { selectedCountries: string[]; titles: string[] } => {
    const { selectedCountries, titles } = countries.reduce(
        (acc: IBuildDepartureTitlesAcc, country) => {
            if (!country.airports) return acc;

            for (const item of country.airports) {
                const result = isAirportGroup(item)
                    ? processAirportGroup(item, selectedOrigins, isDisabledItem)
                    : processIndividualAirport(item, selectedOrigins);

                if (result) {
                    acc.selectedCountries.push(result.country);
                    acc.titles.push(result.title);
                }
            }

            return acc;
        },
        { selectedCountries: [], titles: [] },
    );

    return { selectedCountries, titles };
};

export const getGroupAirportsList = (
    groupAirports: IAirport[],
    selectedOrigins: string[],
    isDisabledItem: (airport: IAirport) => boolean,
): string[] => {
    const selectedInGroup = groupAirports.filter((airport: IAirport) => selectedOrigins.includes(airport.code));

    if (selectedInGroup.length === 0) {
        return [];
    }

    // Add all airports in this group, marking unavailable ones
    return groupAirports.map(airport => formatAirportName(airport, isDisabledItem));
};

export const getIndividualAirportName = (
    item: IAirport,
    selectedOrigins: string[],
    isDisabledItem: (airport: IAirport) => boolean,
): string | null => {
    if (!selectedOrigins.includes(item.code)) {
        return null;
    }

    return formatAirportName(item, isDisabledItem);
};

export const buildMultiDepartureAirportsList = (
    countries: IAirportCountry[],
    selectedOrigins: string[],
    isDisabledItem: (airport: IAirport) => boolean,
): string => {
    const allRegionAirports = countries.reduce((acc: string[], country) => {
        if (!country.airports) return acc;

        for (const item of country.airports) {
            if (isAirportGroup(item)) {
                const airports = getGroupAirportsList(item.airports, selectedOrigins, isDisabledItem);
                acc.push(...airports);
            } else {
                const airport = getIndividualAirportName(item, selectedOrigins, isDisabledItem);

                if (airport) {
                    acc.push(airport);
                }
            }
        }

        return acc;
    }, []);

    return allRegionAirports.join('|');
};

export const buildSelectedAirportsList = (countries: IAirportCountry[], selectedOrigins: string[]): string => {
    const selectedAirportNames = countries.reduce((acc: string[], country) => {
        if (!country.airports) return acc;

        for (const item of country.airports) {
            if (isAirportGroup(item)) {
                // Only include airports that are actually selected (in selectedOrigins)
                const selectedInGroup = item.airports
                    .filter((airport: IAirport) => selectedOrigins.includes(airport.code))
                    .map((airport: IAirport) => airport.itemName || '');
                acc.push(...selectedInGroup);
            } else if (selectedOrigins.includes(item.code)) {
                // Individual airport - only include if actually selected
                acc.push(item.itemName || '');
            }
        }

        return acc;
    }, []);

    return selectedAirportNames.join('|');
};

const getGroupType = (
    groupAirports: IAirport[],
    selectedOrigins: string[],
    isDisabledItem: (airport: IAirport) => boolean,
): TGroupSelectionType => {
    const selectedInGroup = groupAirports.filter((airport: IAirport) => selectedOrigins.includes(airport.code));

    if (selectedInGroup.length === 0) {
        return TGroupSelectionType.None;
    }

    const availableAirports = groupAirports.filter((airport: IAirport) => !isDisabledItem(airport));
    const selectedAvailableAirports = selectedInGroup.filter((airport: IAirport) => !isDisabledItem(airport));

    // Check if all available airports in this group are selected
    if (selectedAvailableAirports.length === availableAirports.length && availableAirports.length > 1) {
        return TGroupSelectionType.Group;
    }

    return TGroupSelectionType.Individual;
};

export const determineSelectionType = (
    countries: IAirportCountry[],
    selectedOrigins: string[],
    isDisabledItem: (airport: IAirport) => boolean,
): { hasGroupSelections: boolean; hasIndividualSelections: boolean } => {
    const { hasGroupSelections, hasIndividualSelections } = countries.reduce(
        (acc: IDetermineSelectionTypeAcc, country) => {
            if (!country.airports) return acc;

            for (const item of country.airports) {
                if (isAirportGroup(item)) {
                    // This is a group (like London)
                    const selectionType: TGroupSelectionType = getGroupType(
                        item.airports,
                        selectedOrigins,
                        isDisabledItem,
                    );

                    if (selectionType === TGroupSelectionType.Group) {
                        acc.hasGroupSelections = true;
                    } else if (selectionType === TGroupSelectionType.Individual) {
                        acc.hasIndividualSelections = true;
                    }
                } else if (selectedOrigins.includes(item.code)) {
                    // Individual airport selection
                    acc.hasIndividualSelections = true;
                }
            }

            return acc;
        },
        { hasGroupSelections: false, hasIndividualSelections: false },
    );

    return { hasGroupSelections, hasIndividualSelections };
};
