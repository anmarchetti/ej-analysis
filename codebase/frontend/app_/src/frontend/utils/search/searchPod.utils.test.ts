import { airportCountryMock, destinationMock } from 'frontend/__mocks__';
import { IDestination } from 'models/data/IDestination';
import { MarketCode } from 'models/data/MarketSettings';
import { DestinationType } from 'models/enum/DestinationType';
import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

import { sortAnywhereFirst } from './search.sort.utils';
import {
    getDestinationsFromAirportCountries,
    getFilteredAirports,
    getFilteredCountriesBySearch,
    getFilteredDestinations,
    getNormalizedCountries,
    hasEnoughSymbolsToSearch,
    joinDuplicatedHotels,
} from './searchPod.utils';

jest.mock('./search.sort.utils', () => ({
    sortAnywhereFirst: jest.fn(places => places),
}));

const mockAirport: IAirport = {
    name: 'Airport',
    code: 'airport',
    isDepartureAirport: true,
    hasDepartureAirports: false,
};

const mockGroupAirport: IAirport = {
    name: 'GroupAirport',
    code: 'group',
    airports: [mockAirport],
    hasDepartureAirports: true,
};

const mockAirportCountry: IAirportCountry = {
    name: 'AirportCountry',
    code: MarketCode.UK,
    airports: [mockAirport, mockGroupAirport],
    hasDepartureAirports: true,
};

describe('searchPod.utils', () => {
    describe('getNormalizedCountries', () => {
        it('should handle common case', () => {
            const [{ name, code, airports }] = getNormalizedCountries([airportCountryMock]);

            expect(name).toBe('airportCountryMock_name');
            expect(code).toBe('airportCountryMock_code');
            expect(airports[0].code).toBe('airport_code');
        });
    });

    describe('getFilteredCountriesBySearch', () => {
        it('should code to be an airport code', () => {
            const result = getFilteredCountriesBySearch([airportCountryMock], 'name');
            expect(result[0].airports[0].code).toBe('airport_code');
        });

        it('should return an empty array', () => {
            const result2 = getFilteredCountriesBySearch([airportCountryMock], 'test');
            expect(result2.length).toBe(0);
        });

        it('should found all airports by country name when marketCode is provided and marketCode is not equal to the country code', () => {
            const airportCountry = [
                {
                    name: 'France',
                    code: MarketCode.FR,
                    airports: [
                        { name: 'Lyon', code: 'LYS' },
                        { name: 'Paris', code: 'ORY' },
                    ],
                    hasDepartureAirports: true,
                },
            ];
            const result = getFilteredCountriesBySearch(airportCountry, 'franc', MarketCode.CH);
            expect(result[0].airports.length).toBe(2);
            expect(result[0].airports[0].name).toBe('Lyon');
            expect(result[0].airports[1].name).toBe('Paris');
        });

        it('should found all airports by country name and airport name when marketCode is provided and marketCode is not equal to the country code', () => {
            const airportCountry = [
                {
                    name: 'France',
                    code: MarketCode.FR,
                    airports: [
                        { name: 'Lyon', code: 'LYS' },
                        { name: 'Paris', code: 'ORY' },
                    ],
                    hasDepartureAirports: true,
                },
            ];
            const result = getFilteredCountriesBySearch(airportCountry, 'France Lyon', MarketCode.CH);
            expect(result[0].airports.length).toBe(1);
            expect(result[0].airports[0].name).toBe('Lyon');

            const resultWithBrackets = getFilteredCountriesBySearch(airportCountry, '(France) Lyon', MarketCode.CH);
            expect(resultWithBrackets[0].airports.length).toBe(1);
            expect(resultWithBrackets[0].airports[0].name).toBe('Lyon');
        });
    });

    describe('hasEnoughSymbolsToSearch', () => {
        it('should return false for an empty input value', () => {
            expect(hasEnoughSymbolsToSearch('')).toBe(false);
        });

        it('should return false when input value length is less than MinCharsTypeAhead', () => {
            expect(hasEnoughSymbolsToSearch('q')).toBe(false);
        });

        it('should return true when input length is greater than to MinCharsTypeAhead', () => {
            expect(hasEnoughSymbolsToSearch('qwerty')).toBe(true);
        });
    });

    describe('getFilteredDestinations', () => {
        let mockTypeAheadResult;

        beforeEach(() => {
            mockTypeAheadResult = {
                destinations: [
                    { name: 'London', code: 'LON', available: true, showOnSearchPod: true },
                    { name: 'Paris', code: 'PAR', available: false, showOnSearchPod: true },
                    { name: 'New York', code: 'NYC', available: true, showOnSearchPod: true },
                ],
                page: 1,
                take: 10,
                total: 20,
            };
        });

        it('should return an empty array when hasEnoughSymbolsToSearch returns false', () => {
            const result = getFilteredDestinations('lo', mockTypeAheadResult);

            expect(result).toEqual([]);
        });

        it('should return null when typeAheadResult is null', () => {
            mockTypeAheadResult = null;

            const result = getFilteredDestinations('london', mockTypeAheadResult);

            expect(result).toBeNull();
        });

        it('should return sorted available destinations', () => {
            const expectedKeys = [
                'name',
                'code',
                'giataCode',
                'parents',
                'relatedRegions',
                'showOnSearchPod',
                'type',
                'hotelTypeIcon',
            ];
            (sortAnywhereFirst as jest.Mock).mockImplementation(val => val);

            const result = getFilteredDestinations('london', mockTypeAheadResult) as IDestination[];

            expect(sortAnywhereFirst).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('London');
            expect(result[1].name).toBe('New York');
            result.forEach(obj => {
                expectedKeys.forEach(key => {
                    expect(obj).toHaveProperty(key);
                });
            });
        });

        it('should copy hotelTypeIcon from destination', () => {
            const mockTypeAheadWithHotelIcon = {
                destinations: [
                    {
                        name: 'London',
                        code: 'LON',
                        available: true,
                        showOnSearchPod: true,
                        hotelTypeIcon: 'hotel-icon-1',
                    },
                ],
                page: 1,
                take: 10,
                total: 20,
            };

            const result = getFilteredDestinations('london', mockTypeAheadWithHotelIcon) as IDestination[];

            expect(result[0].hotelTypeIcon).toBe('hotel-icon-1');
        });
    });

    describe('joinDuplicatedHotels', () => {
        it('should handle different codes', () => {
            const differentGiataCode = joinDuplicatedHotels([
                destinationMock,
                { ...destinationMock, giataCode: 'test' },
            ]);
            expect(differentGiataCode.length).toBe(2);
        });

        it('should handle same codes', () => {
            const sameGiataCode = joinDuplicatedHotels([destinationMock, destinationMock]);
            expect(sameGiataCode.length).toBe(1);
        });

        it('should handle no codes', () => {
            const noGiataCode = joinDuplicatedHotels([{ ...destinationMock, giataCode: undefined }, destinationMock]);
            expect(noGiataCode.length).toBe(2);
        });
    });

    describe('getDestinationsFromAirportCountries', () => {
        const searchPodLabelAll = 'searchPodLabelAll';
        let airportCountries;
        let marketCode;

        beforeEach(() => {
            airportCountries = [mockAirportCountry];
            marketCode = MarketCode.UK;
        });

        it('should return an empty array when no airportCountries', () => {
            airportCountries = [];

            const result = getDestinationsFromAirportCountries(airportCountries, marketCode, searchPodLabelAll);

            expect(result).toEqual([]);
        });

        it('should create a group item  & an airport item when airportCountries contains both types of elements', () => {
            const result = getDestinationsFromAirportCountries(airportCountries, marketCode, searchPodLabelAll);

            expect(result).toEqual([
                {
                    name: 'Airport',
                    code: 'airport',
                    type: DestinationType.Airport,
                    showOnSearchPod: true,
                },
                {
                    name: `GroupAirport ${searchPodLabelAll}`,
                    code: '',
                    type: DestinationType.Group,
                    children: mockGroupAirport.airports,
                    showOnSearchPod: true,
                },
            ]);
        });

        it('should NOT return country item when hasDepartureAirports is false & airport item when isDepartureAirport is false', () => {
            airportCountries = [
                {
                    ...mockAirportCountry,
                    hasDepartureAirports: false,
                    airports: [{ ...mockAirport, isDepartureAirport: false }],
                },
            ];

            const result = getDestinationsFromAirportCountries(airportCountries, marketCode, searchPodLabelAll);

            expect(result).toEqual([]);
        });

        it('should NOT include country name to the name prop for airports from another market when marketCode is UK', () => {
            airportCountries = [
                {
                    ...mockAirportCountry,
                    code: MarketCode.FR,
                    name: 'AnotherCountry',
                },
            ];

            const result = getDestinationsFromAirportCountries(airportCountries, marketCode, searchPodLabelAll);

            expect(result).toEqual([
                {
                    name: 'Airport',
                    code: 'airport',
                    type: DestinationType.Airport,
                    showOnSearchPod: true,
                },
                {
                    name: `GroupAirport ${searchPodLabelAll}`,
                    code: '',
                    type: DestinationType.Group,
                    children: [mockAirport],
                    showOnSearchPod: true,
                },
            ]);
        });

        it('should include country name to the name prop for airports from another market when marketCode is not UK and marketCode is not equal to country code', () => {
            airportCountries = [
                {
                    ...mockAirportCountry,
                    code: MarketCode.FR,
                    name: 'AnotherCountry',
                },
            ];
            marketCode = MarketCode.DE;

            const result = getDestinationsFromAirportCountries(airportCountries, marketCode, searchPodLabelAll);

            expect(result).toEqual([
                {
                    name: '(AnotherCountry) Airport',
                    code: 'airport',
                    type: DestinationType.Airport,
                    showOnSearchPod: true,
                },
                {
                    name: `(AnotherCountry) GroupAirport ${searchPodLabelAll}`,
                    code: '',
                    type: DestinationType.Group,
                    children: [mockAirport],
                    showOnSearchPod: true,
                },
            ]);
        });
    });

    describe('getFilteredAirports', () => {
        const searchPodLabelAll = 'searchPodLabelAll';
        let airportsFilterValue;
        let countries;
        let marketCode;
        let availableOriginsCodes;

        beforeEach(() => {
            airportsFilterValue = 'airport';
            marketCode = MarketCode.UK;
            countries = [mockAirportCountry];
            availableOriginsCodes = ['random'];
        });

        it('should return empty arrays when hasEnoughSymbolsToSearch returns false', () => {
            airportsFilterValue = '';
            expect(
                getFilteredAirports(
                    airportsFilterValue,
                    countries,
                    marketCode,
                    availableOriginsCodes,
                    searchPodLabelAll,
                ),
            ).toEqual([[], false]);
        });

        it('should return all places as available when availableOriginsCodes is null', () => {
            availableOriginsCodes = null;

            const [availablePlaces, blockedPlaces] = getFilteredAirports(
                airportsFilterValue,
                countries,
                marketCode,
                availableOriginsCodes,
                searchPodLabelAll,
            );

            expect(availablePlaces).toHaveLength(3);
            expect(blockedPlaces).toBe(false);
        });

        it('should return all places as blocked when availableOriginsCodes is an empty array', () => {
            availableOriginsCodes = [];

            const [availablePlaces, blockedPlaces] = getFilteredAirports(
                airportsFilterValue,
                countries,
                marketCode,
                availableOriginsCodes,
                searchPodLabelAll,
            );

            expect(availablePlaces).toHaveLength(0);
            expect(blockedPlaces).toBe(true);
        });

        it('should return only item with code from availableOriginsCodes as available and all other items in blocked', () => {
            availableOriginsCodes = ['QWE'];
            countries = [{ ...mockAirportCountry, airports: [mockAirport, { ...mockAirport, code: 'QWE' }] }];

            const [availablePlaces, blockedPlaces] = getFilteredAirports(
                airportsFilterValue,
                countries,
                marketCode,
                availableOriginsCodes,
                searchPodLabelAll,
            );

            expect(availablePlaces).toHaveLength(1);
            expect(blockedPlaces).toBe(true);
            expect(availablePlaces).toEqual([
                {
                    code: 'QWE',
                    name: 'Airport',
                    showOnSearchPod: true,
                    type: 'Airport',
                },
            ]);
        });
    });
});
