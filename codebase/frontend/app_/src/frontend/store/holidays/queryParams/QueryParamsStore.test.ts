import { createMockStores, mockFlightsOffers } from 'frontend/__mocks__';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';
import { RoomAllocation } from 'models/RoomAllocation';

import { QueryParamsStore } from './QueryParamsStore';

let queryStore: QueryParamsStore;

describe('QueryParamsStore', () => {
    beforeEach(() => {
        queryStore = new QueryParamsStore(
            createMockStores({
                bookingStore: {
                    to: new Date(2023, 1, 23),
                    from: new Date(2023, 1, 1),
                    selectedDestinationCodes: ['SKOS', 'LGW', 'BBW'],
                    selectedDestinationCodesQuery: 'FGH',
                    flexDays: 3,
                    isAutoAllocation: true,
                    roomsAllocation: [new RoomAllocation()],
                },
                seatMapStore: {
                    selectedSeats: [],
                },
                searchStore: {
                    selectedAccommodationCodes: 'SKOS',
                    searchFrom: {
                        origins: ['/call', '/retrieve'],
                    },
                    searchWhen: {},
                },
                searchFiltersStore: {},
                layoutStore: {
                    isPromoPage: false,
                },
                mediaCenterStore: {
                    selectedFilters: [{ groupCode: FilterGroupCodes.Topics, code: 'EDF' }],
                },
                marketStore: { formatMoney: jest.fn(a => `+£${a}`) },
                airportParkingStore: {
                    selectedAirportParking: {
                        bookingDetails: {
                            productCode: 'LGW1',
                        },
                    },
                },
                routerStore: {
                    updateCurrentPage: jest.fn(),
                },
            }) as any,
        );
    });

    describe('selectedTopicsFromUrl', () => {
        it('should return an empty array if query has no topics filter', () => {
            queryStore.query[QueryParamName.Topics] = null;

            expect(queryStore.selectedTopicsFromUrl).toEqual([]);
        });

        it('should return an array of topics if query has topics to filter', () => {
            queryStore.query[QueryParamName.Topics] = ['test', 'test2'];

            expect(queryStore.selectedTopicsFromUrl).toEqual([
                {
                    code: 'test',
                    name: 'test',
                    groupCode: FilterGroupCodes.Topics,
                },
                {
                    code: 'test2',
                    name: 'test2',
                    groupCode: FilterGroupCodes.Topics,
                },
            ]);
        });
    });

    describe('parkingCodeFromUrl', () => {
        it('should return an empty string if query has no airportParkingCode', () => {
            queryStore.query[QueryParamName.AirportParkingCode] = null;

            expect(queryStore.parkingCodeFromUrl).toEqual('');
        });

        it('should return a string with AirportParkingCode if query has airportParkingCode', () => {
            queryStore.query[QueryParamName.AirportParkingCode] = 'ABC';

            expect(queryStore.parkingCodeFromUrl).toEqual('ABC');
        });
    });

    describe('buildShortlistHotelQuery', () => {
        it('should return full params', () => {
            const params = queryStore.buildShortlistHotelQuery(mockFlightsOffers[0]);
            const searchParams = new URLSearchParams(params);

            expect(searchParams.get('ibf')).toBe('true');
            expect(searchParams.get('to')).toBe('31-08-2023');
            expect(searchParams.get('from')).toBe('26-08-2023');
            expect(searchParams.get('dst')).toBe('ESMJ0017');
            expect(searchParams.get('geog')).toBe('');
            expect(searchParams.get('sAccId')).toBe('');
            expect(searchParams.get('flex')).toBe('3');
            expect(searchParams.get('org')).toBe('BRS');
            expect(searchParams.get('aa')).toBe('1');
            expect(searchParams.get('rooms')).toBe('1_2:5|7_1/unitRoomMock_mock');
            expect(searchParams.get('outId')).toBe('2179873450/755956');
            expect(searchParams.get('inId')).toBe('2180357869/801791');
            expect(searchParams.get('accId')).toBe('ESMJ0017');
            expect(searchParams.get('packId')).toBe('2183941081/2/2063/5');
            expect(searchParams.get('boardType')).toBe('board_code');
            expect(searchParams.get('offerRooms')).toBe('1_2:5|7_1/unitRoomMock_mock');
            expect(searchParams.get('transfer')).toBe('JUMB011161SS');
            expect(searchParams.get('dtransfer')).toBe('JUMB011161SS');
            expect(searchParams.get('isExt')).toBe('0');
            expect(searchParams.get('lateRoomCheckout')).toBe('0');
        });

        it('should return params with offer price eq 0', () => {
            const params = queryStore.buildShortlistHotelQuery({ ...mockFlightsOffers[0], price: 0 });
            const searchParams = new URLSearchParams(params);

            expect(searchParams.get('ibf')).toBe('true');
            expect(searchParams.get('to')).toBe('31-08-2023');
            expect(searchParams.get('from')).toBe('26-08-2023');
            expect(searchParams.get('dst')).toBe('ESMJ0017');
            expect(searchParams.get('geog')).toBe('');
            expect(searchParams.get('sAccId')).toBe('');
            expect(searchParams.get('flex')).toBe('3');
            expect(searchParams.get('org')).toBe('BRS');
            expect(searchParams.get('aa')).toBe('1');
            expect(searchParams.get('rooms')).toBe('1_2:5|7_1/unitRoomMock_mock');
            expect(searchParams.get('outId')).toBe('2179873450/755956');
            expect(searchParams.get('inId')).toBe('2180357869/801791');
            expect(searchParams.get('accId')).toBe('ESMJ0017');
            expect(searchParams.get('packId')).toBe('2183941081/2/2063/5');
            expect(searchParams.get('boardType')).toBe('board_code');
            expect(searchParams.get('offerRooms')).toBe('1_2:5|7_1/unitRoomMock_mock');
            expect(searchParams.get('transfer')).toBe('JUMB011161SS');
            expect(searchParams.get('dtransfer')).toBe('JUMB011161SS');
            expect(searchParams.get('isExt')).toBe('0');
            expect(searchParams.get('lateRoomCheckout')).toBe('0');
        });
    });

    describe('buildHotelQueryPromotingIframe', () => {
        it('should build params when there is only one guest', () => {
            queryStore.query[QueryParamName.Adults] = 1;
            const params = queryStore.buildHotelQueryPromotingIframe(mockFlightsOffers[0]);

            expect(params).toEqual(
                '?dst=ESMJ0017&isPromotingIframe=true&isReferer=1&openSearchPodWhoField=1&rooms=0&accId=ESMJ0017&to=&from=&org=/call,/retrieve&utm_source=easyjet&utm_medium=en_pickflights&utm_campaign=recommended',
            );
        });

        it('should build params when there is child', () => {
            queryStore.query[QueryParamName.Adults] = 1;
            queryStore.query[QueryParamName.Children] = 1;
            const params = queryStore.buildHotelQueryPromotingIframe(mockFlightsOffers[0]);

            expect(params).toEqual(
                '?dst=ESMJ0017&isPromotingIframe=true&isReferer=1&openSearchPodWhoField=1&rooms=0&accId=ESMJ0017&to=&from=&org=/call,/retrieve&utm_source=easyjet&utm_medium=en_pickflights&utm_campaign=recommended',
            );
        });

        it('should build params when there are more then one guest and no children', () => {
            queryStore.query[QueryParamName.Adults] = 2;
            const params = queryStore.buildHotelQueryPromotingIframe(mockFlightsOffers[0]);

            expect(params).toEqual(
                '?ibf=true&to=23-02-2023&from=01-02-2023&dst=ESMJ0017&sAccId=ESMJ0017&flex=3&aa=1&rooms=0&outId=2179873450/755956&inId=2180357869/801791&accId=ESMJ0017&packId=2183941081/2/2063/5&boardType=board_code&offerRooms=1_2:5|7_1/unitRoomMock_mock&transfer=&dtransfer=&isExt=0&lateRoomCheckout=0&airportParkingCode=LGW1&isPromotingIframe=true&isReferer=1&utm_source=easyjet&utm_medium=en_pickflights&utm_campaign=recommended',
            );
        });
    });

    describe('buildMediaCenterFiltersQuery', () => {
        it("should params with 'forceTopic'", () => {
            const params = queryStore.buildMediaCenterFiltersQuery('forceTopic');

            expect(params).toBe('?topics=forceTopic');
        });

        it('should params with group code', () => {
            const params = queryStore.buildMediaCenterFiltersQuery();

            expect(params).toBe('?topics=EDF');
        });
    });

    describe('buildRedirectUrlToRedeemPage', () => {
        it('should return ordinary params', () => {
            const params = queryStore.buildRedirectUrlToRedeemPage();

            expect(params).toBe('?redirectUrl=/booking/redeem-voucher');
        });
    });

    describe('buildRedirectUrlToShortlistPage', () => {
        it('should return ordinary params', () => {
            expect(queryStore.buildRedirectUrlToShortlistPage()).toBe(
                `?${QueryParamName.RedirectUrl}=${SitePath.Shortlists}`,
            );
        });
    });

    describe('buildBD4HotelParam', () => {
        let superSpy: jest.SpyInstance;

        beforeEach(() => {
            superSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(queryStore)), 'buildBD4HotelParam');
        });

        it('should call parent buildBD4HotelParam with different parameters', () => {
            const mockResult = { [QueryParamName.RedirectUrl]: 'HTL456_FB' };

            superSpy.mockReturnValue(mockResult);

            const result = queryStore.buildBD4HotelParam(5, QueryParamName.RedirectUrl);

            expect(superSpy).toHaveBeenCalledWith(5, QueryParamName.RedirectUrl);
            expect(result).toEqual(mockResult);
        });

        it('should return null when parent returns null', () => {
            superSpy.mockReturnValue(null);

            const result = queryStore.buildBD4HotelParam(0, QueryParamName.EjReco);

            expect(superSpy).toHaveBeenCalledWith(0, QueryParamName.EjReco);
            expect(result).toBeNull();
        });

        it('should work with zero offer position', () => {
            const mockResult = { [QueryParamName.RedirectUrl]: 'HTL000_RO' };

            superSpy.mockReturnValue(mockResult);

            const result = queryStore.buildBD4HotelParam(0, QueryParamName.RedirectUrl);

            expect(superSpy).toHaveBeenCalledWith(0, QueryParamName.RedirectUrl);
            expect(result).toEqual(mockResult);
        });
    });

    describe('updatePageWithLCBQuery', () => {
        it('should be invoked "updatePageWithLCBQuery" from parent', () => {
            queryStore.buildHotelDetailsQuery = jest.fn().mockReturnValue('url');
            queryStore.updatePageWithLCBQueryBase = jest.fn();
            queryStore.updatePageWithLCBQuery();

            expect(queryStore.updatePageWithLCBQueryBase).toHaveBeenCalled();
            expect(queryStore.rootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith('url');
        });
    });

    describe('buildHotelDetailsQuery', () => {
        it('should be invoked "buildHotelDetailsQuery" from parent', () => {
            queryStore.buildHotelDetailsQueryBase = jest.fn();
            queryStore.hotelParams = jest.fn().mockReturnValue({
                [QueryParamName.AirportParkingCode]: 'LGW1',
            });
            queryStore.buildHotelDetailsQuery(undefined, {}, {});

            expect(queryStore.buildHotelDetailsQueryBase).toHaveBeenCalledWith(
                {},
                {
                    [QueryParamName.AirportParkingCode]: 'LGW1',
                },
            );
        });
    });

    describe('hotelParams', () => {
        it('should return object with AirportParkingCode when it was provided as a param', () => {
            const result = queryStore.hotelParams(undefined, {});

            expect(result[QueryParamName.AirportParkingCode]).toBe('LGW1');
        });
    });
});
