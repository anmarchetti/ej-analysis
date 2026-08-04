import { DATE_FORMATS, DayjsLocale } from 'code/dates';
import {
    destinationHotelMock,
    destinationMock,
    destinationRegionMock,
    destinationVirtualCountryMock,
    mockUnitRoom,
    queryRoomMock,
} from 'frontend/__mocks__';
import * as dateUtils from 'frontend/utils/date.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IRegionsFields } from 'models/data/IDestinationFields';
import { IHeroBannerFields } from 'models/data/IHeroBanner';
import { ISavedSearchParams } from 'models/data/ISavedSearchParams';
import { MarketCode } from 'models/data/MarketSettings';
import { DestinationType } from 'models/enum/DestinationType';
import { GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import { RoomAllocation } from 'models/RoomAllocation';

import {
    cloneRoomAllocationArray,
    createOriDisplayValueByCodes,
    getAdultsCountPhrase,
    getAirportsItemNamesByCodes,
    getAvailableCountriesWithRegions,
    getCheapestMonthItemQuery,
    getCheapestMonthQuery,
    getChildrenCountPhrase,
    getDestinationItemNamesByCodes,
    getFirstAndLastTitles,
    getInfantsCountPhrase,
    getParentVirtualCountry,
    getRegionsCodesRelatedToVirtual,
    getRelatedDestinationsCodes,
    getResentSearchTrackingData,
    getRoomAllocationFromQueryRoom,
    getRoomAllocationFromUnit,
    getSortItemBySitecoreConfig,
    getValidSearches,
    getVirtualRegionDestinationData,
    getWhoField,
    isRecentSearchItemExpired,
    isSelectionValid,
    isSingleHotelSearch,
    shallowCompareSearches,
    sortDepartureAirportsAlphabetically,
} from './search.utils';

jest.useFakeTimers({ now: new Date(2023, 3, 22) });
const mockIsDateInRangeOfPastMonths = jest.spyOn(dateUtils, 'isDateInRangeOfPastMonths');
const mockIsDateInCurrentMonth = jest.spyOn(dateUtils, 'isDateInCurrentMonth');
const mockGetDaysDifferenceRoundedFloor = jest.spyOn(dateUtils, 'getDaysDifferenceRoundedFloor');
jest.spyOn(dateUtils, 'formatDateL10n').mockImplementation((date: string) => date);
const mockSavedSearchParams = {
    createdAt: '21-04-2023',
    startDate: '23-04-2023',
    isMonthSearch: false,
} as ISavedSearchParams;
const expirationMonths = 3;

describe('search.utils', () => {
    describe('getRelatedDestinationsCodes', () => {
        const bannerFields: IHeroBannerFields = {
            Regions: [
                {
                    fields: {
                        Code: { value: 'MAMAA' },
                        Name: { value: 'Marakesh' },
                    },
                },
            ],
            Resorts: [
                {
                    fields: {
                        Code: { value: 'MAMAACO' },
                        Name: { value: 'Mariot' },
                    },
                },
            ],
        } as IHeroBannerFields;

        it('should return result for isVirtualRegionBrowsePage', () => {
            const result = getRelatedDestinationsCodes(bannerFields, true, false);

            expect(result).toStrictEqual(['MAMAA']);
        });

        it('should return result for isVirtualResortBrowsePage', () => {
            const result = getRelatedDestinationsCodes(bannerFields, false, true);

            expect(result).toStrictEqual(['MAMAACO']);
        });

        it('should return an empty array for non isVirtualResortBrowsePage or isVirtualRegionBrowsePage', () => {
            const result = getRelatedDestinationsCodes(bannerFields, false, false);

            expect(result).toStrictEqual([]);
        });
    });

    describe('getRoomAllocationFromQueryRoom', () => {
        it('should return correct RoomAllocation object', () => {
            const roomCode = 'rtest';
            const roomAllocation = getRoomAllocationFromQueryRoom({
                adults: 1,
                children: 2,
                infants: 3,
                roomCode,
                childrenAges: [2, 4],
            });

            expect(roomAllocation.adults).toHaveLength(1);
            expect(roomAllocation.children).toHaveLength(2);
            expect(roomAllocation.children[0].age).toEqual(2);
            expect(roomAllocation.children[1].age).toEqual(4);
            expect(roomAllocation.infants).toHaveLength(3);
            expect(roomAllocation.roomCode).toEqual(roomCode);
        });
    });

    describe('getRegionsCodesRelatedToVirtual', () => {
        it('should return regions codes', () => {
            const codes = getRegionsCodesRelatedToVirtual({
                Regions: [{ fields: { Code: { value: 'ESCD' } } }, { fields: { Code: { value: 'ESAL' } } }],
            } as IRegionsFields);

            expect(codes).toEqual(['ESCD', 'ESAL']);
        });

        it('should return empty list if no Regions', () => {
            const codes = getRegionsCodesRelatedToVirtual({
                Regions: [],
            });

            expect(codes).toEqual([]);
        });
    });

    describe('getRoomAllocationFromQueryRoom', () => {
        it('should return allocation rooms for all people', () => {
            const result = getRoomAllocationFromQueryRoom(queryRoomMock);

            expect(result.adults.length).toBe(3);
            expect(result.children.length).toBe(2);
            expect(result.infants.length).toBe(1);
            expect(result.roomCode).toBe('13HG5');
        });
    });

    describe('cloneRoomAllocationArray', () => {
        it('should return empty array for empty input', () => {
            const result = cloneRoomAllocationArray([]);

            expect(result).toEqual([]);
        });

        it('should clone room allocations with ages and codes', () => {
            const room = new RoomAllocation();

            room.addAdult();
            room.addChild(7);
            room.addInfant();
            room.setRoomCode('RM1');

            const result = cloneRoomAllocationArray([room]);

            expect(result).toHaveLength(1);
            expect(result[0]).not.toBe(room);
            expect(result[0].children[0]).not.toBe(room.children[0]);
            expect(result[0].adults).toHaveLength(1);
            expect(result[0].children).toHaveLength(1);
            expect(result[0].infants).toHaveLength(1);
            expect(result[0].children[0].age).toBe(7);
            expect(result[0].roomCode).toBe('RM1');
        });
    });

    describe('getRoomAllocationFromUnit', () => {
        it('Should return plain result', () => {
            const result = getRoomAllocationFromUnit(false, mockUnitRoom);

            expect(result.adults.length).toBe(1);
            expect(result.children.length).toBe(2);
            expect(result.infants.length).toBe(1);
            expect(result.children[0].age).toBe(5);
            expect(result.roomCode).toBe('unitRoomMock_mock');
        });

        it('should no output children age', () => {
            const result = getRoomAllocationFromUnit(false, {
                ...mockUnitRoom,
                occupation: { ...mockUnitRoom.occupation, childAges: [] },
            });

            expect(result.children[0].age).toBe(0);
        });
    });

    describe('createOriDisplayValueByCodes', () => {
        it('should return availableOriginsCodes', () => {
            const result = createOriDisplayValueByCodes(['ci', 'cd'], [destinationMock], ['ci', 'cd'], p => p, true);

            expect(result.main).toBe('SearchPod.Labels.AllCities');
        });

        it('Should return destination name with origin country name when marketCode is provided and marketCode is not equal to the country code', () => {
            const result = createOriDisplayValueByCodes(
                ['destination_code'],
                [destinationMock],
                ['destination_code'],
                p => p,
                false,
                MarketCode.CH,
            );

            expect(result.main).toBe('(originCountry_name) destination_name');
        });

        it('Should return destination name without origin country name when marketCode is provided and equal to UK', () => {
            const result = createOriDisplayValueByCodes(
                ['destination_code'],
                [destinationMock],
                ['destination_code'],
                p => p,
                false,
                MarketCode.UK,
            );

            expect(result.main).toBe('destination_name');
        });

        it('Should return destination child name when availableOriginsCodes is null', () => {
            const result = createOriDisplayValueByCodes(
                ['destination_child_code'],
                [
                    {
                        ...destinationMock,
                        children: [
                            { ...destinationMock.children![0], code: 'test-code', name: 'test-name' },
                            destinationMock.children![0],
                        ],
                    },
                ],
                null,
                p => p,
                false,
            );

            expect(result.main).toBe('destination_child_name');
        });

        it('Should return adding count', () => {
            const result = createOriDisplayValueByCodes(
                ['destination_code', 'destination_child_code'],
                [destinationMock],
                ['destination_code', 'destination_child_code'],
                p => p,
            );

            expect(result.main).toBe('destination_name');
            expect(result.add).toBe('+1');
        });

        it('Should handle no child code', () => {
            const result = createOriDisplayValueByCodes(
                ['destination_code', 'destination_another_code', 'test_code'],
                [{ ...destinationMock, code: 'test' }],
                ['destination_code', 'destination_another_code'],
                p => p,
            );

            expect(result.main).toBe('');
        });

        it('Should return unselected codes', () => {
            const result = createOriDisplayValueByCodes(
                ['destination_code', 'destination_child_code'],
                [
                    {
                        ...destinationMock,
                        children: [
                            { ...destinationMock.children![0], code: 'test-code' },
                            destinationMock.children![0],
                        ],
                    },
                ],
                ['destination_code', 'destination_child_code'],
                p => p,
            );

            expect(result.main).toBe('destination_name');
            expect(result.add).toBe('+1');
        });

        it('should ignore unavailable airports of a city', () => {
            const result = createOriDisplayValueByCodes(
                ['code-1', 'code-2', 'code-3'],
                [
                    {
                        name: 'London',
                        code: '',
                        children: [
                            { name: 'name-1', code: 'code-1' },
                            { name: 'name-2', code: 'code-2' },
                            { name: 'name-3', code: 'code-3' },
                            { name: 'name-4', code: 'code-4' },
                        ],
                    },
                ],
                ['code-1', 'code-2'],
                p => p,
                false,
            );

            expect(result.main).toBe('London');
            expect(result.add).toBe(undefined);
        });
    });

    describe('getSortItemBySitecoreConfig', () => {
        const sortItem = {
            id: 'id',
            fields: {
                Code: { value: 'RMD' },
                Title: { value: 'Title' },
            },
        };

        it('should return config within getSortItemBySitecoreConfig', () => {
            const result = getSortItemBySitecoreConfig(sortItem);
            expect(result?.code).toBe('RMD');
            expect(result?.orderBy).toBe('recommended');
            expect(result?.orderDirection).toBe('default');
        });

        it('should return null', () => {
            const nullableResult = getSortItemBySitecoreConfig({
                ...sortItem,
                fields: { ...sortItem.fields, Code: { value: null as any } },
            });
            expect(nullableResult).toBeNull();
        });
    });

    it('getAdultsCountPhrase', () => {
        const result = getAdultsCountPhrase(3, p => p);
        expect(result).toBe('3 Globals.Labels.Adults');

        const resultLessCount = getAdultsCountPhrase(1, p => p);
        expect(resultLessCount).toBe('1 Globals.Labels.Adult');
    });

    it('getChildrenCountPhrase', () => {
        const result = getChildrenCountPhrase(3, p => p);
        expect(result).toBe('3 Globals.Labels.Children');

        const resultLessCount = getChildrenCountPhrase(1, p => p);
        expect(resultLessCount).toBe('1 Globals.Labels.Child');
    });

    it('getInfantsCountPhrase', () => {
        const result = getInfantsCountPhrase(3, p => p);
        expect(result).toBe('3 Globals.Labels.Infants');

        const resultLessCount = getInfantsCountPhrase(1, p => p);
        expect(resultLessCount).toBe('1 Globals.Labels.Infant');
    });

    describe('getWhoField', () => {
        const mockRoom = { adults: 3, children: 2, infants: 2 };

        it('should return who label without children ages and with room label when multi rooms and isPromoPage = false', () => {
            const resultMultiRooms = getWhoField(mockRoom, 3, true, p => p, [1, 2, 3], false);
            expect(resultMultiRooms).toBe(
                '3 Globals.Labels.Adults, 2 Globals.Labels.Children, 2 Globals.Labels.Infants, 3 Globals.Labels.Rooms',
            );
        });

        it('should return who label without children ages and without room label when multi rooms and isPromoPage = false', () => {
            const resultOneRoom = getWhoField(mockRoom, 1, true, p => p, [1, 2, 3], false);
            expect(resultOneRoom).toBe('3 Globals.Labels.Adults, 2 Globals.Labels.Children, 2 Globals.Labels.Infants');
        });

        it('should return who label with children ages and without room label when single room and isPromoPage = true', () => {
            const resultOneRoom = getWhoField(mockRoom, 1, true, p => p, [1, 2, 3], true);
            expect(resultOneRoom).toBe(
                '3 Globals.Labels.Adults, 2 Globals.Labels.Children (Global.Labels.Aged 1, 2, 3), 2 Globals.Labels.Infants',
            );
        });

        it('should return who label with children ages and with room label when multi rooms and isPromoPage = true', () => {
            const resultMultiRooms = getWhoField(mockRoom, 3, true, p => p, [1, 2, 3], true);
            expect(resultMultiRooms).toBe(
                '3 Globals.Labels.Adults, 2 Globals.Labels.Children (Global.Labels.Aged 1, 2, 3), 2 Globals.Labels.Infants, 3 Globals.Labels.Rooms',
            );
        });
    });

    it('shallowCompareSearches', () => {
        const param1 = {
            startDate: new Date().toString(),
            durations: ['23', '32'],
            departure: 'departure',
            geog: 'geog',
            dest: 'dest',
            rooms: ['room-1', 'room-2'],
            autoAllocation: true,
            flexDays: 1,
        } as any;
        const param2 = {
            startDate: new Date().toString(),
            durations: ['33', '32'],
            departure: 'departure',
            geog: 'geog',
            dest: 'dest',
            rooms: ['room-1', 'room-2'],
            autoAllocation: true,
            flexDays: 1,
        } as any;

        const validResult = shallowCompareSearches(param1, param1);
        const inValidResult = shallowCompareSearches(param1, param2);

        expect(validResult).toBe(true);
        expect(inValidResult).toBe(false);
    });

    describe('getValidSearches', () => {
        let recentSearches;
        let marketDepartureAirports;
        let isMonthSearchEnabled;

        beforeEach(() => {
            recentSearches = [
                {
                    startDate: '21-08-2023',
                    durations: ['1'],
                    departure: 'LGW,LTN,STN',
                    dest: 'ALL',
                    geog: 'ALL',
                    rooms: [
                        {
                            adults: 2,
                            children: 0,
                            infants: 0,
                            roomCode: '',
                            childrenAges: [],
                        },
                    ],
                    autoAllocation: true,
                    flexDays: 0,
                    createdAt: '26-07-2023',
                    isMonthSearch: false,
                },
                {
                    startDate: '08-07-2023',
                    durations: ['7'],
                    departure: 'BHU,HUY,MKO',
                    dest: 'CYLN0009',
                    geog: '',
                    rooms: [
                        {
                            adults: 2,
                            children: 0,
                            infants: 0,
                            roomCode: '',
                            childrenAges: [],
                        },
                    ],
                    autoAllocation: true,
                    flexDays: 0,
                    createdAt: '23-06-2023',
                    isMonthSearch: true,
                },
                {
                    startDate: '08-07-2023',
                    durations: ['7'],
                    departure: 'LGW',
                    dest: 'CYLN0009',
                    geog: '',
                    rooms: [
                        {
                            adults: 2,
                            children: 0,
                            infants: 0,
                            roomCode: '',
                            childrenAges: [],
                        },
                    ],
                    autoAllocation: true,
                    flexDays: 0,
                    createdAt: '23-04-2022',
                    isMonthSearch: false,
                },
                {
                    startDate: '21-04-2023',
                    durations: ['7'],
                    departure: 'LGW',
                    dest: 'CYLN0009',
                    geog: '',
                    rooms: [
                        {
                            adults: 2,
                            children: 0,
                            infants: 0,
                            roomCode: '',
                            childrenAges: [],
                        },
                    ],
                    autoAllocation: true,
                    flexDays: 0,
                    createdAt: '23-04-2022',
                    isMonthSearch: false,
                },
            ];
            marketDepartureAirports = ['LGW', 'LTN', 'STN', 'TYU', 'LOP'];
            isMonthSearchEnabled = false;
        });

        it('should return only valid searches', () => {
            expect(
                getValidSearches(recentSearches, marketDepartureAirports, expirationMonths, isMonthSearchEnabled),
            ).toMatchObject([
                {
                    startDate: '21-08-2023',
                    durations: ['1'],
                    departure: 'LGW,LTN,STN',
                    dest: 'ALL',
                    geog: 'ALL',
                    rooms: [
                        {
                            adults: 2,
                            children: 0,
                            infants: 0,
                            roomCode: '',
                            childrenAges: [],
                        },
                    ],
                    autoAllocation: true,
                    flexDays: 0,
                    createdAt: '26-07-2023',
                },
            ]);
        });

        it('should return only valid searches when Month Search is enabled', () => {
            isMonthSearchEnabled = true;
            recentSearches[0].isMonthSearch = true;

            expect(
                getValidSearches(recentSearches, marketDepartureAirports, expirationMonths, isMonthSearchEnabled),
            ).toMatchObject([
                {
                    startDate: '21-08-2023',
                    durations: ['1'],
                    departure: 'LGW,LTN,STN',
                    dest: 'ALL',
                    geog: 'ALL',
                    rooms: [
                        {
                            adults: 2,
                            children: 0,
                            infants: 0,
                            roomCode: '',
                            childrenAges: [],
                        },
                    ],
                    autoAllocation: true,
                    flexDays: 0,
                    createdAt: '26-07-2023',
                },
            ]);
        });
    });

    describe('isSingleHotelSearch', () => {
        it('should return true when hotel has more than two codes and each code has length 8', () => {
            expect(isSingleHotelSearch(['12345678', '12345678'])).toBeTruthy();
        });

        it('should return false when the hotel has less than two codes', () => {
            expect(isSingleHotelSearch(['12345678'])).toBeFalsy();
        });

        it('should return false when not all codes have length 8', () => {
            expect(isSingleHotelSearch(['12345678', '1234567', '12345678'])).toBeFalsy();
        });
    });

    describe('isRecentSearchItemExpired', () => {
        beforeEach(() => {
            mockIsDateInRangeOfPastMonths.mockReturnValue(true);
            mockGetDaysDifferenceRoundedFloor.mockReturnValue(0);
            mockIsDateInCurrentMonth.mockReturnValue(false);
            mockSavedSearchParams.isMonthSearch = false;
        });

        it('should return false when isDateInRangeOfPastMonths is true and getDaysDifferenceRoundedFloor is 0 and isMonthSearch is false', () => {
            expect(isRecentSearchItemExpired(mockSavedSearchParams, expirationMonths)).toBe(false);
        });

        it('should return false when getDaysDifferenceRoundedFloor is 0 and isDateInCurrentMonth is false and isMonthSearch is true', () => {
            mockSavedSearchParams.isMonthSearch = true;

            expect(isRecentSearchItemExpired(mockSavedSearchParams, expirationMonths)).toBe(false);
        });

        it('should return true when isDateInRangeOfPastMonths is false', () => {
            mockIsDateInRangeOfPastMonths.mockReturnValueOnce(false);

            expect(isRecentSearchItemExpired(mockSavedSearchParams, expirationMonths)).toBe(true);
        });

        it('should return true when getDaysDifferenceRoundedFloor is greater than 0 and and isMonthSearch is false', () => {
            mockGetDaysDifferenceRoundedFloor.mockReturnValueOnce(1);

            expect(isRecentSearchItemExpired(mockSavedSearchParams, expirationMonths)).toBe(true);
        });

        it('should return true when getDaysDifferenceRoundedFloor is greater than 0 and IsDateInCurrentMonth is false, and isMonthSearch is true', () => {
            mockGetDaysDifferenceRoundedFloor.mockReturnValueOnce(1);
            mockSavedSearchParams.isMonthSearch = true;

            expect(isRecentSearchItemExpired(mockSavedSearchParams, expirationMonths)).toBe(true);
        });

        it('should return false when createdAt and startDate are NOT provided', () => {
            mockSavedSearchParams.createdAt = '';
            mockSavedSearchParams.startDate = '';

            expect(isRecentSearchItemExpired(mockSavedSearchParams, expirationMonths)).toBe(false);
        });
    });

    describe('sortDepartureAirportsAlphabetically', () => {
        it('should sort airports alphabetically', () => {
            expect(
                sortDepartureAirportsAlphabetically([
                    { name: 'Luton', code: 'LTN' },
                    { name: 'Belfast', code: 'BHD' },
                    { name: 'London', code: 'LDN' },
                ]),
            ).toEqual([
                { name: 'Belfast', code: 'BHD' },
                { name: 'London', code: 'LDN' },
                { name: 'Luton', code: 'LTN' },
            ]);
        });

        it('should sort airports alphabetically including special characters', () => {
            expect(
                sortDepartureAirportsAlphabetically([
                    { name: 'Deutschland', code: 'DE' },
                    { name: 'Frankreich', code: 'FR' },
                    { name: 'Dänemark', code: 'DK' },
                ]),
            ).toEqual([
                { name: 'Dänemark', code: 'DK' },
                { name: 'Deutschland', code: 'DE' },
                { name: 'Frankreich', code: 'FR' },
            ]);
        });

        it('should sort airports alphabetically removing brackets if any', () => {
            expect(
                sortDepartureAirportsAlphabetically([
                    { name: 'Belfast', code: 'BHD' },
                    { name: 'London', code: 'LDN' },
                    { name: '(France) Paris', code: 'FR' },
                ]),
            ).toEqual([
                { name: 'Belfast', code: 'BHD' },
                { name: '(France) Paris', code: 'FR' },
                { name: 'London', code: 'LDN' },
            ]);
        });
    });

    describe('getFirstAndLastTitles', () => {
        const mockDestinationCountries = [
            { code: 'ES', name: 'Spain' },
            { code: 'IT', name: 'Italy' },
        ];

        it('should return an empty res when pass an empty array', () => {
            const res = getFirstAndLastTitles([]);

            expect(res).toEqual({ main: '' });
        });

        it('should return country name in main prop when pass an array with 1 element', () => {
            const destinationCountries: IDestinationCountry[] = [mockDestinationCountries[0]];
            const res = getFirstAndLastTitles(destinationCountries);

            expect(res).toEqual({
                main: mockDestinationCountries[0].name,
            });
        });

        it('should return country name in main prop and number of countries left in add prop when pass an array with number of elements greater than maxMainAmount', () => {
            const destinationCountries: IDestinationCountry[] = mockDestinationCountries;
            const res = getFirstAndLastTitles(destinationCountries);

            expect(res).toEqual({
                main: mockDestinationCountries[0].name,
                add: `+${mockDestinationCountries.length - 1}`,
            });
        });

        it('should return country names in main prop when pass an array with 2 elements and maxMainAmount as 2', () => {
            const destinationCountries: IDestinationCountry[] = mockDestinationCountries;
            const res = getFirstAndLastTitles(destinationCountries, 2);

            expect(res).toEqual({
                main: `${mockDestinationCountries[0].name}, ${mockDestinationCountries[1].name}`,
            });
        });

        it('should return info ignoring virtual region when pass an array with virtual region containing the destination code of country in the relatedRegions field', () => {
            const virtualRegionCountry: IDestinationCountry = {
                name: 'Canary Islands',
                itemName: 'Canary Islands',
                code: 'CIV',
                type: DestinationType.VirtualRegion,
                relatedRegions: [mockDestinationCountries[0].code],
            };
            const destinationCountries: IDestinationCountry[] = [...mockDestinationCountries, virtualRegionCountry];
            const res = getFirstAndLastTitles(destinationCountries);

            expect(res).toEqual({
                main: `${mockDestinationCountries[0].name}`,
                add: `+1`,
            });
        });

        it('should count virtual region in result count when pass an array with virtual region which does not contain the destination code of country in the relatedRegions field', () => {
            const virtualRegionCountry: IDestinationCountry = {
                name: 'Canary Islands',
                itemName: 'Canary Islands',
                code: 'CIV',
                type: DestinationType.VirtualRegion,
                relatedRegions: [],
            };
            const destinationCountries: IDestinationCountry[] = [...mockDestinationCountries, virtualRegionCountry];
            const res = getFirstAndLastTitles(destinationCountries);

            expect(res).toEqual({
                main: `${mockDestinationCountries[0].name}`,
                add: `+2`,
            });
        });
    });

    describe('isSelectionValid', () => {
        const mockCodes = ['ES', 'IT'];

        describe('availableCodes value is null', () => {
            it('should return false when selectedCodes value is an empty array', () => {
                const res = isSelectionValid([], null);

                expect(res).toBe(false);
            });

            it('should return true when selectedCodes value contains GEOGRAPHY_ALL_CODE', () => {
                const res = isSelectionValid([GEOGRAPHY_ALL_CODE], null);

                expect(res).toBe(true);
            });

            it('should return true when selectedCodes value is not an empty array', () => {
                const res = isSelectionValid(mockCodes, null);

                expect(res).toBe(true);
            });
        });

        describe('availableCodes value is not null', () => {
            it('should return false when availableCodes value is an empty array', () => {
                const res = isSelectionValid(mockCodes, []);

                expect(res).toBe(false);
            });

            it('should return true when availableCodes value is not an empty array and contains at least one selected code', () => {
                const res = isSelectionValid(mockCodes, [mockCodes[0]]);

                expect(res).toBe(true);
            });

            it('should return false when availableCodes value is not an empty array and does not contain any selected code', () => {
                const res = isSelectionValid(mockCodes, ['ABC']);

                expect(res).toBe(false);
            });
        });
    });

    describe('getDestinationItemNamesByCodes', () => {
        const destinationsWithNames: IDestinationCountry[] = [
            { code: 'TUR', itemName: 'Turkey', name: 'Turkey' },
            { code: 'ESP', name: 'Spain' },
            {
                code: 'GRC',
                itemName: 'Greece',
                name: 'Greece',
                children: [
                    { code: 'ATH', itemName: 'Athens', name: 'Athens' },
                    { code: 'SKG', name: 'Thessaloniki' },
                ],
            },
        ];

        it('should return item names for valid codes', () => {
            const result = getDestinationItemNamesByCodes(['TUR', 'ESP'], destinationsWithNames);
            expect(result).toEqual(['Turkey', 'Spain']);
        });

        it('should return child item names for codes in children', () => {
            const result = getDestinationItemNamesByCodes(['ATH', 'SKG'], destinationsWithNames);
            expect(result).toEqual(['Athens', 'Thessaloniki']);
        });

        it('should return "Anywhere" for GEOGRAPHY_ALL_CODE', () => {
            const result = getDestinationItemNamesByCodes(['ALL'], destinationsWithNames);
            expect(result).toEqual(['Anywhere']);
        });

        it('should return code for unknown codes', () => {
            const result = getDestinationItemNamesByCodes(['XXX'], destinationsWithNames);
            expect(result).toEqual(['XXX']);
        });

        it('should return empty array for empty input', () => {
            const result = getDestinationItemNamesByCodes([], destinationsWithNames);
            expect(result).toEqual([]);
        });
    });

    describe('getAirportsItemNamesByCodes', () => {
        const airports = new Map([
            ['LGW', { code: 'LGW', itemName: 'Gatwick', name: 'Gatwick' }],
            ['LTN', { code: 'LTN', itemName: 'Luton', name: 'Luton' }],
            ['STN', { code: 'STN', name: 'Stansted' }],
            ['XXX', { code: 'XXX', name: '' }],
        ]);

        it('should return item names for valid codes', () => {
            const result = getAirportsItemNamesByCodes(['LGW', 'LTN'], airports);
            expect(result).toEqual(['Gatwick', 'Luton']);
        });

        it('should return name if itemName is missing', () => {
            const result = getAirportsItemNamesByCodes(['STN'], airports);
            expect(result).toEqual(['Stansted']);
        });

        it('should return codes not found in airports map', () => {
            const result = getAirportsItemNamesByCodes(['LGW', 'XXX'], airports);
            expect(result).toEqual(['Gatwick', 'XXX']);
        });

        it('should return empty array for empty input', () => {
            const result = getAirportsItemNamesByCodes([], airports);
            expect(result).toEqual([]);
        });
    });

    describe('getResentSearchTrackingData', () => {
        const search = {
            departure: 'LGW,LTN',
            dest: 'TUR,ESP',
            startDate: '2025-05-01',
            durations: ['7'],
            rooms: [
                { adults: 2, children: 1, infants: 0, childrenAges: [], roomCode: '' },
                { adults: 1, children: 0, infants: 1, childrenAges: [], roomCode: '' },
            ],
            autoAllocation: false,
            flexDays: 4,
            geog: '',
            isMonthSearch: false,
            isVirtualResort: false,
        };

        const airports = new Map([
            ['LGW', { code: 'LGW', itemName: 'Gatwick', name: 'Gatwick' }],
            ['LTN', { code: 'LTN', itemName: 'Luton', name: 'Luton' }],
        ]);

        const destinationsWithNames: IDestinationCountry[] = [
            { code: 'TUR', itemName: 'Turkey', name: 'Turkey' },
            { code: 'ESP', name: 'Spain', itemName: 'Spain' },
        ];

        it('should return correct tracking data for valid input', () => {
            const result = getResentSearchTrackingData(search, destinationsWithNames, airports);
            expect(result).toEqual({
                date: '2025-05-01, 7 Nights',
                direction: 'Gatwick, Luton - Turkey, Spain',
                who: '3 Adult, 1 Child, 1 Infant',
            });
            expect(formatDateL10n).toHaveBeenCalledWith('2025-05-01', DATE_FORMATS.fullDate, DayjsLocale.En);
        });

        it('should return date in different format when isMonthSearch is true', () => {
            getResentSearchTrackingData({ ...search, isMonthSearch: true }, destinationsWithNames, airports);

            expect(formatDateL10n).toHaveBeenCalledWith('2025-05-01', DATE_FORMATS.fullMonthAndYear, DayjsLocale.En);
        });
    });

    describe('getCheapestMonthItemQuery', () => {
        it('should return result for virtual country', () => {
            const result = getCheapestMonthItemQuery(destinationVirtualCountryMock);

            expect(result).toStrictEqual(['GB', 'GBSC', 'GBSCED']);
        });

        it('should return result for region', () => {
            const result = getCheapestMonthItemQuery(destinationRegionMock);

            expect(result).toStrictEqual(['MA', 'MAAG']);
        });

        it('should return an empty array for Hotel type', () => {
            const result = getCheapestMonthItemQuery(destinationHotelMock);

            expect(result).toStrictEqual([]);
        });

        it('should return a result for Country type', () => {
            const result = getCheapestMonthItemQuery({
                ...destinationHotelMock,
                type: DestinationType.Country,
                children: [
                    { type: DestinationType.Region, code: 'CYPF', name: 'Paphos' },
                    { type: DestinationType.Region, code: 'CYLN', name: 'Larnaca' },
                ],
            });

            expect(result).toStrictEqual(['destination_code,CYPF;destination_code,CYLN']);
        });

        it('should return a result for VirtualCountry type', () => {
            const result = getCheapestMonthItemQuery({
                ...destinationHotelMock,
                type: DestinationType.VirtualCountry,
                relatedRegions: ['GGA'],
                children: [{ type: DestinationType.Region, code: 'MA', name: 'Marocco' }],
            });

            expect(result).toStrictEqual(['region-code', 'GGA']);
        });
    });

    describe('getCheapestMonthQuery', () => {
        it('should return query string for correct destinations', () => {
            const result = getCheapestMonthQuery([destinationRegionMock, destinationVirtualCountryMock]);

            expect(result).toBe('MA,MAAG;GB,GBSC,GBSCED');
        });
    });

    describe('getVirtualRegionDestinationData', () => {
        let mockVirtualRegionList;

        beforeEach(() => {
            mockVirtualRegionList = [
                {
                    ...destinationRegionMock,
                    relatedRegions: ['ESCD', 'ESAL', 'ESSV', 'ESCT'],
                    type: DestinationType.VirtualRegion,
                },
                {
                    ...destinationRegionMock,
                    code: 'ESCD',
                },
                {
                    ...destinationRegionMock,
                    code: 'ESAL',
                },
                {
                    ...destinationRegionMock,
                    code: 'ESSV',
                },
                {
                    ...destinationRegionMock,
                    code: 'ESCT',
                },
            ];
        });

        it('should return virtualRegion result', () => {
            const result = getVirtualRegionDestinationData(mockVirtualRegionList);

            expect(result).toStrictEqual({
                virtualRegion: mockVirtualRegionList[0],
                destinationsWithoutVirtualRegion: mockVirtualRegionList.slice(1),
                relatedDestinationsWithoutVirtualRegion: mockVirtualRegionList.slice(1),
                areOnlyRelatedRegionsSelected: true,
            });
        });

        it('should return result without virtualRegion', () => {
            mockVirtualRegionList[0].type = DestinationType.Region;

            const result = getVirtualRegionDestinationData(mockVirtualRegionList);

            expect(result).toStrictEqual({
                virtualRegion: undefined,
                destinationsWithoutVirtualRegion: mockVirtualRegionList,
                relatedDestinationsWithoutVirtualRegion: [],
                areOnlyRelatedRegionsSelected: false,
            });
        });

        it('should return result with virtualRegion, and areOnlyRelatedRegionsSelected is false, when NOT ONLY related region present', () => {
            mockVirtualRegionList.push({
                ...destinationRegionMock,
                code: 'MAA',
            });

            const result = getVirtualRegionDestinationData(mockVirtualRegionList);

            expect(result).toStrictEqual({
                virtualRegion: mockVirtualRegionList[0],
                destinationsWithoutVirtualRegion: mockVirtualRegionList.slice(1),
                relatedDestinationsWithoutVirtualRegion: mockVirtualRegionList.slice(
                    1,
                    mockVirtualRegionList.length - 1,
                ),
                areOnlyRelatedRegionsSelected: false,
            });
        });
    });

    describe('getParentVirtualCountry', () => {
        it('should return undefined when destination not a resort type', () => {
            const result = getParentVirtualCountry(destinationRegionMock);

            expect(result).toBe(undefined);
        });

        it('should return undefined when destination do not contain virtual country parent', () => {
            const result = getParentVirtualCountry({ ...destinationRegionMock, type: DestinationType.Resort });

            expect(result).toBe(undefined);
        });

        it('should return false when destination contain virtual country parent and has a Resort type', () => {
            const result = getParentVirtualCountry({
                ...destinationRegionMock,
                type: DestinationType.Resort,
                parents: [{ ...destinationRegionMock, type: DestinationType.VirtualCountry }],
            });

            expect(result).toStrictEqual({ ...destinationRegionMock, type: DestinationType.VirtualCountry });
        });
    });

    describe('getAvailableCountriesWithRegions', () => {
        const mockCountries: IDestinationCountry[] = [
            {
                code: 'ES',
                name: 'Spain',
                children: [
                    { code: 'ESMA', name: 'Madrid' },
                    { code: 'ESBC', name: 'Barcelona' },
                    { code: 'ESSI', name: 'Seville' },
                ],
            },
            {
                code: 'IT',
                name: 'Italy',
                children: [
                    { code: 'ITRO', name: 'Rome' },
                    { code: 'ITMIL', name: 'Milan' },
                ],
            },
            {
                code: 'FR',
                name: 'France',
                children: [{ code: 'FRPA', name: 'Paris' }],
            },
        ];

        it('should return empty array when countriesWithRegions is empty', () => {
            const result = getAvailableCountriesWithRegions([], ['ES', 'IT']);

            expect(result).toEqual([]);
        });

        it('should return all countries when availableDestinationsCodes is null', () => {
            const result = getAvailableCountriesWithRegions(mockCountries, null);

            expect(result).toEqual(mockCountries);
        });

        it('should return all countries when availableDestinationsCodes is empty', () => {
            const result = getAvailableCountriesWithRegions(mockCountries, []);

            expect(result).toEqual(mockCountries);
        });

        it('should return empty array when both countriesWithRegions and availableDestinationsCodes are empty', () => {
            const result = getAvailableCountriesWithRegions([], []);

            expect(result).toEqual([]);
        });

        it('should filter countries based on available codes', () => {
            const result = getAvailableCountriesWithRegions(mockCountries, ['ES', 'IT']);

            expect(result).toHaveLength(2);
            expect(result[0].code).toBe('ES');
            expect(result[1].code).toBe('IT');
        });

        it('should filter children within countries based on available codes', () => {
            const result = getAvailableCountriesWithRegions(mockCountries, ['ES', 'ESMA', 'ESBC']);

            expect(result).toHaveLength(1);
            expect(result[0].code).toBe('ES');
            expect(result[0].children).toHaveLength(2);
            expect(result[0].children?.[0].code).toBe('ESMA');
            expect(result[0].children?.[1].code).toBe('ESBC');
        });

        it('should exclude children not in available codes', () => {
            const result = getAvailableCountriesWithRegions(mockCountries, ['ES', 'ESMA', 'IT', 'ITRO']);

            expect(result).toHaveLength(2);
            expect(result[0].children).toHaveLength(1);
            expect(result[0].children?.[0].code).toBe('ESMA');
            expect(result[1].children).toHaveLength(1);
            expect(result[1].children?.[0].code).toBe('ITRO');
        });

        it('should return country with empty children array when no children are in available codes', () => {
            const result = getAvailableCountriesWithRegions(mockCountries, ['ES']);

            expect(result).toHaveLength(1);
            expect(result[0].code).toBe('ES');
            expect(result[0].children).toEqual([]);
        });

        it('should return empty array when no countries match available codes', () => {
            const result = getAvailableCountriesWithRegions(mockCountries, ['XX', 'YY']);

            expect(result).toEqual([]);
        });
    });
});
