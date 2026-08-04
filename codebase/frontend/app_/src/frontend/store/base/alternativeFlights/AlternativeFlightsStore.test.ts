import { mockFlightsOffers } from 'frontend/__mocks__';
import { altOffers } from 'frontend/__mocks__/altOffer';
import { mockAltFlightsFilters } from 'frontend/__mocks__/filters';
import { buildTimeFilterOptions, getTimeFiltersCounts } from 'frontend/utils/filter.utils';
import * as sortUtils from 'frontend/utils/sort.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IFilterOption, ISelectedFilter } from 'models/data/IFilters';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IAirportCountry } from 'models/sitecore/IAirportsData';

import { AlternativeFlightsStore } from './AlternativeFlightsStore';

jest.mock('frontend/utils/date.utils', () => ({
    isTimeInTimeSlots: jest.fn().mockReturnValue(true),
    formatDateL10n: jest.fn(d => d),
}));

jest.mock('frontend/utils/airports.utils', () => ({
    getAirportByCode: jest.fn(code => ({ name: `${code} name` })),
}));

const mockGetTimeFiltersCounts = [{}, {}, {}];
jest.mock('frontend/utils/filter.utils', () => ({
    getTimeFiltersCounts: jest.fn(() => mockGetTimeFiltersCounts),
    buildTimeFilterOptions: jest.fn(() => filterOptions),
}));

const timeFilterOptionSettings = [{ id: 'time setting 1' }, { id: 'time setting 2' }] as any;
const filterOptions = { code: 'custom filter code' };
const createAltFlights = () => altOffers;

const createRootStore = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    searchStore: {
        searchFrom: {
            origins: [],
        },
    },
    bookingStore: { getOriginsWithOtherRoutes: jest.fn(() => 'LGW,LTN') },
});

describe('<AlternativeFlightsStore />', () => {
    let rootStore;
    let altFlights: IAlternativeOffer[];

    beforeEach(() => {
        rootStore = createRootStore();
        altFlights = createAltFlights();
    });

    describe('Airports Filters', () => {
        describe('setAirportsFilter', () => {
            const airportsMock: IAirportCountry[] = [] as IAirportCountry[];

            it('should NOT set airports filters if no origins in search', () => {
                const store = new AlternativeFlightsStore(rootStore);
                store.setAirportsFilter(airportsMock);

                expect(store.filters.length).toBe(0);
            });

            it('should NOT set airports filters if there is only one origin in search', () => {
                rootStore.searchStore.searchFrom.origins = ['LGW'];
                const store = new AlternativeFlightsStore(rootStore);
                store.setAirportsFilter(airportsMock);

                expect(store.filters.length).toBe(0);
            });

            it('should set and sort by name airports filters by origins', () => {
                rootStore.searchStore.searchFrom.origins = ['LGW', 'BFS', 'LTN'];
                const store = new AlternativeFlightsStore(rootStore);
                const groupCode = FilterGroupCodes.AltFlightsDepartureAirports;
                store.setAirportsFilter(airportsMock);

                expect(store.filters).toEqual([
                    {
                        code: groupCode,
                        options: [
                            { code: 'BFS', name: 'BFS name', groupCode, count: 0 },
                            { code: 'LGW', name: 'LGW name', groupCode, count: 0 },
                            { code: 'LTN', name: 'LTN name', groupCode, count: 0 },
                        ],
                        name: groupCode,
                    },
                ]);
            });
        });

        describe('setAirportsFilterCounts', () => {
            it('should set airports counts by flights', () => {
                const store = new AlternativeFlightsStore(rootStore);
                const groupCode = FilterGroupCodes.AltFlightsDepartureAirports;
                store.filters = [
                    {
                        code: groupCode,
                        options: [
                            { code: 'BFS', name: 'BFS name', groupCode, count: 0 },
                            { code: 'LGW', name: 'LGW name', groupCode, count: 0 },
                            { code: 'LTN', name: 'LTN name', groupCode, count: 0 },
                        ],
                        name: groupCode,
                    },
                ];
                store.setAirportsFilterCounts(altFlights);

                expect(store.filters).toEqual([
                    {
                        code: groupCode,
                        options: [
                            { code: 'BFS', name: 'BFS name', groupCode, count: 0 },
                            { code: 'LGW', name: 'LGW name', groupCode, count: 2 },
                            { code: 'LTN', name: 'LTN name', groupCode, count: 1 },
                        ],
                        name: groupCode,
                    },
                ]);
            });
        });

        describe('departureAirportsQuery', () => {
            it('Should return origins form search store if no selected airports', () => {
                const store = new AlternativeFlightsStore(rootStore);
                rootStore.searchStore.searchFrom.origins = ['LGW', 'LTN'];

                expect(store.departureAirportsQuery).toEqual('LGW,LTN');
            });

            it('Should return selected airports', () => {
                const store = new AlternativeFlightsStore(rootStore);
                rootStore.searchStore.searchFrom.origins = ['LGW', 'LTN'];
                const groupCode = FilterGroupCodes.AltFlightsDepartureAirports;
                store.selectedFilters = [
                    { code: 'MAN', groupCode },
                    { code: 'LTN', groupCode },
                    { code: 'BFS', groupCode },
                ] as ISelectedFilter[];

                expect(store.departureAirportsQuery).toEqual('MAN,LTN,BFS');
            });
        });
    });

    describe('Filter Flights', () => {
        it('should return all flights if no selected filters', () => {
            const store = new AlternativeFlightsStore(rootStore);
            const filteredFlights = store.filterFlights(altFlights);

            expect(filteredFlights).toEqual(altFlights);
        });

        it('should filter flights by all selected filters', () => {
            const store = new AlternativeFlightsStore(rootStore);
            store.addSelectedFilter({
                code: 'LTN',
                name: 'Luton Airport',
                groupCode: FilterGroupCodes.AltFlightsDepartureAirports,
            } as IFilterOption);

            store.addSelectedFilter({
                code: 'earlyMorning',
                groupCode: FilterGroupCodes.AltFlightsOutboundDepartureTime,
                timeSlot: { start: '0000', end: '0559' },
            } as IFilterOption);

            store.addSelectedFilter({
                code: 'evening',
                groupCode: FilterGroupCodes.AltFlightsInboundDepartureTime,
                timeSlot: { start: '2100', end: '2359' },
            } as IFilterOption);

            const filteredFlights = store.filterFlights(altFlights);

            expect(filteredFlights).toHaveLength(1);
            expect(filteredFlights[0].transport.routes[0].depPt).toEqual('LTN');
        });

        it('should return empty list if filter do no meet selected filters', () => {
            const store = new AlternativeFlightsStore(rootStore);
            store.addSelectedFilter({
                code: 'EDI',
                groupCode: FilterGroupCodes.AltFlightsDepartureAirports,
            } as IFilterOption);

            const filteredFlights = store.filterFlights(altFlights);

            expect(filteredFlights).toEqual([]);
        });
    });

    describe('clearStore', () => {
        it('should clean store', () => {
            const store = new AlternativeFlightsStore(rootStore);

            store.filters = [{} as any];
            store.selectedFilters = [{} as any];
            store.activeFilterCode = FilterGroupCodes.BoardType;
            store.sortBy = AlternativeFlightsSortBy.OutboundEarliestDeparture;

            store.clearStore();

            expect(store.filters.length).toEqual(0);
            expect(store.selectedFilters.length).toEqual(0);
            expect(store.activeFilterCode).toEqual(FilterGroupCodes.NoFilter);
            expect(store.sortBy).toEqual(AlternativeFlightsSortBy.PriceLowToHigh);
        });
    });

    describe('initFilters', () => {
        it('if no filters initialize them', () => {
            const store = new AlternativeFlightsStore(rootStore);
            const orderSettings = [{ id: 'setting 1' }, { id: 'setting 2' }] as any;
            const airportCountry = [{ name: 'Spain' }, { name: 'Poland' }] as any;

            store.setAirportsFilter = jest.fn();
            store.setTimesFilters = jest.fn();
            store.setFiltersOrder = jest.fn();

            store.initFilters(orderSettings, timeFilterOptionSettings, airportCountry, null, null);

            expect(store.setAirportsFilter).toBeCalledWith(airportCountry);
            expect(store.setTimesFilters).toBeCalledWith(timeFilterOptionSettings);
            expect(store.setFiltersOrder).toBeCalledWith(orderSettings);
        });

        it('do nothing if filters has already initialized', () => {
            const store = new AlternativeFlightsStore(rootStore);

            store.filters = [{ code: 'filter' } as any];
            store.setAirportsFilter = jest.fn();
            store.setTimeFilter = jest.fn();
            store.setFiltersOrder = jest.fn();

            store.initFilters({} as any, {} as any, {} as any, null, null);

            expect(store.setAirportsFilter).not.toBeCalled();
            expect(store.setTimeFilter).not.toBeCalled();
            expect(store.setFiltersOrder).not.toBeCalled();
        });
    });

    describe('setFilterOptionsCounts', () => {
        it('set filter options counts', () => {
            const store = new AlternativeFlightsStore(rootStore);
            const offers = [{ id: '1' }, { id: '2' }] as any;

            store.setAirportsFilterCounts = jest.fn();
            store.setTimeFiltersCounts = jest.fn();

            store.setFilterOptionsCounts(offers);

            expect(store.setAirportsFilterCounts).toBeCalledWith(offers);
            expect(store.setTimeFiltersCounts).toBeCalledWith(FilterGroupCodes.AltFlightsOutboundDepartureTime, offers);
            expect(store.setTimeFiltersCounts).toBeCalledWith(FilterGroupCodes.AltFlightsInboundDepartureTime, offers);
        });
    });

    describe('setTimesFilters', () => {
        it('if optionsSettings length 0 do nothing', () => {
            const store = new AlternativeFlightsStore(rootStore);

            store.setTimeFilter = jest.fn();

            store.setTimesFilters([]);

            expect(store.setTimeFilter).not.toBeCalled();
        });

        it('if optionsSettings length > 0 set times filters', () => {
            const store = new AlternativeFlightsStore(rootStore);

            store.setTimeFilter = jest.fn();

            store.setTimesFilters(timeFilterOptionSettings);

            expect(store.setTimeFilter).toBeCalledWith(
                FilterGroupCodes.AltFlightsOutboundDepartureTime,
                timeFilterOptionSettings,
                SitecoreDictionary.AlternativeFlightsFiltersLabelsOutboundDepartureTimePill,
            );
            expect(store.setTimeFilter).toBeCalledWith(
                FilterGroupCodes.AltFlightsInboundDepartureTime,
                timeFilterOptionSettings,
                SitecoreDictionary.AlternativeFlightsFiltersLabelsInboundDepartureTimePill,
            );
        });
    });

    describe('setTimeFilter', () => {
        it('add filter', () => {
            const store = new AlternativeFlightsStore(rootStore);

            store.setTimeFilter(
                FilterGroupCodes.Date,
                timeFilterOptionSettings,
                SitecoreDictionary.GlobalsButtonsCancel,
            );

            expect(store.rootStore.layoutStore.getPhrase).toBeCalledWith(SitecoreDictionary.GlobalsButtonsCancel);
            expect(buildTimeFilterOptions).toBeCalled();
            expect(store.filters[0]).toEqual({
                code: FilterGroupCodes.Date,
                options: filterOptions,
                name: FilterGroupCodes.Date,
            });
        });
    });

    describe('sortAndFilterFlights', () => {
        it('should call sortFlights with correct sorting', () => {
            const mockSortFlights = jest.spyOn(sortUtils, 'sortFlights');
            const store = new AlternativeFlightsStore(rootStore);
            store.sortBy = AlternativeFlightsSortBy.PriceHightToLow;
            store.sortAndFilterFlights([]);

            expect(mockSortFlights).toBeCalledWith([], store.sortBy);
        });
    });

    describe('setTimeFiltersCounts', () => {
        it('should set filters count', () => {
            const store = new AlternativeFlightsStore(rootStore);
            store.filters = mockAltFlightsFilters;

            store.setTimeFiltersCounts(FilterGroupCodes.AltFlightsOutboundDepartureTime, mockFlightsOffers);

            expect(getTimeFiltersCounts).toHaveBeenCalled();
        });

        it('should not set filter counts if filter group is not defined', () => {
            const store = new AlternativeFlightsStore(rootStore);
            store.filters = [];

            store.setTimeFiltersCounts(FilterGroupCodes.AltFlightsInboundDepartureTime, mockFlightsOffers);

            expect(getTimeFiltersCounts).not.toHaveBeenCalled();
        });
    });
});
