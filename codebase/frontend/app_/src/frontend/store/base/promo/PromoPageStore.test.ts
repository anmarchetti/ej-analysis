import { waitFor } from '@testing-library/react';
import * as mobx from 'mobx';

import { mockDefaultSeason, mockSearchParamsPayload, mockSeasonsData, mockSeasonWithDates } from 'frontend/__mocks__';
import * as arrayUtils from 'frontend/utils/array.utils';
import isBackend from 'frontend/utils/isBackend';
import * as promoPageUtils from 'frontend/utils/promoPage.utils';
import * as sitecoreUtils from 'frontend/utils/sitecore.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { OffersAndPromotionsSettings } from 'models/enum/OffersAndPromotionsSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { RoomAllocation } from 'models/RoomAllocation';

import PromoPageStore from './PromoPageStore';

jest.mock('models/RoomAllocation');
jest.mock('flatted', () => ({
    stringify: x => JSON.stringify(x),
}));

jest.mock('frontend/utils/isBackend', () => jest.fn());
const mockedIsBacked = isBackend as jest.MockedFn<typeof isBackend>;

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    isDateGreater: jest.fn((date1, date2) => date1 > date2),
}));

const localStorageMock = (function () {
    let store = {};

    return {
        getItem: key => store[key] || null,
        setItem: (key, value) => (store[key] = value),
        removeItem: key => {
            delete store[key];
        },
        clear: () => (store = {}),
    };
})();

const mockWhen = jest.spyOn(mobx, 'when');

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

const createRootStore = () =>
    ({
        searchStore: {
            serialize: jest.fn().mockReturnValue({
                searchWhen: {},
                searchWho: {},
            }),
            deserialize: jest.fn(),
            clearSearchValues: jest.fn(),
            onSelectFilters: jest.fn(),
            setSpecialFilters: jest.fn(),
            searchWhen: {
                changeDateAvailabilityInterval: jest.fn(),
            },
            searchFrom: {
                origins: [],
                setOrigins: jest.fn(),
            },
            searchTo: {
                collectLoadedDestinationsTitles: jest.fn(),
                changeDestinations: jest.fn(),
                loadAllDestinations: jest.fn(),
                addDestination: jest.fn(),
                selectedDestinationCodes: [],
            },
            searchWho: {
                setRoomsAllocation: jest.fn(),
                onChangeRooms: jest.fn(),
            },
        },
        searchFiltersStore: {
            serialize: jest.fn().mockReturnValue({}),
            deserialize: jest.fn(),
            onClearAllFilters: jest.fn(),
            onSelectFilters: jest.fn(),
            selectedFilters: [],
            filters: [],
        },
        hotelsStore: {
            fetchOffers: jest.fn(),
            updateOffersDataStatus: jest.fn(),
        },
        queryParamsStore: {
            durationFromUrl: 5,
            destinationFromUrl: '',
        },
        bookingStore: {
            selectedDestinationCodesQuery: true,
            grabSearchValuesFromSearchStore: jest.fn(),
            lastActualSearchParams: {},
            createRoomAllocation: jest.fn(() => []),
            origins: ['LTN'],
        },
        layoutStore: {
            isPreviewMode: false,
            layout: { sitecore: { route: { fields: {} } } },
            route: {
                fields: {
                    OverridePaxMix: mockSitecoreField(true),
                    NumberOfAdults: mockSitecoreField(3),
                    NumberOfChildren: mockSitecoreField(2),
                    NumberOfInfants: mockSitecoreField(1),
                    OverrideDestinations: mockSitecoreField(true),
                    Destinations: [
                        { fields: { PageCategory: mockSitecoreField('Country'), Code: mockSitecoreField('TR') } },
                        { fields: { PageCategory: mockSitecoreField('Region'), Code: mockSitecoreField('EGHR') } },
                        { fields: { PageCategory: mockSitecoreField('Resort'), Code: mockSitecoreField('ITLGBA') } },
                    ],
                    OverrideDefaultDuration: mockSitecoreField(true),
                    DefaultDuration: mockSitecoreField(7),
                    ChildrenAges: mockSitecoreField('2,3'),
                },
            },
        },
        routerStore: {
            clearPromoQuery: jest.fn(),
        },
    } as any);

jest.spyOn(promoPageUtils, 'convertSitecoreItemsToIDestinations').mockImplementation(jest.fn(() => []));
jest.spyOn(promoPageUtils, 'getHotelsIDestinations').mockImplementation(jest.fn(() => []));
jest.spyOn(promoPageUtils, 'getPromoPageDestinationByUrl').mockImplementation(jest.fn());
const getOnlyFieldValuesFromSitecoreItemsArray = jest
    .spyOn(sitecoreUtils, 'getOnlyFieldValuesFromSitecoreItemsArray')
    .mockImplementation(jest.fn(() => []));

const mockRemovePrefixes = jest.spyOn(arrayUtils, 'removePrefixes').mockImplementation(jest.fn(() => []));

describe('PromoPageStore', () => {
    let rootStore;

    beforeEach(() => {
        rootStore = createRootStore();
        mockedIsBacked.mockReturnValue(false);
    });

    describe('dynamic promo page', () => {
        let store;

        beforeEach(() => {
            rootStore = createRootStore();
            store = new PromoPageStore(rootStore);
        });

        describe('clearPromopageStore', () => {
            it('should clear promopage store on call', () => {
                store.duration = 5;
                store.from = new Date('2025-01-01');
                store.to = new Date('2025-01-10');
                store.departures = 'Destination1,Destination2';
                store.rooms = [
                    {
                        adults: 2,
                        children: 1,
                        infants: 0,
                        roomCode: 'A1',
                        childrenAges: [5],
                    },
                ];

                store.clearPromopageStore();

                expect(store.duration).toBe(undefined);
                expect(store.from).toBeNull();
                expect(store.to).toBeNull();
                expect(store.departures).toBe('');
                expect(store.rooms).toEqual([]);
            });
        });

        describe('clearQueryParamsData', () => {
            it('should clear data', () => {
                store.duration = 5;
                store.rooms = [{}, {}] as IQueryRoom[];
                store.departures = 'LDN';

                store.clearQueryParamsData();

                expect(store.duration).toBe(undefined);
                expect(store.rooms).toStrictEqual([]);
                expect(store.departures).toBe('');
            });
        });

        describe('editorDestinationsQuery', () => {
            it('should return null when editorDestinations undefined', () => {
                rootStore.layoutStore.isDynamicPromoPage = true;

                expect(store.editorDestinationsQuery).toEqual(null);
            });

            it('should return null when editorDestinations undefined', () => {
                rootStore.layoutStore.isDynamicPromoPage = true;
                store.editorDestinations = [];

                expect(store.editorDestinationsQuery).toEqual(null);
            });

            it('should return null when isDynamicPromoPage is false', () => {
                rootStore.layoutStore.isDynamicPromoPage = false;
                store.editorDestinations = mockSearchParamsPayload.destinations;

                expect(store.editorDestinationsQuery).toEqual(null);
            });

            it('should return editor destination query', () => {
                rootStore.layoutStore.isDynamicPromoPage = true;
                store.editorDestinations = mockSearchParamsPayload.destinations;

                expect(store.editorDestinationsQuery).toEqual(['country:TR', 'region:EGHR', 'resort:ITLGBA']);
            });
        });

        describe('editorGeographyQuery', () => {
            it('should return null when editorDestinations undefined', () => {
                expect(store.editorGeographyQuery).toEqual('');
            });

            it('should return editor geography query', () => {
                rootStore.layoutStore.isDynamicPromoPage = true;
                store.editorDestinations = mockSearchParamsPayload.destinations;

                expect(store.editorGeographyQuery).toEqual('TR|EG|IT,EGHR|ITLG,ITLGBA');
            });
        });

        describe('constructSearchPayload', () => {
            it('should return empty search payload when fields undefined', async () => {
                rootStore.layoutStore.route = undefined;

                expect(store.constructSearchPayload()).toEqual(
                    expect.objectContaining({
                        destinations: [],
                        duration: 0,
                        departures: [],
                        rooms: [],
                    }),
                );
            });

            it('should return search payload', async () => {
                expect(store.constructSearchPayload()).toEqual(
                    expect.objectContaining({
                        destinations: [
                            { code: 'TR', type: 'Country' },
                            { code: 'EGHR', type: 'Region' },
                            { code: 'ITLGBA', type: 'Resort' },
                        ],
                        duration: 7,
                        departures: [],
                        rooms: [
                            {
                                adults: 3,
                                children: 2,
                                childrenAges: [2, 3],
                                infants: 1,
                                roomCode: '',
                            },
                        ],
                    }),
                );
            });

            it('should return empty childrenAges when ChildrenAges is missing', async () => {
                rootStore.layoutStore.route = {
                    fields: {
                        OverridePaxMix: { value: true },
                        OverrideDestinations: { value: false },
                        OverrideDefaultDuration: { value: false },
                        NumberOfAdults: { value: 2 },
                        NumberOfChildren: { value: 1 },
                        NumberOfInfants: { value: 0 },
                        InitialSearchDays: { value: 30 },
                    },
                };

                expect(store.constructSearchPayload()).toEqual(
                    expect.objectContaining({
                        rooms: [
                            {
                                adults: 2,
                                children: 1,
                                infants: 0,
                                roomCode: '',
                                childrenAges: [],
                            },
                        ],
                    }),
                );
            });
        });

        describe('setOverrideWhoValue', () => {
            let roomInstanceMock;

            beforeEach(() => {
                roomInstanceMock = {
                    addAdult: jest.fn(),
                    addChild: jest.fn(),
                    addInfant: jest.fn(),
                    adults: [{}, {}],
                    children: [{}, {}],
                    infants: [{}],
                };

                (RoomAllocation as jest.Mock).mockImplementation(() => roomInstanceMock);

                rootStore.layoutStore.isDynamicPromoPage = true;
                rootStore.layoutStore.route = {
                    fields: {
                        OverridePaxMix: { value: true },
                        NumberOfAdults: { value: 2 },
                        NumberOfChildren: { value: 2 },
                        NumberOfInfants: { value: 1 },
                        ChildrenAges: { value: '5,7' },
                    },
                };
            });

            it('should not do anything if not a dynamic promo page', () => {
                rootStore.layoutStore.isDynamicPromoPage = false;

                store.setOverrideWhoValue();

                expect(rootStore.searchStore.searchWho.setRoomsAllocation).not.toHaveBeenCalled();
            });

            it('should not do anything if OverridePaxMix is false', () => {
                rootStore.layoutStore.route.fields.OverridePaxMix.value = false;

                store.setOverrideWhoValue();

                expect(rootStore.searchStore.searchWho.setRoomsAllocation).not.toHaveBeenCalled();
            });

            it('should not call addChild/addInfant if values are 0', () => {
                rootStore.layoutStore.route.fields.NumberOfChildren.value = 0;
                rootStore.layoutStore.route.fields.NumberOfInfants.value = 0;

                store.setOverrideWhoValue();

                expect(roomInstanceMock.addChild).not.toHaveBeenCalled();
                expect(roomInstanceMock.addInfant).not.toHaveBeenCalled();
            });

            it('should call RoomAllocation methods correctly and pass result to setRoomsAllocation', () => {
                const setRoomsAllocationMock = jest.fn();
                rootStore.searchStore.searchWho.setRoomsAllocation = setRoomsAllocationMock;

                store.setOverrideWhoValue();

                expect(RoomAllocation).toHaveBeenCalledTimes(1);
                expect(roomInstanceMock.addAdult).toHaveBeenCalledTimes(2);
                expect(roomInstanceMock.addChild).toHaveBeenCalledTimes(2);
                expect(roomInstanceMock.addInfant).toHaveBeenCalledTimes(1);
                expect(setRoomsAllocationMock).toHaveBeenCalledWith([roomInstanceMock]);
            });

            it('should set child ages correctly if ChildrenAges are provided', () => {
                const setRoomsAllocationMock = jest.fn();
                rootStore.searchStore.searchWho.setRoomsAllocation = setRoomsAllocationMock;

                const childMock1 = { age: null };
                const childMock2 = { age: null };
                roomInstanceMock.children = [childMock1, childMock2];

                rootStore.layoutStore.route.fields.NumberOfChildren.value = 2;

                store.setOverrideWhoValue();

                expect(childMock1.age).toBe(5);
                expect(childMock2.age).toBe(7);
            });
        });

        describe('getSeasonFields', () => {
            beforeEach(() => {
                rootStore.queryParamsStore.seasonFromUrl = undefined;
                rootStore.layoutStore.layout.sitecore.route.fields = {
                    OverrideSeasons: { value: false },
                    DefaultSeason: mockDefaultSeason,
                    Seasons: [mockSeasonWithDates('2025-12-31')],
                };
            });

            it('should return season from seasonFromUrl', () => {
                rootStore.queryParamsStore.seasonFromUrl = 'S001';

                expect(store.getSeasonFields().Name.value).toBe('Default Season');
            });

            it('should return default season when OverrideSeasons is true', () => {
                rootStore.layoutStore.layout.sitecore.route.fields.OverrideSeasons.value = true;

                expect(store.getSeasonFields().Code.value).toBe('S001');
            });

            it('should return undefined when season not found', () => {
                rootStore.queryParamsStore.seasonFromUrl = 'S002';

                expect(store.getSeasonFields()).toBeUndefined();
            });
        });

        describe('getSeasonDates', () => {
            beforeEach(() => {
                rootStore.queryParamsStore.seasonFromUrl = 'S001';
                rootStore.layoutStore.layout.sitecore.route.fields = {
                    OverrideSeasons: { value: false },
                    DefaultSeason: mockDefaultSeason,
                    Seasons: [mockSeasonWithDates('2025-03-01')],
                };
            });

            it('should return [StartDate, EndDate] when StartDate > payloadFrom', () => {
                const payloadFrom = new Date('2024-12-01');

                expect(store.getSeasonDates(payloadFrom)).toEqual([new Date('2025-01-01'), new Date('2025-03-01')]);
            });

            it('should return [payloadFrom, EndDate] when payloadFrom > StartDate', () => {
                const payloadFrom = new Date('2025-02-01');

                expect(store.getSeasonDates(payloadFrom)).toEqual([new Date('2025-02-01'), new Date('2025-03-01')]);
            });

            it('should return [] when EndDate <= payloadFrom', () => {
                const payloadFrom = new Date('2025-04-01');

                expect(store.getSeasonDates(payloadFrom)).toEqual([]);
            });

            it('should return [] when no matching season is found', () => {
                rootStore.queryParamsStore.seasonFromUrl = 'INVALID';

                expect(store.getSeasonDates(new Date('2025-01-01'))).toEqual([]);
            });

            it('should return [] if getSeason returns null', () => {
                store.getSeasonFields = jest.fn(() => null);

                expect(store.getSeasonDates(new Date('2025-01-01'))).toEqual([]);
            });
        });

        describe('getSeasonName', () => {
            beforeEach(() => {
                rootStore.queryParamsStore.seasonFromUrl = 'S001';
                rootStore.layoutStore.layout.sitecore.route.fields = {
                    OverrideSeasons: { value: false },
                    DefaultSeason: mockDefaultSeason,
                    Seasons: [mockDefaultSeason],
                };
            });

            it('should return season name when season is found', () => {
                expect(store.getSeasonName()).toBe('Default Season');
            });

            it('should return null when season is not found', () => {
                rootStore.queryParamsStore.seasonFromUrl = 'INVALID';

                expect(store.getSeasonName()).toBeNull();
            });
        });

        describe('getToSearchParam', () => {
            it('should return calculated date when "to" is less than the calculated start date', () => {
                store.rootStore = {
                    layoutStore: {
                        layout: {
                            sitecore: {
                                route: {
                                    fields: { InitialSearchDays: { value: 5 } },
                                },
                            },
                        },
                    },
                };

                expect(
                    store
                        .getToSearchParam(
                            new Date('2025-02-10T00:00:00Z'),
                            new Date('2025-03-01T00:00:00Z'),
                            new Date('2025-02-15T00:00:00Z'),
                        )
                        .toISOString(),
                ).toEqual(new Date('2025-02-20T00:00:00Z').toISOString());
            });

            it('should return seasonTo when "to" is greater than seasonTo', () => {
                const seasonTo = new Date('2025-03-01T00:00:00Z');

                store.rootStore = {
                    layoutStore: {
                        layout: {
                            sitecore: {
                                route: {
                                    fields: { InitialSearchDays: { value: 5 } },
                                },
                            },
                        },
                    },
                };

                expect(
                    store
                        .getToSearchParam(new Date('2025-03-05T00:00:00Z'), seasonTo, new Date('2025-02-15T00:00:00Z'))
                        .toISOString(),
                ).toEqual(seasonTo.toISOString());
            });

            it('should return "to" when it is between the calculated start date and seasonTo', () => {
                const to = new Date('2025-02-25T00:00:00Z');

                store.rootStore = {
                    layoutStore: {
                        layout: {
                            sitecore: {
                                route: {
                                    fields: { InitialSearchDays: { value: 5 } },
                                },
                            },
                        },
                    },
                };

                expect(
                    store
                        .getToSearchParam(to, new Date('2025-03-01T00:00:00Z'), new Date('2025-02-15T00:00:00Z'))
                        .toISOString(),
                ).toEqual(to.toISOString());
            });

            it('should handle zero InitialSearchDays correctly', () => {
                store.rootStore = {
                    layoutStore: {
                        layout: {
                            sitecore: {
                                route: {
                                    fields: { InitialSearchDays: { value: 0 } },
                                },
                            },
                        },
                    },
                };

                expect(
                    store
                        .getToSearchParam(
                            new Date('2025-02-12T00:00:00Z'),
                            new Date('2025-03-01T00:00:00Z'),
                            new Date('2025-02-15T00:00:00Z'),
                        )
                        .toISOString(),
                ).toEqual(new Date('2025-02-15T00:00:00Z').toISOString());
            });
        });

        describe('updateSearchParamsAndExecuteSearch', () => {
            beforeEach(() => {
                store.clearQueryParamsData = jest.fn();
                store.setFilters = jest.fn();
                store.constructSearchPayload = jest.fn(() => mockSearchParamsPayload);
                store.getSeasonDates = jest.fn(() => mockSeasonsData);
                store.getToSearchParam = jest.fn();
            });

            it('should update search params, consider InitialSearchDays, call fetchOffers, and set from/to variables correctly', async () => {
                mockSearchParamsPayload.to = new Date('2025-02-15T00:00:00Z');
                store.getToSearchParam.mockReturnValueOnce(new Date('2025-02-15T00:00:00.000Z'));
                rootStore.layoutStore.layout = {
                    sitecore: {
                        route: {
                            fields: { InitialSearchDays: { value: 2 } },
                        },
                    },
                };

                await store.updateSearchParamsAndExecuteSearch();

                expect(store.duration).toBe(mockSearchParamsPayload.duration);
                expect(store.departures).toBe(mockSearchParamsPayload.departures.join(','));
                expect(store.rooms).toEqual(mockSearchParamsPayload.rooms);
                expect(store.from).toEqual(mockSeasonsData[0]);
                expect(store.to.toISOString()).toEqual(mockSearchParamsPayload.to.toISOString());

                await waitFor(() => {
                    expect(store.constructSearchPayload).toHaveBeenCalled();
                    expect(store.getSeasonDates).toHaveBeenCalled();
                    expect(rootStore.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
                    expect(store.clearQueryParamsData).toHaveBeenCalled();
                });
            });

            it('should update search params, call fetchOffers, setFilters and set from and to variables to seasonsData values', async () => {
                mockSearchParamsPayload.to = new Date('2025-03-15T00:00:00Z');
                store.getToSearchParam.mockReturnValueOnce(new Date('2025-02-18T00:00:00.000Z'));
                rootStore.layoutStore.layout = {
                    sitecore: {
                        route: {
                            fields: { InitialSearchDays: { value: 15 } },
                        },
                    },
                };
                store.updateSearchParamsAndExecuteSearch();

                expect(store.duration).toBe(mockSearchParamsPayload.duration);
                expect(store.departures).toBe(mockSearchParamsPayload.departures.join(','));
                expect(store.rooms).toEqual(mockSearchParamsPayload.rooms);
                expect(store.from).toEqual(mockSeasonsData[0]);
                expect(store.to.toISOString()).toEqual(mockSeasonsData[1].toISOString());

                await waitFor(() => {
                    expect(store.constructSearchPayload).toHaveBeenCalled();
                    expect(store.getSeasonDates).toHaveBeenCalled();
                    expect(rootStore.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
                    expect(store.clearQueryParamsData).toHaveBeenCalled();
                    expect(store.setFilters).toHaveBeenCalled();
                });
            });

            it('should take from and to from constructSearchPayload when getSeasonDates is empty', async () => {
                store.getToSearchParam.mockReturnValueOnce(new Date('2025-03-15T00:00:00.000Z'));
                store.getSeasonDates = jest.fn(() => []);

                store.updateSearchParamsAndExecuteSearch();

                expect(store.from).toEqual(mockSearchParamsPayload.from);
                expect(store.to.toISOString()).toBe(mockSearchParamsPayload.to.toISOString());
            });

            it('should take duration from queryParamsStore when duration is empty', () => {
                const mockSearchParamsPayloadWithoutDuration = { ...mockSearchParamsPayload, duration: null };
                store.constructSearchPayload = jest.fn(() => mockSearchParamsPayloadWithoutDuration);

                store.updateSearchParamsAndExecuteSearch();

                expect(store.duration).toEqual(rootStore.queryParamsStore.durationFromUrl);
            });

            it('should take duration as default constant when both are empty', () => {
                rootStore.queryParamsStore.durationFromUrl = null;
                const mockSearchParamsPayloadWithoutDuration = { ...mockSearchParamsPayload, duration: null };
                store.constructSearchPayload = jest.fn(() => mockSearchParamsPayloadWithoutDuration);

                store.updateSearchParamsAndExecuteSearch();

                expect(store.duration).toEqual(7);
            });

            it('should take rooms and departures from bookingStore when both are empty', () => {
                const mockSearchParamsPayloadWithoutDuration = {
                    ...mockSearchParamsPayload,
                    rooms: null,
                    departures: null,
                };
                store.constructSearchPayload = jest.fn(() => mockSearchParamsPayloadWithoutDuration);

                store.updateSearchParamsAndExecuteSearch();

                expect(store.departures).toEqual(rootStore.bookingStore.origins.join(','));
                expect(store.rooms).toEqual([]);
            });

            it('should NOT call setFilters when applyFilters is false', async () => {
                store.getToSearchParam.mockReturnValueOnce(new Date('2025-03-15T00:00:00.000Z'));
                store.getSeasonDates = jest.fn(() => mockSeasonsData);

                await store.updateSearchParamsAndExecuteSearch(false);

                expect(store.setFilters).not.toHaveBeenCalled();
                expect(store.constructSearchPayload).toHaveBeenCalled();
                expect(store.getSeasonDates).toHaveBeenCalled();
                expect(rootStore.hotelsStore.fetchOffers).toHaveBeenCalledWith(true);
                expect(store.clearQueryParamsData).toHaveBeenCalled();
            });
        });

        describe('setFilters', () => {
            beforeEach(() => {
                store.setBoardTypesFilters = jest.fn();
                store.setFacilitiesTypesFilters = jest.fn(() => Promise.resolve());
                store.setRatingFilters = jest.fn();
                store.setPriceFilters = jest.fn();
                store.setPackageThemes = jest.fn();
                store.setPackageFacilityMatrix = jest.fn();
                store.setPackageThemeFilters = jest.fn();

                rootStore.layoutStore.layout = {
                    sitecore: {
                        route: {
                            fields: {},
                        },
                    },
                };
            });

            it('should call setBoardTypesFilters, setFacilitiesTypesFilters, ratings, price, themes, and facility matrix when not a dynamic promo page', async () => {
                rootStore.layoutStore.isDynamicPromoPage = false;
                rootStore.layoutStore.layout.sitecore.route.fields = {
                    StarRating: { value: '3,4' },
                    TripAdvisorRating: { value: '4' },
                };

                await store.setFilters();

                expect(store.setBoardTypesFilters).toHaveBeenCalled();
                expect(store.setFacilitiesTypesFilters).toHaveBeenCalled();
                expect(store.setRatingFilters).toHaveBeenCalledWith(['3', '4'], FilterGroupCodes.StarRating);
                expect(store.setRatingFilters).toHaveBeenCalledWith(['4'], FilterGroupCodes.TripAdvisorRating);
                expect(store.setPriceFilters).toHaveBeenCalled();
                expect(store.setPackageThemes).toHaveBeenCalled();
                expect(store.setPackageFacilityMatrix).toHaveBeenCalled();
            });

            it('should skip setPackageFacilityMatrix when dynamic promo page and OverrideHotelTypes is falsy', async () => {
                rootStore.layoutStore.isDynamicPromoPage = true;
                rootStore.layoutStore.layout.sitecore.route.fields = {
                    StarRating: { value: '5' },
                    TripAdvisorRating: { value: '4' },
                };

                await store.setFilters();

                expect(store.setBoardTypesFilters).toHaveBeenCalled();
                expect(store.setFacilitiesTypesFilters).toHaveBeenCalled();
                expect(store.setRatingFilters).toHaveBeenCalledWith(['5'], FilterGroupCodes.StarRating);
                expect(store.setRatingFilters).toHaveBeenCalledWith(['4'], FilterGroupCodes.TripAdvisorRating);
                expect(store.setPriceFilters).toHaveBeenCalled();
                expect(store.setPackageThemes).toHaveBeenCalled();
                expect(store.setPackageFacilityMatrix).not.toHaveBeenCalled();
            });

            it('should call setPackageFacilityMatrix even on dynamic promo page if OverrideHotelTypes is truthy', async () => {
                rootStore.layoutStore.isDynamicPromoPage = true;
                rootStore.layoutStore.layout.sitecore.route.fields = {
                    OverrideHotelTypes: { value: true },
                    StarRating: { value: '3' },
                    TripAdvisorRating: { value: '2' },
                };

                await store.setFilters();

                expect(store.setPackageFacilityMatrix).toHaveBeenCalled();
            });

            it('should split StarRating correctly when it is a comma-separated string', async () => {
                rootStore.layoutStore.isDynamicPromoPage = false;
                rootStore.layoutStore.layout.sitecore.route.fields = {
                    StarRating: { value: '2,3,4' },
                    TripAdvisorRating: { value: '3' },
                };

                await store.setFilters();

                expect(store.setRatingFilters).toHaveBeenCalledWith(['2', '3', '4'], FilterGroupCodes.StarRating);
            });

            it('should default ratings to empty array if undefined or null', async () => {
                rootStore.layoutStore.isDynamicPromoPage = false;
                rootStore.layoutStore.layout.sitecore.route.fields = {};

                await store.setFilters();

                expect(store.setRatingFilters).toHaveBeenCalledWith([], FilterGroupCodes.StarRating);
                expect(store.setRatingFilters).toHaveBeenCalledWith([], FilterGroupCodes.TripAdvisorRating);
            });
        });

        describe('setBoardTypesFilters', () => {
            let store;
            let mockBoardTypes;

            beforeEach(() => {
                store = new PromoPageStore(rootStore);
                mockBoardTypes = [
                    {
                        fields: {
                            Code: mockSitecoreField('AI'),
                            Name: mockSitecoreField('All Inclusive'),
                            BoardGroup: undefined,
                        },
                    },
                    {
                        fields: {
                            Code: mockSitecoreField('AI+'),
                            Name: mockSitecoreField('All Inclusive Plus'),
                            BoardGroup: {
                                fields: {
                                    Code: mockSitecoreField('AI'),
                                },
                            },
                        },
                    },
                    {
                        fields: {
                            Code: mockSitecoreField('AS'),
                            Name: mockSitecoreField('All Inclusive Superior'),
                            BoardGroup: {
                                fields: {
                                    Code: mockSitecoreField('AI'),
                                },
                            },
                        },
                    },
                    {
                        fields: {
                            Code: mockSitecoreField('HB'),
                            Name: mockSitecoreField('Half Board'),
                            BoardGroup: undefined,
                        },
                    },
                ];

                rootStore.layoutStore.layout.sitecore.route.fields.BoardTypes = mockBoardTypes;
            });

            it('should build boardTypeToParentMap correctly from Sitecore BoardGroup references', () => {
                store.setBoardTypesFilters();

                expect(store.boardTypeToParentMap).toEqual({
                    AI: 'AI',
                    'AI+': 'AI',
                    AS: 'AI',
                    HB: 'HB',
                });
            });

            it('should map each variant board code to its parent board code when boardGroup exists', () => {
                store.setBoardTypesFilters();

                expect(store.boardTypeToParentMap['AI+']).toBe('AI');
                expect(store.boardTypeToParentMap['AS']).toBe('AI');

                expect(store.boardTypeToParentMap['AI']).toBe('AI');
                expect(store.boardTypeToParentMap['HB']).toBe('HB');
            });

            it('should clear existing BoardType selectedFilters before setting them', () => {
                rootStore.searchFiltersStore.selectedFilters = [
                    { groupCode: FilterGroupCodes.BoardType, code: 'OLD_BOARD' },
                    { groupCode: 'OTHER_GROUP', code: 'OTHER_CODE' },
                ];

                store.setBoardTypesFilters();

                const remainingFilters = rootStore.searchFiltersStore.selectedFilters;
                expect(remainingFilters).toEqual([{ groupCode: 'OTHER_GROUP', code: 'OTHER_CODE' }]);
            });

            it('should apply all Sitecore board types as selected filters', () => {
                store.setBoardTypesFilters();

                expect(rootStore.searchFiltersStore.onSelectFilters).toHaveBeenCalledTimes(mockBoardTypes.length);
                expect(rootStore.searchFiltersStore.onSelectFilters).toHaveBeenCalledWith({
                    code: 'AI',
                    count: 0,
                    name: 'All Inclusive',
                    groupCode: FilterGroupCodes.BoardType,
                });
                expect(rootStore.searchFiltersStore.onSelectFilters).toHaveBeenCalledWith({
                    code: 'AI+',
                    count: 0,
                    name: 'All Inclusive Plus',
                    groupCode: FilterGroupCodes.BoardType,
                });
            });

            it('should handle empty BoardTypes gracefully', () => {
                rootStore.layoutStore.layout.sitecore.route.fields.BoardTypes = undefined;

                store.setBoardTypesFilters();

                expect(store.boardTypeToParentMap).toEqual({});
                expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled();
            });

            it('should maintain boardTypeToParentMap across multiple invocations', () => {
                store.setBoardTypesFilters();
                const firstMapResult = { ...store.boardTypeToParentMap };

                store.setBoardTypesFilters();
                const secondMapResult = store.boardTypeToParentMap;

                expect(secondMapResult).toEqual(firstMapResult);
            });
        });
    });

    describe('LocalStorage', () => {
        beforeEach(() => localStorage.clear());

        it('should restore data on going back from hotel details', () => {
            const store = new PromoPageStore({
                routerStore: {
                    state: { BackToPromoFromHotelDetails: true },
                    isPopState: true,
                },
            } as any);
            expect(store.needToRestoreFromLocalStorage()).toBeTruthy();
        });

        it('should save data to localStorage', () => {
            rootStore.queryParamsStore.destinationFromUrl = 'ES';
            const store = new PromoPageStore(rootStore);
            const spy = jest.spyOn(localStorage, 'setItem');
            store.pageDestinationCode = 'code';
            store.pageThemeTypeCodes = ['B'] as any;
            store.setPromoCollections(['lux']);

            store.saveSearchParamsAndFilterToLocalStorage('testID');

            expect(spy).toHaveBeenCalled();
            expect(localStorage.getItem(WebStorageKeys.Promopage)).toEqual(
                JSON.stringify({
                    layoutId: 'testID',
                    searchStore: { searchWhen: { from: '', to: '' }, searchWho: {} },
                    filtersStore: {},
                    pageDestinationCode: 'code',
                    defaultDestinations: null,
                    destinationFromUrl: 'ES',
                    pageThemeTypeCodes: ['B'],
                    hotelTypes: [],
                    promoCollections: ['lux'],
                }),
            );
        });

        it('should clear data from localStorage', () => {
            const store = new PromoPageStore(null as any);
            const spy = jest.spyOn(localStorage, 'removeItem');
            localStorage.setItem(WebStorageKeys.Promopage, 'test');
            store.clearPromoPageFromLocalStorage();
            expect(spy).toHaveBeenCalledWith(WebStorageKeys.Promopage);
            expect(localStorage.getItem(WebStorageKeys.Promopage)).toEqual(null);
        });

        describe('restoreSearchParamsAndFilterFromLocalStorage', () => {
            it('should restore data if layoutIds are the same', () => {
                const store = new PromoPageStore(rootStore);
                localStorage.setItem(
                    WebStorageKeys.Promopage,
                    '{"layoutId":"testID","searchStore":{},"filtersStore":{},"pageDestinationCode":null, "defaultDestinations": null}',
                );

                expect(store.restoreSearchParamsAndFilterFromLocalStorage('testID')).toBeTruthy();
                expect(store.rootStore.searchStore.deserialize).toHaveBeenCalledWith({});
            });

            it("should not restore data if it's empty", () => {
                const store = new PromoPageStore(rootStore);
                expect(store.restoreSearchParamsAndFilterFromLocalStorage('testID')).toBeFalsy();
            });

            it('should not restore data if layoutIds are different', () => {
                const store = new PromoPageStore(rootStore);
                localStorage.setItem(
                    WebStorageKeys.Promopage,
                    '{"layoutId":"testID-1","searchStore":{},"filtersStore":{},"pageDestinationCode":null}',
                );
                expect(store.restoreSearchParamsAndFilterFromLocalStorage('testID-2')).toBeFalsy();
            });

            it('should not restore data from localStorage if destinationCodes are different', () => {
                const store = new PromoPageStore(rootStore);
                store.pageDestinationCode = 'code-1';
                localStorage.setItem(
                    WebStorageKeys.Promopage,
                    '{"layoutId":"testID","searchStore":{},"filtersStore":{},"pageDestinationCode":"code-2"}',
                );
                expect(store.restoreSearchParamsAndFilterFromLocalStorage('testID')).toBeFalsy();
            });
        });

        describe('pageFromStorage', () => {
            it('should return first page if localStorage is empty', () => {
                const store = new PromoPageStore(rootStore);
                expect(store.pageFromStorage()).toEqual(1);
            });

            it('should return page from localStorage', () => {
                localStorage.setItem(WebStorageKeys.Promopage, '{"searchStore": {"page": 2}}');
                const store = new PromoPageStore(rootStore);
                expect(store.pageFromStorage()).toEqual(2);
            });

            it('should return first page on backend', () => {
                mockedIsBacked.mockReturnValueOnce(true);
                const store = new PromoPageStore(rootStore);
                expect(store.pageFromStorage()).toEqual(1);
            });
        });

        describe('isPromoPageStorage', () => {
            it('should return true if there is promo data in localStorage', () => {
                const store = new PromoPageStore(rootStore);
                localStorage.setItem(WebStorageKeys.Promopage, 'test');
                expect(store.isPromoPageStorage()).toBeTruthy();
            });

            it('should return false if there is not promo data in localStorage', () => {
                const store = new PromoPageStore(rootStore);
                expect(store.isPromoPageStorage()).toBeFalsy();
            });
        });
    });

    describe('clearPageDestination', () => {
        it('should clear destination', () => {
            const store = new PromoPageStore(null as any);
            store.clearPageDestination();
            expect(store.pageDestinationCode).toBeNull();
            expect(store.pageDestination).toBeNull();
        });
    });

    describe('setBackgroundFilters', () => {
        it('should two calls setSpecialFilters with true for isKidsGoFree and ShowSuperDeals', () => {
            const store = new PromoPageStore(rootStore);
            store.setBackgroundFilters(true, true);
            expect(store.rootStore.searchStore.setSpecialFilters).toHaveBeenCalledWith(
                OffersAndPromotionsSettings.KidsGoFree,
                true,
            );
            expect(store.rootStore.searchStore.setSpecialFilters).toHaveBeenCalledWith(
                OffersAndPromotionsSettings.ShowSuperDeals,
                true,
            );
        });

        it('should two calls setSpecialFilters with false for isKidsGoFree and ShowSuperDeals', () => {
            const store = new PromoPageStore(rootStore);
            store.setBackgroundFilters();
            expect(store.rootStore.searchStore.setSpecialFilters).toHaveBeenCalledWith(
                OffersAndPromotionsSettings.KidsGoFree,
                false,
            );
            expect(store.rootStore.searchStore.setSpecialFilters).toHaveBeenCalledWith(
                OffersAndPromotionsSettings.ShowSuperDeals,
                false,
            );
        });
    });

    describe('restoreFromLocalStorage', () => {
        let store;

        beforeEach(() => {
            store = new PromoPageStore(rootStore);
            store.restoreSearchParamsAndFilterFromLocalStorage = jest.fn();
        });

        it('should NOT restore data from local storage when needToRestoreFromLocalStorage is false', () => {
            store.needToRestoreFromLocalStorage = jest.fn().mockReturnValue(false);

            store.restoreFromLocalStorage();

            expect(store.restoreSearchParamsAndFilterFromLocalStorage).not.toHaveBeenCalled();
        });

        it('should restore data from local storage when needToRestoreFromLocalStorage is true', () => {
            store.needToRestoreFromLocalStorage = jest.fn().mockReturnValue(true);

            store.restoreFromLocalStorage();

            expect(store.restoreSearchParamsAndFilterFromLocalStorage).toHaveBeenCalled();
        });
    });

    describe('prefillPromoPage', () => {
        it('should prefill origins from sitecore', async () => {
            rootStore.layoutStore.layout.sitecore.route.fields.Origin = [{ fields: { Code: { value: 'test' } } }];
            const store = new PromoPageStore(rootStore);
            await store.prefillPromoPage();
            expect(store.rootStore.searchStore.searchFrom.setOrigins).toHaveBeenCalledWith(['test'], false);
        });

        it('should call clear query on promo page', async () => {
            const store = new PromoPageStore(rootStore);

            await store.prefillPromoPage();
            expect(store.rootStore.routerStore.clearPromoQuery).toHaveBeenCalled();
        });

        it('should Not call clear query on promo page if Sitecore preview mode', async () => {
            rootStore.layoutStore.isPreviewMode = true;
            const store = new PromoPageStore(rootStore);

            await store.prefillPromoPage();
            expect(store.rootStore.routerStore.clearPromoQuery).not.toHaveBeenCalled();
        });

        it('should prefill rooms allocation from sitecore', async () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                NumberOfAdults: { value: 2 },
                NumberOfChildren: { value: 2 },
                NumberOfInfants: { value: 1 },
            };
            const store = new PromoPageStore(rootStore);
            const mockRoomAllocation = {
                addAdult: jest.fn(),
                addChild: jest.fn(),
                addInfant: jest.fn(),
            };

            (RoomAllocation as any).mockImplementationOnce(() => mockRoomAllocation);
            await store.prefillPromoPage();

            expect(RoomAllocation).toHaveBeenCalledTimes(1);
            expect(store.rootStore.searchStore.searchWho.onChangeRooms).toHaveBeenCalledWith(-1);
            expect(mockRoomAllocation.addAdult).toHaveBeenCalledTimes(2);
            expect(mockRoomAllocation.addChild).toHaveBeenCalledTimes(2);
            expect(mockRoomAllocation.addInfant).toHaveBeenCalledTimes(1);
            expect(store.rootStore.searchStore.searchWho.setRoomsAllocation).toHaveBeenCalled();
        });

        it('should check available dates', async () => {
            const utils = require('frontend/utils/promoPageDates');
            utils.getPromoPageAvailableDateRange = jest.fn((date1, date2) => ({ from: date1, to: date2 }));
            utils.getPromoPageDates = jest.fn(() => ({
                startDate: new Date('2020-12-12'),
                endDate: new Date('2020-12-20'),
            }));
            rootStore.layoutStore.layout.sitecore.route.fields = {
                StartDate: { value: '2020-12-12' },
                EndDate: { value: '2020-12-20' },
            };
            const store = new PromoPageStore(rootStore);
            await store.prefillPromoPage();
            expect(store.rootStore.searchStore.searchWhen.changeDateAvailabilityInterval).toHaveBeenCalledWith(
                new Date('2020-12-12'),
                new Date('2020-12-20'),
            );
        });

        it('should call when() to wait until destinationsWithNames is not empty in this.setDestinations', async () => {
            rootStore.searchStore.searchTo.destinationsWithNames = [
                {
                    code: 'GR',
                    name: 'Greece',
                },
            ];
            rootStore.layoutStore.layout.sitecore.route.fields.Destination = [];
            const store = new PromoPageStore(rootStore);
            await store.prefillPromoPage();

            expect(mockWhen).toHaveBeenCalled();
        });
    });

    describe('loadDynamicPromoPageDestination', () => {
        it('should call loadAllDestinations', async () => {
            rootStore.searchStore.searchTo.loadAllDestinations = jest.fn();
            rootStore.layoutStore.isDynamicPromoPage = true;

            const store = new PromoPageStore(rootStore);
            store.pageDestinationCode = undefined;
            store.pageDestination = undefined;

            await store['loadDynamicPromoPageDestination']();

            await waitFor(() => expect(store.rootStore.searchStore.searchTo.loadAllDestinations).toHaveBeenCalled());
        });
    });

    describe('setPackageThemes', () => {
        it('should set preselected themes when ShowSelectedHolidayThemesInFilters is false', async () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                HolidayThemes: [
                    { fields: { Code: { value: 'B' }, Name: { value: 'Beach' } } },
                    { fields: { Code: { value: 'L' }, Name: { value: 'Luxury' } } },
                ],
                ShowSelectedHolidayThemesInFilters: { value: false },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageThemes']();

            expect(store.pageThemeTypeCodes).toEqual([]);
            await waitFor(() => expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled());
        });

        it('should set themes as filters when ShowSelectedHolidayThemesInFilters is true', async () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                HolidayThemes: [{ fields: { Code: { value: 'B' }, Name: { value: 'Beach' } } }],
                ShowSelectedHolidayThemesInFilters: { value: true },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageThemes']();

            expect(store.pageThemeTypeCodes).toEqual([]);
            await waitFor(() =>
                expect(rootStore.searchFiltersStore.onSelectFilters).toHaveBeenCalledWith({
                    code: 'B',
                    count: 0,
                    name: 'Beach',
                    groupCode: 'packageTheme',
                }),
            );
        });

        it('should filter out parent themes when child types are present', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                HolidayThemes: [{ fields: { Code: { value: 'B' }, Name: { value: 'Beach' } } }],
                HolidayTypes: [{ fields: { Code: { value: 'BL' }, Name: { value: 'Beach Luxury' } } }],
                ShowSelectedHolidayThemesInFilters: { value: false },
                ShowSelectedHolidayTypesInFilters: { value: false },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageThemes']();

            // Should only include 'BL' and filter out 'B' since BL is a child type of B
            expect(store.pageThemeTypeCodes).toEqual([]);
        });

        it('should handle empty or undefined holiday themes and types', async () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                HolidayThemes: undefined,
                HolidayTypes: undefined,
                ShowSelectedHolidayThemesInFilters: { value: false },
                ShowSelectedHolidayTypesInFilters: { value: false },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageThemes']();

            expect(store.pageThemeTypeCodes).toEqual([]);
            await waitFor(() => expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled());
        });

        it('should handle mix of filtered and preselected themes', async () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                HolidayThemes: [{ fields: { Code: { value: 'B' }, Name: { value: 'Beach' } } }],
                HolidayTypes: [{ fields: { Code: { value: 'BL' }, Name: { value: 'Beach Luxury' } } }],
                ShowSelectedHolidayThemesInFilters: { value: true },
                ShowSelectedHolidayTypesInFilters: { value: false },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageThemes']();

            // BL should be preselected
            expect(store.pageThemeTypeCodes).toEqual([]);
            expect(getOnlyFieldValuesFromSitecoreItemsArray).toHaveBeenCalledWith(
                rootStore.layoutStore.layout.sitecore.route.fields.HolidayTypes,
                sitecoreUtils.SitecoreKeyFieldName.Code,
            );
            expect(mockRemovePrefixes).toHaveBeenCalledWith([]);

            // B be set as filters
            await waitFor(() =>
                expect(rootStore.searchFiltersStore.onSelectFilters).toHaveBeenCalledWith({
                    code: 'B',
                    count: 0,
                    name: 'Beach',
                    groupCode: 'packageTheme',
                }),
            );
        });

        it('should skip setting HolidayThemes if dynamic promo page and no OverrideHolidayTheme', () => {
            rootStore.layoutStore.isDynamicPromoPage = true;
            rootStore.layoutStore.layout.sitecore.route.fields = {
                HolidayThemes: [{ fields: { Code: { value: 'B' }, Name: { value: 'Beach' } } }],
                ShowSelectedHolidayThemesInFilters: { value: true },
                OverrideHolidayTheme: { value: false },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageThemes']();

            expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled();
        });

        it('should set HolidayThemes even on dynamic promo page when OverrideHolidayTheme is true', () => {
            rootStore.layoutStore.isDynamicPromoPage = true;
            rootStore.layoutStore.layout.sitecore.route.fields = {
                HolidayThemes: [{ fields: { Code: { value: 'A' }, Name: { value: 'Adventure' } } }],
                ShowSelectedHolidayThemesInFilters: { value: true },
                OverrideHolidayTheme: { value: true },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageThemes']();

            expect(rootStore.searchFiltersStore.onSelectFilters).toHaveBeenCalledWith({
                code: 'A',
                count: 0,
                name: 'Adventure',
                groupCode: 'packageTheme',
            });
        });

        it('should skip setting HolidayTypes if dynamic promo page and no OverrideHolidayType', () => {
            rootStore.layoutStore.isDynamicPromoPage = true;
            rootStore.layoutStore.layout.sitecore.route.fields = {
                HolidayTypes: [{ fields: { Code: { value: 'BL' }, Name: { value: 'Beach Luxury' } } }],
                ShowSelectedHolidayTypesInFilters: { value: true },
                OverrideHolidayType: { value: false },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageThemes']();

            expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled();
        });

        it('should skip all themes and types if dynamic promo page and both overrides are missing or false', () => {
            rootStore.layoutStore.isDynamicPromoPage = true;
            rootStore.layoutStore.layout.sitecore.route.fields = {
                HolidayThemes: [{ fields: { Code: { value: 'C' }, Name: { value: 'City' } } }],
                HolidayTypes: [{ fields: { Code: { value: 'CU' }, Name: { value: 'Cultural' } } }],
                ShowSelectedHolidayThemesInFilters: { value: true },
                ShowSelectedHolidayTypesInFilters: { value: true },
                OverrideHolidayTheme: { value: false },
                OverrideHolidayType: { value: false },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageThemes']();

            expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled();
            expect(store.pageThemeTypeCodes).toEqual([]);
        });
    });

    describe('setPackageFacilityMatrix', () => {
        it('should set hotel types from facility matrix', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                FacilityMatrix: [
                    { fields: { Code: { value: 'FAM' }, Name: { value: 'Family' } } },
                    { fields: { Code: { value: 'LUX' }, Name: { value: 'Luxury' } } },
                ],
                ShowSelectedFacilityMatrixInFilters: { value: false },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageFacilityMatrix']();

            expect(store.hotelTypes).toEqual([]);
            expect(getOnlyFieldValuesFromSitecoreItemsArray).toHaveBeenCalledWith(
                rootStore.layoutStore.layout.sitecore.route.fields.FacilityMatrix,
                sitecoreUtils.SitecoreKeyFieldName.Code,
            );
            expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled();
        });

        it('should set hotel types as filters when ShowSelectedFacilityMatrixInFilters is true', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                FacilityMatrix: [
                    { fields: { Code: { value: 'FAM' }, Name: { value: 'Family' }, IsExclusive: { value: true } } },
                ],
                ShowSelectedFacilityMatrixInFilters: { value: true },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageFacilityMatrix']();

            expect(store.hotelTypes).toEqual([]);
            expect(rootStore.searchFiltersStore.onSelectFilters).toHaveBeenCalledWith({
                code: 'FAM',
                count: 0,
                name: 'Family',
                groupCode: 'hotelTypes',
                isExclusive: true,
            });
        });

        it('should handle empty facility matrix', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                FacilityMatrix: [],
                ShowSelectedFacilityMatrixInFilters: { value: true },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageFacilityMatrix']();

            expect(store.hotelTypes).toEqual([]);
            expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled();
        });

        it('should handle undefined facility matrix', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                FacilityMatrix: undefined,
                ShowSelectedFacilityMatrixInFilters: { value: true },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageFacilityMatrix']();

            expect(store.hotelTypes).toEqual([]);
            expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled();
        });

        it('should handle facility matrix items without codes', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                FacilityMatrix: [
                    { fields: { Code: { value: '' }, Name: { value: 'Empty' } } },
                    { fields: { Code: { value: 'LUX' }, Name: { value: 'Luxury' } } },
                ],
                ShowSelectedFacilityMatrixInFilters: { value: true },
            };

            const store = new PromoPageStore(rootStore);
            store['setPackageFacilityMatrix']();

            expect(store.hotelTypes).toEqual([]);
            expect(rootStore.searchFiltersStore.onSelectFilters).toHaveBeenCalledTimes(1);
            expect(rootStore.searchFiltersStore.onSelectFilters).toHaveBeenCalledWith({
                code: 'LUX',
                count: 0,
                name: 'Luxury',
                groupCode: 'hotelTypes',
                isExclusive: false,
            });
        });
    });

    describe('initializePromoCollectionsOrFilters  ', () => {
        it('should set promoCollections from keys when ShowSelectedPromoCollectionsInFilters is false', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                PromoCollections: [{ fields: { Key: { value: 'COL1' } } }, { fields: { Key: { value: 'COL2' } } }],
                ShowSelectedPromoCollectionsInFilters: { value: false },
            };
            const store = new PromoPageStore(rootStore);
            store['initializePromoCollectionsOrFilters']();
            expect(getOnlyFieldValuesFromSitecoreItemsArray).toHaveBeenCalledWith(
                rootStore.layoutStore.layout.sitecore.route.fields.PromoCollections,
                sitecoreUtils.SitecoreKeyFieldName.Key,
            );
            expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled();
        });

        it('should call onSelectFilters for each collection when ShowSelectedPromoCollectionsInFilters is true', () => {
            const onSelectFilters = jest.fn();
            rootStore.searchFiltersStore.onSelectFilters = onSelectFilters;
            rootStore.layoutStore.layout.sitecore.route.fields = {
                PromoCollections: [
                    { fields: { Key: { value: 'COL1' }, Title: { value: 'Collection 1' } } },
                    { fields: { Key: { value: 'COL2' }, Title: { value: 'Collection 2' } } },
                ],
                ShowSelectedPromoCollectionsInFilters: { value: true },
            };
            const store = new PromoPageStore(rootStore);
            store['initializePromoCollectionsOrFilters']();
            expect(onSelectFilters).toHaveBeenCalledTimes(2);
            expect(onSelectFilters).toHaveBeenCalledWith({
                code: 'COL1',
                count: 0,
                name: 'Collection 1',
                groupCode: 'promoCollection',
            });
            expect(onSelectFilters).toHaveBeenCalledWith({
                code: 'COL2',
                count: 0,
                name: 'Collection 2',
                groupCode: 'promoCollection',
            });
            expect(store.promoCollections).toEqual([]);
        });

        it('should do nothing if PromoCollections is empty or undefined', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                PromoCollections: undefined,
                ShowSelectedPromoCollectionsInFilters: { value: false },
            };
            const store = new PromoPageStore(rootStore);
            store['initializePromoCollectionsOrFilters']();
            expect(store.promoCollections).toEqual([]);
            expect(rootStore.searchFiltersStore.onSelectFilters).not.toHaveBeenCalled();
        });
    });

    describe('isInitialPaxIsDefault', () => {
        it('should return true when all pax values match between sitecore and searchWho', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                NumberOfAdults: mockSitecoreField(3),
                NumberOfChildren: mockSitecoreField(2),
                NumberOfInfants: mockSitecoreField(1),
            };
            rootStore.searchStore.searchWho = {
                adultsQuantity: 3,
                childrenQuantity: 2,
                infantsQuantity: 1,
            };
            const store = new PromoPageStore(rootStore);

            expect(store.isInitialPaxIsDefault()).toBe(true);
        });

        it('should return false when adults quantity does not match', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                NumberOfAdults: mockSitecoreField(3),
                NumberOfChildren: mockSitecoreField(2),
                NumberOfInfants: mockSitecoreField(1),
            };
            rootStore.searchStore.searchWho = {
                adultsQuantity: 2,
                childrenQuantity: 2,
                infantsQuantity: 1,
            };
            const store = new PromoPageStore(rootStore);

            expect(store.isInitialPaxIsDefault()).toBe(false);
        });

        it('should return false when children quantity does not match', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                NumberOfAdults: mockSitecoreField(3),
                NumberOfChildren: mockSitecoreField(2),
                NumberOfInfants: mockSitecoreField(1),
            };
            rootStore.searchStore.searchWho = {
                adultsQuantity: 3,
                childrenQuantity: 1,
                infantsQuantity: 1,
            };
            const store = new PromoPageStore(rootStore);

            expect(store.isInitialPaxIsDefault()).toBe(false);
        });

        it('should return false when infants quantity does not match', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                NumberOfAdults: mockSitecoreField(3),
                NumberOfChildren: mockSitecoreField(2),
                NumberOfInfants: mockSitecoreField(1),
            };
            rootStore.searchStore.searchWho = {
                adultsQuantity: 3,
                childrenQuantity: 2,
                infantsQuantity: 0,
            };
            const store = new PromoPageStore(rootStore);

            expect(store.isInitialPaxIsDefault()).toBe(false);
        });

        it('should default missing sitecore values to 0 and return true when searchWho also has 0 values', () => {
            rootStore.layoutStore.layout.sitecore.route.fields = {
                NumberOfAdults: undefined,
                NumberOfChildren: undefined,
                NumberOfInfants: undefined,
            };
            rootStore.searchStore.searchWho = {
                adultsQuantity: 0,
                childrenQuantity: 0,
                infantsQuantity: 0,
            };
            const store = new PromoPageStore(rootStore);

            expect(store.isInitialPaxIsDefault()).toBe(true);
        });
    });
});
