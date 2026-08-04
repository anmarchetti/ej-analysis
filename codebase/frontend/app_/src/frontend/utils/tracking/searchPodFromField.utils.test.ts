import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

import {
    buildDepartureTitles,
    buildMultiDepartureAirportsList,
    buildSelectedAirportsList,
    determineSelectionType,
    getDisplayGroupName,
    getGroupAirportsList,
    getIndividualAirportName,
    processAirportGroup,
    processIndividualAirport,
} from './searchPodFromField.utils';

describe('searchPodFromField.utils', () => {
    const mockIsDisabledItem = jest.fn((airport: IAirport) => airport.code === 'STN');

    beforeEach(() => {
        mockIsDisabledItem.mockClear();
    });

    describe('getDisplayGroupName', () => {
        it('should return group name with "(all)" suffix for multiple airports', () => {
            const airports = [
                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
            ] as IAirport[];

            const result = getDisplayGroupName('London', airports);

            expect(result).toBe('London (all)');
        });

        it('should return group name without "(all)" suffix for single airport', () => {
            const airports = [{ name: 'Manchester', code: 'MAN', itemName: 'Manchester' }] as IAirport[];

            const result = getDisplayGroupName('Manchester', airports);

            expect(result).toBe('Manchester');
        });

        it('should return group name without "(all)" suffix for empty airports array', () => {
            const airports = [] as IAirport[];

            const result = getDisplayGroupName('Empty', airports);

            expect(result).toBe('Empty');
        });
    });

    describe('processAirportGroup', () => {
        it('should return null when no airports in group are selected', () => {
            const item = {
                name: 'London',
                code: 'LON',
                itemName: 'London',
                airports: [
                    { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                    { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                ],
            } as any;
            const selectedOrigins = ['MAN'];

            const result = processAirportGroup(item, selectedOrigins, mockIsDisabledItem);

            expect(result).toBeNull();
        });

        it('should return group name with "(all)" when all available airports are selected', () => {
            const item = {
                name: 'London',
                code: 'LON',
                itemName: 'London',
                airports: [
                    { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                    { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                ],
            } as any;
            const selectedOrigins = ['LGW', 'LTN'];

            const result = processAirportGroup(item, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                country: 'London',
                title: 'London(all)',
            });
        });

        it('should return group name without "(all)" when only some airports are selected', () => {
            const item = {
                name: 'London',
                code: 'LON',
                itemName: 'London',
                airports: [
                    { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                    { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                ],
            } as any;
            const selectedOrigins = ['LGW'];

            const result = processAirportGroup(item, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                country: 'London',
                title: 'London',
            });
        });

        it('should return group name without "(all)" when only one available airport exists', () => {
            const item = {
                name: 'Manchester',
                code: 'MAN',
                itemName: 'Manchester',
                airports: [{ name: 'Manchester', code: 'MAN', itemName: 'Manchester' }],
            } as any;
            const selectedOrigins = ['MAN'];

            const result = processAirportGroup(item, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                country: 'Manchester',
                title: 'Manchester',
            });
        });

        it('should show "(all)" when all available airports are selected, excluding disabled ones', () => {
            const item = {
                name: 'London',
                code: 'LON',
                itemName: 'London',
                airports: [
                    { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                    { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                    { name: 'Stansted', code: 'STN', itemName: 'Stansted' },
                ],
            } as any;
            const selectedOrigins = ['LGW', 'LTN', 'STN'];

            const result = processAirportGroup(item, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                country: 'London',
                title: 'London(all)',
            });
        });
    });

    describe('processIndividualAirport', () => {
        it('should return null when airport is not selected', () => {
            const item = { name: 'Manchester', code: 'MAN', itemName: 'Manchester' } as IAirport;
            const selectedOrigins = ['LGW'];

            const result = processIndividualAirport(item, selectedOrigins);

            expect(result).toBeNull();
        });

        it('should return airport data when airport is selected', () => {
            const item = { name: 'Manchester', code: 'MAN', itemName: 'Manchester' } as IAirport;
            const selectedOrigins = ['MAN'];

            const result = processIndividualAirport(item, selectedOrigins);

            expect(result).toEqual({
                country: 'Manchester',
                title: 'Manchester',
            });
        });
    });

    describe('buildDepartureTitles', () => {
        it('should return empty arrays when no airports are selected', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [{ name: 'Manchester', code: 'MAN', itemName: 'Manchester' }],
                },
            ] as IAirportCountry[];
            const selectedOrigins = [];

            const result = buildDepartureTitles(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                selectedCountries: [],
                titles: [],
            });
        });

        it('should build titles for individual airport selections', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        { name: 'Manchester', code: 'MAN', itemName: 'Manchester' },
                        { name: 'Birmingham', code: 'BHX', itemName: 'Birmingham' },
                    ],
                },
            ] as IAirportCountry[];
            const selectedOrigins = ['MAN', 'BHX'];

            const result = buildDepartureTitles(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                selectedCountries: ['Manchester', 'Birmingham'],
                titles: ['Manchester', 'Birmingham'],
            });
        });

        it('should build titles for group selections', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'London',
                            code: 'LON',
                            itemName: 'London',
                            airports: [
                                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                            ],
                        },
                    ],
                },
            ] as any;
            const selectedOrigins = ['LGW', 'LTN'];

            const result = buildDepartureTitles(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                selectedCountries: ['London'],
                titles: ['London(all)'],
            });
        });

        it('should handle mixed group and individual selections', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'London',
                            code: 'LON',
                            itemName: 'London',
                            airports: [
                                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                            ],
                        },
                        { name: 'Manchester', code: 'MAN', itemName: 'Manchester' },
                    ],
                },
            ] as any;
            const selectedOrigins = ['LGW', 'LTN', 'MAN'];

            const result = buildDepartureTitles(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                selectedCountries: ['London', 'Manchester'],
                titles: ['London(all)', 'Manchester'],
            });
        });

        it('should skip countries without airports', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                },
            ] as IAirportCountry[];
            const selectedOrigins = ['MAN'];

            const result = buildDepartureTitles(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                selectedCountries: [],
                titles: [],
            });
        });
    });

    describe('getGroupAirportsList', () => {
        it('should return empty array when no airports in group are selected', () => {
            const groupAirports = [
                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
            ] as IAirport[];
            const selectedOrigins = ['MAN'];

            const result = getGroupAirportsList(groupAirports, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual([]);
        });

        it('should return all airports when some are selected', () => {
            const groupAirports = [
                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
            ] as IAirport[];
            const selectedOrigins = ['LGW'];

            const result = getGroupAirportsList(groupAirports, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual(['Gatwick', 'Luton']);
        });

        it('should mark disabled airports as unavailable', () => {
            const groupAirports = [
                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                { name: 'Stansted', code: 'STN', itemName: 'Stansted' },
            ] as IAirport[];
            const selectedOrigins = ['LGW', 'STN'];

            const result = getGroupAirportsList(groupAirports, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual(['Gatwick', 'Stansted (unavailable)']);
        });
    });

    describe('getIndividualAirportName', () => {
        it('should return null when airport is not selected', () => {
            const item = { name: 'Manchester', code: 'MAN', itemName: 'Manchester' } as IAirport;
            const selectedOrigins = ['LGW'];

            const result = getIndividualAirportName(item, selectedOrigins, mockIsDisabledItem);

            expect(result).toBeNull();
        });

        it('should return airport name when selected and not disabled', () => {
            const item = { name: 'Manchester', code: 'MAN', itemName: 'Manchester' } as IAirport;
            const selectedOrigins = ['MAN'];

            const result = getIndividualAirportName(item, selectedOrigins, mockIsDisabledItem);

            expect(result).toBe('Manchester');
        });

        it('should return airport name with "(unavailable)" when selected and disabled', () => {
            const item = { name: 'Stansted', code: 'STN', itemName: 'Stansted' } as IAirport;
            const selectedOrigins = ['STN'];

            const result = getIndividualAirportName(item, selectedOrigins, mockIsDisabledItem);

            expect(result).toBe('Stansted (unavailable)');
        });
    });

    describe('buildMultiDepartureAirportsList', () => {
        it('should return empty string when no airports are selected', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [{ name: 'Manchester', code: 'MAN', itemName: 'Manchester' }],
                },
            ] as IAirportCountry[];
            const selectedOrigins = [];

            const result = buildMultiDepartureAirportsList(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toBe('');
        });

        it('should build pipe-separated list of individual airports', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        { name: 'Manchester', code: 'MAN', itemName: 'Manchester' },
                        { name: 'Birmingham', code: 'BHX', itemName: 'Birmingham' },
                    ],
                },
            ] as IAirportCountry[];
            const selectedOrigins = ['MAN', 'BHX'];

            const result = buildMultiDepartureAirportsList(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toBe('Manchester|Birmingham');
        });

        it('should build list for group selections including all airports', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'London',
                            code: 'LON',
                            itemName: 'London',
                            airports: [
                                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                            ],
                        },
                    ],
                },
            ] as any;
            const selectedOrigins = ['LGW'];

            const result = buildMultiDepartureAirportsList(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toBe('Gatwick|Luton');
        });

        it('should mark disabled airports as unavailable', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'London',
                            code: 'LON',
                            itemName: 'London',
                            airports: [
                                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                                { name: 'Stansted', code: 'STN', itemName: 'Stansted' },
                            ],
                        },
                    ],
                },
            ] as any;
            const selectedOrigins = ['LGW', 'STN'];

            const result = buildMultiDepartureAirportsList(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toBe('Gatwick|Stansted (unavailable)');
        });
    });

    describe('buildSelectedAirportsList', () => {
        it('should return empty string when no airports are selected', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [{ name: 'Manchester', code: 'MAN', itemName: 'Manchester' }],
                },
            ] as IAirportCountry[];
            const selectedOrigins = [];

            const result = buildSelectedAirportsList(countries, selectedOrigins);

            expect(result).toBe('');
        });

        it('should build pipe-separated list of selected individual airports', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        { name: 'Manchester', code: 'MAN', itemName: 'Manchester' },
                        { name: 'Birmingham', code: 'BHX', itemName: 'Birmingham' },
                    ],
                },
            ] as IAirportCountry[];
            const selectedOrigins = ['MAN', 'BHX'];

            const result = buildSelectedAirportsList(countries, selectedOrigins);

            expect(result).toBe('Manchester|Birmingham');
        });

        it('should only include selected airports from groups', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'London',
                            code: 'LON',
                            itemName: 'London',
                            airports: [
                                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                                { name: 'Stansted', code: 'STN', itemName: 'Stansted' },
                            ],
                        },
                    ],
                },
            ] as any;
            const selectedOrigins = ['LGW', 'LTN'];

            const result = buildSelectedAirportsList(countries, selectedOrigins);

            expect(result).toBe('Gatwick|Luton');
        });

        it('should handle mixed group and individual selections', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'London',
                            code: 'LON',
                            itemName: 'London',
                            airports: [
                                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                            ],
                        },
                        { name: 'Manchester', code: 'MAN', itemName: 'Manchester' },
                    ],
                },
            ] as any;
            const selectedOrigins = ['LGW', 'MAN'];

            const result = buildSelectedAirportsList(countries, selectedOrigins);

            expect(result).toBe('Gatwick|Manchester');
        });
    });

    describe('determineSelectionType', () => {
        it('should return false for both when no airports are selected', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [{ name: 'Manchester', code: 'MAN', itemName: 'Manchester' }],
                },
            ] as IAirportCountry[];
            const selectedOrigins = [];

            const result = determineSelectionType(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                hasGroupSelections: false,
                hasIndividualSelections: false,
            });
        });

        it('should detect group selections when all available airports in a group are selected', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'London',
                            code: 'LON',
                            itemName: 'London',
                            airports: [
                                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                            ],
                        },
                    ],
                },
            ] as any;
            const selectedOrigins = ['LGW', 'LTN'];

            const result = determineSelectionType(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                hasGroupSelections: true,
                hasIndividualSelections: false,
            });
        });

        it('should detect individual selections when only some airports in a group are selected', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'London',
                            code: 'LON',
                            itemName: 'London',
                            airports: [
                                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                            ],
                        },
                    ],
                },
            ] as any;
            const selectedOrigins = ['LGW'];

            const result = determineSelectionType(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                hasGroupSelections: false,
                hasIndividualSelections: true,
            });
        });

        it('should detect individual selections for standalone airports', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        { name: 'Manchester', code: 'MAN', itemName: 'Manchester' },
                        { name: 'Birmingham', code: 'BHX', itemName: 'Birmingham' },
                    ],
                },
            ] as IAirportCountry[];
            const selectedOrigins = ['MAN'];

            const result = determineSelectionType(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                hasGroupSelections: false,
                hasIndividualSelections: true,
            });
        });

        it('should detect both group and individual selections', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'London',
                            code: 'LON',
                            itemName: 'London',
                            airports: [
                                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                            ],
                        },
                        { name: 'Manchester', code: 'MAN', itemName: 'Manchester' },
                    ],
                },
            ] as any;
            const selectedOrigins = ['LGW', 'LTN', 'MAN'];

            const result = determineSelectionType(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                hasGroupSelections: true,
                hasIndividualSelections: true,
            });
        });

        it('should handle disabled airports correctly in group selection detection', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'London',
                            code: 'LON',
                            itemName: 'London',
                            airports: [
                                { name: 'Gatwick', code: 'LGW', itemName: 'Gatwick' },
                                { name: 'Luton', code: 'LTN', itemName: 'Luton' },
                                { name: 'Stansted', code: 'STN', itemName: 'Stansted' },
                            ],
                        },
                    ],
                },
            ] as any;
            const selectedOrigins = ['LGW', 'LTN', 'STN'];

            const result = determineSelectionType(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                hasGroupSelections: true,
                hasIndividualSelections: false,
            });
        });

        it('should not detect group selection when only one available airport in group', () => {
            const countries = [
                {
                    name: 'United Kingdom',
                    code: 'UK',
                    airports: [
                        {
                            name: 'Manchester',
                            code: 'MAN',
                            itemName: 'Manchester',
                            airports: [{ name: 'Manchester', code: 'MAN', itemName: 'Manchester' }],
                        },
                    ],
                },
            ] as any;
            const selectedOrigins = ['MAN'];

            const result = determineSelectionType(countries, selectedOrigins, mockIsDisabledItem);

            expect(result).toEqual({
                hasGroupSelections: false,
                hasIndividualSelections: true,
            });
        });
    });
});
