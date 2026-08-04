import { normalizeString } from 'frontend/utils/string.utils';
import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

export const isAirportMatchesSearchValue = (airport: IAirport, searcherValue: string): boolean => {
    const normalizedAirportName = normalizeString(airport.name).toLocaleLowerCase();
    const normalizedSearchedValue = normalizeString(searcherValue).toLocaleLowerCase();

    return normalizedAirportName.includes(normalizedSearchedValue);
};

export const filterGroupsAirportsBySearchValue = (
    acc: IAirport[],
    airportGroupOfAirports: IAirport,
    searcherValue: string,
): IAirport[] => {
    const filteredAirports = airportGroupOfAirports.airports?.filter(airport =>
        isAirportMatchesSearchValue(airport, searcherValue),
    );

    if (filteredAirports?.length) {
        return [...acc, { ...airportGroupOfAirports, airports: filteredAirports }];
    }

    return acc;
};

export const filterAirports = (airportsGroups: IAirportCountry[], searcherValue: string): IAirportCountry[] =>
    airportsGroups?.map((marketsAirportGroup: IAirportCountry) => {
        const filteredMarketsAirports = marketsAirportGroup.airports.reduce((acc, airportGroupOfAirports: IAirport) => {
            if (!!airportGroupOfAirports.airports) {
                return filterGroupsAirportsBySearchValue(acc, airportGroupOfAirports, searcherValue);
            }

            const isAirportMatched = isAirportMatchesSearchValue(airportGroupOfAirports, searcherValue);

            if (isAirportMatched) {
                return [...acc, airportGroupOfAirports];
            }

            return acc;
        }, [] as IAirport[]);

        return { ...marketsAirportGroup, airports: filteredMarketsAirports };
    });

export const isCheckedAirport =
    (checkedAirports: string[]) =>
    (item: IAirport | IAirportCountry): boolean => {
        const checkedCodes = new Set(checkedAirports);

        if (item.airports) {
            return !item.airports.find(airport => !checkedCodes.has(airport.code));
        }

        return checkedCodes.has(item.code);
    };
