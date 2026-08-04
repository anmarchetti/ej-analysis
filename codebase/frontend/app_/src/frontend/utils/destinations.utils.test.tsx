import { destinationMock } from 'frontend/__mocks__';
import { deepClone } from 'frontend/utils/array.utils';
import { IDestination } from 'models/data/IDestination';
import { DestinationType } from 'models/enum/DestinationType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import * as destinationUtils from './destinations.utils';

describe('destinations.utils', () => {
    describe('checkDestinationTypeExists', () => {
        it('should return true when destination with search type exists', () => {
            const destination: IDestination = {
                name: 'test',
                code: 'ACTEST',
                type: DestinationType.VirtualRegion,
            };

            const res = destinationUtils.checkDestinationTypeExists([destination], DestinationType.VirtualRegion);

            expect(res).toBe(true);
        });

        it("should return false when destination with search type doesn't exists", () => {
            const destination: IDestination = {
                name: 'test',
                code: 'ACTEST',
                type: DestinationType.VirtualRegion,
            };

            const res = destinationUtils.checkDestinationTypeExists([destination], DestinationType.Hotel);

            expect(res).toBe(false);
        });
    });

    describe('removeRelatedRegions', () => {
        it("should return array excluding virtual regions related regions when destinations include both a virtual region and 1 of it's child regions", () => {
            const destinations: IDestination[] = [
                {
                    name: 'Canary Islands',
                    code: 'CIV',
                    type: DestinationType.VirtualRegion,
                    relatedRegions: ['ESMJ'],
                },
                {
                    name: 'Majorca',
                    code: 'ESMJ',
                    type: DestinationType.Region,
                },
            ];

            const res = destinationUtils.removeRelatedRegions(destinations);

            expect(res).toEqual([
                {
                    name: 'Canary Islands',
                    code: 'CIV',
                    type: DestinationType.VirtualRegion,
                    relatedRegions: ['ESMJ'],
                },
            ]);
        });
    });

    describe('manageDestinationCodes', () => {
        let outputCountries: string[];
        let outputRegions: string[];
        let outputResorts: string[];
        let outputHotels: string[];

        beforeEach(() => {
            outputCountries = [];
            outputRegions = [];
            outputResorts = [];
            outputHotels = [];
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should add country code to the countries array', () => {
            const destinations: IDestination[] = [
                {
                    name: 'country',
                    code: 'countryCode',
                    type: DestinationType.Country,
                },
            ];
            jest.spyOn(destinationUtils, 'getAllDestinations').mockReturnValueOnce(destinations);
            destinationUtils.manageDestinationCodes(
                destinations,
                outputCountries,
                outputRegions,
                outputResorts,
                outputHotels,
            );

            expect(outputCountries).toEqual(['countryCode']);
            expect(outputRegions).toEqual([]);
            expect(outputResorts).toEqual([]);
            expect(outputHotels).toEqual([]);
        });

        it('should add region codes and relatedRegions from virtual country type to the regions array', () => {
            const destinations: IDestination[] = [
                {
                    name: 'region',
                    code: 'regionCode',
                    type: DestinationType.Region,
                },
                {
                    name: 'virtualCountry',
                    code: 'virtualCountryCode',
                    type: DestinationType.VirtualCountry,
                    relatedRegions: ['relatedRegionCode'],
                },
            ];
            jest.spyOn(destinationUtils, 'getAllDestinations').mockReturnValueOnce(destinations);
            destinationUtils.manageDestinationCodes(
                destinations,
                outputCountries,
                outputRegions,
                outputResorts,
                outputHotels,
            );

            expect(outputCountries).toEqual([]);
            expect(outputRegions).toEqual(['regionCode', 'relatedRegionCode']);
            expect(outputResorts).toEqual([]);
            expect(outputHotels).toEqual([]);
        });

        it('should add resort code to the resorts array', () => {
            const destinations: IDestination[] = [
                {
                    name: 'resort',
                    code: 'resortCode',
                    type: DestinationType.Resort,
                },
            ];
            jest.spyOn(destinationUtils, 'getAllDestinations').mockReturnValueOnce(destinations);
            destinationUtils.manageDestinationCodes(
                destinations,
                outputCountries,
                outputRegions,
                outputResorts,
                outputHotels,
            );

            expect(outputCountries).toEqual([]);
            expect(outputRegions).toEqual([]);
            expect(outputResorts).toEqual(['resortCode']);
            expect(outputHotels).toEqual([]);
        });

        it('should add hotels code to the hotels array', () => {
            const destinations: IDestination[] = [
                {
                    name: 'hotels',
                    code: 'hotelsCode',
                    type: DestinationType.Hotel,
                },
            ];
            jest.spyOn(destinationUtils, 'getAllDestinations').mockReturnValueOnce(destinations);
            destinationUtils.manageDestinationCodes(
                destinations,
                outputCountries,
                outputRegions,
                outputResorts,
                outputHotels,
            );

            expect(outputCountries).toEqual([]);
            expect(outputRegions).toEqual([]);
            expect(outputResorts).toEqual([]);
            expect(outputHotels).toEqual(['hotelsCode']);
        });

        it('should recursively processes parents', () => {
            const destinations = [
                {
                    name: 'region',
                    code: 'regionCode',
                    type: DestinationType.Region,
                    parents: [
                        {
                            name: 'country',
                            code: 'countryCode',
                            type: DestinationType.Country,
                        },
                    ],
                },
            ];

            jest.spyOn(destinationUtils, 'getAllDestinations').mockReturnValueOnce(destinations);
            destinationUtils.manageDestinationCodes(
                destinations,
                outputCountries,
                outputRegions,
                outputResorts,
                outputHotels,
            );

            expect(outputCountries).toEqual(['countryCode']);
            expect(outputRegions).toEqual(['regionCode']);
            expect(outputResorts).toEqual([]);
            expect(outputHotels).toEqual([]);
        });

        it('should add codes without duplication', () => {
            const destinations = [
                { type: DestinationType.Country, name: 'country', code: 'countryCode' },
                { type: DestinationType.Country, name: 'country', code: 'countryCode' },
                {
                    name: 'region',
                    code: 'regionCode',
                    type: DestinationType.Region,
                },
                {
                    name: 'region',
                    code: 'regionCode',
                    type: DestinationType.Region,
                },
                {
                    name: 'resort',
                    code: 'resortCode',
                    type: DestinationType.Resort,
                },
                {
                    name: 'resort',
                    code: 'resortCode',
                    type: DestinationType.Resort,
                },
                {
                    name: 'hotels',
                    code: 'hotelsCode',
                    type: DestinationType.Hotel,
                },
                {
                    name: 'hotels',
                    code: 'hotelsCode',
                    type: DestinationType.Hotel,
                },
            ] as IDestination[];

            jest.spyOn(destinationUtils, 'getAllDestinations').mockReturnValueOnce(destinations);
            destinationUtils.manageDestinationCodes(
                destinations,
                outputCountries,
                outputRegions,
                outputResorts,
                outputHotels,
            );

            expect(outputCountries).toEqual(['countryCode']);
            expect(outputRegions).toEqual(['regionCode']);
            expect(outputResorts).toEqual(['resortCode']);
            expect(outputHotels).toEqual(['hotelsCode']);
        });

        it('should ignore destinations without relatedRegions', () => {
            const destinations = [
                {
                    name: 'virtualCountry',
                    code: 'virtualCountryCode',
                    type: DestinationType.VirtualCountry,
                },
            ];

            jest.spyOn(destinationUtils, 'getAllDestinations').mockReturnValueOnce(destinations);
            destinationUtils.manageDestinationCodes(
                destinations,
                outputCountries,
                outputRegions,
                outputResorts,
                outputHotels,
            );

            expect(outputRegions).toEqual([]);
        });
    });

    describe('getCombinedDestinationCodes', () => {
        it('should construct codes array', () => {
            const result = destinationUtils.getCombinedDestinationCodes('ESMJ,CIV,ACTEST', 'ACC,CDS,CPB');

            expect(JSON.stringify(result)).toBe(JSON.stringify(['ESMJ', 'CIV', 'CIV', 'ACC', 'CDS', 'CPB']));
        });
    });

    describe('getDestinationsFromQuery', () => {
        it('should construct entities from query', () => {
            const result = destinationUtils.getDestinationsFromQuery('Balaklawa,Kupawa,Monro');

            expect(result.countries[0]).toBe('Balaklawa');
            expect(result.regions[0]).toBe('Kupawa');
            expect(result.resorts[0]).toBe('Kupawa');
        });
    });

    describe('getIDestinationByKeyValue', () => {
        it('Should handle parent code key', () => {
            const result = destinationUtils.getIDestinationByKeyValue(
                [{ ...destinationMock }],
                'destination_code',
                'code',
            );

            expect(result.code).toBe('destination_code');
        });

        it('Should handle children code key', () => {
            const result = destinationUtils.getIDestinationByKeyValue(
                [{ ...destinationMock }],
                'destination_child_code',
                'code',
            );

            expect(result.code).toBe('destination_child_code');
        });

        it('Should handle no children data', () => {
            const result = destinationUtils.getIDestinationByKeyValue(
                [{ ...destinationMock, children: undefined }],
                'destination_child_code',
                'code',
            );

            expect(result).toBe(undefined);
        });

        it('Should include itemName in returned destination', () => {
            const mockData = [
                {
                    code: 'ES',
                    name: 'Spain',
                    itemName: 'Spain Item Name',
                    type: DestinationType.Country,
                },
            ];

            const result = destinationUtils.getIDestinationByKeyValue(mockData, 'ES', 'code');

            expect(result.itemName).toBe('Spain Item Name');
        });

        it('Should include itemName in returned child destination', () => {
            const mockData = [
                {
                    code: 'ES',
                    name: 'Spain',
                    itemName: 'Spain',
                    type: DestinationType.Country,
                    children: [
                        {
                            code: 'ESMJ',
                            name: 'Majorca',
                            itemName: 'Majorca Item Name',
                            type: DestinationType.Region,
                        },
                    ],
                },
            ];

            const result = destinationUtils.getIDestinationByKeyValue(mockData, 'ESMJ', 'code');

            expect(result.itemName).toBe('Majorca Item Name');
        });

        it('Should include parent itemName when returning child', () => {
            const mockData = [
                {
                    code: 'ES',
                    name: 'Spain',
                    itemName: 'Spain Item Name',
                    type: DestinationType.Country,
                    children: [
                        {
                            code: 'ESMJ',
                            name: 'Majorca',
                            itemName: 'Majorca',
                            type: DestinationType.Region,
                        },
                    ],
                },
            ];

            const result = destinationUtils.getIDestinationByKeyValue(mockData, 'ESMJ', 'code');

            expect(result.parents![0].itemName).toBe('Spain Item Name');
        });

        it('Should include parents with itemName when country has parents', () => {
            const mockData = [
                {
                    code: 'VC',
                    name: 'Virtual Country',
                    itemName: 'Virtual Country Item Name',
                    type: DestinationType.VirtualCountry,
                    parents: [
                        {
                            code: 'ES',
                            name: 'Spain',
                            itemName: 'Spain Item Name',
                            type: DestinationType.Country,
                        },
                    ],
                },
            ];

            const result = destinationUtils.getIDestinationByKeyValue(mockData, 'VC', 'code');

            expect(result.parents![0].itemName).toBe('Spain Item Name');
        });
    });

    describe('getIDestinationByCode', () => {
        it('should return destination code', () => {
            const result = destinationUtils.getIDestinationByCode([destinationMock], 'destination_code');

            expect(result?.code).toBe('destination_code');
        });
    });

    describe('getIDestinationByName', () => {
        it('should return destination name', () => {
            const result = destinationUtils.getIDestinationByName([destinationMock], 'destination_name');

            expect(result?.name).toBe('destination_name');
        });
    });

    describe('getAllDestinations', () => {
        it("should return children's parents", () => {
            const result = destinationUtils.getAllDestinations([
                deepClone({ ...destinationMock, parents: [] }),
                deepClone({ ...destinationMock, type: DestinationType.Region }),
            ]);

            expect(result[0].parents?.length).toBe(1);
        });

        it("should NOT return children's parent", () => {
            const result = destinationUtils.getAllDestinations([
                deepClone({ ...destinationMock, parents: [] }),
                deepClone(destinationMock),
            ]);

            expect(result[0].parents?.length).toBe(0);
        });
    });

    describe('createParentDstDisplayValueByCodes', () => {
        it('Should return couple destination name', () => {
            const result = destinationUtils.createParentDstDisplayValueByCodes(
                ['destination_code', 'test-code'],
                [destinationMock],
                p => p,
            );

            expect(result.main).toBe(`destination_name ${SitecoreDictionary.GlobalConjunctionsAnd} `);
        });

        it('Should return destination name with short code', () => {
            const result = destinationUtils.createParentDstDisplayValueByCodes(
                ['destination_code', 'TS'],
                [destinationMock],
                p => p,
            );

            expect(result.main).toBe(`destination_name ${SitecoreDictionary.GlobalConjunctionsAnd} destination_name`);
        });

        it('Should return empty result', () => {
            const result = destinationUtils.createParentDstDisplayValueByCodes([], [destinationMock], p => p);

            expect(result.main).toBe('');
        });

        it('should use getPhrase with GlobalConjunctionsAnd and combine names', () => {
            const selectedDestinationCodes = ['destination_code', 'another_code'];
            const destinationsWithNames = [
                { code: 'destination_code', name: 'London' },
                { code: 'another_code', name: 'Paris' },
            ];

            const result = destinationUtils.createParentDstDisplayValueByCodes(
                selectedDestinationCodes,
                destinationsWithNames,
                p => p,
            );

            expect(result.main).toBe(`London ${SitecoreDictionary.GlobalConjunctionsAnd} Paris`);
        });
    });

    describe('getDestinationTypeByCodeLength', () => {
        it('should return Country', () => {
            const result = destinationUtils.getDestinationTypeByCodeLength('ci');
            expect(result).toBe(DestinationType.Country);
        });

        it('should return Region', () => {
            const result = destinationUtils.getDestinationTypeByCodeLength('cidi');
            expect(result).toBe(DestinationType.Region);
        });

        it('should return Resort', () => {
            const result = destinationUtils.getDestinationTypeByCodeLength('ciditi');
            expect(result).toBe(DestinationType.Resort);
        });

        it('should return Hotel', () => {
            const result = destinationUtils.getDestinationTypeByCodeLength('ciditier');
            expect(result).toBe(DestinationType.Hotel);
        });

        it('should return null', () => {
            const result = destinationUtils.getDestinationTypeByCodeLength('c');
            expect(result).toBeNull();
        });
    });

    describe('getDestinationTypeByType', () => {
        it('should return new value', () => {
            const newType = destinationUtils.getDestinationTypeByType({
                ...destinationMock,
                type: DestinationType.VirtualCountry,
            });
            expect(newType).toBe(DestinationType.Country);
        });

        it('should return default value', () => {
            const defaultType = destinationUtils.getDestinationTypeByType({
                ...destinationMock,
                type: DestinationType.Hotel,
            });
            expect(defaultType).toBe(DestinationType.Hotel);
        });
    });

    describe('getDestinationOrChildrenByCode', () => {
        it('should return country by country code', () => {
            const result = destinationUtils.getDestinationOrChildrenByCode('destination_code', [
                destinationMock,
                destinationMock,
            ]);
            expect(result?.code).toBe('destination_code');
        });

        it('should return child by child code', () => {
            const result = destinationUtils.getDestinationOrChildrenByCode('destination_child_code', [
                destinationMock,
                destinationMock,
            ]);
            expect(result?.code).toBe('destination_child_code');
        });

        it('should return null when nothing was found', () => {
            const result = destinationUtils.getDestinationOrChildrenByCode('test', [destinationMock, destinationMock]);
            expect(result).toBeNull();
        });
    });

    describe('getParentDestinationByCode', () => {
        it('should return country code for country', () => {
            const result = destinationUtils.getParentDestinationByCode('destination_code', [destinationMock]);

            expect(result!.code).toBe('destination_code');
        });

        it('should return country code for region', () => {
            const result = destinationUtils.getParentDestinationByCode('destination_child_code', [destinationMock]);

            expect(result!.code).toBe('destination_code');
        });

        it('should return null when country is not founded', () => {
            const result = destinationUtils.getParentDestinationByCode('test', [destinationMock]);

            expect(result).toBe(null);
        });
    });

    describe('getDestinationHierarchy', () => {
        it('should return an empty object when there is no type and no parents', () => {
            const destination = { itemName: 'Unknown' } as IDestination;
            const result = destinationUtils.getDestinationHierarchy(destination);

            expect(result).toEqual({});
        });

        it('should add the current destination to the hierarchy', () => {
            const result = destinationUtils.getDestinationHierarchy({
                ...destinationMock,
                itemName: 'France',
                parents: [],
            });

            expect(result).toEqual({ [DestinationType.Country]: 'France' });
        });

        it('should include parent destinations in the hierarchy', () => {
            const parents = [{ itemName: 'Turkey', type: DestinationType.Country }] as IDestination[];

            const result = destinationUtils.getDestinationHierarchy({
                ...destinationMock,
                type: DestinationType.Region,
                itemName: 'Antalya',
                parents: parents,
            });

            expect(result).toEqual({
                [DestinationType.Country]: 'Turkey',
                [DestinationType.Region]: 'Antalya',
            });
        });

        it('should skip parents without a type', () => {
            const badParent = { itemName: 'Somewhere' } as IDestination;

            const result = destinationUtils.getDestinationHierarchy({
                ...destinationMock,
                type: DestinationType.Region,
                itemName: 'Antalya',
                parents: [badParent],
            });

            expect(result).toEqual({
                [DestinationType.Region]: 'Antalya',
            });
        });

        it('should use name as fallback when itemName is missing', () => {
            const result = destinationUtils.getDestinationHierarchy({
                ...destinationMock,
                type: DestinationType.Country,
                name: 'France',
                parents: [],
            });

            expect(result).toEqual({ [DestinationType.Country]: 'France' });
        });

        it('should use name as fallback for parents when itemName is missing', () => {
            const parents = [{ name: 'Turkey', type: DestinationType.Country }] as IDestination[];

            const result = destinationUtils.getDestinationHierarchy({
                ...destinationMock,
                type: DestinationType.Region,
                name: 'Antalya',
                parents: parents,
            });

            expect(result).toEqual({
                [DestinationType.Country]: 'Turkey',
                [DestinationType.Region]: 'Antalya',
            });
        });

        it('should prefer itemName over name when both are present', () => {
            const result = destinationUtils.getDestinationHierarchy({
                ...destinationMock,
                type: DestinationType.Country,
                name: 'France',
                itemName: 'France Item Name',
                parents: [],
            });

            expect(result).toEqual({ [DestinationType.Country]: 'France Item Name' });
        });

        it('should return hierarchy from item with nested parents', () => {
            const result = destinationUtils.getDestinationHierarchy({
                type: DestinationType.Resort,
                name: 'Edinburgh City',
                itemName: 'Edinburgh City',
                code: 'GBSCED',
                parents: [
                    {
                        code: 'VGBSC',
                        name: 'Scotland',
                        itemName: 'Scotland',
                        type: DestinationType.VirtualCountry,
                        parents: [
                            {
                                code: 'GB',
                                name: 'United Kingdom',
                                itemName: 'United Kingdom',
                                type: DestinationType.Country,
                            },
                        ],
                    },
                ],
            });

            expect(result).toEqual({
                [DestinationType.Resort]: 'Edinburgh City',
                [DestinationType.VirtualCountry]: 'Scotland',
                [DestinationType.Country]: 'United Kingdom',
            });
        });
    });

    describe('getDestinationsItemNameGroupedByParent', () => {
        it('should return right result', () => {
            const selectedDestinations: IDestination[] = [
                {
                    name: 'Excelsior Hotel Gallia  a Luxury Collection Hotel',
                    itemName: 'Excelsior Hotel Gallia  a Luxury Collection Hotel-HBG',
                    available: true,
                    type: DestinationType.Hotel,
                    parents: [
                        {
                            code: 'ITMIMI',
                            name: 'Milan City',
                            itemName: 'Milan City',
                            available: true,
                            type: DestinationType.Resort,
                            showOnSearchPod: false,
                        },
                        {
                            code: 'ITMI',
                            name: 'Milan',
                            itemName: 'Milan',
                            available: true,
                            type: DestinationType.Region,
                            showOnSearchPod: false,
                        },
                        {
                            code: 'IT',
                            name: 'Italy',
                            itemName: 'Italy',
                            available: true,
                            type: DestinationType.Country,
                            showOnSearchPod: false,
                        },
                    ],
                    showOnSearchPod: true,
                    giataCode: '12368',
                    code: '',
                },
                {
                    code: 'BIV',
                    name: 'Balearic Islands',
                    itemName: 'Balearic Islands',
                    type: DestinationType.VirtualRegion,
                    relatedRegions: ['ESIB', 'ESMN', 'ESMJ'],
                    parents: [
                        {
                            code: 'ES',
                            name: 'Spain',
                            itemName: 'Spain',
                            type: DestinationType.Country,
                        },
                    ],
                },
                {
                    code: 'ESMJ',
                    name: 'Majorca',
                    itemName: 'Majorca',
                    available: true,
                    type: DestinationType.Region,
                    showOnSearchPod: true,
                    parents: [
                        {
                            code: 'ES',
                            name: 'Spain',
                            itemName: 'Spain',
                            available: true,
                            type: DestinationType.Country,
                            showOnSearchPod: true,
                        },
                    ],
                },
            ];

            const result = destinationUtils.getDestinationsItemNameGroupedByParent(selectedDestinations);

            expect(result).toEqual(
                'Excelsior Hotel Gallia  a Luxury Collection Hotel-HBG | Hotel - Milan City, Milan, Italy, Balearic Islands | VirtualRegion - Spain, Majorca | Region - Spain',
            );
        });

        it('should use ame when itemName is missing', () => {
            const selectedDestinations: IDestination[] = [
                {
                    name: 'Name in market lang',
                    available: true,
                    type: DestinationType.Hotel,
                    parents: [
                        {
                            code: 'ITMIMI',
                            name: 'Milan City',
                            itemName: 'Milan City',
                            available: true,
                            type: DestinationType.Resort,
                            showOnSearchPod: false,
                        },
                        {
                            code: 'ITMI',
                            name: 'Milan',
                            itemName: 'Milan',
                            available: true,
                            type: DestinationType.Region,
                            showOnSearchPod: false,
                        },
                        {
                            code: 'IT',
                            name: 'Italy',
                            itemName: 'Italy',
                            available: true,
                            type: DestinationType.Country,
                            showOnSearchPod: false,
                        },
                    ],
                    showOnSearchPod: true,
                    giataCode: '12368',
                    code: '',
                    itemName: 'Name in market lang',
                },
            ];

            const result = destinationUtils.getDestinationsItemNameGroupedByParent(selectedDestinations);

            expect(result).toEqual('Name in market lang | Hotel - Milan City, Milan, Italy');
        });

        it('should return correct format for Country selection (Spain All)', () => {
            const selectedDestinations: IDestination[] = [
                {
                    code: 'ES',
                    name: 'Spain',
                    itemName: 'Spain',
                    type: DestinationType.Country,
                    available: true,
                    showOnSearchPod: true,
                },
            ];

            const result = destinationUtils.getDestinationsItemNameGroupedByParent(selectedDestinations);

            expect(result).toEqual('Spain | Country - Spain');
        });

        it('should return correct format for Anywhere selection', () => {
            const selectedDestinations: IDestination[] = [
                {
                    code: 'ALL',
                    name: 'Anywhere',
                },
            ];

            const result = destinationUtils.getDestinationsItemNameGroupedByParent(selectedDestinations);

            expect(result).toEqual('Anywhere | Anywhere - Anywhere');
        });
    });
});
