import { mockAllTypesPassengersList, mockPassengerWithLCB } from 'frontend/__mocks__';
import { IUnitOccupation } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { IQueryRoom } from 'models/data/URLQueryRooms';

import {
    buildAltAccommodationsParams,
    buildAltIdsFromAltAccommodationsParams,
    buildChildAgesQuery,
    buildCmsUrlWithMediaSizeQuery,
    buildFlightPlusHotelUrl,
    buildFrontendImageWithFallBack,
    buildGeogParamByDestinationCodeQuery,
    buildGeogParamByRelatedRegionsQuery,
    buildLCBQuery,
    buildLuggageQuery,
    buildOfferCodeQuery,
    buildRoomAllocationFromOfferUnitParams,
    buildRoomFromOfferUnitParams,
    buildRoomsParams,
    buildRoomsQueryParams,
    buildSelectedSeatsQuery,
    checkIfQueryRooms,
    deleteUrlParam,
    encodeQuotation,
    filterInvalidRelativePath,
    getAccommodationIdsString,
    getChangedQueryParamNames,
    hyphenateString,
    isEncoded,
    isValidURL,
    matchesPathname,
    parseQuery,
    purifyUrl,
} from './url.utils';

const scrollTo = jest.fn();
Object.defineProperty(global, 'scrollTo', { value: scrollTo });

let mockQsParse = jest.fn().mockReturnValue({ query: 'query-string' });
jest.mock('qs', () => ({
    __esModule: true,
    ...jest.requireActual('qs'),
    default: {
        parse: (...params) => mockQsParse(...params),
    },
}));

describe('url.util', () => {
    describe('parseQuery', () => {
        afterAll(() => {
            mockQsParse = jest.requireActual('qs').parse;
        });

        it("should call qs.parse and return it's result", () => {
            const query =
                'ibf=true&ims=true&msDur=7&to=31-07-2026&from=01-07-2026&dst=VAND,BIV,CIV,ESCB&sAccId=&geog=ES,ESCB|ESBV|ESCC&flex=0&org=LGW&aa=1&rooms=2&page=1&take=10&orderBy=recommended&orderDirection=default&m=0';
            const result = parseQuery(query, { delimiter: ';' });

            expect(mockQsParse).toHaveBeenCalledWith(query, {
                arrayLimit: 1000,
                comma: true,
                decoder: expect.any(Function),
                delimiter: ';',
                ignoreQueryPrefix: true,
            });
            expect(result).toStrictEqual({ query: 'query-string' });
        });
    });

    describe('buildOfferCodeQuery', () => {
        test('should return empty string is no offer pass', () => {
            const url = buildOfferCodeQuery(null);
            expect(url).toEqual('');
        });

        test('should return offer code from offer', () => {
            const url = buildOfferCodeQuery({
                accom: {
                    code: 'code',
                    packageId: 'packageID',
                    unit: [
                        {
                            board: 'board',
                            code: 'room',
                        },
                    ],
                },
            } as any);
            expect(url).toEqual('code_packageID_room-board');
        });

        test('should return offer code from offer for external accom and room code with different board', () => {
            const url = buildOfferCodeQuery(
                {
                    accom: {
                        isExt: true,
                        code: 'code',
                        packageId: 'packageID',
                        unit: [
                            {
                                board: 'HB',
                                code: 'DBT.ST-2!NOR.CG-PACKAGEHB',
                            },
                        ],
                    },
                } as any,
                'BB',
                {
                    offers: [
                        {
                            accom: {
                                unit: [
                                    {
                                        code: 'DBT.ST-2!NOR TEST BB',
                                    },
                                ],
                            },
                        },
                    ],
                } as any,
            );
            expect(url).toEqual('code_packageID_DBT.ST-2!NOR TEST BB-BB');
        });
    });

    describe('deleteUrlParam', () => {
        test('should return new url without params', () => {
            const url = deleteUrlParam('example?foo=1&bar=2&foo=3', 'foo');
            expect(url).toEqual('example?bar=2');
        });

        test('should return the same url', () => {
            const url = deleteUrlParam('example?foo=1&bar=2&foo=3', 'fo');
            expect(url).toEqual(url);
        });
    });

    describe('buildCmsUrlWithMediaSizeQuery', () => {
        test('should return new url with "mw" and "mh" params', () => {
            const url = buildCmsUrlWithMediaSizeQuery('example', { mw: 100, mh: 100 });
            expect(url).toEqual('example?mw=100&mh=100');
        });

        test('should return new url with "mw" and "mh" and without "w", "h" and "hash" params', () => {
            const url = buildCmsUrlWithMediaSizeQuery('example?w=1&h=1&hash=ABC', { mw: 100, mh: 100 });
            expect(url).toEqual('example?mw=100&mh=100');
        });

        test('should return new url with "mw" and "mh" and without "w", "h", "hash" and "iar" params', () => {
            const url = buildCmsUrlWithMediaSizeQuery('example?w=1&h=1&hash=ABC&iar=1', { mw: 100, mh: 100 });
            expect(url).toEqual('example?mw=100&mh=100');
        });
    });

    describe('buildFrontendImageWithFallBack', () => {
        test('should return main image only', () => {
            const url = buildFrontendImageWithFallBack('test');
            expect(url).toEqual('url("test")');
        });

        test('should return main and fallback image', () => {
            const url = buildFrontendImageWithFallBack('test', 'test1');
            expect(url).toEqual('url("test"), url("test1")');
        });

        test('should return main and print image on trade', () => {
            const url = buildFrontendImageWithFallBack('test', 'test1', false, '/en/holidays/trade-portal', true);
            expect(url).toEqual('url("test"), url("/en/holidays/trade-portal/print-image?url=test"), url("test1")');
        });
    });

    describe('encodeQuotation', () => {
        test('should encode quotes', () => {
            const url = encodeQuotation(`/hotel_".jpg`);
            expect(url).toEqual('/hotel_%22.jpg');
        });
    });

    describe('buildRoomAllocationFromOfferUnitParams', () => {
        test('should build room allocation', () => {
            const units = [
                {
                    code: 'TPL.ST!NOR.SEMIFLEXRO',
                    occupation: {
                        adults: 2,
                        children: 1,
                        infants: 0,
                        childAges: [3],
                    },
                },
            ] as any;

            const allocation = buildRoomAllocationFromOfferUnitParams(units);

            expect(allocation).toEqual([
                {
                    adults: 2,
                    children: 1,
                    infants: 0,
                    childrenAges: [3],
                    roomCode: 'TPL.ST!NOR.SEMIFLEXRO',
                },
            ]);
        });

        test('should build room allocation with #', () => {
            const units = [
                {
                    code: 'DBL.ST!NOR.ID_B2B_20#CG-TODOS',
                    occupation: {
                        adults: 2,
                        children: 2,
                        infants: 1,
                        childAges: [3, 5],
                    },
                },
            ] as any;

            const allocation = buildRoomAllocationFromOfferUnitParams(units);

            expect(allocation).toEqual([
                {
                    adults: 2,
                    children: 2,
                    infants: 1,
                    childrenAges: [3, 5],
                    roomCode: 'DBL.ST!NOR.ID_B2B_20%23CG-TODOS',
                },
            ]);
        });
    });

    describe.each([
        [null, ''],
        ['', ''],
        ['ES', 'ES'],
        ['ESBA', 'ES,ESBA'],
        ['ESCBBE', 'ES,ESCB,ESCBBE'],
    ])('buildGeogParamByDestinationCodeQuery', (code, expected) => {
        it(`should return ${expected}`, () => {
            const res = buildGeogParamByDestinationCodeQuery(code as string);
            expect(res).toEqual(expected);
        });
    });

    describe.each([
        [[], ''],
        [['ESCD', 'ESAL', 'ESSV', 'ESGR'], 'ES,ESCD|ESAL|ESSV|ESGR'],
    ])('buildGeogParamByRelatedRegionsQuery', (codes, expected) => {
        it(`should return ${expected}`, () => {
            const res = buildGeogParamByRelatedRegionsQuery(codes);
            expect(res).toEqual(expected);
        });
    });

    describe('buildRoomFromOfferUnitParams', () => {
        test('should return IQueryRoom', () => {
            const queryRoom = buildRoomFromOfferUnitParams([
                {
                    code: 'DB1',
                    occupation: {
                        adults: 1,
                        children: 0,
                        infants: 0,
                    } as IUnitOccupation,
                } as IUnit,
                {
                    code: 'DB2',
                    occupation: {
                        adults: 2,
                        children: 1,
                        infants: 0,
                    } as IUnitOccupation,
                } as IUnit,
            ]);
            expect(queryRoom).toEqual([
                {
                    adults: 1,
                    children: 0,
                    infants: 0,
                    roomCode: 'DB1',
                } as IQueryRoom,
                {
                    adults: 2,
                    children: 1,
                    infants: 0,
                    roomCode: 'DB2',
                } as IQueryRoom,
            ]);
        });
    });

    describe('buildAltIdsFromAltAccommodationsParams', () => {
        it('should return alternative IDs', () => {
            const queryString = buildAltIdsFromAltAccommodationsParams([
                { accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' },
                { accomCode: 'GRCF0055', packageId: '2154857381/2/1950/32' },
                { accomCode: 'GRCF0066', packageId: '2154857381/2/1950/43' },
            ]);
            expect(queryString).toStrictEqual([
                'GRCF0044,GRCF0055,GRCF0066',
                '2154857381/2/1950/21,2154857381/2/1950/32,2154857381/2/1950/43',
            ]);
        });
    });

    describe('buildAltAccommodationsParams', () => {
        it('should return empty string when altAcc NOT passed', () => {
            const queryString = buildAltAccommodationsParams([]);
            expect(queryString).toEqual([]);
        });

        it('should return array when altAcc passed', () => {
            const queryString = buildAltAccommodationsParams([
                { accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' },
                { accomCode: 'GRCF0055', packageId: '2154857381/2/1950/32' },
                { accomCode: 'GRCF0066', packageId: '2154857381/2/1950/43' },
            ]);
            expect(queryString).toEqual([
                { accId: 'GRCF0044', packId: '2154857381/2/1950/21' },
                { accId: 'GRCF0055', packId: '2154857381/2/1950/32' },
                { accId: 'GRCF0066', packId: '2154857381/2/1950/43' },
            ]);
        });
    });

    describe('buildLuggageQuery', () => {
        it('should return undefined when no luggage selected', () => {
            expect(buildLuggageQuery(undefined)).toBeUndefined();
        });

        it('should return selected luggage query', () => {
            const queryString = buildLuggageQuery({ BIKE: 3, CANO: 4 });

            expect(queryString).toBe('BIKE-3|CANO-4');
        });
    });

    describe('buildLCBQuery', () => {
        it('should return undefined when passengers == undefined', () => {
            expect(buildLCBQuery(undefined)).toBeUndefined();
        });

        it('should return undefined when passengers == []', () => {
            expect(buildLCBQuery([])).toBeUndefined();
        });

        it('should return an empty string when passengers have no selected lcb', () => {
            const queryString = buildLCBQuery(mockAllTypesPassengersList);

            expect(queryString).toBe('');
        });

        it('should return an empty string when passengers have no selected lcb', () => {
            const queryString = buildLCBQuery([
                ...mockAllTypesPassengersList,
                mockPassengerWithLCB('5'),
                mockPassengerWithLCB('6'),
            ]);

            expect(queryString).toBe('5|6');
        });
    });

    describe('buildSelectedSeatsQuery', () => {
        it('should return undefined when no seats selected', () => {
            expect(buildSelectedSeatsQuery(undefined)).toEqual([]);
        });

        it('should return selected seats query', () => {
            const queryString = buildSelectedSeatsQuery([
                { seats: [{ seatNumber: '1A' }, { seatNumber: '2A' }] },
                { seats: [{ seatNumber: '3A' }, { seatNumber: '4A' }] },
            ] as ISelectedSeat[]);

            expect(queryString).toEqual(['1A|2A', '3A|4A']);
        });
    });

    describe('isEncoded', () => {
        it('should return true for an encoded string', () => {
            expect(isEncoded('Room%20A')).toBe(true);
        });

        it('should return false for a non-encoded string', () => {
            expect(isEncoded('Room A')).toBe(false);
        });
    });

    describe('buildRoomsParams', () => {
        it('should handle undefined input', () => {
            const result = buildRoomsParams(undefined);
            expect(result).toEqual([]);
        });

        it('should encode roomCode if it is not encoded', () => {
            const input = [{ adults: 2, children: 1, infants: 0, roomCode: 'Room A' }] as IQueryRoom[];
            const result = buildRoomsParams(input);
            expect(result).toEqual([
                {
                    adults: 2,
                    children: 1,
                    infants: 0,
                    roomCode: 'Room%20A',
                },
            ]);
        });

        it('should not re-encode an already encoded roomCode', () => {
            const input = [{ adults: 2, children: 1, infants: 0, roomCode: 'Room%20A' }] as IQueryRoom[];
            const result = buildRoomsParams(input);
            expect(result).toEqual([
                {
                    adults: 2,
                    children: 1,
                    infants: 0,
                    roomCode: 'Room%20A',
                },
            ]);
        });

        it('should handle empty roomCode gracefully', () => {
            const input = [{ adults: 2, children: 0, infants: 1, roomCode: undefined }] as unknown as IQueryRoom[];
            const result = buildRoomsParams(input);
            expect(result).toEqual([
                {
                    adults: 2,
                    children: 0,
                    infants: 1,
                    roomCode: undefined,
                },
            ]);
        });

        it('should not encode roomCode when doNotEncode is true', () => {
            const input = [{ adults: 1, children: 0, infants: 0, roomCode: 'Room A' }] as IQueryRoom[];
            const result = buildRoomsParams(input, true);
            expect(result).toEqual([
                {
                    adults: 1,
                    children: 0,
                    infants: 0,
                    roomCode: 'Room A',
                },
            ]);
        });

        it('should correctly process multiple rooms', () => {
            const input = [
                { adults: 2, children: 2, infants: 0, roomCode: 'Room A' },
                { adults: 1, children: 0, infants: 1, roomCode: 'Room%20B' },
            ] as IQueryRoom[];
            const result = buildRoomsParams(input);
            expect(result).toEqual([
                {
                    adults: 2,
                    children: 2,
                    infants: 0,
                    roomCode: 'Room%20A',
                },
                {
                    adults: 1,
                    children: 0,
                    infants: 1,
                    roomCode: 'Room%20B',
                },
            ]);
        });
    });

    describe.each([
        ['?to=11-05-2021', '?to=11-05-2021', []],
        ['?to=11-05-2021', '?to=11-05-2021&from=08-05-2021', ['from']],
        [
            '?to=11-05-2021&from=08-05-2021&rooms[0][adults]=2&rooms[0][children]=0&rooms[0][infants]=0',
            '',
            ['to', 'from', 'rooms'],
        ],
        [
            '?rooms[0][adults]=2&rooms[0][children]=0&rooms[0][infants]=0',
            '?rooms[0][adults]=2&rooms[0][children]=1&rooms[0][infants]=0',
            ['rooms'],
        ],
    ])('buildGeogParamByDestinationCodeQuery', (query, prevQuery, expected) => {
        it(`should return ${expected}`, () => {
            const res = getChangedQueryParamNames(query, prevQuery);
            expect(res).toEqual(expected);
        });
    });

    describe.each([
        [null, false],
        ['', false],
        ['noschema/page', false],
        ['string', false],
        ['javascript:void(0)', true],
        ['qqq:www', true],
        ['http://test', true],
        ['https://www.domain.com/page', true],
    ])('isValidURL', (code, expected) => {
        it(`should validate url as ${expected}`, () => {
            const res = isValidURL(code as string);
            expect(res).toEqual(expected);
        });
    });

    describe('purifyUrl', () => {
        it('should remove destinations from url', () => {
            expect(purifyUrl('/destinations/espagne')).toEqual('/espagne');
        });

        it('should remove root from url', () => {
            expect(purifyUrl('/root/campaigns/holiday-promotions')).toEqual('/campaigns/holiday-promotions');
        });

        it('should remove / from end of url', () => {
            expect(purifyUrl('/trade-portal/')).toEqual('/trade-portal');
        });

        it('should replace / with empty string by default', () => {
            expect(purifyUrl('/')).toEqual('');
        });

        it('should preserve / when preserveRootSlash is true', () => {
            expect(purifyUrl('/', true)).toEqual('/');
        });
    });

    describe('buildRoomsQueryParams', () => {
        it('should build correct query for multiple guests', () => {
            const roomAllocation = [
                {
                    adults: 2,
                    children: 2,
                    infants: 1,
                    childrenAges: [3, 4],
                    roomCode: '',
                },
                {
                    adults: 1,
                    children: 1,
                    infants: 0,
                    childrenAges: [5],
                    roomCode: 'testCode',
                },
                {
                    adults: 2,
                    children: 0,
                    infants: 0,
                    childrenAges: [],
                    roomCode: '',
                },
                {
                    adults: 1,
                    children: 0,
                    infants: 1,
                    childrenAges: [],
                    roomCode: 'testCode2',
                },
            ];

            expect(buildRoomsQueryParams(roomAllocation)).toStrictEqual([
                '2_2:3|4_1',
                '1_1:5/testCode',
                '2',
                '1_0_1/testCode2',
            ]);
        });

        it('should work with strings as well', () => {
            const roomAllocation = [
                {
                    adults: '2',
                    children: '0',
                    infants: '1',
                    childrenAges: [],
                    roomCode: '',
                },
            ];

            expect(buildRoomsQueryParams(roomAllocation)).toStrictEqual(['2_0_1']);
        });

        it('should return empty array for invalid array', () => {
            const roomAllocation = [
                {
                    foo: 'bar',
                },
            ] as any;

            expect(buildRoomsQueryParams(roomAllocation)).toStrictEqual([]);
        });
    });

    describe('checkIfQueryRooms', () => {
        it('should return false if nothing was provided', () => {
            expect(checkIfQueryRooms('')).toBe(false);
        });

        it('should return false if array was not provided', () => {
            expect(checkIfQueryRooms({} as any)).toBe(false);
        });

        it('should return false if array of strings was provided', () => {
            expect(checkIfQueryRooms(['2', '2_1:3'])).toBe(false);
        });

        it('should return false only when array of empty objects were provided', () => {
            expect(checkIfQueryRooms([{}, {}] as any)).toBe(false);
        });

        it('should return true if array of room objects were provided', () => {
            expect(checkIfQueryRooms([{ adults: 0, children: 0, infants: 1, childrenAges: [] }] as any)).toBe(true);
        });
    });

    describe('buildChildAgesQuery', () => {
        it('should return undefined if no rooms', () => {
            const res = buildChildAgesQuery([]);

            expect(res).toBeUndefined();
        });

        it('should return undefined when no children ages', () => {
            const res = buildChildAgesQuery([{ childrenAges: [] as number[] }] as IQueryRoom[]);

            expect(res).toBeUndefined();
        });

        it('should return children ages string', () => {
            const res = buildChildAgesQuery([{ childrenAges: [1] }, { childrenAges: [2, 3] }] as IQueryRoom[]);

            expect(res).toBe('1,2,3');
        });

        it('should return undefined when no children ages', () => {
            const res = buildChildAgesQuery([{ childrenAges: [] as number[] }] as IQueryRoom[]);

            expect(res).toBeUndefined();
        });

        it('should return children ages string', () => {
            const res = buildChildAgesQuery([{ childrenAges: [1] }, { childrenAges: [2, 3] }] as IQueryRoom[]);

            expect(res).toBe('1,2,3');
        });
    });

    describe('matchesPath', () => {
        const matches = [
            ['/booking', '/booking', ''],
            ['/booking/', '/booking', ''],
            ['/booking?param=param', '/booking', ''],
            ['/booking?param=param&reference=123', '/booking', ''],
            ['/welcome/?verifier=z3vvsSm', '/welcome', ''],
            ['/en/holidays/welcome', '/welcome', '/en/holidays'],
            ['/en/holidays/bookings/my_booking', '/bookings/my_booking', '/en/holidays'],
        ];

        const nonMatches = [
            ['/stake', '/snake', ''],
            ['/booking/subpath-not-ok', '/booking', ''],
            ['/en/holidays/welcome', '/welcome', ''],
            ['/en/holidays/welcome', '/welcome', '/de/urlaub'],
        ];

        matches.forEach(([asPath, pathname, basePath]) => {
            it(`matches ${asPath} to ${pathname}`, () => {
                expect(matchesPathname({ asPath, pathname, basePath })).toEqual(true);
            });
        });

        nonMatches.forEach(([asPath, pathname, basePath]) => {
            it(`does not match ${asPath} to ${pathname}`, () => {
                expect(matchesPathname({ asPath, pathname, basePath })).toEqual(false);
            });
        });
    });

    describe('getAccommodationIdsString', () => {
        it('should return only accommodationIdFromUrl when provided', () => {
            const result = getAccommodationIdsString({
                accommodationIdFromUrl: '123',
                altAccommodationsFromUrl: [],
                selectedAccommodationCodesFromUrl: '',
            });
            expect(result).toBe('123');
        });

        it('should return only altAccommodationsFromUrl when provided', () => {
            const result = getAccommodationIdsString({
                accommodationIdFromUrl: '',
                altAccommodationsFromUrl: [{ accomCode: '456' }, { accomCode: '789' }],
                selectedAccommodationCodesFromUrl: '',
            });
            expect(result).toBe('456,789');
        });

        it('should return only selectedAccommodationCodesFromUrl when provided', () => {
            const result = getAccommodationIdsString({
                accommodationIdFromUrl: '',
                altAccommodationsFromUrl: [],
                selectedAccommodationCodesFromUrl: '101,102',
            });
            expect(result).toBe('101,102');
        });

        it('should combine all inputs and remove duplicates', () => {
            const result = getAccommodationIdsString({
                accommodationIdFromUrl: '123',
                altAccommodationsFromUrl: [{ accomCode: '456' }],
                selectedAccommodationCodesFromUrl: '101,102',
            });
            expect(result).toBe('123,456,101,102');
        });

        it('should handle duplicate values in inputs', () => {
            const result = getAccommodationIdsString({
                accommodationIdFromUrl: '123',
                altAccommodationsFromUrl: [{ accomCode: '123' }, { accomCode: '456' }],
                selectedAccommodationCodesFromUrl: '456,102',
            });
            expect(result).toBe('123,456,102');
        });

        it('should return an empty string when all inputs are empty', () => {
            const result = getAccommodationIdsString({
                accommodationIdFromUrl: '',
                altAccommodationsFromUrl: [],
                selectedAccommodationCodesFromUrl: '',
            });
            expect(result).toBe('');
        });

        it('should handle extra commas in selectedAccommodationCodesFromUrl', () => {
            const result = getAccommodationIdsString({
                accommodationIdFromUrl: '',
                altAccommodationsFromUrl: [],
                selectedAccommodationCodesFromUrl: '101,,102,',
            });
            expect(result).toBe('101,102');
        });

        it('should ignore empty strings in altAccommodationsFromUrl', () => {
            const result = getAccommodationIdsString({
                accommodationIdFromUrl: '',
                altAccommodationsFromUrl: [{ accomCode: '' }, { accomCode: '456' }],
                selectedAccommodationCodesFromUrl: '',
            });
            expect(result).toBe('456');
        });

        it('should ignore empty strings in selectedAccommodationCodesFromUrl', () => {
            const result = getAccommodationIdsString({
                accommodationIdFromUrl: '',
                altAccommodationsFromUrl: [],
                selectedAccommodationCodesFromUrl: ',101,,102,',
            });
            expect(result).toBe('101,102');
        });
    });

    describe('hyphenateString', () => {
        it('should hyphenate and lowercase a string', () => {
            const input = 'Departure Airport with spaces';
            const result = hyphenateString(input);

            expect(result).toBe('departure-airport-with-spaces');
        });

        it('should NOT hyphenate a single string', () => {
            const input = 'Luton';

            const result = hyphenateString(input);
            expect(result).toBe('luton');
        });

        it('should return an empty string for falsy input', () => {
            const result = hyphenateString('');
            expect(result).toBe('');
        });
    });

    describe('filterInvalidRelativePath', () => {
        it('should return an empty string when the passed param is a string that starts with / and contains a space', () => {
            expect(filterInvalidRelativePath('/en/buy/flights plus hotels')).toEqual('');
        });

        it('should return a passed param when the passed param is a string that starts with / and does NOT contain a space', () => {
            expect(filterInvalidRelativePath('/en/buy/flights-plus-hotels')).toEqual('/en/buy/flights-plus-hotels');
        });

        it('should return an empty string when the passed param is a string that does NOT start with / and contains a space', () => {
            expect(filterInvalidRelativePath('en/buy/flights plus hotels')).toEqual('');
        });

        it('should return an empty string when the passed param is a string that does NOT start with / and does NOT contain a space', () => {
            expect(filterInvalidRelativePath('en/buy/flights-plus-hotels')).toEqual('');
        });

        it('should return an empty string when the passed param is undefined', () => {
            expect(filterInvalidRelativePath(undefined)).toEqual('');
        });
    });

    describe('buildFlightPlusHotelUrl', () => {
        it('should append the ecp query param with the fph provider value to the given path', () => {
            const result = buildFlightPlusHotelUrl('/en/buy/flights-plus-hotels?foo=bar');

            expect(result).toBe('/en/buy/flights-plus-hotels?foo=bar&ecp=fph');
        });

        it('should work with a root path', () => {
            const result = buildFlightPlusHotelUrl('/');

            expect(result).toBe('/?ecp=fph');
        });

        it('should override any existing query string with the ecp param', () => {
            const result = buildFlightPlusHotelUrl('/search?ecp=bar');

            expect(result).toBe('/search?ecp=fph');
        });
    });
});
