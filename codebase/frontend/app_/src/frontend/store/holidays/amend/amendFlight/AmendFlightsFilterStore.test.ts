import { mockFlightsOffers, mockValidatedFlights } from 'frontend/__mocks__';
import {
    mockAltFlightsFilters,
    mockFilterDepartureAirport,
    mockFilterOutboundDepartureTime,
    mockFlightSelectedFilter,
} from 'frontend/__mocks__/filters';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { AmendFlightsFilterStore } from './AmendFlightsFilterStore';

let mockStores;

const createRootStore = () => ({
    appStore: {
        setAmendBookingItemPayload: jest.fn(),
        amendBookingItemPayload: {
            selectedFlight: mockValidatedFlights.transports[0],
            date: 'date',
            bookingReference: 'bookingReference',
            lastName: 'lastName',
        },
    },
    viewBookingStore: {
        updateBookingInfo: jest.fn(),
    },
    routerStore: {
        redirectTo: jest.fn(),
        redirectToLoginPage: jest.fn(),
        redirectToViewBookingsPage: jest.fn(),
        redirectToViewBookingPage: jest.fn(),
    },
    userStore: {
        isLoggedIn: true,
        checkIfUserLoggedIn: jest.fn(() => true),
    },
    layoutStore: {
        getSetting: s => s,
        getPhrase: s => s,
    },
});

let rootStore;
let amendFlightsFilterStore: AmendFlightsFilterStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('AmendFlightsFilterStore', () => {
    beforeEach(() => {
        rootStore = createRootStore();
        amendFlightsFilterStore = new AmendFlightsFilterStore(rootStore);
    });

    describe('onFilterItem', () => {
        it('Should return results for AltFlightsDepartureAirports code', () => {
            const falsyResult = amendFlightsFilterStore.onFilterItem(
                mockFlightsOffers[0],
                FilterGroupCodes.AltFlightsDepartureAirports,
                ['TEST'],
            );
            const truthyResult = amendFlightsFilterStore.onFilterItem(
                mockFlightsOffers[0],
                FilterGroupCodes.AltFlightsDepartureAirports,
                [mockFlightsOffers[0].transport.routes[0].depPt],
            );

            expect(falsyResult).toBe(false);
            expect(truthyResult).toBe(true);
        });

        it('Should return results for AltFlightsOutboundDepartureTime code', () => {
            const falsyResult = amendFlightsFilterStore.onFilterItem(
                mockFlightsOffers[0],
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                [
                    {
                        start: '1300',
                        end: '1400',
                    },
                ],
            );

            const truthyResult = amendFlightsFilterStore.onFilterItem(
                mockFlightsOffers[0],
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                [
                    {
                        start: '1100',
                        end: '1400',
                    },
                ],
            );

            expect(falsyResult).toBe(false);
            expect(truthyResult).toBe(true);
        });

        it('Should return results for AltFlightsInboundDepartureTime code', () => {
            const falsyResult = amendFlightsFilterStore.onFilterItem(
                mockFlightsOffers[0],
                FilterGroupCodes.AltFlightsInboundDepartureTime,
                [
                    {
                        start: '1100',
                        end: '1300',
                    },
                ],
            );

            const truthyResult = amendFlightsFilterStore.onFilterItem(
                mockFlightsOffers[0],
                FilterGroupCodes.AltFlightsInboundDepartureTime,
                [
                    {
                        start: '1300',
                        end: '1700',
                    },
                ],
            );

            expect(falsyResult).toBe(false);
            expect(truthyResult).toBe(true);
        });
    });

    it('onClearAllSelectedFilters', async () => {
        amendFlightsFilterStore.onClearAllSelectedFilters();

        expect(amendFlightsFilterStore.selectedFilters.length).toBe(0);
    });

    it('onCloseFilters', () => {
        amendFlightsFilterStore.onCloseFilters();
        expect(amendFlightsFilterStore.activeFilterCode).toBe(FilterGroupCodes.NoFilter);
    });

    describe('onRemoveSelectedFilter', () => {
        it('should remove filter', () => {
            amendFlightsFilterStore.selectedFilters = [mockFlightSelectedFilter];
            amendFlightsFilterStore.onRemoveSelectedFilter(
                mockFlightSelectedFilter.groupCode,
                mockFlightSelectedFilter.code,
            );

            expect(amendFlightsFilterStore.selectedFilters.length).toBe(0);
        });

        it('should NOT remove filter', () => {
            amendFlightsFilterStore.selectedFilters = [mockFlightSelectedFilter];
            amendFlightsFilterStore.onRemoveSelectedFilter('groupCode', mockFlightSelectedFilter.code);

            expect(amendFlightsFilterStore.selectedFilters.length).toBe(1);
        });
    });

    it('onSelectFilterGroup', async () => {
        amendFlightsFilterStore.onSelectFilterGroup(FilterGroupCodes.Date);

        expect(amendFlightsFilterStore.activeFilterCode).toBe(FilterGroupCodes.Date);
    });

    it('onSelectFilter', async () => {
        amendFlightsFilterStore.addSelectedFilter = jest.fn();

        amendFlightsFilterStore.onSelectFilter({ groupCode: -1 } as any);
        expect(amendFlightsFilterStore.addSelectedFilter).toHaveBeenCalledWith({ groupCode: -1 });

        amendFlightsFilterStore.selectedFilters = [{ groupCode: 1, code: 'code' } as any];
        amendFlightsFilterStore.onSelectFilter({ groupCode: 1, code: 'code' } as any);
        expect(amendFlightsFilterStore.selectedFilters.length).toBe(0);
    });

    it('addSelectedFilter', async () => {
        amendFlightsFilterStore.addSelectedFilter({
            code: 'code',
            name: 'name',
            groupCode: 'groupCode',
            timeSlot: 'timeSlot',
        } as any);

        expect(amendFlightsFilterStore.selectedFilters.length).toBe(1);
        expect(amendFlightsFilterStore.selectedFilters[0].code).toBe('code');
    });

    describe('isFilterSelected', () => {
        it('should return true', () => {
            amendFlightsFilterStore.selectedFilters = [{ code: 'code', groupCode: 'groupCode' }] as any;

            expect(amendFlightsFilterStore.isFilterSelected({ code: 'code', groupCode: 'groupCode' } as any)).toBe(
                true,
            );
        });

        it('should return false', () => {
            amendFlightsFilterStore.selectedFilters = [{ code: 'code', groupCode: 'groupCode_1' }] as any;

            expect(amendFlightsFilterStore.isFilterSelected({ code: 'code', groupCode: 'groupCode' } as any)).toBe(
                false,
            );
        });
    });

    it('setFiltersOrder', async () => {
        amendFlightsFilterStore.filters = [{ code: 'code' }] as any;
        amendFlightsFilterStore.setFiltersOrder([{ fields: { Code: { value: 'code' } } }] as any);

        expect(amendFlightsFilterStore.filters[0].code).toBe('code');
    });

    it('setTimeFilter', async () => {
        amendFlightsFilterStore.setTimeFiltersCounts = jest.fn((...args) => args) as any;
        amendFlightsFilterStore.setTimeFilter(
            FilterGroupCodes.AltFlightsDepartureAirports,
            [
                {
                    id: 'id',
                    fields: {
                        Code: { value: 'Code' },
                        Name: { value: 'Name' },
                        StartTime: { value: new Date(2023, 1, 1).toISOString() },
                        EndTime: { value: new Date(2023, 1, 1).toISOString() },
                    },
                },
            ],
            SitecoreDictionary.GlobalsButtonsExpand,
            mockFlightsOffers,
        );

        expect(amendFlightsFilterStore.setTimeFiltersCounts).toHaveBeenCalled();
    });

    describe('isFilterGroupDisabled', () => {
        it('should return false', () => {
            expect(amendFlightsFilterStore.isFilterGroupDisabled({ options: ['option'] } as any)).toBe(false);
        });

        it('should return true', () => {
            expect(amendFlightsFilterStore.isFilterGroupDisabled({ options: [] } as any)).toBe(true);
        });
    });

    it('setTimesFilters', async () => {
        amendFlightsFilterStore.setTimeFilter = jest.fn();
        amendFlightsFilterStore.setTimesFilters([''] as any, mockFlightsOffers);
        expect(amendFlightsFilterStore.setTimeFilter).toHaveBeenCalledTimes(2);
    });

    describe('setDepartureFilters', () => {
        it('Should invoke "addFilterOptionsToGroup" regular value', async () => {
            amendFlightsFilterStore.setTimeFilter = jest.fn();
            amendFlightsFilterStore.getFiltersGroup = jest.fn();
            amendFlightsFilterStore.addFilterOptionsToGroup = jest.fn();

            amendFlightsFilterStore.setDepartureFilters(mockFlightsOffers);

            expect(amendFlightsFilterStore.addFilterOptionsToGroup).toHaveBeenCalledWith(
                FilterGroupCodes.AltFlightsDepartureAirports,
                [
                    {
                        code: 'BFS',
                        name: 'Belfast International',
                        groupCode: 'altFlightsDepartureAirport',
                        count: 1,
                    },
                    {
                        code: 'BRS',
                        name: 'Bristol',
                        groupCode: 'altFlightsDepartureAirport',
                        count: 1,
                    },
                ],
            );
        });

        it('should "addFilterOptionsToGroup" NOT have been invoked', () => {
            amendFlightsFilterStore.setTimeFilter = jest.fn();
            amendFlightsFilterStore.getFiltersGroup = jest.fn();
            amendFlightsFilterStore.addFilterOptionsToGroup = jest.fn();

            amendFlightsFilterStore.setDepartureFilters([]);

            expect(amendFlightsFilterStore.addFilterOptionsToGroup).not.toHaveBeenCalled();
        });
    });

    describe('setTimeFiltersCounts', () => {
        it('setTimeFiltersCounts -> RouteDirection.outbound ', () => {
            amendFlightsFilterStore.filters = mockAltFlightsFilters;
            amendFlightsFilterStore.setTimeFiltersCounts(
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                mockFlightsOffers,
            );

            expect(amendFlightsFilterStore.filters[0].options[0].count).toBe(5);
        });

        it('setTimeFiltersCounts -> RouteDirection.inbound ', () => {
            amendFlightsFilterStore.filters = mockAltFlightsFilters;
            amendFlightsFilterStore.setTimeFiltersCounts(
                FilterGroupCodes.AltFlightsInboundDepartureTime,
                mockFlightsOffers,
            );

            expect(amendFlightsFilterStore.filters[2].options[0].count).toBe(0);
            expect(amendFlightsFilterStore.filters[2].options[1].count).toBe(0);
            expect(amendFlightsFilterStore.filters[2].options[2].count).toBe(1);
            expect(amendFlightsFilterStore.filters[2].options[3].count).toBe(1);
            expect(amendFlightsFilterStore.filters[2].options[4].count).toBe(0);
        });
    });

    describe('addFilterOptionsToGroup', () => {
        it('should add filter to group', () => {
            amendFlightsFilterStore.addFilterOptionsToGroup(FilterGroupCodes.AltFlightsDepartureAirports, [
                mockFilterDepartureAirport.options[0],
            ]);
            expect(amendFlightsFilterStore.filters[0].code).toBe(FilterGroupCodes.AltFlightsDepartureAirports);
        });

        it('should replace filter in group', () => {
            amendFlightsFilterStore.filters = [mockFilterDepartureAirport, mockFilterOutboundDepartureTime];
            amendFlightsFilterStore.addFilterOptionsToGroup(FilterGroupCodes.AltFlightsDepartureAirports, [
                {
                    ...mockFilterDepartureAirport.options[0],
                    code: 'ALABAMA',
                },
            ]);
            expect(amendFlightsFilterStore.filters[0].options[0].code).toBe('ALABAMA');
        });

        it('does not double filter options if new option has the same value', () => {
            const mockOneDepartureAirport = {
                ...mockFilterDepartureAirport,
                options: mockFilterDepartureAirport.options.slice(0, 1),
            };

            amendFlightsFilterStore.filters = [mockOneDepartureAirport];
            amendFlightsFilterStore.addFilterOptionsToGroup(
                FilterGroupCodes.AltFlightsDepartureAirports,
                mockOneDepartureAirport.options,
            );

            expect(amendFlightsFilterStore.filters[0].options.length).toBe(1);
        });

        it('does not double filter options if some of the elements are the same', () => {
            const mockOneDepartureAirport = {
                ...mockFilterDepartureAirport,
                options: mockFilterDepartureAirport.options.slice(0, 1),
            };

            const mockThreeDepartureAirport = {
                ...mockFilterDepartureAirport,
                options: mockFilterDepartureAirport.options.slice(0, 3),
            };

            amendFlightsFilterStore.filters = [mockOneDepartureAirport];
            amendFlightsFilterStore.addFilterOptionsToGroup(
                FilterGroupCodes.AltFlightsDepartureAirports,
                mockThreeDepartureAirport.options,
            );

            expect(amendFlightsFilterStore.filters[0].options.length).toBe(3);
        });
    });

    describe('getSelectedFiltersByGroupCode', () => {
        it('should return filter', () => {
            amendFlightsFilterStore.selectedFilters = [mockFlightSelectedFilter];
            expect(
                amendFlightsFilterStore.getSelectedFiltersByGroupCode(mockFlightSelectedFilter.groupCode).length,
            ).toBe(1);
        });

        it('should return filter', () => {
            amendFlightsFilterStore.selectedFilters = [mockFlightSelectedFilter];
            expect(amendFlightsFilterStore.getSelectedFiltersByGroupCode(FilterGroupCodes.Flights).length).toBe(0);
        });
    });

    it('getFiltersGroup', () => {
        amendFlightsFilterStore.filters = [mockFilterDepartureAirport];
        expect(amendFlightsFilterStore.getFiltersGroup(mockFilterDepartureAirport.code)?.code).toBe(
            mockFilterDepartureAirport.code,
        );
    });

    describe('getFilteredOffers', () => {
        const amendFlightsFilterStore = new AmendFlightsFilterStore(rootStore);
        amendFlightsFilterStore.filters = [
            mockFilterDepartureAirport,
            mockFilterOutboundDepartureTime,
            mockFilterOutboundDepartureTime,
        ];

        it('should return offers filtered by "altFlightsDepartureAirports"', () => {
            amendFlightsFilterStore.collectFiltersByGroupCode = jest.fn(() => ({
                altFlightsDepartureAirport: ['LTN', 'BRS'],
            }));

            const result = amendFlightsFilterStore.getFilteredOffers(mockFlightsOffers);
            expect(result.length).toBe(1);
        });

        it('should return offers filtered by "altFlightsInboundDepartureTime"', () => {
            amendFlightsFilterStore.collectFiltersByGroupCode = jest.fn(() => ({
                altFlightsInboundDepartureTime: [{ start: '1200', end: '1759' }],
            }));

            const result = amendFlightsFilterStore.getFilteredOffers(mockFlightsOffers);
            expect(result.length).toBe(1);
        });

        it('should return offers filtered by "altFlightsOutboundDepartureTime"', () => {
            amendFlightsFilterStore.collectFiltersByGroupCode = jest.fn(() => ({
                altFlightsOutboundDepartureTime: [{ start: '1400', end: '2159' }],
            }));

            const result = amendFlightsFilterStore.getFilteredOffers(mockFlightsOffers);
            expect(result.length).toBe(1);
        });

        it('should return all offers', () => {
            amendFlightsFilterStore.collectFiltersByGroupCode = jest.fn(() => ({
                testGroupCode: [{ start: '1400', end: '2159' }],
            }));

            const result = amendFlightsFilterStore.getFilteredOffers(mockFlightsOffers);
            expect(result.length).toBe(2);
        });
    });

    it('collectFiltersByGroupCode', () => {
        amendFlightsFilterStore.selectedFilters = [
            { ...mockFlightSelectedFilter, groupCode: FilterGroupCodes.AltFlightsDepartureAirports },
            { ...mockFlightSelectedFilter, groupCode: FilterGroupCodes.AltFlightsOutboundDepartureTime },
            { ...mockFlightSelectedFilter, groupCode: FilterGroupCodes.AltFlightsOutboundDepartureTime },
        ];
        const result = amendFlightsFilterStore.collectFiltersByGroupCode();
        expect(result[FilterGroupCodes.AltFlightsDepartureAirports].length).toBe(1);
        expect(result[FilterGroupCodes.AltFlightsOutboundDepartureTime].length).toBe(2);
    });

    describe('setInitiateFilters', () => {
        it('should set with departure filter', () => {
            amendFlightsFilterStore.setDepartureFilters = jest.fn();
            amendFlightsFilterStore.setTimesFilters = jest.fn();
            amendFlightsFilterStore.setFiltersOrder = jest.fn();
            amendFlightsFilterStore.setInitiateFilters(mockFlightsOffers, { setDepartureFilter: true });

            expect(amendFlightsFilterStore.setDepartureFilters).toHaveBeenCalled();
            expect(amendFlightsFilterStore.setTimesFilters).toHaveBeenCalled();
            expect(amendFlightsFilterStore.setFiltersOrder).toHaveBeenCalled();
        });

        it('should set with NO departure filter', () => {
            amendFlightsFilterStore.setDepartureFilters = jest.fn();
            amendFlightsFilterStore.setTimesFilters = jest.fn();
            amendFlightsFilterStore.setFiltersOrder = jest.fn();
            amendFlightsFilterStore.setInitiateFilters(mockFlightsOffers);

            expect(amendFlightsFilterStore.setDepartureFilters).not.toHaveBeenCalled();
            expect(amendFlightsFilterStore.setTimesFilters).toHaveBeenCalled();
            expect(amendFlightsFilterStore.setFiltersOrder).toHaveBeenCalled();
        });
    });

    describe('onFilterItem', () => {
        const mockRoute = {} as IRoute;
        const mockFilterFlightOffer = { ...mockFlightsOffers[0], transport: { routes: [mockRoute] } } as IOffer;
        const mockDepCode = 'LWG';
        const mockRightTimeSlot = [
            {
                start: '10:00',
                end: '14:00',
            },
        ];
        const mockWrongTimeSlot = [
            {
                start: '10:00',
                end: '12:00',
            },
        ];

        beforeEach(() => {
            Object.assign(mockRoute, {
                ...mockFlightsOffers[0].transport.routes[0],
                depDate: '2023-08-26T12:45:00+00:00',
                depPt: mockDepCode,
            });
        });

        it('returns true when filtered by AltFlightsDepartureAirports and outbound flight', () => {
            mockRoute.direction = RouteDirection.Outbound;

            const result = amendFlightsFilterStore.onFilterItem(
                mockFilterFlightOffer,
                FilterGroupCodes.AltFlightsDepartureAirports,
                [mockDepCode],
            );
            expect(result).toBe(true);
        });

        it('returns false when filtered by AltFlightsDepartureAirports and inbound flight', () => {
            mockRoute.direction = RouteDirection.Inbound;

            const result = amendFlightsFilterStore.onFilterItem(
                mockFilterFlightOffer,
                FilterGroupCodes.AltFlightsDepartureAirports,
                [mockDepCode],
            );
            expect(result).toBe(false);
        });

        it('returns true when filtered by AltFlightsOutboundDepartureTime and right timeslot', () => {
            mockRoute.direction = RouteDirection.Outbound;

            const result = amendFlightsFilterStore.onFilterItem(
                mockFilterFlightOffer,
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                mockRightTimeSlot,
            );
            expect(result).toBe(true);
        });

        it('returns false when filtered by AltFlightsOutboundDepartureTime and wrong timeslot', () => {
            mockRoute.direction = RouteDirection.Outbound;

            const result = amendFlightsFilterStore.onFilterItem(
                mockFilterFlightOffer,
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                mockWrongTimeSlot,
            );
            expect(result).toBe(false);
        });

        it('returns true when filtered by AltFlightsInboundDepartureTime and right timeslot', () => {
            mockRoute.direction = RouteDirection.Inbound;

            const result = amendFlightsFilterStore.onFilterItem(
                mockFilterFlightOffer,
                FilterGroupCodes.AltFlightsInboundDepartureTime,
                mockRightTimeSlot,
            );
            expect(result).toBe(true);
        });

        it('returns false when filtered by AltFlightsInboundDepartureTime and wrong timeslot', () => {
            mockRoute.direction = RouteDirection.Inbound;

            const result = amendFlightsFilterStore.onFilterItem(
                mockFilterFlightOffer,
                FilterGroupCodes.AltFlightsInboundDepartureTime,
                mockWrongTimeSlot,
            );
            expect(result).toBe(false);
        });

        it('should return true for unknown filter type', () => {
            const result = amendFlightsFilterStore.onFilterItem(
                mockFilterFlightOffer,
                'unknownType' as FilterGroupCodes,
                [mockDepCode],
            );
            expect(result).toBe(true);
        });
    });
});
