import { IBookingInfo } from 'models/data/IBookingInfo';
import { IRoute } from 'models/data/IRoute';
import { ISelectOption } from 'models/data/ISelectOption';
import { RouteDirection } from 'models/enum/RouteDirection';
import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

export interface ICountryName {
    name: string;
    itemName?: string;
}

export const convertAirportsToSelectOptions = (airports: IAirport[]): ISelectOption[] => {
    if (!airports) return [];

    return airports
        .filter(airport => !!airport.code && !!airport.name)
        .map(airport => ({
            label: airport.name,
            value: airport.code,
        }));
};

export const convertCountriesAirportsToSelectOptions = (countriesAirports: IAirportCountry[]): ISelectOption[] => {
    const options: ISelectOption[] = [];

    countriesAirports.forEach(countryAirports => {
        options.push(...convertAirportsToSelectOptions(countryAirports.airports));

        countryAirports.airports.forEach(airportsGroup => {
            airportsGroup.airports && options.push(...convertAirportsToSelectOptions(airportsGroup.airports));
        });
    });

    options.sort((a, b) => (a.label as string).localeCompare(b.label as string));

    return options;
};

export const getAirportWithGroup = (
    code: string,
    airportGroups: Array<IAirport | IAirportCountry>,
): { airport: IAirport; parent: IAirportCountry | IAirport } | null => {
    for (const group of airportGroups) {
        const airport =
            group.airports &&
            (group.airports.find(a => a.code === code) ||
                getAirportWithGroup(
                    code,
                    group.airports.filter(a => a.airports),
                )?.airport);

        if (airport) {
            return { airport, parent: group };
        }
    }

    return null;
};

export const getAirportByCode = (code: string, airportGroups: Array<IAirport | IAirportCountry>): IAirport | null => {
    const airportWithGroup = getAirportWithGroup(code, airportGroups);

    return airportWithGroup ? airportWithGroup.airport : null;
};

export const getCountryNameOfAirportByCode = (
    code: string,
    airportGroups: Array<IAirport | IAirportCountry>,
): Nullable<string> => {
    const airportWithGroup = getAirportWithGroup(code, airportGroups);

    if (airportWithGroup && 'countryName' in airportWithGroup.parent) {
        return airportWithGroup.parent.countryName;
    }

    return null;
};

/**
 * Returns the departure and arrival airport codes from the booking
 * @param booking
 * @returns  [departureAirportCode, arrivalAirportCode]
 */
export const getBookingAirportCodes = (booking: IBookingInfo): string[] => {
    const departureAirportCode = booking?.package?.transport?.routes[0]?.depPt;
    const arrivalAirportCode = booking?.package?.transport?.routes[1]?.depPt;

    return [departureAirportCode, arrivalAirportCode];
};

export const getRouteByDirection = (routes: IRoute[]): Record<RouteDirection, IRoute | undefined> => ({
    outbound: routes?.find(route => route.direction === RouteDirection.Outbound),
    inbound: routes?.find(route => route.direction === RouteDirection.Inbound),
});

export const normalizeAirport = (airport: IAirport, countryInfo: ICountryName, isForeign = false): IAirport => {
    const airportWithCountry = countryInfo.itemName ? { ...airport, countryName: countryInfo.itemName } : airport;

    if (!isForeign) return airportWithCountry;

    return {
        ...airportWithCountry,
        name: `(${countryInfo.name}) ${airport.name}`,
    };
};
