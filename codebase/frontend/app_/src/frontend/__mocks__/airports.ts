import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

export const airportMock: IAirport = {
    name: 'airportMock_name',
    code: 'airport_code',
    isDepartureAirport: false,
    latitude: 'latitude',
    longitude: 'longitude',
    airports: [
        {
            name: 'airport-children_name',
            code: 'airport_children_code',
            isDepartureAirport: false,
            latitude: 'latitude_children',
            longitude: 'longitude_children',
        },
    ],
};

export const airportCountryMock: IAirportCountry = {
    name: 'airportCountryMock_name',
    code: 'airportCountryMock_code',
    airports: [airportMock],
    hasDepartureAirports: true,
};
