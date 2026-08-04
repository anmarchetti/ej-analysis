import { airportMock, mockBooking, mockFlightsRoutes } from 'frontend/__mocks__';
import { RouteDirection } from 'models/enum/RouteDirection';

import {
    convertAirportsToSelectOptions,
    convertCountriesAirportsToSelectOptions,
    getAirportByCode,
    getAirportWithGroup,
    getBookingAirportCodes,
    getCountryNameOfAirportByCode,
    getRouteByDirection,
    ICountryName,
    normalizeAirport,
} from './airports.utils';

describe('airports.utils', () => {
    describe('convertAirportsToSelectOptions()', () => {
        it('should return empty array if nothing is passed', () => {
            const res = convertAirportsToSelectOptions(null as any);

            expect(res).toEqual([]);
        });

        it('should convert to selected options only airports with codes and names', () => {
            const res = convertAirportsToSelectOptions([
                { code: 'BFS', name: 'Belfast' },
                { code: 'LPL', name: 'Liverpool' },
                { code: '', name: 'Manchester' },
                { code: 'SOU', name: '' },
            ]);

            expect(res).toEqual([
                { value: 'BFS', label: 'Belfast' },
                { value: 'LPL', label: 'Liverpool' },
            ]);
        });
    });

    describe('convertCountriesAirportsToSelectOptions', () => {
        it('should convert and sort items', () => {
            const res = convertCountriesAirportsToSelectOptions([
                {
                    code: 'GB',
                    name: 'United Kingdom',
                    airports: [
                        { code: 'SOU', name: 'Southampton' },
                        {
                            code: '',
                            name: 'London',
                            airports: [
                                { code: 'LGW', name: 'London Gatwick' },
                                { code: 'LTN', name: 'London Luton' },
                            ],
                        },
                    ],
                },
                {
                    code: 'AT',
                    name: 'Austria',
                    airports: [{ code: 'INN', name: 'Innsbruck' }],
                },
            ] as any);

            expect(res).toEqual([
                { value: 'INN', label: 'Innsbruck' },
                { value: 'LGW', label: 'London Gatwick' },
                { value: 'LTN', label: 'London Luton' },
                { value: 'SOU', label: 'Southampton' },
            ]);
        });
    });

    describe('getBookingAirportCodes', () => {
        it('should return departure and arrival airport codes', () => {
            const res = getBookingAirportCodes(mockBooking);

            expect(res).toEqual(['LGW', 'ACE']);
        });
    });

    describe('getRouteByDirection', () => {
        it('Return both routes', () => {
            const { outbound, inbound } = getRouteByDirection(mockFlightsRoutes);

            expect(outbound!.direction).toBe(RouteDirection.Outbound);
            expect(inbound!.direction).toBe(RouteDirection.Inbound);
        });
    });

    describe('getAirportWithGroup', () => {
        it('should return the correct airport with parent when airport code is in group', () => {
            const result = getAirportWithGroup('airport_children_code', [airportMock]);

            expect(result).toEqual({ airport: airportMock.airports![0], parent: airportMock });
        });

        it('should return null when airport group has no airport with passed code', () => {
            const result = getAirportByCode('any', [airportMock]);

            expect(result).toBeNull();
        });

        it('should return null when airport group has no airports', () => {
            const result = getAirportByCode('airport_children_code', [{ ...airportMock, airports: undefined }]);

            expect(result).toBeNull();
        });
    });

    describe('getAirportByCode', () => {
        it('should return the correct airport when airport code is in group', () => {
            const result = getAirportByCode('airport_children_code', [airportMock]);

            expect(result).toBe(airportMock.airports![0]);
        });

        it('should return null when airport group has no airport with passed code', () => {
            const result = getAirportByCode('any', [airportMock]);

            expect(result).toBeNull();
        });
    });

    describe('getCountryNameOfAirportByCode', () => {
        it('should return the correct country name when airport code is found directly', () => {
            const result = getCountryNameOfAirportByCode('airport_children_code', [
                { ...airportMock, countryName: 'France' },
            ]);

            expect(result).toBe('France');
        });

        it('should return null when airport group has no airports array', () => {
            const result = getCountryNameOfAirportByCode('any', [{ ...airportMock, countryName: 'France' }]);

            expect(result).toBeNull();
        });

        it('should return null when airport group has no countryName', () => {
            const result = getCountryNameOfAirportByCode('airport_children_code', [airportMock]);

            expect(result).toBeNull();
        });

        it('should return null when there are no airport groups', () => {
            const result = getCountryNameOfAirportByCode('airport_children_code', [
                { ...airportMock, countryName: 'France', airports: undefined },
            ]);

            expect(result).toBeNull();
        });
    });

    describe('normalizeAirport', () => {
        let countryInfo: ICountryName;

        beforeEach(() => {
            countryInfo = {
                name: 'United Kingdom',
                itemName: 'United Kingdom',
            };
        });

        it('should not modify airport if countryInfo has no itemName', () => {
            countryInfo.itemName = undefined;
            const result = normalizeAirport(airportMock, countryInfo);

            expect(result).toEqual(airportMock);
        });

        it('should add countryName when countryInfo has itemName', () => {
            const result = normalizeAirport(airportMock, countryInfo);

            expect(result).toEqual({ ...airportMock, countryName: 'United Kingdom' });
        });

        it('should prefix airport name if isForeign is true', () => {
            const result = normalizeAirport(airportMock, countryInfo, true);

            expect(result).toEqual({
                ...airportMock,
                countryName: 'United Kingdom',
                name: '(United Kingdom) airportMock_name',
            });
        });
    });
});
