import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { SearchPodGenericValues } from 'models/data/tracking/SearchPodEvent';
import { DestinationType } from 'models/enum/DestinationType';

import {
    buildDestinationRegionLists,
    buildDestinationTitles,
    buildFooterTrackingData,
    determineDestinationSelectionType,
    findParentCountryForRegion,
    getAllChildrenFromParent,
    hasGroupSelectionsInDestinations,
    hasIndividualSelectionsInDestinations,
    processCountryOrVirtualCountry,
    processIndividualRegionOrResort,
    processVirtualRegion,
} from './searchPodToField.utils';

describe('searchPodToField.utils', () => {
    const mockIsDisabledItem = jest.fn((item: IDestination) => item.code === 'BOD');

    beforeEach(() => {
        mockIsDisabledItem.mockClear();
    });

    describe('findParentCountryForRegion', () => {
        it('should find country by matching code', () => {
            const regionParent: IDestination = {
                code: 'TUR',
                name: 'Turkey',
                type: DestinationType.Country,
            };

            const countries: IDestinationCountry[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                    children: [],
                },
                {
                    code: 'GRC',
                    name: 'Greece',
                    type: DestinationType.Country,
                    children: [],
                },
            ];

            const result = findParentCountryForRegion(regionParent, countries);

            expect(result).toEqual(countries[0]);
        });

        it('should find country by related regions', () => {
            const regionParent: IDestination = {
                code: 'SCT',
                name: 'Scotland',
                type: DestinationType.Region,
            };

            const countries: IDestinationCountry[] = [
                {
                    code: 'UK',
                    name: 'United Kingdom',
                    type: DestinationType.Country,
                    relatedRegions: ['SCT', 'NIR'],
                    children: [],
                },
            ];

            const result = findParentCountryForRegion(regionParent, countries);

            expect(result).toEqual(countries[0]);
        });

        it('should return undefined if no match found', () => {
            const regionParent: IDestination = {
                code: 'UNKNOWN',
                name: 'Unknown',
                type: DestinationType.Region,
            };

            const countries: IDestinationCountry[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                    children: [],
                },
            ];

            const result = findParentCountryForRegion(regionParent, countries);

            expect(result).toBeUndefined();
        });
    });

    describe('getAllChildrenFromParent', () => {
        it('should return formatted children names with availability marking', () => {
            const parent: IDestinationCountry = {
                code: 'TUR',
                name: 'Turkey',
                type: DestinationType.Country,
                children: [
                    { code: 'AYT', name: 'Antalya', itemName: 'Antalya', type: DestinationType.Resort },
                    { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum', type: DestinationType.Resort },
                    { code: 'DLM', name: 'Dalaman', itemName: 'Dalaman', type: DestinationType.Resort },
                ],
            };

            const result = getAllChildrenFromParent(parent, mockIsDisabledItem);

            expect(result).toEqual(['Antalya', 'Bodrum(unavailable)', 'Dalaman']);
            expect(mockIsDisabledItem).toHaveBeenCalledTimes(3);
        });

        it('should return empty array if no children', () => {
            const parent: IDestinationCountry = {
                code: 'TUR',
                name: 'Turkey',
                type: DestinationType.Country,
                children: undefined,
            };

            const result = getAllChildrenFromParent(parent, mockIsDisabledItem);

            expect(result).toEqual([]);
            expect(mockIsDisabledItem).not.toHaveBeenCalled();
        });

        it('should use itemName over name if available', () => {
            const parent: IDestinationCountry = {
                code: 'TUR',
                name: 'Turkey',
                type: DestinationType.Country,
                children: [
                    { code: 'AYT', name: 'Antalya Name', itemName: 'Antalya ItemName', type: DestinationType.Resort },
                ],
            };

            const result = getAllChildrenFromParent(parent, mockIsDisabledItem);

            expect(result).toEqual(['Antalya ItemName']);
        });
    });

    describe('processCountryOrVirtualCountry', () => {
        const countriesWithRegions: IDestinationCountry[] = [
            {
                code: 'TUR',
                name: 'Turkey',
                type: DestinationType.Country,
                children: [
                    { code: 'AYT', name: 'Antalya', itemName: 'Antalya', type: DestinationType.Resort },
                    { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum', type: DestinationType.Resort },
                    { code: 'DLM', name: 'Dalaman', itemName: 'Dalaman', type: DestinationType.Resort },
                ],
            },
        ];

        it('should process country and return all regions with selected ones', () => {
            const dest: IDestination = {
                code: 'TUR',
                name: 'Turkey',
                type: DestinationType.Country,
            };

            const result = processCountryOrVirtualCountry(dest, countriesWithRegions, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Antalya', 'Bodrum(unavailable)', 'Dalaman'],
                selectedRegions: ['Antalya', 'Dalaman'],
            });
        });

        it('should return empty arrays if country not found', () => {
            const dest: IDestination = {
                code: 'UNKNOWN',
                name: 'Unknown',
                type: DestinationType.Country,
            };

            const result = processCountryOrVirtualCountry(dest, countriesWithRegions, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: [],
                selectedRegions: [],
            });
        });

        it('should return empty arrays if country has no children', () => {
            const dest: IDestination = {
                code: 'EMPTY',
                name: 'Empty Country',
                type: DestinationType.Country,
            };

            const countries: IDestinationCountry[] = [
                {
                    code: 'EMPTY',
                    name: 'Empty Country',
                    type: DestinationType.Country,
                    children: undefined,
                },
            ];

            const result = processCountryOrVirtualCountry(dest, countries, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: [],
                selectedRegions: [],
            });
        });
    });

    describe('processVirtualRegion', () => {
        const countriesWithRegions: IDestinationCountry[] = [
            {
                code: 'UK',
                name: 'United Kingdom',
                type: DestinationType.Country,
                children: [
                    {
                        code: 'SCT',
                        name: 'Scotland',
                        itemName: 'Scotland',
                        type: DestinationType.Region,
                        relatedRegions: ['ABZ', 'EDI', 'GLA'],
                    },
                    {
                        code: 'ABZ',
                        name: 'Aberdeen City',
                        itemName: 'Aberdeen City',
                        type: DestinationType.Resort,
                    },
                    {
                        code: 'EDI',
                        name: 'Edinburgh City',
                        itemName: 'Edinburgh City',
                        type: DestinationType.Resort,
                    },
                    {
                        code: 'GLA',
                        name: 'Glasgow City',
                        itemName: 'Glasgow City',
                        type: DestinationType.Resort,
                    },
                ],
            },
        ];

        it('should process virtual region with related regions', () => {
            const dest: IDestination = {
                code: 'SCT',
                name: 'Scotland',
                type: DestinationType.VirtualRegion,
            };

            const mockIsDisabled = jest.fn((item: IDestination) => item.code === 'EDI');

            const result = processVirtualRegion(dest, countriesWithRegions, mockIsDisabled);

            expect(result).toEqual({
                allRegions: ['Aberdeen City', 'Edinburgh City(unavailable)', 'Glasgow City'],
                selectedRegions: ['Aberdeen City', 'Glasgow City'],
            });
        });

        it('should return empty arrays if region not found', () => {
            const dest: IDestination = {
                code: 'UNKNOWN',
                name: 'Unknown',
                type: DestinationType.VirtualRegion,
            };

            const result = processVirtualRegion(dest, countriesWithRegions, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: [],
                selectedRegions: [],
            });
        });

        it('should return empty arrays if region has no related regions', () => {
            const countries: IDestinationCountry[] = [
                {
                    code: 'UK',
                    name: 'United Kingdom',
                    type: DestinationType.Country,
                    children: [
                        {
                            code: 'SCT',
                            name: 'Scotland',
                            itemName: 'Scotland',
                            type: DestinationType.Region,
                            relatedRegions: undefined,
                        },
                    ],
                },
            ];

            const dest: IDestination = {
                code: 'SCT',
                name: 'Scotland',
                type: DestinationType.VirtualRegion,
            };

            const result = processVirtualRegion(dest, countries, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: [],
                selectedRegions: [],
            });
        });

        it('should skip related regions that cannot be found', () => {
            const countries: IDestinationCountry[] = [
                {
                    code: 'UK',
                    name: 'United Kingdom',
                    type: DestinationType.Country,
                    children: [
                        {
                            code: 'SCT',
                            name: 'Scotland',
                            itemName: 'Scotland',
                            type: DestinationType.Region,
                            relatedRegions: ['ABZ', 'MISSING', 'EDI'],
                        },
                        {
                            code: 'ABZ',
                            name: 'Aberdeen City',
                            itemName: 'Aberdeen City',
                            type: DestinationType.Resort,
                        },
                        {
                            code: 'EDI',
                            name: 'Edinburgh City',
                            itemName: 'Edinburgh City',
                            type: DestinationType.Resort,
                        },
                    ],
                },
            ];

            const dest: IDestination = {
                code: 'SCT',
                name: 'Scotland',
                type: DestinationType.VirtualRegion,
            };

            const result = processVirtualRegion(dest, countries, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Aberdeen City', 'Edinburgh City'],
                selectedRegions: ['Aberdeen City', 'Edinburgh City'],
            });
        });
    });

    describe('processIndividualRegionOrResort', () => {
        const countriesWithRegions: IDestinationCountry[] = [
            {
                code: 'UK',
                name: 'United Kingdom',
                type: DestinationType.Country,
                relatedRegions: ['SCT'],
                children: [
                    {
                        code: 'SCT',
                        name: 'Scotland',
                        itemName: 'Scotland',
                        type: DestinationType.Region,
                    },
                    {
                        code: 'ABZ',
                        name: 'Aberdeen City',
                        itemName: 'Aberdeen City',
                        type: DestinationType.Resort,
                    },
                    {
                        code: 'EDI',
                        name: 'Edinburgh City',
                        itemName: 'Edinburgh City',
                        type: DestinationType.Resort,
                    },
                ],
            },
        ];

        it('should return single item if destination has no parents', () => {
            const dest: IDestination = {
                code: 'AYT',
                name: 'Antalya',
                itemName: 'Antalya',
                type: DestinationType.Resort,
                parents: undefined,
            };

            const result = processIndividualRegionOrResort(dest, countriesWithRegions, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Antalya'],
                selectedRegions: ['Antalya'],
            });
        });

        it('should process resort with Region parent', () => {
            const dest: IDestination = {
                code: 'ABZ',
                name: 'Aberdeen City',
                itemName: 'Aberdeen City',
                type: DestinationType.Resort,
                parents: [
                    { code: 'SCT', name: 'Scotland', type: DestinationType.Region },
                    { code: 'UK', name: 'United Kingdom', type: DestinationType.Country },
                ],
            };

            const mockIsDisabled = jest.fn((item: IDestination) => item.code === 'EDI');

            const result = processIndividualRegionOrResort(dest, countriesWithRegions, mockIsDisabled);

            expect(result).toEqual({
                allRegions: ['Scotland', 'Aberdeen City', 'Edinburgh City(unavailable)'],
                selectedRegions: ['Aberdeen City'],
            });
        });

        it('should process resort with VirtualCountry parent', () => {
            const countries: IDestinationCountry[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.VirtualCountry,
                    children: [
                        {
                            code: 'ABZ',
                            name: 'Aberdeen City',
                            itemName: 'Aberdeen City',
                            type: DestinationType.Resort,
                        },
                        {
                            code: 'EDI',
                            name: 'Edinburgh City',
                            itemName: 'Edinburgh City',
                            type: DestinationType.Resort,
                        },
                    ],
                },
            ];

            const dest: IDestination = {
                code: 'ABZ',
                name: 'Aberdeen City',
                itemName: 'Aberdeen City',
                type: DestinationType.Resort,
                parents: [{ code: 'SCT', name: 'Scotland', type: DestinationType.VirtualCountry }],
            };

            const result = processIndividualRegionOrResort(dest, countries, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Aberdeen City', 'Edinburgh City'],
                selectedRegions: ['Aberdeen City'],
            });
        });

        it('should process resort with Country parent fallback', () => {
            const countries: IDestinationCountry[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                    children: [
                        {
                            code: 'AYT',
                            name: 'Antalya',
                            itemName: 'Antalya',
                            type: DestinationType.Resort,
                        },
                        {
                            code: 'BOD',
                            name: 'Bodrum',
                            itemName: 'Bodrum',
                            type: DestinationType.Resort,
                        },
                    ],
                },
            ];

            const dest: IDestination = {
                code: 'AYT',
                name: 'Antalya',
                itemName: 'Antalya',
                type: DestinationType.Resort,
                parents: [{ code: 'TUR', name: 'Turkey', type: DestinationType.Country }],
            };

            const result = processIndividualRegionOrResort(dest, countries, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Antalya', 'Bodrum(unavailable)'],
                selectedRegions: ['Antalya'],
            });
        });

        it('should return single item if no valid parent found', () => {
            const dest: IDestination = {
                code: 'AYT',
                name: 'Antalya',
                itemName: 'Antalya',
                type: DestinationType.Resort,
                parents: [{ code: 'UNKNOWN', name: 'Unknown', type: DestinationType.Country }],
            };

            const result = processIndividualRegionOrResort(dest, countriesWithRegions, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Antalya'],
                selectedRegions: ['Antalya'],
            });
        });

        it('should return single item if parent country not in list', () => {
            const dest: IDestination = {
                code: 'AYT',
                name: 'Antalya',
                itemName: 'Antalya',
                type: DestinationType.Resort,
                parents: [{ code: 'TUR', name: 'Turkey', type: DestinationType.Country }],
            };

            const result = processIndividualRegionOrResort(dest, countriesWithRegions, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Antalya'],
                selectedRegions: ['Antalya'],
            });
        });
    });

    describe('buildDestinationRegionLists', () => {
        const countriesWithRegions: IDestinationCountry[] = [
            {
                code: 'TUR',
                name: 'Turkey',
                type: DestinationType.Country,
                children: [
                    { code: 'AYT', name: 'Antalya', itemName: 'Antalya', type: DestinationType.Resort },
                    { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum', type: DestinationType.Resort },
                ],
            },
        ];

        it('should route Country type to processCountryOrVirtualCountry', () => {
            const dest: IDestination = {
                code: 'TUR',
                name: 'Turkey',
                type: DestinationType.Country,
            };

            const result = buildDestinationRegionLists(dest, countriesWithRegions, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Antalya', 'Bodrum(unavailable)'],
                selectedRegions: ['Antalya'],
            });
        });

        it('should route VirtualCountry type to processCountryOrVirtualCountry', () => {
            const countries: IDestinationCountry[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.VirtualCountry,
                    children: [{ code: 'ABZ', name: 'Aberdeen', itemName: 'Aberdeen', type: DestinationType.Resort }],
                },
            ];

            const dest: IDestination = {
                code: 'SCT',
                name: 'Scotland',
                type: DestinationType.VirtualCountry,
            };

            const result = buildDestinationRegionLists(dest, countries, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Aberdeen'],
                selectedRegions: ['Aberdeen'],
            });
        });

        it('should route VirtualRegion type to processVirtualRegion', () => {
            const countries: IDestinationCountry[] = [
                {
                    code: 'UK',
                    name: 'United Kingdom',
                    type: DestinationType.Country,
                    children: [
                        {
                            code: 'SCT',
                            name: 'Scotland',
                            itemName: 'Scotland',
                            type: DestinationType.VirtualRegion,
                            relatedRegions: ['ABZ'],
                        },
                        {
                            code: 'ABZ',
                            name: 'Aberdeen',
                            itemName: 'Aberdeen',
                            type: DestinationType.Resort,
                        },
                    ],
                },
            ];

            const dest: IDestination = {
                code: 'SCT',
                name: 'Scotland',
                type: DestinationType.VirtualRegion,
            };

            const result = buildDestinationRegionLists(dest, countries, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Aberdeen'],
                selectedRegions: ['Aberdeen'],
            });
        });

        it('should route Region type to processIndividualRegionOrResort', () => {
            const dest: IDestination = {
                code: 'SCT',
                name: 'Scotland',
                itemName: 'Scotland',
                type: DestinationType.Region,
                parents: undefined,
            };

            const result = buildDestinationRegionLists(dest, countriesWithRegions, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Scotland'],
                selectedRegions: ['Scotland'],
            });
        });

        it('should route Resort type to processIndividualRegionOrResort', () => {
            const dest: IDestination = {
                code: 'AYT',
                name: 'Antalya',
                itemName: 'Antalya',
                type: DestinationType.Resort,
                parents: [{ code: 'TUR', name: 'Turkey', type: DestinationType.Country }],
            };

            const result = buildDestinationRegionLists(dest, countriesWithRegions, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: ['Antalya', 'Bodrum(unavailable)'],
                selectedRegions: ['Antalya'],
            });
        });

        it('should return empty arrays for unknown destination type', () => {
            const dest: IDestination = {
                code: 'ANY',
                name: 'Anywhere',
                type: DestinationType.Anywhere,
            };

            const result = buildDestinationRegionLists(dest, countriesWithRegions, mockIsDisabledItem);

            expect(result).toEqual({
                allRegions: [],
                selectedRegions: [],
            });
        });
    });

    describe('buildDestinationTitles', () => {
        it('should return itemName for destinations without parents', () => {
            const destinations: IDestination[] = [
                {
                    code: 'TUR',
                    name: 'Turkey Name',
                    itemName: 'Turkey ItemName',
                    type: DestinationType.Country,
                },
                {
                    code: 'GRC',
                    name: 'Greece',
                    type: DestinationType.Country,
                },
            ];

            const result = buildDestinationTitles(destinations);

            expect(result).toEqual(['Turkey ItemName', 'Greece']);
        });

        it('should return parent VirtualCountry name for Resort destinations with parents', () => {
            const destinations: IDestination[] = [
                {
                    code: 'ABZ',
                    name: 'Aberdeen',
                    itemName: 'Aberdeen City',
                    type: DestinationType.Resort,
                    parents: [
                        {
                            code: 'SCT',
                            name: 'Scotland',
                            itemName: 'Scotland ItemName',
                            type: DestinationType.VirtualCountry,
                        },
                    ],
                },
            ];

            const result = buildDestinationTitles(destinations);

            expect(result).toEqual(['Scotland ItemName']);
        });

        it('should prioritize Region over VirtualCountry in hierarchy for Resort', () => {
            const destinations: IDestination[] = [
                {
                    code: 'ABZ',
                    name: 'Aberdeen',
                    itemName: 'Aberdeen City',
                    type: DestinationType.Resort,
                    parents: [
                        { code: 'SCT', name: 'Scotland', itemName: 'Scotland Region', type: DestinationType.Region },
                        {
                            code: 'UK',
                            name: 'United Kingdom',
                            itemName: 'UK Virtual',
                            type: DestinationType.VirtualCountry,
                        },
                        { code: 'GB', name: 'Great Britain', itemName: 'GB Country', type: DestinationType.Country },
                    ],
                },
            ];

            const result = buildDestinationTitles(destinations);

            expect(result).toEqual(['Scotland Region']);
        });

        it('should prioritize VirtualCountry over Country in hierarchy when no Region (Resort)', () => {
            const destinations: IDestination[] = [
                {
                    code: 'ABZ',
                    name: 'Aberdeen',
                    itemName: 'Aberdeen City',
                    type: DestinationType.Resort,
                    parents: [
                        {
                            code: 'UK',
                            name: 'United Kingdom',
                            itemName: 'UK Virtual',
                            type: DestinationType.VirtualCountry,
                        },
                        { code: 'GB', name: 'Great Britain', itemName: 'GB Country', type: DestinationType.Country },
                    ],
                },
            ];

            const result = buildDestinationTitles(destinations);

            expect(result).toEqual(['UK Virtual']);
        });

        it('should use Country when no Region or VirtualCountry present (Resort)', () => {
            const destinations: IDestination[] = [
                {
                    code: 'AYT',
                    name: 'Antalya',
                    itemName: 'Antalya City',
                    type: DestinationType.Resort,
                    parents: [
                        { code: 'TUR', name: 'Turkey', itemName: 'Turkey Country', type: DestinationType.Country },
                    ],
                },
            ];

            const result = buildDestinationTitles(destinations);

            expect(result).toEqual(['Turkey Country']);
        });

        it('should fallback to itemName when no parent hierarchy found', () => {
            const destinations: IDestination[] = [
                {
                    code: 'AYT',
                    name: 'Antalya Name',
                    itemName: 'Antalya ItemName',
                    type: DestinationType.Resort,
                    parents: [{ code: 'UNKNOWN', name: 'Unknown', type: DestinationType.Anywhere }],
                },
            ];

            const result = buildDestinationTitles(destinations);

            expect(result).toEqual(['Antalya ItemName']);
        });

        it('should fallback to name when no itemName and no parent hierarchy', () => {
            const destinations: IDestination[] = [
                {
                    code: 'AYT',
                    name: 'Antalya Name',
                    type: DestinationType.Resort,
                    parents: [{ code: 'UNKNOWN', name: 'Unknown', type: DestinationType.Anywhere }],
                },
            ];

            const result = buildDestinationTitles(destinations);

            expect(result).toEqual(['Antalya Name']);
        });

        it('should return itemName for Country type destinations', () => {
            const destinations: IDestination[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    itemName: 'Turkey ItemName',
                    type: DestinationType.Country,
                    parents: [{ code: 'EUR', name: 'Europe', type: DestinationType.Region }],
                },
            ];

            const result = buildDestinationTitles(destinations);

            expect(result).toEqual(['Turkey ItemName']);
        });

        it('should handle mixed destination types', () => {
            const destinations: IDestination[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    itemName: 'Turkey ItemName',
                    type: DestinationType.Country,
                },
                {
                    code: 'AYT',
                    name: 'Antalya',
                    itemName: 'Antalya City',
                    type: DestinationType.Resort,
                    parents: [
                        { code: 'TUR', name: 'Turkey', itemName: 'Turkey Parent', type: DestinationType.Country },
                    ],
                },
            ];

            const result = buildDestinationTitles(destinations);

            expect(result).toEqual(['Turkey ItemName', 'Turkey Parent']);
        });

        it('should return empty array for empty input', () => {
            const result = buildDestinationTitles([]);

            expect(result).toEqual([]);
        });
    });

    describe('hasGroupSelectionsInDestinations', () => {
        it('should return true when Country type is present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                },
            ];

            const result = hasGroupSelectionsInDestinations(destinations);

            expect(result).toBe(true);
        });

        it('should return true when VirtualCountry type is present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.VirtualCountry,
                },
            ];

            const result = hasGroupSelectionsInDestinations(destinations);

            expect(result).toBe(true);
        });

        it('should return true when VirtualRegion type is present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.VirtualRegion,
                },
            ];

            const result = hasGroupSelectionsInDestinations(destinations);

            expect(result).toBe(true);
        });

        it('should return true when mixed group types are present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                },
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.VirtualRegion,
                },
                {
                    code: 'AYT',
                    name: 'Antalya',
                    type: DestinationType.Resort,
                },
            ];

            const result = hasGroupSelectionsInDestinations(destinations);

            expect(result).toBe(true);
        });

        it('should return false when only Region type is present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.Region,
                },
            ];

            const result = hasGroupSelectionsInDestinations(destinations);

            expect(result).toBe(false);
        });

        it('should return false when only Resort type is present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'AYT',
                    name: 'Antalya',
                    type: DestinationType.Resort,
                },
            ];

            const result = hasGroupSelectionsInDestinations(destinations);

            expect(result).toBe(false);
        });

        it('should return false for empty array', () => {
            const result = hasGroupSelectionsInDestinations([]);

            expect(result).toBe(false);
        });
    });

    describe('hasIndividualSelectionsInDestinations', () => {
        it('should return true when Region type is present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.Region,
                },
            ];

            const result = hasIndividualSelectionsInDestinations(destinations);

            expect(result).toBe(true);
        });

        it('should return true when Resort type is present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'AYT',
                    name: 'Antalya',
                    type: DestinationType.Resort,
                },
            ];

            const result = hasIndividualSelectionsInDestinations(destinations);

            expect(result).toBe(true);
        });

        it('should return true when mixed individual types are present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.Region,
                },
                {
                    code: 'AYT',
                    name: 'Antalya',
                    type: DestinationType.Resort,
                },
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                },
            ];

            const result = hasIndividualSelectionsInDestinations(destinations);

            expect(result).toBe(true);
        });

        it('should return false when only Country type is present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                },
            ];

            const result = hasIndividualSelectionsInDestinations(destinations);

            expect(result).toBe(false);
        });

        it('should return false when only VirtualCountry type is present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.VirtualCountry,
                },
            ];

            const result = hasIndividualSelectionsInDestinations(destinations);

            expect(result).toBe(false);
        });

        it('should return false when only VirtualRegion type is present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.VirtualRegion,
                },
            ];

            const result = hasIndividualSelectionsInDestinations(destinations);

            expect(result).toBe(false);
        });

        it('should return false for empty array', () => {
            const result = hasIndividualSelectionsInDestinations([]);

            expect(result).toBe(false);
        });
    });

    describe('determineDestinationSelectionType', () => {
        it('should return DestinationRegionAllSingle when both group and individual selections present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                },
                {
                    code: 'AYT',
                    name: 'Antalya',
                    type: DestinationType.Resort,
                },
            ];

            const result = determineDestinationSelectionType(destinations);

            expect(result).toBe(SearchPodGenericValues.DestinationRegionAllSingle);
        });

        it('should return DestinationRegionAll when only group selections present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                },
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.VirtualCountry,
                },
            ];

            const result = determineDestinationSelectionType(destinations);

            expect(result).toBe(SearchPodGenericValues.DestinationRegionAll);
        });

        it('should return DestinationRegionSingle when only individual selections present', () => {
            const destinations: IDestination[] = [
                {
                    code: 'AYT',
                    name: 'Antalya',
                    type: DestinationType.Resort,
                },
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.Region,
                },
            ];

            const result = determineDestinationSelectionType(destinations);

            expect(result).toBe(SearchPodGenericValues.DestinationRegionSingle);
        });

        it('should return DestinationRegionSingle for empty array', () => {
            const result = determineDestinationSelectionType([]);

            expect(result).toBe(SearchPodGenericValues.DestinationRegionSingle);
        });

        it('should return DestinationRegionAllSingle with VirtualRegion and Resort', () => {
            const destinations: IDestination[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    type: DestinationType.VirtualRegion,
                },
                {
                    code: 'AYT',
                    name: 'Antalya',
                    type: DestinationType.Resort,
                },
            ];

            const result = determineDestinationSelectionType(destinations);

            expect(result).toBe(SearchPodGenericValues.DestinationRegionAllSingle);
        });
    });

    describe('buildFooterTrackingData', () => {
        const mockIsDisabledItem = jest.fn((item: IDestination) => item.code === 'BOD');

        beforeEach(() => {
            mockIsDisabledItem.mockClear();
        });

        it('should build tracking data for single Country selection', () => {
            const destinations: IDestination[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    itemName: 'Turkey ItemName',
                    type: DestinationType.Country,
                },
            ];

            const countries: IDestinationCountry[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                    children: [
                        { code: 'AYT', name: 'Antalya', itemName: 'Antalya', type: DestinationType.Resort },
                        { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum', type: DestinationType.Resort },
                    ],
                },
            ];

            const result = buildFooterTrackingData(destinations, countries, mockIsDisabledItem);

            expect(result).toEqual({
                destinationTitles: ['Turkey ItemName'],
                allRegionsList: ['Antalya', 'Bodrum(unavailable)'],
                selectedRegionsList: ['Antalya'],
            });
        });

        it('should build tracking data for multiple destinations', () => {
            const destinations: IDestination[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    itemName: 'Turkey',
                    type: DestinationType.Country,
                },
                {
                    code: 'AYT',
                    name: 'Antalya',
                    itemName: 'Antalya',
                    type: DestinationType.Resort,
                    parents: [{ code: 'TUR', name: 'Turkey', itemName: 'Turkey', type: DestinationType.Country }],
                },
            ];

            const countries: IDestinationCountry[] = [
                {
                    code: 'TUR',
                    name: 'Turkey',
                    type: DestinationType.Country,
                    children: [
                        { code: 'AYT', name: 'Antalya', itemName: 'Antalya', type: DestinationType.Resort },
                        { code: 'BOD', name: 'Bodrum', itemName: 'Bodrum', type: DestinationType.Resort },
                        { code: 'DLM', name: 'Dalaman', itemName: 'Dalaman', type: DestinationType.Resort },
                    ],
                },
            ];

            const result = buildFooterTrackingData(destinations, countries, mockIsDisabledItem);

            expect(result).toEqual({
                destinationTitles: ['Turkey', 'Turkey'],
                allRegionsList: [
                    'Antalya',
                    'Bodrum(unavailable)',
                    'Dalaman',
                    'Antalya',
                    'Bodrum(unavailable)',
                    'Dalaman',
                ],
                selectedRegionsList: ['Antalya', 'Dalaman', 'Antalya'],
            });
        });

        it('should build tracking data for Resort with Region parent', () => {
            const destinations: IDestination[] = [
                {
                    code: 'ABZ',
                    name: 'Aberdeen City',
                    itemName: 'Aberdeen City',
                    type: DestinationType.Resort,
                    parents: [
                        { code: 'SCT', name: 'Scotland', itemName: 'Scotland', type: DestinationType.Region },
                        { code: 'UK', name: 'United Kingdom', itemName: 'UK', type: DestinationType.Country },
                    ],
                },
            ];

            const countries: IDestinationCountry[] = [
                {
                    code: 'UK',
                    name: 'United Kingdom',
                    type: DestinationType.Country,
                    relatedRegions: ['SCT'],
                    children: [
                        {
                            code: 'SCT',
                            name: 'Scotland',
                            itemName: 'Scotland',
                            type: DestinationType.Region,
                        },
                        {
                            code: 'ABZ',
                            name: 'Aberdeen City',
                            itemName: 'Aberdeen City',
                            type: DestinationType.Resort,
                        },
                        {
                            code: 'EDI',
                            name: 'Edinburgh City',
                            itemName: 'Edinburgh City',
                            type: DestinationType.Resort,
                        },
                    ],
                },
            ];

            const result = buildFooterTrackingData(destinations, countries, mockIsDisabledItem);

            expect(result).toEqual({
                destinationTitles: ['Scotland'],
                allRegionsList: ['Scotland', 'Aberdeen City', 'Edinburgh City'],
                selectedRegionsList: ['Aberdeen City'],
            });
        });

        it('should handle empty destinations array', () => {
            const result = buildFooterTrackingData([], [], mockIsDisabledItem);

            expect(result).toEqual({
                destinationTitles: [],
                allRegionsList: [],
                selectedRegionsList: [],
            });
        });

        it('should build tracking data for VirtualRegion', () => {
            const destinations: IDestination[] = [
                {
                    code: 'SCT',
                    name: 'Scotland',
                    itemName: 'Scotland',
                    type: DestinationType.VirtualRegion,
                },
            ];

            const countries: IDestinationCountry[] = [
                {
                    code: 'UK',
                    name: 'United Kingdom',
                    type: DestinationType.Country,
                    children: [
                        {
                            code: 'SCT',
                            name: 'Scotland',
                            itemName: 'Scotland',
                            type: DestinationType.VirtualRegion,
                            relatedRegions: ['ABZ', 'EDI'],
                        },
                        {
                            code: 'ABZ',
                            name: 'Aberdeen',
                            itemName: 'Aberdeen',
                            type: DestinationType.Resort,
                        },
                        {
                            code: 'EDI',
                            name: 'Edinburgh',
                            itemName: 'Edinburgh',
                            type: DestinationType.Resort,
                        },
                    ],
                },
            ];

            const result = buildFooterTrackingData(destinations, countries, mockIsDisabledItem);

            expect(result).toEqual({
                destinationTitles: ['Scotland'],
                allRegionsList: ['Aberdeen', 'Edinburgh'],
                selectedRegionsList: ['Aberdeen', 'Edinburgh'],
            });
        });

        it('should handle destinations with no matching data in countries', () => {
            const destinations: IDestination[] = [
                {
                    code: 'UNKNOWN',
                    name: 'Unknown',
                    itemName: 'Unknown',
                    type: DestinationType.Resort,
                },
            ];

            const countries: IDestinationCountry[] = [];

            const result = buildFooterTrackingData(destinations, countries, mockIsDisabledItem);

            expect(result).toEqual({
                destinationTitles: ['Unknown'],
                allRegionsList: ['Unknown'],
                selectedRegionsList: ['Unknown'],
            });
        });
    });
});
