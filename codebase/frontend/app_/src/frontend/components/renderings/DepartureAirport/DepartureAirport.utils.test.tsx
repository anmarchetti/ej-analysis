import { airportCountryMock, airportMock } from 'frontend/__mocks__';
import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

import {
    filterAirports,
    filterGroupsAirportsBySearchValue,
    isAirportMatchesSearchValue,
    isCheckedAirport,
} from './DepartureAirport.utils';

describe('departure utils', () => {
    describe.each([
        [{ name: 'London' }, 'lond', true],
        [{ name: 'Bâle' }, 'Bâle', true],
        [{ name: 'Bâle' }, 'bale', true],
        [{ name: 'Bâle' }, 'tets', false],
    ])('isAirportMatchesSearchValue', (airport, searchedValue, result) => {
        it(`should compare ${airport.name} with ${searchedValue} and return ${result}`, () => {
            expect(isAirportMatchesSearchValue(airport as IAirport, searchedValue)).toBe(result);
        });
    });

    describe('filterGroupsAirportsBySearchValue', () => {
        const mockAirportsGroup = {
            code: '',
            name: '',
            airports: [
                { code: 'LHR', name: 'London Heathrow' },
                { code: 'LGW', name: 'London Gatwick' },
            ],
        };

        it('should return only matched airports in group', () => {
            const result = filterGroupsAirportsBySearchValue([], mockAirportsGroup, 'Gatwick');

            const expectedOutput = [
                {
                    code: '',
                    name: '',
                    airports: [{ code: 'LGW', name: 'London Gatwick' }],
                },
            ];

            expect(result).toEqual(expectedOutput);
        });

        it('should return the initial accumulator when there are no matches', () => {
            const mockAccumulator = [
                {
                    code: '',
                    name: '',
                    airports: [{ code: 'LHR', name: 'London Heathrow' }],
                },
            ];
            const result = filterGroupsAirportsBySearchValue(mockAccumulator, mockAirportsGroup, 'Paris');

            expect(result).toEqual(mockAccumulator);
        });
    });

    describe('filterAirports', () => {
        const airports = [
            {
                airports: [
                    {
                        airports: [
                            {
                                code: 'LGW',
                                name: 'London Gatwick',
                            },
                            {
                                code: 'LTN',
                                name: 'London Luton test',
                            },
                        ],
                        code: '',
                        name: 'London',
                    },
                    {
                        code: '',
                        name: 'Belfast test',
                    },
                ],
            },
        ] as IAirportCountry[];

        it('should return only airports that match the searched value', () => {
            const result = filterAirports(airports, 'test');
            expect(result).toEqual([
                {
                    airports: [
                        {
                            airports: [
                                {
                                    code: 'LTN',
                                    name: 'London Luton test',
                                },
                            ],
                            code: '',
                            name: 'London',
                        },
                        {
                            code: '',
                            name: 'Belfast test',
                        },
                    ],
                },
            ]);
        });

        it('should return an empty array when no airports match the filter', () => {
            const result = filterAirports(airports, 'Nonexistent Airport');
            expect(result).toEqual([
                {
                    airports: [],
                },
            ]);
        });
    });

    describe('isCheckedAirport', () => {
        it('should return true when airport is checked', () => {
            const airport = { ...airportMock, code: 'code-1', airports: undefined };

            expect(isCheckedAirport(['code-1'])(airport)).toBe(true);
        });

        it('should return false when airport is NOT checked', () => {
            const airport = { ...airportMock, code: 'code-1', airports: undefined };

            expect(isCheckedAirport([])(airport)).toBe(false);
        });

        it('should return true when group airports is checked', () => {
            const group = {
                ...airportCountryMock,
                airports: [
                    { ...airportMock, code: 'code-1' },
                    { ...airportMock, code: 'code-2' },
                ],
            };

            expect(isCheckedAirport(['code-1', 'code-2'])(group)).toBe(true);
        });

        it('should return false when any of group airports is NOT checked', () => {
            const group = {
                ...airportCountryMock,
                airports: [
                    { ...airportMock, code: 'code-1' },
                    { ...airportMock, code: 'code-2' },
                    { ...airportMock, code: 'code-3' },
                ],
            };

            expect(isCheckedAirport(['code-1', 'code-2'])(group)).toBe(false);
        });
    });
});
