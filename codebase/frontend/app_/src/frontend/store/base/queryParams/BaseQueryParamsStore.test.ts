import { envPublic } from 'code/env';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockedBooking } from 'frontend/__mocks__/tracking';
import * as utils from 'frontend/utils/url.utils';
import { IGuestPassenger, ILeadPassenger } from 'models/data/ILeadPassenger';
import { IOffer } from 'models/data/IOffer';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { FlightPlusHotelQueryParamName } from 'models/enum/FlightPlusHotelQueryParamName';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import { QueryParamName } from 'models/enum/QueryParamName';
import { FlightPlusHotelSitePath } from 'models/enum/SitePath';

import { BaseQueryParamsStore } from './BaseQueryParamsStore';
import { FLIGHTS_PLUS_HOTEL_PROVIDER } from './constants';

const spy = jest.spyOn(utils, 'buildAltIdsFromAltAccommodationsParams');

describe('QueryParamsStore', () => {
    const createRootStore = () =>
        ({
            searchStore: {
                searchWhen: {
                    from: null,
                    to: null,
                },
            },
            bookingStore: {
                selectedOffer: mockedOffer,
            },
            layoutStore: {},
            seatMapStore: {
                selectedSeats: [],
            },
            flightsPassengersStore: {
                inBoundPassengers: [{ passengerId: '1' }],
                outBoundPassengers: [{ passengerId: '2' }],
            },
            routerStore: {
                updateCurrentPage: jest.fn(),
            },
            searchFiltersStore: {
                outboundFlightNumber: 'EZY0001',
                inboundFlightNumber: 'EZY0002',
            },
        } as any);

    let rootStore: any = createRootStore();

    beforeEach(() => {
        rootStore = createRootStore();
    });

    describe('query params helpers', () => {
        let store;

        beforeEach(() => {
            store = new BaseQueryParamsStore(rootStore);
        });

        for (const { methodName, paramName } of [
            { methodName: 'promoPage', paramName: QueryParamName.Promo },
            { methodName: 'needLogout', paramName: QueryParamName.Logout },
            { methodName: 'viewMyBooking', paramName: QueryParamName.ViewMyBooking },
            { methodName: 'myBookings', paramName: QueryParamName.MyBookings },
            { methodName: 'needOpenSearchPodWhoField', paramName: QueryParamName.OpenSearchPodWhoField },
            { methodName: 'isPromotingIframe', paramName: QueryParamName.IsPromotingIframe },
        ]) {
            it(`should return ${paramName} value when ${methodName} called`, () => {
                store.query = { [paramName]: '1' };

                expect(store[methodName]()).toBe('1');
            });
        }
    });

    describe('buildSearchQuery', () => {
        it('should return string containing parameters from search store', () => {
            rootStore.searchStore.page = 1;
            rootStore.searchStore.orderBy = OrderBy.Recommended;
            rootStore.searchStore.orderDirection = OrderDirection.Asc;
            rootStore.bookingStore.flexDays = 0;
            const store = new BaseQueryParamsStore(rootStore);
            jest.spyOn(store, 'itemsPerPageFromUrl', 'get').mockReturnValue(1);
            const query = store.buildSearchQuery();

            expect(query).toContain(`${QueryParamName.Page}=1`);
            expect(query).toContain(`${QueryParamName.Take}=1`);
            expect(query).toContain(`${QueryParamName.OrderBy}=recommended`);
            expect(query).toContain(`${QueryParamName.OrderDirection}=asc`);
            expect(query).toContain(`${QueryParamName.FlexDays}=0`);
            expect(query).toContain(`${QueryParamName.AutoAllocation}=0`);
            expect(query).toContain(`${QueryParamName.IsMap}=0`);
        });

        it('should return string containing parameters from booking store', () => {
            rootStore.bookingStore.to = new Date('01.02.2020');
            rootStore.bookingStore.from = new Date('01.01.2020');
            rootStore.bookingStore.origins = ['LA'];
            rootStore.bookingStore.selectedDestinationCodes = ['LD', 'LS'];
            rootStore.bookingStore.flexDays = 1;
            rootStore.bookingStore.isAutoAllocation = true;
            const store = new BaseQueryParamsStore(rootStore);
            const query = store.buildSearchQuery(true, false, false, true);

            expect(query).toContain(`${QueryParamName.From}=01-01-2020`);
            expect(query).toContain(`${QueryParamName.To}=02-01-2020`);
            expect(query).toContain(`${QueryParamName.FlexDays}=1`);
            expect(query).toContain(`${QueryParamName.AutoAllocation}=1`);
            expect(query).toContain(`${QueryParamName.Origin}=LA`);
            expect(query).toContain(`${QueryParamName.Destination}=LD,LS`);
            expect(query).toContain(`${QueryParamName.IsMap}=1`);
        });

        it('should return string containing parameters from search filter store', () => {
            const store = new BaseQueryParamsStore(rootStore);
            const query = store.buildSearchQuery(true, false, false, true);

            expect(query).toContain(
                `${QueryParamName.OutboundFlightNumber}=EZY0001&${QueryParamName.InboundFlightNumber}=EZY0002`,
            );
        });

        it('should return mapQueryParams when provided and isMapPopupShown is true', () => {
            const store = new BaseQueryParamsStore(rootStore);
            const mapQueryParams = {
                accomId: '123',
                zoomLevel: 10,
            };

            const query = store.buildSearchQuery(true, false, false, true, mapQueryParams);

            expect(query).toContain(`${QueryParamName.IsMap}=123@10`);
        });
    });

    it('should fall back to searchWhen dates when bookingStore dates are null', () => {
        rootStore.bookingStore.from = null;
        rootStore.bookingStore.to = null;
        rootStore.searchStore.searchWhen.from = new Date(2026, 8, 1);
        rootStore.searchStore.searchWhen.to = new Date(2026, 8, 8);
        rootStore.bookingStore.flexDays = 0;

        const store = new BaseQueryParamsStore(rootStore);
        const query = store.buildSearchQuery();

        expect(query).toContain(`${QueryParamName.From}=01-09-2026`);
        expect(query).toContain(`${QueryParamName.To}=08-09-2026`);
    });

    it('should fall back to URL geog when bookingStore.selectedDestinationCodesQuery is empty', () => {
        rootStore.bookingStore.selectedDestinationCodesQuery = '';

        const store = new BaseQueryParamsStore(rootStore);
        store.query[QueryParamName.Geog] = 'region:ESMJ';
        const query = store.buildSearchQuery();

        expect(query).toContain(`${QueryParamName.Geog}=region:ESMJ`);
    });

    it('should fall back to URL origin when bookingStore.origins is empty', () => {
        rootStore.bookingStore.origins = [];

        const store = new BaseQueryParamsStore(rootStore);
        store.query[QueryParamName.Origin] = ['LTN'];
        const query = store.buildSearchQuery();

        expect(query).toContain(`${QueryParamName.Origin}=LTN`);
    });

    describe('buildHotelDetailsQueryBase', () => {
        beforeEach(() => {
            store = new BaseQueryParamsStore(rootStore);
        });

        let store;

        describe('alternative packages', () => {
            it('should return string containing alternative packages parameters from url', () => {
                store.query[QueryParamName.AltAccommodationIds] = 'altAccommodationIds';
                store.query[QueryParamName.AltPackageIds] = 'altPackageIds';

                const query = store.buildHotelDetailsQueryBase({}, store.hotelParamsBase(undefined, {}));

                expect(query).toContain(`${QueryParamName.AltAccommodationIds}=altAccommodationIds`);
                expect(query).toContain(`${QueryParamName.AltPackageIds}=altPackageIds`);
            });

            it('should return string containing alternative packages parameters from offer even when URL is provided', () => {
                store.query[QueryParamName.AltAccommodationIds] = 'altAccommodationIds';
                store.query[QueryParamName.AltPackageIds] = 'altPackageIds';
                spy.mockReturnValueOnce(['altAcc1', 'altPack1']);

                rootStore.bookingStore.selectedOffer = {
                    accom: { isExt: false },
                    altAcc: [
                        {
                            accomCode: 'test1',
                            packageId: 'test2',
                        },
                    ],
                } as IOffer;

                const query = store.buildHotelDetailsQueryBase({}, store.hotelParamsBase(undefined, {}));

                expect(utils.buildAltIdsFromAltAccommodationsParams).toHaveBeenCalledWith([
                    { accomCode: 'test1', packageId: 'test2' },
                ]);
                expect(query).toContain(`${QueryParamName.AltAccommodationIds}=altAcc1`);
                expect(query).toContain(`${QueryParamName.AltPackageIds}=altPack1`);
            });
        });

        describe('return path', () => {
            it('should return string containing return Path when present', () => {
                const returnPath = '/en/buy/flights';
                store.query[QueryParamName.ReturnPath] = returnPath;

                const query = store.buildHotelDetailsQueryBase();

                expect(query).toContain(`${QueryParamName.ReturnPath}=${returnPath}`);
            });
        });

        describe('return path from hotel', () => {
            it('should return string containing return Path From Hotel when present', () => {
                const returnPath = '/en/buy/flights';
                store.query[QueryParamName.ReturnPathFromHotelDetails] = returnPath;

                const query = store.buildHotelDetailsQueryBase();

                expect(query).toContain(`${QueryParamName.ReturnPathFromHotelDetails}=${returnPath}`);
            });
        });

        describe('selected luggage and lcb', () => {
            beforeEach(() => {
                spy.mockReturnValueOnce([]);
            });

            it('should return string containing selected luggage parameters from url', () => {
                store.query[QueryParamName.SelectedLuggage] = 'SelectedLuggage';
                store.query[QueryParamName.SelectedSportEquipment] = 'SelectedSportEquipment';
                store.query[QueryParamName.SelectedBagsOut] = 'SelectedBagsOut';
                store.query[QueryParamName.SelectedBagsIn] = 'SelectedBagsIn';

                const query = store.buildHotelDetailsQueryBase({}, store.hotelParamsBase(undefined, {}));

                expect(query).toContain(`${QueryParamName.SelectedLuggage}=SelectedLuggage`);
                expect(query).toContain(`${QueryParamName.SelectedSportEquipment}=SelectedSportEquipment`);
                expect(query).toContain(`${QueryParamName.SelectedBagsOut}=SelectedBagsOut`);
                expect(query).toContain(`${QueryParamName.SelectedBagsIn}=SelectedBagsIn`);
            });

            it('should return string containing selected luggage parameters from params object when it is provided', () => {
                store.query[QueryParamName.SelectedLuggage] = 'selectedLuggageURL';
                store.query[QueryParamName.SelectedSportEquipment] = 'selectedSportEquipmentURL';
                store.query[QueryParamName.SelectedBagsOut] = 'SelectedBagsOutURL';
                store.query[QueryParamName.SelectedBagsIn] = 'SelectedBagsInURL';

                store.query[QueryParamName.SelectedLuggage] = 'selectedLuggageURL';
                store.query[QueryParamName.SelectedSportEquipment] = 'selectedSportEquipmentURL';
                store.query[QueryParamName.SelectedBagsOut] = 'SelectedBagsOutURL';
                store.query[QueryParamName.SelectedBagsIn] = 'SelectedBagsInURL';

                const lcbParams = {
                    [QueryParamName.SelectedLuggage]: 'selectedLuggageParams',
                    [QueryParamName.SelectedSportEquipment]: 'selectedSportEquipmentParams',
                    [QueryParamName.SelectedBagsOut]: 'SelectedBagsOutParams',
                    [QueryParamName.SelectedBagsIn]: 'SelectedBagsInParams',
                };

                const query = store.buildHotelDetailsQueryBase({}, store.hotelParamsBase(undefined, lcbParams));

                expect(query).not.toContain(`${QueryParamName.SelectedLuggage}=selectedLuggageURL`);
                expect(query).not.toContain(`${QueryParamName.SelectedSportEquipment}=selectedSportEquipmentURL`);
                expect(query).not.toContain(`${QueryParamName.SelectedBagsOut}=SelectedBagsOutURL`);
                expect(query).not.toContain(`${QueryParamName.SelectedBagsIn}=SelectedBagsInURL`);

                expect(query).toContain(`${QueryParamName.SelectedLuggage}=selectedLuggageParams`);
                expect(query).toContain(`${QueryParamName.SelectedSportEquipment}=selectedSportEquipmentParams`);
                expect(query).toContain(`${QueryParamName.SelectedBagsOut}=SelectedBagsOutParams`);
                expect(query).toContain(`${QueryParamName.SelectedBagsIn}=SelectedBagsInParams`);
            });
        });
    });

    describe('buildSearchQueryWithParams', () => {
        it('should return string containing parameters from object', () => {
            const store = new BaseQueryParamsStore(rootStore);
            const params = {
                paramNumber: 1,
                paramString: 'str',
                paramBool: true,
            };
            const query = store.buildSearchQueryWithParams(true, params);

            expect(query).toContain('paramNumber=1');
            expect(query).toContain('paramString=str');
            expect(query).toContain('paramBool=true');
        });
    });

    describe('buildHelpQuestionQuery', () => {
        it('should return string not containing passed parameters', () => {
            const store = new BaseQueryParamsStore(rootStore);
            const query = store.buildHelpQuestionQuery();

            expect(query).not.toContain(`${QueryParamName.HelpCategory}`);
            expect(query).not.toContain(`${QueryParamName.HelpQuestion}`);
        });

        it('should return string containing passed parameters', () => {
            const store = new BaseQueryParamsStore(rootStore);
            const query = store.buildHelpQuestionQuery('category', 'question');

            expect(query).toContain(`${QueryParamName.HelpCategory}=category`);
            expect(query).toContain(`${QueryParamName.HelpQuestion}=question`);
        });
    });

    describe('updatePageWithLCBQueryBase', () => {
        it('should return lcbparams', () => {
            const spyBuildLCBQuery = jest
                .spyOn(utils, 'buildLCBQuery')
                .mockReturnValueOnce('1|2|3')
                .mockReturnValueOnce('4|5|6');

            const store = new BaseQueryParamsStore(rootStore);

            const LCBQueryBaseResults = store.updatePageWithLCBQueryBase();

            const lcbParams = {
                [QueryParamName.SelectedBagsOut]: '1|2|3',
                [QueryParamName.SelectedBagsIn]: '4|5|6',
            };

            expect(spyBuildLCBQuery).toHaveBeenCalledWith(rootStore.flightsPassengersStore.outBoundPassengers);
            expect(spyBuildLCBQuery).toHaveBeenCalledWith(rootStore.flightsPassengersStore.inBoundPassengers);
            expect(LCBQueryBaseResults).toEqual(lcbParams);
        });
    });

    describe('buildSearchParamsQuery', () => {
        describe('destinations param', () => {
            it('should be equal to selectedDestinationCodes when selectedDestinationCodes is NOT empty', () => {
                const selectedDestinationCodes = ['ES', 'PT'];
                rootStore.bookingStore.selectedDestinationCodes = selectedDestinationCodes;

                const store = new BaseQueryParamsStore(rootStore);

                const query = store['buildSearchParamsQuery']();

                expect(query[QueryParamName.Destination]).toEqual(selectedDestinationCodes.join(','));
            });

            it('should add FlightPlusHotelFunnel params when isFlightPlusHotelFunnel is true', () => {
                const store = new BaseQueryParamsStore(rootStore);
                store.query[QueryParamName.ExperienceContextProvider] = FLIGHTS_PLUS_HOTEL_PROVIDER;
                jest.spyOn(store, 'isFlightPlusHotelFunnel', 'get').mockReturnValue(true);

                const query = store['buildSearchParamsQuery']();

                expect(query[QueryParamName.ExperienceContextProvider]).toEqual(FLIGHTS_PLUS_HOTEL_PROVIDER);
            });

            it('should NOT add FlightPlusHotelFunnel param when isFlightPlusHotelFunnel is false', () => {
                const store = new BaseQueryParamsStore(rootStore);
                jest.spyOn(store, 'isFlightPlusHotelFunnel', 'get').mockReturnValue(false);

                const query = store['buildSearchParamsQuery']();

                expect(query[QueryParamName.ExperienceContextProvider]).toBeUndefined();
            });

            it('should be equal to selectedDestinationCodesFromUrl when selectedDestinationCodes is empty', () => {
                const selectedDestinationCodesFromUrl = ['code1', 'code2'];
                rootStore.bookingStore.selectedDestinationCodes = [];

                const store = new BaseQueryParamsStore(rootStore);

                jest.spyOn(store, 'selectedDestinationCodesFromUrl', 'get').mockReturnValue(
                    selectedDestinationCodesFromUrl,
                );

                const query = store['buildSearchParamsQuery']();

                expect(query[QueryParamName.Destination]).toEqual(selectedDestinationCodesFromUrl.join(','));
            });

            describe('month search params', () => {
                it('should set month search params to query when called with true param and isMonthSearch is true', () => {
                    rootStore.bookingStore.isMonthSearch = true;
                    rootStore.bookingStore.monthSearchDuration = 7;

                    const store = new BaseQueryParamsStore(rootStore);

                    const query = store['buildSearchParamsQuery'](true);

                    expect(query[QueryParamName.IsMonthSearch]).toBe(true);
                    expect(query[QueryParamName.MonthSearchDuration]).toBe(rootStore.bookingStore.monthSearchDuration);
                });

                it('should NOT set month search params to query when called with false param', () => {
                    rootStore.bookingStore.isMonthSearch = true;

                    const store = new BaseQueryParamsStore(rootStore);

                    const query = store['buildSearchParamsQuery'](false);

                    expect(query[QueryParamName.IsMonthSearch]).toBeUndefined();
                    expect(query[QueryParamName.MonthSearchDuration]).toBeUndefined();
                });

                it('should NOT set month search params to query when called with true param but isMonthSearch is false', () => {
                    rootStore.bookingStore.isMonthSearch = false;

                    const store = new BaseQueryParamsStore(rootStore);

                    const query = store['buildSearchParamsQuery'](true);

                    expect(query[QueryParamName.IsMonthSearch]).toBeUndefined();
                    expect(query[QueryParamName.MonthSearchDuration]).toBeUndefined();
                });
            });
        });

        describe('return path', () => {
            it('should return string containing return Path when present', () => {
                const store = new BaseQueryParamsStore(rootStore);

                const returnPath = '/en/buy/flights';

                store.query[QueryParamName.ReturnPath] = returnPath;

                const query = store.buildHotelDetailsQueryBase();

                expect(query).toContain(`${QueryParamName.ReturnPath}=${returnPath}`);
            });
        });

        describe('searchAccommodationId param', () => {
            it('should be empty when destination is NOT hotel', () => {
                rootStore.bookingStore.selectedDestinationCodes = ['ES'];

                const store = new BaseQueryParamsStore(rootStore);

                const query = store['buildSearchParamsQuery']();

                expect(query[QueryParamName.SearchAccommodationId]).toBe('');
            });

            it('should NOT be empty when destination is hotel', () => {
                const hotelCodes = ['xxxxxxx1', 'xxxxxxx2'];

                rootStore.bookingStore.selectedDestinationCodes = hotelCodes;

                const store = new BaseQueryParamsStore(rootStore);

                const query = store['buildSearchParamsQuery']();

                expect(query[QueryParamName.SearchAccommodationId]).toBe(hotelCodes.join(','));
            });
        });
    });

    describe('hotelParamsBase', () => {
        let store;

        beforeEach(() => {
            store = new BaseQueryParamsStore(rootStore);
            store.buildSearchParamsQuery = jest.fn(() => ({}));
        });

        describe('luggage params', () => {
            it('should return object with SelectedLuggage when it was provided as a param', () => {
                const result = store.hotelParamsBase(undefined, { lug: 2 });

                expect(result[QueryParamName.SelectedLuggage]).toBe(2);
            });

            it('should return object with SelectedLuggage and use value from query when SelectedLuggage is undefined in arguments', () => {
                store.query = { lug: 5 };
                const result = store.hotelParamsBase(undefined, {});

                expect(result[QueryParamName.SelectedLuggage]).toBe(5);
            });

            it('should return object without SelectedLuggage if value provided in arguments is empty string', () => {
                const result = store.hotelParamsBase(undefined, { lug: '' });

                expect(result[QueryParamName.SelectedLuggage]).toBe(undefined);
            });
        });
    });

    describe('buildContactUsFormQuery', () => {
        it('should return string containing parameters the booking', () => {
            const store = new BaseQueryParamsStore(rootStore);
            const query = store.buildContactUsFormQuery({
                ...mockedBooking,
                ...{ leadPassenger: { email: 'test-email' } as ILeadPassenger },
            });

            const { startDate, endDate } = mockedBooking.package.accom;

            expect(query).toContain(`${QueryParamName.BookingRef}=${mockedBooking.bookingReference}`);
            expect(query).toContain(`${QueryParamName.DateStart}=${startDate}`);
            expect(query).toContain(`${QueryParamName.DateEnd}=${endDate}`);
            expect(query).toContain(`${QueryParamName.Email}=test-email`);

            expect(query).not.toContain(QueryParamName.LeadFirstName);
            expect(query).not.toContain(QueryParamName.LeadLastName);
        });

        it('should return query string containing lead passenger name', () => {
            const store = new BaseQueryParamsStore(rootStore);
            const query = store.buildContactUsFormQuery({
                ...mockedBooking,
                ...{
                    guests: [
                        { firstName: 'Test', lastName: 'P', isLead: false },
                        { firstName: 'John', lastName: 'Doe', isLead: true },
                    ] as IGuestPassenger[],
                    leadPassenger: { email: 'test-email' } as ILeadPassenger,
                },
            });

            expect(query).toContain(`${QueryParamName.LeadFirstName}=John`);
            expect(query).toContain(`${QueryParamName.LeadLastName}=Doe`);
        });
    });

    describe('buildRebookHotelQuery', () => {
        it('should return string containing room count of the booking', () => {
            const mockedRoomsCount: IQueryRoom[] = [
                {
                    adults: 2,
                    children: 1,
                    childrenAges: [4],
                    infants: 1,
                    roomCode: 'DB01',
                },
            ];

            const spyRoomAllocationQuery = jest
                .spyOn(utils, 'buildRoomAllocationFromOfferUnitParams')
                .mockReturnValueOnce(mockedRoomsCount);

            const store = new BaseQueryParamsStore(rootStore);
            const query = store.buildRebookHotelQuery(mockedBooking);

            expect(spyRoomAllocationQuery).toHaveBeenCalledWith(mockedBooking.package.accom.rooms);
            expect(query).toBe(`?${QueryParamName.Rooms}=2_1:4_1/DB01`);
        });
    });

    describe('itemsPerPageFromUrl', () => {
        let store;

        beforeEach(() => {
            rootStore.layoutStore.numberOfResultsPerPage = 5;
            store = new BaseQueryParamsStore(rootStore);
        });

        it('should return take parameter from query when it exists', () => {
            jest.spyOn(store, 'parsePaginationValue').mockReturnValue(10);

            expect(store.itemsPerPageFromUrl).toBe(10);
        });

        it('should return numberOfResultsPerPage when take in NOT in the query', () => {
            jest.spyOn(store, 'parsePaginationValue').mockReturnValue(0);

            expect(store.itemsPerPageFromUrl).toBe(rootStore.layoutStore.numberOfResultsPerPage);
        });
    });

    describe('updateMapInQuery', () => {
        let store;

        beforeEach(() => {
            rootStore.routerStore.updateSearchResultsPage = jest.fn();
            store = new BaseQueryParamsStore(rootStore);
            store.stringifyQuery = jest.fn(() => 'test');
        });

        it('should call updateSearchResultsPage and stringifyQuery with isMap = 1', () => {
            store.query[QueryParamName.AltAccommodationIds] = 'altAccommodationIds';
            store.query[QueryParamName.AltPackageIds] = 'altPackageIds';
            store.query[QueryParamName.IsMap] = 0;

            store.updateMapInQuery(true);

            expect(store.stringifyQuery).toHaveBeenCalledWith({
                [QueryParamName.AltAccommodationIds]: 'altAccommodationIds',
                [QueryParamName.AltPackageIds]: 'altPackageIds',
                [QueryParamName.IsMap]: 1,
            });
            expect(rootStore.routerStore.updateSearchResultsPage).toHaveBeenCalledWith('test');
        });

        it('should call updateSearchResultsPage and stringifyQuery with isMap = 0', () => {
            store.query[QueryParamName.AltAccommodationIds] = 'altAccommodationIds';
            store.query[QueryParamName.AltPackageIds] = 'altPackageIds';

            store.updateMapInQuery(false);

            expect(store.stringifyQuery).toHaveBeenCalledWith({
                [QueryParamName.AltAccommodationIds]: 'altAccommodationIds',
                [QueryParamName.AltPackageIds]: 'altPackageIds',
                [QueryParamName.IsMap]: 0,
            });
            expect(rootStore.routerStore.updateSearchResultsPage).toHaveBeenCalledWith('test');
        });
    });

    describe('applyFlightPlusHotelParams', () => {
        it('should not apply params when not in FPH funnel', () => {
            const store = new BaseQueryParamsStore(rootStore);
            jest.spyOn(store, 'isFlightPlusHotelFunnel', 'get').mockReturnValue(false);
            rootStore.layoutStore.isTradePortal = false;

            const queryParams = {};
            store['applyFlightPlusHotelParams'](queryParams);

            expect(queryParams).toEqual({});
        });

        it('should not apply params when in trade portal', () => {
            const store = new BaseQueryParamsStore(rootStore);
            jest.spyOn(store, 'isFlightPlusHotelFunnel', 'get').mockReturnValue(true);
            rootStore.layoutStore.isTradePortal = true;

            const queryParams = {};
            store['applyFlightPlusHotelParams'](queryParams);

            expect(queryParams).toEqual({});
        });

        it('should apply all FPH params when present in query', () => {
            const store = new BaseQueryParamsStore(rootStore);
            jest.spyOn(store, 'isFlightPlusHotelFunnel', 'get').mockReturnValue(true);
            rootStore.layoutStore.isTradePortal = false;
            store.query[QueryParamName.ExperienceContextProvider] = FLIGHTS_PLUS_HOTEL_PROVIDER;
            store.query[FlightPlusHotelQueryParamName.DestinationAirport] = 'LGW';
            store.query[FlightPlusHotelQueryParamName.SearchPodDepartureDate] = '2026-06-01';
            store.query[FlightPlusHotelQueryParamName.SearchPodReturnDate] = '2026-06-15';
            store.query[FlightPlusHotelQueryParamName.Pax] = '2';
            store.query[FlightPlusHotelQueryParamName.Discount] = '10';
            store.query[FlightPlusHotelQueryParamName.Signature] = '10100';
            store.query[QueryParamName.OutboundFlightNumber] = 'EZY0001';
            store.query[QueryParamName.InboundFlightNumber] = 'EZY0002';
            store.query[FlightPlusHotelQueryParamName.RoomAllocation1] = '2-0-0';
            store.query[FlightPlusHotelQueryParamName.RoomAllocation2] = '1-0-0';
            store.query[FlightPlusHotelQueryParamName.SelectedRef] = 'REF123';
            store.query[FlightPlusHotelQueryParamName.SelectedBoardType] = 'BB';
            store.query[FlightPlusHotelQueryParamName.SelectedPackId] = '12345/12345';

            const queryParams = {};
            store['applyFlightPlusHotelParams'](queryParams);

            expect(queryParams).toEqual({
                [QueryParamName.ExperienceContextProvider]: FLIGHTS_PLUS_HOTEL_PROVIDER,
                [FlightPlusHotelQueryParamName.DestinationAirport]: 'LGW',
                [FlightPlusHotelQueryParamName.SearchPodDepartureDate]: '2026-06-01',
                [FlightPlusHotelQueryParamName.SearchPodReturnDate]: '2026-06-15',
                [FlightPlusHotelQueryParamName.Pax]: '2',
                [FlightPlusHotelQueryParamName.Discount]: '10',
                [FlightPlusHotelQueryParamName.Signature]: '10100',
                [QueryParamName.OutboundFlightNumber]: 'EZY0001',
                [QueryParamName.InboundFlightNumber]: 'EZY0002',
                [FlightPlusHotelQueryParamName.RoomAllocation1]: '2-0-0',
                [FlightPlusHotelQueryParamName.RoomAllocation2]: '1-0-0',
                [FlightPlusHotelQueryParamName.SelectedRef]: 'REF123',
                [FlightPlusHotelQueryParamName.SelectedBoardType]: 'BB',
                [FlightPlusHotelQueryParamName.SelectedPackId]: '12345/12345',
            });
        });
    });

    describe('buildFlightPlusHotelUrl', () => {
        const FPH_BASE_URL = 'https://fph-test.example.com';

        let store: BaseQueryParamsStore;

        beforeEach(() => {
            rootStore.layoutStore.lang = 'en';
            envPublic.FLIGHT_PLUS_HOTEL_BASE_URL = FPH_BASE_URL;
            store = new BaseQueryParamsStore(rootStore);
        });

        it('should build a full FPH URL with all query params', () => {
            store.query[QueryParamName.Origin] = 'LGW';
            store.query[FlightPlusHotelQueryParamName.DestinationAirport] = 'AMS';
            store.query[FlightPlusHotelQueryParamName.SearchPodDepartureDate] = '12-06-2026';
            store.query[FlightPlusHotelQueryParamName.SearchPodReturnDate] = '19-06-2026';
            store.query[QueryParamName.From] = '12-06-2026';
            store.query[QueryParamName.To] = '19-06-2026';
            store.query[FlightPlusHotelQueryParamName.Pax] = '2';
            store.query[QueryParamName.OutboundFlightNumber] = 'EZY8672';
            store.query[QueryParamName.InboundFlightNumber] = 'EZY8673';
            store.query[QueryParamName.OutboundId] = 'Eef4ed3dff724f459b65ba849b4f9f88f';
            store.query[QueryParamName.InboundId] = 'Efd8060aa222077570ee4366f17db9270';
            store.query[QueryParamName.AccommodationId] = 'W0022774';
            store.query[QueryParamName.PackageId] = '2298940072/2/3050/7';
            store.query[QueryParamName.OfferRooms] = '2/DBL.QN!NRF.OPAQUE RO NRF';
            store.query[QueryParamName.ExperienceContextProvider] = 'FPH';
            store.query[FlightPlusHotelQueryParamName.RoomAllocation1] = '2-0-0';
            store.query[FlightPlusHotelQueryParamName.RoomAllocation2] = '1-0-0';
            store.query[FlightPlusHotelQueryParamName.SelectedRef] = 'REF123';
            store.query[FlightPlusHotelQueryParamName.SelectedBoardType] = 'BB';
            store.query[FlightPlusHotelQueryParamName.SelectedPackId] = '12345/12345';

            const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Flights);

            expect(url).toBe(
                `${FPH_BASE_URL}/en/flight-plus-hotel/flights?org=LGW&ecp=FPH&dstAirportCode=AMS&searchPodDepartureDate=12-06-2026&searchPodReturnDate=19-06-2026&apax=2&from=12-06-2026&to=19-06-2026&outboundFltNo=EZY8672&inboundFltNo=EZY8673&outId=Eef4ed3dff724f459b65ba849b4f9f88f&inId=Efd8060aa222077570ee4366f17db9270&accId=W0022774&packId=2298940072%2F2%2F3050%2F7&offerRooms=2%2FDBL.QN%21NRF.OPAQUE%20RO%20NRF&rm1=2-0-0&rm2=1-0-0&selectedRef=REF123&selectedBoardType=BB&selectedPackId=12345%2F12345`,
            );
        });

        it('should build a base FPH URL with no query params when query is empty', () => {
            const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Flights);

            expect(url).toBe(`${FPH_BASE_URL}/en/flight-plus-hotel/flights?`);
        });

        describe('with includeHotelCode parameter', () => {
            it('should NOT include hotel code when includeHotelCode is false', () => {
                rootStore.bookingStore.selectedOffer = {
                    accom: { code: 'HTL123' },
                } as IOffer;

                const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Hotels, false);

                expect(url).not.toContain('/HTL123');
                expect(url).toBe(`${FPH_BASE_URL}/en/flight-plus-hotel/hotels?`);
            });

            it('should NOT include hotel code when includeHotelCode is not provided (default)', () => {
                rootStore.bookingStore.selectedOffer = {
                    accom: { code: 'HTL123' },
                } as IOffer;

                const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Hotels);

                expect(url).not.toContain('/HTL123');
                expect(url).toBe(`${FPH_BASE_URL}/en/flight-plus-hotel/hotels?`);
            });

            it('should include hotel code when includeHotelCode is true and offer exists', () => {
                rootStore.bookingStore.selectedOffer = {
                    accom: { code: 'HTL123' },
                } as IOffer;

                const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Hotels, true);

                expect(url).toContain('/HTL123?');
                expect(url).toBe(`${FPH_BASE_URL}/en/flight-plus-hotel/hotels/HTL123?`);
            });

            it('should include hotel code in URL with query params', () => {
                rootStore.bookingStore.selectedOffer = {
                    accom: { code: 'HTL456' },
                } as IOffer;
                store.query[QueryParamName.Origin] = 'LGW';
                store.query[FlightPlusHotelQueryParamName.Pax] = '2';

                const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Hotels, true);

                expect(url).toContain('/HTL456?');
                expect(url).toContain('org=LGW');
                expect(url).toContain('apax=2');
            });

            it('should NOT include hotel code when includeHotelCode is true but selectedOffer is null', () => {
                rootStore.bookingStore.selectedOffer = null;

                const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Hotels, true);

                expect(url).not.toContain('/null');
                expect(url).not.toContain('/undefined');
                expect(url).toBe(`${FPH_BASE_URL}/en/flight-plus-hotel/hotels?`);
            });

            it('should NOT include hotel code when includeHotelCode is true but selectedOffer is undefined', () => {
                rootStore.bookingStore.selectedOffer = undefined;

                const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Hotels, true);

                expect(url).not.toContain('/null');
                expect(url).not.toContain('/undefined');
                expect(url).toBe(`${FPH_BASE_URL}/en/flight-plus-hotel/hotels?`);
            });

            it('should NOT include hotel code when includeHotelCode is true but accom.code is undefined', () => {
                rootStore.bookingStore.selectedOffer = {
                    accom: { code: undefined },
                } as any;

                const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Hotels, true);

                expect(url).toBe(`${FPH_BASE_URL}/en/flight-plus-hotel/hotels?`);
            });

            it('should NOT include hotel code when includeHotelCode is true but accom is undefined', () => {
                rootStore.bookingStore.selectedOffer = {
                    accom: undefined,
                } as any;

                const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Hotels, true);

                expect(url).toBe(`${FPH_BASE_URL}/en/flight-plus-hotel/hotels?`);
            });

            it('should NOT include hotel code when includeHotelCode is true but path is Flights', () => {
                rootStore.bookingStore.selectedOffer = {
                    accom: { code: 'HTL123' },
                } as IOffer;

                const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Flights, true);

                expect(url).not.toContain('/HTL123');
                expect(url).toBe(`${FPH_BASE_URL}/en/flight-plus-hotel/flights?`);
            });

            it('should NOT include hotel code when path is Flights even with query params', () => {
                rootStore.bookingStore.selectedOffer = {
                    accom: { code: 'HTL789' },
                } as IOffer;
                store.query[QueryParamName.Origin] = 'LGW';

                const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Flights, true);

                expect(url).not.toContain('/HTL789');
                expect(url).toContain('org=LGW');
                expect(url).toContain('/flight-plus-hotel/flights?');
            });
        });

        it('should build URL with only basic params when basicUrl is true', () => {
            store.query[QueryParamName.Origin] = 'LGW';
            store.query[QueryParamName.ExperienceContextProvider] = 'FPH';
            store.query[FlightPlusHotelQueryParamName.DestinationAirport] = 'CDG';
            store.query[FlightPlusHotelQueryParamName.SearchPodDepartureDate] = '18-08-2026';
            store.query[FlightPlusHotelQueryParamName.SearchPodReturnDate] = '22-08-2026';
            store.query[FlightPlusHotelQueryParamName.Pax] = '2';
            store.query[QueryParamName.From] = '18-08-2026';
            store.query[QueryParamName.To] = '22-08-2026';
            store.query[QueryParamName.OutboundFlightNumber] = 'EZY8672';
            store.query[QueryParamName.InboundFlightNumber] = 'EZY8673';
            store.query[QueryParamName.PackageId] = '2298940072/2/3050/7';
            store.query[QueryParamName.OfferRooms] = '2/DBL.QN!NRF.OPAQUE RO NRF';
            store.query[FlightPlusHotelQueryParamName.RoomAllocation1] = '2-0-0';
            store.query[FlightPlusHotelQueryParamName.RoomAllocation2] = '1-0-0';
            store.query[FlightPlusHotelQueryParamName.SelectedRef] = 'REF123';
            store.query[FlightPlusHotelQueryParamName.SelectedBoardType] = 'BB';
            store.query[FlightPlusHotelQueryParamName.SelectedPackId] = '12345/12345';

            const url = store.buildFlightPlusHotelUrl(FlightPlusHotelSitePath.Flights, false, true);

            expect(url).toBe(
                `${FPH_BASE_URL}/en/flight-plus-hotel/flights?org=LGW&ecp=FPH&dstAirportCode=CDG&searchPodDepartureDate=18-08-2026&searchPodReturnDate=22-08-2026&apax=2`,
            );
            expect(url).not.toContain('from=');
            expect(url).not.toContain('to=');
            expect(url).not.toContain('outboundFltNo=');
            expect(url).not.toContain('inboundFltNo=');
            expect(url).not.toContain('packId=');
            expect(url).not.toContain('offerRooms=');
            expect(url).not.toContain('rm1=');
            expect(url).not.toContain('rm2=');
            expect(url).not.toContain('selectedRef=');
            expect(url).not.toContain('selectedBoardType=');
        });
    });

    describe('updateMapStateInQuery', () => {
        let store;

        beforeEach(() => {
            rootStore.routerStore.updateSearchResultsPage = jest.fn();
            store = new BaseQueryParamsStore(rootStore);
            store.stringifyQuery = jest.fn(() => 'test');
        });

        it('should call updateSearchResultsPage and stringifyQuery with mapPopupState when isMapPopupShown is true', () => {
            const accomId = '123';
            const zoomLevel = 10;
            store.updateMapStateInQuery(accomId, zoomLevel);

            expect(store.stringifyQuery).toHaveBeenCalledWith({
                [QueryParamName.IsMap]: `${accomId}@${zoomLevel}`,
            });
            expect(store.mapZoomLevel).toBe(zoomLevel);
            expect(rootStore.routerStore.updateSearchResultsPage).toHaveBeenCalledWith('test');
        });
    });

    describe('removeQueryParam', () => {
        let store;

        beforeEach(() => {
            rootStore.routerStore.updateCurrentPage = jest.fn();
            store = new BaseQueryParamsStore(rootStore);
            store.stringifyQuery = jest.fn(() => 'test');
        });

        it('should call updateCurrentPage and stringifyQuery with correct params', () => {
            store.query = { [QueryParamName.IsMap]: '1', [QueryParamName.Origin]: 'LGW' };

            store.removeQueryParam(QueryParamName.IsMap);

            expect(store.stringifyQuery).toHaveBeenCalledWith({
                [QueryParamName.Origin]: 'LGW',
            });
            expect(rootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith('test');
        });
    });
});
