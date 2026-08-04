import settings from 'code/settings';
import { normalizeString } from 'frontend/utils/string.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { ITypeAheadResponse } from 'models/data/ITypeAheadResponse';
import { MarketCode } from 'models/data/MarketSettings';
import { DestinationType } from 'models/enum/DestinationType';
import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

import { sortAnywhereFirst } from './search.sort.utils';
import { bracketsRegex } from './search.utils';

export const getNormalizedCountries = (countries: IAirportCountry[]): IAirportCountry[] =>
    (countries || [])
        .filter(c => c.hasDepartureAirports && c.airports.length > 0)
        .reduce((result: IAirportCountry[], nextCountry: IAirportCountry) => {
            const airports = nextCountry.airports
                .filter(airport => airport.isDepartureAirport || airport.airports)
                .map(item => ({ ...item }));

            airports.forEach(airport => {
                if (airport.airports) {
                    airport.airports = airport.airports.filter(airport => airport.isDepartureAirport);
                }
            });

            if (airports.length > 0) {
                result.push({
                    ...nextCountry,
                    airports,
                });
            }

            return result;
        }, []);

export const getFilteredCountriesBySearch = (
    countries: IAirportCountry[],
    searchValue: string,
    marketCode?: MarketCode,
): IAirportCountry[] => {
    const getValueForComparing = (
        airport: IAirport,
        country: IAirportCountry,
        marketCode: MarketCode | undefined,
    ): string => {
        if (marketCode && marketCode !== country.code && marketCode !== MarketCode.UK) {
            return `${country.name} ${airport.name}`.toLowerCase();
        }

        return airport.name.toLowerCase();
    };

    const airportFilter = (
        searchValue: string,
        airport: IAirport,
        nextCountry: IAirportCountry,
        marketCode: MarketCode | undefined,
    ): boolean => {
        /* https://jira.build.easyjet.com/browse/EUXE-786 */
        const normalizedSearchValue = normalizeString(searchValue.replace(bracketsRegex, '').toLowerCase());
        const airportValue = getValueForComparing(airport, nextCountry, marketCode);

        return (
            normalizeString(airportValue).includes(normalizedSearchValue) ||
            airport.code.toLowerCase().includes(searchValue)
        );
    };

    return countries.reduce((result: IAirportCountry[], nextCountry: IAirportCountry) => {
        const airports = nextCountry.airports.filter(airport =>
            airportFilter(searchValue, airport, nextCountry, marketCode),
        );
        nextCountry.airports.forEach(airport => {
            if (airport.airports) {
                const filteredAirportsInGroup = airport.airports.filter(airport =>
                    airportFilter(searchValue, airport, nextCountry, marketCode),
                );

                if (filteredAirportsInGroup.length) {
                    airports.push(...filteredAirportsInGroup);
                }
            }
        });

        if (airports.length > 0) {
            result.push({
                ...nextCountry,
                airports,
            });
        }

        return result;
    }, []);
};

export const hasEnoughSymbolsToSearch = (inputValue: string): boolean =>
    !!inputValue.length && inputValue.length >= settings.SearchPod.MinCharsTypeAhead;

/**Join duplicated hotels by giata code, to avoid hotel duplication in search pod in case,
 *  when hotel has internal and external record in atcom. EJH-11865 */
export const joinDuplicatedHotels = (places: IDestination[]): IDestination[] => {
    const result: IDestination[] = [];

    places.forEach(p => {
        if (p.giataCode) {
            const isHotelExistInResult = result.find(item => item?.giataCode && item?.giataCode === p.giataCode);

            if (!isHotelExistInResult) {
                result.push(p);
            }
        } else {
            result.push(p);
        }
    });

    return result;
};

export const getFilteredDestinations = (
    destinationsFilterValue: string,
    typeAheadResult: ITypeAheadResponse | null,
): IDestination[] | null => {
    const value = destinationsFilterValue.trim().toLowerCase();

    if (!hasEnoughSymbolsToSearch(value)) {
        return [];
    }

    if (!typeAheadResult) {
        return null;
    }

    return joinDuplicatedHotels(
        typeAheadResult.destinations.reduce((acc: IDestination[], destination: IDestination) => {
            if (destination.available) {
                acc.push({
                    name: destination.name,
                    code: destination.code,
                    type: destination.type,
                    parents: destination.parents,
                    showOnSearchPod: destination.showOnSearchPod,
                    relatedRegions: destination.relatedRegions,
                    giataCode: destination.giataCode,
                    hotelTypeIcon: destination.hotelTypeIcon,
                });
            }

            return acc;
        }, []),
    ).sort(sortAnywhereFirst);
};

export const getDestinationsFromAirportCountries = (
    airportCountries: IAirportCountry[],
    marketCode: MarketCode,
    searchPodLabelAll: string,
): IDestinationCountry[] => {
    const isFromAnotherMarket = (country: IAirportCountry): boolean =>
        country.code !== marketCode && marketCode !== MarketCode.UK;

    const getItemNamePrefix = (country: IAirportCountry): string =>
        isFromAnotherMarket(country) ? `(${country.name}) ` : '';

    const createGroupItem = (country: IAirportCountry, item: IAirport): IDestinationCountry | IDestination => ({
        name: `${getItemNamePrefix(country)}${item.name} ${searchPodLabelAll}`,
        code: '',
        type: DestinationType.Group,
        children: item.airports,
        showOnSearchPod: true,
    });

    const createAirportItem = (country: IAirportCountry, item: IAirport): IDestinationCountry | IDestination => ({
        name: `${getItemNamePrefix(country)}${item.name}`,
        code: item.code,
        type: DestinationType.Airport,
        showOnSearchPod: true,
    });

    return airportCountries.reduce((acc: IDestinationCountry[] | IDestination[], country: IAirportCountry) => {
        country.airports?.forEach(item => {
            if (item.airports && item.hasDepartureAirports) {
                acc.push(createGroupItem(country, item));
            } else if (item.isDepartureAirport) {
                acc.push(createAirportItem(country, item));
            }
        });

        return acc;
    }, []);
};

export const getFilteredAirports = (
    airportsFilterValue: string,
    countries: IAirportCountry[],
    marketCode: MarketCode,
    availableOriginsCodes: string[] | null,
    searchPodLabelAll: string,
): [IDestinationCountry[], boolean] => {
    const value = airportsFilterValue.trim().toLowerCase();

    if (!hasEnoughSymbolsToSearch(value)) {
        return [[], false];
    }

    const filteredCountriesBySearch = getFilteredCountriesBySearch(countries, value, marketCode);
    const places = getDestinationsFromAirportCountries(filteredCountriesBySearch, marketCode, searchPodLabelAll);

    let availablePlaces: IDestinationCountry[] = [];
    let blockedPlaces: IDestinationCountry[] = [];

    if (!availableOriginsCodes) {
        availablePlaces = places;
    } else if (availableOriginsCodes.length === 0) {
        blockedPlaces = places;
    } else {
        places.forEach(place => {
            if (!place.code && place.children?.length) {
                const groupHasAvailable = place.children.some(child => availableOriginsCodes.includes(child.code));

                (groupHasAvailable ? availablePlaces : blockedPlaces).push(place);
            } else {
                (availableOriginsCodes.includes(place.code) ? availablePlaces : blockedPlaces).push(place);
            }
        });
    }

    return [availablePlaces, blockedPlaces.length > 0];
};
