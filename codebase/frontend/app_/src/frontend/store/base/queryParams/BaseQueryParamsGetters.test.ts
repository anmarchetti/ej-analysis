import * as urlUtils from 'frontend/utils/url.utils';
import { FlightPlusHotelQueryParamName } from 'models/enum/FlightPlusHotelQueryParamName';
import { QueryParamName } from 'models/enum/QueryParamName';

import { BaseQueryParamsGetters } from './BaseQueryParamsGetters';
import { FLIGHTS_PLUS_HOTEL_PROVIDER } from './constants';

export const emptyAncillariesParams = {
    equip: '',
    lug: '',
    ss: '',
    lcbIn: '',
    lcbOut: '',
};

describe('BaseQueryParamsGetters', () => {
    describe('parseBrowserQuery', () => {
        it('should parse the return the path if the value is an encoded URL: %2Fen%2Fbuy%2Fflights', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.parseBrowserQuery('returnPath=%2Fen%2Fbuy%2Fflights');

            expect(queryGetter.returnPathFromUrl).toEqual('/en/buy/flights');
        });

        it('should parse the return the path if the value contains encoded query params: /en/buy/flights%3Fp%3D1%26c%3D2', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.parseBrowserQuery('returnPath=/en/buy/flights%3Fp%3D1%26c%3D2');

            expect(queryGetter.returnPathFromUrl).toEqual('/en/buy/flights?p=1&c=2');
        });

        it('should parse the return the path including only the encoded query params: /en/buy/flights%3Fp%3D1&c%3D2', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.parseBrowserQuery('returnPath=/en/buy/flights%3Fp%3D1&c%3D2');

            expect(queryGetter.returnPathFromUrl).toEqual('/en/buy/flights?p=1');
        });

        it('should parse the return path into an empty string if the value contains encoded spaces: /en/buy/%20flights', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.parseBrowserQuery('returnPath=/en/buy/%20flight');

            expect(queryGetter.returnPathFromUrl).toEqual('');
        });
    });

    describe('parseGuestsInRoomValue', () => {
        it('should return 0 if passed value cant parsed sa integer', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parseGuestsInRoomValue('string value')).toBe(0);
        });

        it('should return 0 if passed value is decimal', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parseGuestsInRoomValue('2.3')).toBe(0);
        });

        it('should return 0 if passed value is negative', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parseGuestsInRoomValue('-2')).toBe(0);
        });

        it('should return passed value as parsed integer if it is more or equal to 0', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parseGuestsInRoomValue('2')).toBe(2);
        });
    });

    describe('parsePaginationValue', () => {
        it('should return 0 if passed value cant be parsed as integer', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parsePaginationValue('string value')).toBe(0);
            expect(queryGetter.parsePaginationValue('1.sad')).toBe(0);
        });

        it('should return 0 if passed value was parsed as negative number', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parsePaginationValue('-1')).toBe(0);
            expect(queryGetter.parsePaginationValue('-2.3')).toBe(0);
        });

        it('should return value if a passed value is correct', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parsePaginationValue('1')).toBe(1);
        });
    });

    describe('parseStringValue', () => {
        it.each([[1], [[]], [{}], [null]])('should return an empty string if passed value is not a string', value => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parseStringValue(value as any)).toBe('');
        });

        it('should return a passed value if it string', () => {
            const queryGetter = new BaseQueryParamsGetters();
            const value = 'string value';

            expect(queryGetter.parseStringValue(value)).toBe(value);
        });
    });

    describe('parseIntValueFromString', () => {
        it.each([['string.value'], ['1.23'], ['1.asd'], [NaN]])(
            'should return null if a passed value cant be parsed as integer',
            value => {
                const queryGetter = new BaseQueryParamsGetters();

                expect(queryGetter.parseIntValueFromString(value as any)).toBeNull();
            },
        );

        it.each([
            ['1', 1],
            ['0', 0],
            ['-1', -1],
        ])('should return integer if a passed value can be parsed as integer', (value, expected) => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parseIntValueFromString(value)).toBe(expected);
        });
    });

    describe('parseAltAccommodations', () => {
        it('should return alternative accommodations', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(
                queryGetter.parseAltAccommodations(
                    'GRCF0044,GRCF0055,GRCF0066',
                    '2154857381/2/1950/21,2154857381/2/1950/32,2154857381/2/1950/43',
                ),
            ).toStrictEqual([
                { accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' },
                { accomCode: 'GRCF0055', packageId: '2154857381/2/1950/32' },
                { accomCode: 'GRCF0066', packageId: '2154857381/2/1950/43' },
            ]);
        });
    });

    describe('parseLuggage', () => {
        it('should skip when no selected luggage', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parseLuggage('')).toBeUndefined();
        });

        it('should return selected luggage', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.parseLuggage('LUS-5|LUG-1|BIKE-3|CANO-4')).toStrictEqual({
                BIKE: 3,
                CANO: 4,
                LUG: 1,
                LUS: 5,
            });
        });
    });

    describe('durationFromUrl', () => {
        it('should return number when query value is a number string', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.Duration] = '10';

            expect(queryGetter.durationFromUrl).toBe(10);
        });

        it('should return 0 when query value is not defined', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query = {};

            expect(queryGetter.durationFromUrl).toBe(0);
        });
    });

    describe('flexDaysFromUrl', () => {
        it('should return true if query value is 1 number', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.FlexDays] = 1;

            expect(queryGetter.flexDaysFromUrl).toBe(1);
        });

        it('should return true if query value is 1 string', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.FlexDays] = '1';

            expect(queryGetter.flexDaysFromUrl).toBe(1);
        });

        it('should return false if query value is 0 number', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.FlexDays] = 0;

            expect(queryGetter.flexDaysFromUrl).toBeFalsy();
        });

        it('should return false if query value is 0 string', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.FlexDays] = '0';

            expect(queryGetter.flexDaysFromUrl).toBeFalsy();
        });

        it('should return null if query value is not defined', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query = {};

            expect(queryGetter.flexDaysFromUrl).toBeFalsy();
        });

        it('should return true (selected as by default) if query value is defined but not 1 or 0 (string and number)', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.FlexDays] = NaN;
            expect(queryGetter.flexDaysFromUrl).toBeFalsy();

            queryGetter.query[QueryParamName.FlexDays] = {};
            expect(queryGetter.flexDaysFromUrl).toBeFalsy();

            queryGetter.query[QueryParamName.FlexDays] = [];
            expect(queryGetter.flexDaysFromUrl).toBeFalsy();

            queryGetter.query[QueryParamName.FlexDays] = 1.23;
            expect(queryGetter.flexDaysFromUrl).toBeFalsy();

            queryGetter.query[QueryParamName.FlexDays] = -1234.56;
            expect(queryGetter.flexDaysFromUrl).toBeFalsy();

            queryGetter.query[QueryParamName.FlexDays] = 'string value';
            expect(queryGetter.flexDaysFromUrl).toBeFalsy();

            queryGetter.query[QueryParamName.FlexDays] = -1;
            expect(queryGetter.flexDaysFromUrl).toBe(1);
        });
    });

    describe('originFromUrl', () => {
        it('should return only strings in passed origins array', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.Origin] = ['LGW', 1];

            expect(queryGetter.originFromUrl).toEqual(['LGW']);
        });

        it('should return an empty array if passed value is not an array', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.Origin] = 1;
            expect(queryGetter.originFromUrl).toEqual([]);

            queryGetter.query[QueryParamName.Origin] = { name: 'easyJet' };
            expect(queryGetter.originFromUrl).toEqual([]);
        });

        it('should return an array if received a string', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.Origin] = 'LGW,LTN';
            expect(queryGetter.originFromUrl).toEqual(['LGW', 'LTN']);

            queryGetter.query[QueryParamName.Origin] = 'LGW';
            expect(queryGetter.originFromUrl).toEqual(['LGW']);
        });
    });

    describe('altAccommodationsFromUrl', () => {
        it('should return empty array when no alternative IDs passed', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.altAccommodationsFromUrl).toEqual([]);
        });

        it('should return alternative accommodations when alternative IDs passed', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.AltAccommodationIds] = 'GRCF0044';
            queryGetter.query[QueryParamName.AltPackageIds] = '2154857381/2/1950/21';

            expect(queryGetter.altAccommodationsFromUrl).toEqual([
                { accomCode: 'GRCF0044', packageId: '2154857381/2/1950/21' },
            ]);
        });
    });

    describe('lcb getters', () => {
        it('should return empty string when no lcb in URL', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.outboundLCBSelectionFromUrl).toEqual('');
            expect(queryGetter.inboundLCBSelectionFromUrl).toEqual('');
        });

        it('should return lcb from URL when they passed', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.SelectedBagsOut] = 'SelectedBagsOut';
            queryGetter.query[QueryParamName.SelectedBagsIn] = 'SelectedBagsIn';

            expect(queryGetter.outboundLCBSelectionFromUrl).toBe('SelectedBagsOut');
        });
    });

    describe('roomsAllocationFromUrl', () => {
        it('should return empty array when no rooms are passed', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.roomsAllocationFromUrl).toEqual([]);
        });

        it('should return empty array for invalid string', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.Rooms] = 'invalid';

            expect(queryGetter.roomsAllocationFromUrl).toEqual([]);
        });

        it('should return valid rooms allocation for multiple guests', () => {
            const queryGetter = new BaseQueryParamsGetters();

            queryGetter.query[QueryParamName.Rooms] = '2_2:3|4_1,1_1:5,2';

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
                    roomCode: '',
                },
                {
                    adults: 2,
                    children: 0,
                    infants: 0,
                    childrenAges: [],
                    roomCode: '',
                },
            ];

            expect(queryGetter.roomsAllocationFromUrl).toEqual(roomAllocation);
        });
    });

    describe('luggageSelectionFromUrl', () => {
        it('should return undefined when no selected luggage passed', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.luggageSelectionFromUrl).toBeUndefined();
        });

        it('should return selected luggage when it is passed', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.SelectedLuggage] = 'LUS-5|LUG-1';

            expect(queryGetter.luggageSelectionFromUrl).toStrictEqual({
                LUG: 1,
                LUS: 5,
            });
        });
    });

    describe('sportEquipmentSelectionFromUrl', () => {
        it('should return undefined when no selected sport equipment passed', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.luggageSelectionFromUrl).toBeUndefined();
        });

        it('should return selected sport equipment when it is passed', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.SelectedLuggage] = 'BIKE-3|CANO-4';

            expect(queryGetter.luggageSelectionFromUrl).toStrictEqual({
                BIKE: 3,
                CANO: 4,
            });
        });
    });

    describe('offerRoomsAllocationFromUrl', () => {
        let queryGetter: BaseQueryParamsGetters;

        beforeAll(() => {
            queryGetter = new BaseQueryParamsGetters();
        });

        it('should return empty array when no rooms are passed', () => {
            expect(queryGetter.offerRoomsAllocationFromUrl).toEqual([]);
        });

        it('should return empty array for invalid string', () => {
            queryGetter.query[QueryParamName.OfferRooms] = 'invalid';

            expect(queryGetter.offerRoomsAllocationFromUrl).toEqual([]);
        });

        it('should return valid rooms allocation for multiple guests', () => {
            queryGetter.query[QueryParamName.OfferRooms] = '2_2:3|4_1/code1,1_1:5/code2,2/code3';

            const roomAllocation = [
                {
                    adults: 2,
                    children: 2,
                    infants: 1,
                    childrenAges: [3, 4],
                    roomCode: 'code1',
                },
                {
                    adults: 1,
                    children: 1,
                    infants: 0,
                    childrenAges: [5],
                    roomCode: 'code2',
                },
                {
                    adults: 2,
                    children: 0,
                    infants: 0,
                    childrenAges: [],
                    roomCode: 'code3',
                },
            ];

            expect(queryGetter.offerRoomsAllocationFromUrl).toEqual(roomAllocation);
        });

        it('should return valid rooms allocation when room code contains separator', () => {
            queryGetter.query[QueryParamName.OfferRooms] = '2_2:3|4_1/code1/foo,1_1:5/code2,2/code3/bar';

            const roomAllocation = [
                {
                    adults: 2,
                    children: 2,
                    infants: 1,
                    childrenAges: [3, 4],
                    roomCode: 'code1/foo',
                },
                {
                    adults: 1,
                    children: 1,
                    infants: 0,
                    childrenAges: [5],
                    roomCode: 'code2',
                },
                {
                    adults: 2,
                    children: 0,
                    infants: 0,
                    childrenAges: [],
                    roomCode: 'code3/bar',
                },
            ];

            expect(queryGetter.offerRoomsAllocationFromUrl).toEqual(roomAllocation);
        });
    });

    describe('selectedAccommodationCodesFromUrl', () => {
        it('should return an empty string when the selected accommodations and alternative accommodations are not passed', () => {
            const queryGetter = new BaseQueryParamsGetters();

            expect(queryGetter.selectedAccommodationCodesFromUrl).toEqual('');
        });

        it('should return a combination of the selected accommodations and alternative accommodations', () => {
            const queryGetter = new BaseQueryParamsGetters();

            queryGetter.query[QueryParamName.SearchAccommodationId] = 'ESMJ0056';
            queryGetter.query[QueryParamName.AltAccommodationIds] = 'Z0024222,X0024222';

            expect(queryGetter.selectedAccommodationCodesFromUrl).toEqual('ESMJ0056,Z0024222,X0024222');
        });

        it('should return a combination of the selected accommodations and alternative accommodations without duplicates', () => {
            const queryGetter = new BaseQueryParamsGetters();

            queryGetter.query[QueryParamName.SearchAccommodationId] = 'ESMJ0056,Z0024222';
            queryGetter.query[QueryParamName.AltAccommodationIds] = 'Z0024222,X0024222';

            expect(queryGetter.selectedAccommodationCodesFromUrl).toEqual('ESMJ0056,Z0024222,X0024222');
        });

        it('should return only alternative accommodations', () => {
            const queryGetter = new BaseQueryParamsGetters();

            queryGetter.query[QueryParamName.AltAccommodationIds] = 'Z0024222,X0024222';

            expect(queryGetter.selectedAccommodationCodesFromUrl).toEqual('Z0024222,X0024222');
        });

        it('should return only selected accommodations', () => {
            const queryGetter = new BaseQueryParamsGetters();

            queryGetter.query[QueryParamName.SearchAccommodationId] = 'ESMJ0056';

            expect(queryGetter.selectedAccommodationCodesFromUrl).toEqual('ESMJ0056');
        });
    });

    describe('emptyAncillariesParams', () => {
        it('should clear params that had value', () => {
            const store = new BaseQueryParamsGetters();

            jest.spyOn(store, 'seatSelectionFromUrl', 'get').mockReturnValue({ s1: '1A' });
            jest.spyOn(store, 'luggageSelectionFromUrl', 'get').mockReturnValue({ LUG: 1 });
            jest.spyOn(store, 'sportEquipmentSelectionFromUrl', 'get').mockReturnValue({ BIKE: 1 });
            jest.spyOn(store, 'outboundLCBSelectionFromUrl', 'get').mockReturnValue('outboundLCBSelectionFromUrl');
            jest.spyOn(store, 'inboundLCBSelectionFromUrl', 'get').mockReturnValue('inboundLCBSelectionFromUrl');

            expect(store.emptyAncillariesParams).toEqual(emptyAncillariesParams);
        });
    });

    describe('booking parameters from URL', () => {
        let store;

        beforeEach(() => {
            store = new BaseQueryParamsGetters();
        });

        it('should return season type from URL', () => {
            store.query[QueryParamName.Season] = 'summer25';

            expect(store.seasonFromUrl).toEqual('summer25');
        });

        it('should return booking reference from URL', () => {
            store.query[QueryParamName.BookingRef] = 'bookingRef';

            expect(store.bookingRefFromUrl).toEqual('bookingRef');
        });

        it('should return lead passenger first name from URL', () => {
            store.query[QueryParamName.LeadFirstName] = 'leadFirstName';

            expect(store.leadFirstNameFromUrl).toEqual('leadFirstName');
        });

        it('should return lead passenger last name from URL', () => {
            store.query[QueryParamName.LeadLastName] = 'leadLastName';

            expect(store.leadLastNameFromUrl).toEqual('leadLastName');
        });

        it('should return trip date start from URL', () => {
            store.query[QueryParamName.DateStart] = 'dateStart';

            expect(store.dateStartFromUrl).toEqual('dateStart');
        });

        it('should return package id from URL', () => {
            store.query[QueryParamName.PackageId] = 'packageId';

            expect(store.packageIdFromUrl).toEqual('packageId');
        });

        it('should return trip date end from URL', () => {
            store.query[QueryParamName.DateEnd] = 'dateEnd';

            expect(store.dateEndFromUrl).toEqual('dateEnd');
        });

        it('should return board type from URL', () => {
            store.query[QueryParamName.BoardType] = 'boardType';

            expect(store.boardTypeFromUrl).toEqual('boardType');
        });

        it('should return default transfer from URL', () => {
            store.query[QueryParamName.DefaultTransfer] = 'defaultTransfer';

            expect(store.defaultTransferFromUrl).toEqual('defaultTransfer');
        });

        it('should return selected transfer from URL', () => {
            store.query[QueryParamName.Transfer] = 'transfer';

            expect(store.selectedTransferFromUrl).toEqual('transfer');
        });

        it('should return firebase source from URL', () => {
            store.query[QueryParamName.FirebaseSource] = 'firebaseSource';

            expect(store.firebaseSource).toEqual('firebaseSource');
        });

        it('should return other routes from URL', () => {
            store.query[QueryParamName.OtherRoutes] = 'otherRoutes';

            expect(store.otherRoutesFromUrl).toStrictEqual(['otherRoutes']);
        });

        it('should return isExt from URL', () => {
            store.query[QueryParamName.IsExt] = 1;

            expect(store.isExtFromUrl).toEqual(true);
        });

        it('should return isLateRoom from URL', () => {
            store.query[QueryParamName.LateRoomCheckout] = 1;

            expect(store.isLateRoom).toEqual(true);
        });

        it('should return isNewFlow from URL', () => {
            store.query[FlightPlusHotelQueryParamName.IsNewFlow] = 1;

            expect(store.isNewFlow).toEqual(true);
        });

        it('should return FlightPlusHotelFunnel from URL', () => {
            store.query[QueryParamName.ExperienceContextProvider] = FLIGHTS_PLUS_HOTEL_PROVIDER;

            expect(store.isFlightPlusHotelFunnel).toEqual(true);
        });

        it('should return true for isFlightPlusHotelFunnel when ecp is uppercase', () => {
            store.query[QueryParamName.ExperienceContextProvider] = FLIGHTS_PLUS_HOTEL_PROVIDER.toUpperCase();

            expect(store.isFlightPlusHotelFunnel).toEqual(true);
        });

        it('should return ecp as FLIGHTS_PLUS_HOTEL_PROVIDER when ExperienceContextProvider is set', () => {
            store.query[QueryParamName.ExperienceContextProvider] = FLIGHTS_PLUS_HOTEL_PROVIDER;

            expect(store.ecp).toEqual(FLIGHTS_PLUS_HOTEL_PROVIDER);
        });

        it('should return ecp as undefined when ExperienceContextProvider is not set', () => {
            expect(store.ecp).toBeUndefined();
        });

        it('should return discount value when dPrice is present in URL', () => {
            store.query[FlightPlusHotelQueryParamName.Discount] = '10';

            expect(store.fphDiscountPriceFromUrl).toBe(10);
        });

        it('should return undefined when dPrice is not present in URL', () => {
            expect(store.fphDiscountPriceFromUrl).toBeUndefined();
        });

        it('should return undefined when dPrice is not a valid number', () => {
            store.query[FlightPlusHotelQueryParamName.Discount] = 'invalid';

            expect(store.fphDiscountPriceFromUrl).toBeUndefined();
        });

        it('should return 0 when dPrice is 0', () => {
            store.query[FlightPlusHotelQueryParamName.Discount] = '0';

            expect(store.fphDiscountPriceFromUrl).toBe(0);
        });

        it('should return negative discount values', () => {
            store.query[FlightPlusHotelQueryParamName.Discount] = '-15';

            expect(store.fphDiscountPriceFromUrl).toBe(-15);
        });

        it('should return discount value for valid positive integers', () => {
            store.query[FlightPlusHotelQueryParamName.Discount] = '100';

            expect(store.fphDiscountPriceFromUrl).toBe(100);
        });

        it('should return redirect url from URL', () => {
            store.query[QueryParamName.RedirectUrl] = 'redirectUrl';

            expect(store.redirectUrlFromUrl).toEqual('redirectUrl');
        });

        it('should return themes codes from URL', () => {
            store.query[QueryParamName.ThemesCodes] = 'themesCodes';

            expect(store.themesCodesFromUrl).toStrictEqual(['themesCodes']);
        });

        it('should return facilities from URL', () => {
            store.query[QueryParamName.Facilities] = 'facilities';

            expect(store.facilitiesFromUrl).toStrictEqual(['facilities']);
        });

        it('should return star rating from URL', () => {
            store.query[QueryParamName.StarRating] = 'starRating';

            expect(store.starRatingFromUrl).toStrictEqual(['starRating']);
        });

        it('should return trip advisor rating from URL', () => {
            store.query[QueryParamName.TripAdvisorRating] = 'tripAdvisorRatingFromUrl';

            expect(store.tripAdvisorRatingFromUrl).toEqual('tripAdvisorRatingFromUrl');
        });

        it('should return inboundFlightNumber from URL', () => {
            store.query[QueryParamName.InboundFlightNumber] = 'EZY0001';

            expect(store.inboundFlightNumber).toEqual('EZY0001');
        });

        it('should return outboundFlightNumber from URL', () => {
            store.query[QueryParamName.OutboundFlightNumber] = 'EZY0002';

            expect(store.outboundFlightNumber).toEqual('EZY0002');
        });
    });

    it('should return email string', () => {
        const store = new BaseQueryParamsGetters();

        store.query[QueryParamName.Email] = 'email';

        expect(store.email).toEqual('email');
    });

    it('should return source string', () => {
        const store = new BaseQueryParamsGetters();

        store.query[QueryParamName.Source] = 'source';

        expect(store.source).toEqual('source');
    });

    describe('returnPath validation', () => {
        const spy = jest.spyOn(urlUtils, 'filterInvalidRelativePath');
        const store = new BaseQueryParamsGetters();

        store.query[QueryParamName.ReturnPath] = '/ReturnPath';

        it('should return /ReturnPath string', () => {
            expect(store.returnPathFromUrl).toEqual('/ReturnPath');
        });

        it('should call filterInvalidRelativePath with the expected args', () => {
            store.returnPathFromUrl;
            expect(spy).toHaveBeenCalledWith('/ReturnPath');
        });
    });

    describe('ReturnPathFromHotelDetails validation', () => {
        const spy = jest.spyOn(urlUtils, 'filterInvalidRelativePath');
        const store = new BaseQueryParamsGetters();

        store.query[QueryParamName.ReturnPathFromHotelDetails] = '/ReturnPathFromHotelDetails';

        it('should return /ReturnPathFromHotelDetails string', () => {
            expect(store.returnPathFromHotelDetailsFromUrl).toEqual('/ReturnPathFromHotelDetails');
        });

        it('should call filterInvalidRelativePath with the expected args', () => {
            store.returnPathFromHotelDetailsFromUrl;
            expect(spy).toHaveBeenCalledWith('/ReturnPathFromHotelDetails');
        });
    });

    describe('isMap', () => {
        const store = new BaseQueryParamsGetters();

        it('should return true when query contains IsMap flag', () => {
            store.query[QueryParamName.IsMap] = 1;

            expect(store.isMap).toBe(true);
        });

        it('should return true when mapPopupState is truthy', () => {
            store.query[QueryParamName.IsMap] = '123@10';

            expect(store.isMap).toBe(true);
        });

        it('should return false when query does NOT contain IsMap flag', () => {
            store.query[QueryParamName.IsMap] = 0;

            expect(store.isMap).toBe(false);
        });
    });

    describe('mapPopupState', () => {
        const store = new BaseQueryParamsGetters();

        it('should return object with accomId and zoom when query contains valid MapPopupState', () => {
            store.query[QueryParamName.IsMap] = '123@10';

            expect(store.mapPopupState).toEqual({ accomId: '123', zoomLevel: 10 });
        });

        it('should return null when no isMap query param', () => {
            store.query[QueryParamName.IsMap] = undefined;

            expect(store.mapPopupState).toBeNull();
        });

        it('should return null when isMap query param is 1', () => {
            store.query[QueryParamName.IsMap] = 1;

            expect(store.mapPopupState).toBeNull();
        });

        it('should return null when isMap query param is 0', () => {
            store.query[QueryParamName.IsMap] = 0;

            expect(store.mapPopupState).toBeNull();
        });

        it('should return null when isMap query param has invalid format', () => {
            store.query[QueryParamName.IsMap] = 'invalidFormat';

            expect(store.mapPopupState).toBeNull();
        });

        it('should return null when isMap query param has non-numeric zoom level', () => {
            store.query[QueryParamName.IsMap] = '123@invalidZoom';

            expect(store.mapPopupState).toBeNull();
        });

        it('should return null when isMap query does not have accomId', () => {
            store.query[QueryParamName.IsMap] = '@10';

            expect(store.mapPopupState).toBeNull();
        });
    });

    describe('isMonthSearchFromUrl', () => {
        const store = new BaseQueryParamsGetters();

        it('should return true when query contains IsMonthSearch flag', () => {
            store.query[QueryParamName.IsMonthSearch] = 1;

            expect(store.isMonthSearchFromUrl).toBe(true);
        });

        it('should return false when query does NOT contain IsMonthSearch flag', () => {
            store.query[QueryParamName.IsMonthSearch] = 0;

            expect(store.isMonthSearchFromUrl).toBe(false);
        });
    });

    describe('monthSearchDurationFromUrl', () => {
        it('should return number when query value is a number string', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query[QueryParamName.MonthSearchDuration] = '10';

            expect(queryGetter.monthSearchDurationFromUrl).toBe(10);
        });

        it('should return 0 when query value is not defined', () => {
            const queryGetter = new BaseQueryParamsGetters();
            queryGetter.query = {};

            expect(queryGetter.monthSearchDurationFromUrl).toBe(0);
        });
    });
});
