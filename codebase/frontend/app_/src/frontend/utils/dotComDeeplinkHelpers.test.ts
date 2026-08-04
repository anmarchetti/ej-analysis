/* eslint-disable no-magic-numbers */
import { DATE_FORMATS } from 'code/dates';
import { createMockStores } from 'frontend/__mocks__';
import { mockAllMarketsSettings } from 'frontend/__mocks__/markets';
import offersService from 'frontend/services/offers.service';
import { SearchStore } from 'frontend/store/holidays';
import { IMarketSettings } from 'models/data/MarketSettings';
import { DestinationType } from 'models/enum/DestinationType';

import * as datesUtils from './date.utils';
import {
    findClosestMarketByLang,
    getMarketFromDotComDeeplink,
    saveDotComDeeplinkDatesToSearchStore,
    saveDotComDeeplinkGuestsToSearchStore,
    saveDotComDeeplinkOriginsToSearchStore,
    saveDotComDeeplinkRoomsToSearchStore,
    saveDotComDepplinkDestinationToSearchStore,
} from './dotComDeeplinkHelpers';
import { findMarketsByDepAirports } from './market.utils';
import AxiosRequest from './request';

jest.mock('./market.utils');
const mockFindMarketsByDepAirport = findMarketsByDepAirports as jest.Mock;

jest.mock('frontend/utils/request');
const mockAxiosGet = AxiosRequest.get as jest.Mock;

const createSearchStore = () => ({
    searchWhen: { onChangeDates: jest.fn() },
    searchFrom: {
        setNormalOrigins: jest.fn(),
        onAddOrigin: jest.fn(),
        origins: [] as string[],
    },
    searchWho: { roomsAllocation: [] },
});
let mockSearchStore: SearchStore;

describe('dotComDeeplinkHelpers.ts', () => {
    beforeEach(() => {
        mockSearchStore = createSearchStore() as any;
    });

    describe('saveDotComDeeplinkOriginsToSearchStore()', () => {
        it('should not add origins if no airports', () => {
            saveDotComDeeplinkOriginsToSearchStore('', mockSearchStore);

            expect(mockSearchStore.searchFrom.onAddOrigin).not.toHaveBeenCalled();
        });

        it('should add origin for each airport', () => {
            saveDotComDeeplinkOriginsToSearchStore('LGW,LTN', mockSearchStore);

            expect(mockSearchStore.searchFrom.onAddOrigin).toHaveBeenNthCalledWith(1, 'LGW');
            expect(mockSearchStore.searchFrom.onAddOrigin).toHaveBeenNthCalledWith(2, 'LTN');
        });
    });

    describe('saveDotComDeeplinkDatesToSearchStore()', () => {
        it('should parse dates and call onChangeDates()', () => {
            const parseDateL10n = jest
                .spyOn(datesUtils, 'parseDateL10n')
                .mockImplementation(d => `${d}T00:00:00.000Z` as any);
            const from = '2023-01-01';
            const to = '2023-01-07';

            saveDotComDeeplinkDatesToSearchStore(from, to, mockSearchStore);

            expect(parseDateL10n).toHaveBeenCalledTimes(2);
            expect(parseDateL10n).toHaveBeenNthCalledWith(1, from, DATE_FORMATS.query);
            expect(parseDateL10n).toHaveBeenNthCalledWith(2, to, DATE_FORMATS.query);
            expect(mockSearchStore.searchWhen.onChangeDates).toHaveBeenCalledWith([
                `${from}T00:00:00.000Z`,
                `${to}T00:00:00.000Z`,
            ]);
        });
    });

    describe('saveDotComDeeplinkRoomsToSearchStore()', () => {
        it('should not create rooms if empty array is passed', () => {
            saveDotComDeeplinkRoomsToSearchStore([], mockSearchStore);

            const rooms = mockSearchStore.searchWho.roomsAllocation;

            expect(rooms).toHaveLength(0);
        });

        it('should not create rooms if array with empty string is passed', () => {
            saveDotComDeeplinkRoomsToSearchStore([''], mockSearchStore);

            const rooms = mockSearchStore.searchWho.roomsAllocation;

            expect(rooms).toHaveLength(0);
        });

        it('should not create rooms if not string type array is passed', () => {
            saveDotComDeeplinkRoomsToSearchStore([5 as any], mockSearchStore);

            const rooms = mockSearchStore.searchWho.roomsAllocation;

            expect(rooms).toHaveLength(0);
        });

        it('should create one room with 1 adult', () => {
            saveDotComDeeplinkRoomsToSearchStore(['1'], mockSearchStore);

            const rooms = mockSearchStore.searchWho.roomsAllocation;

            expect(rooms).toHaveLength(1);
            expect(rooms[0].adults).toHaveLength(1);
            expect(rooms[0].children).toHaveLength(0);
            expect(rooms[0].infants).toHaveLength(0);
        });

        describe('Legacy format: dot-separated', () => {
            it('should create one room with 2 adults and 3 children', () => {
                saveDotComDeeplinkRoomsToSearchStore(['2.0.0.0'], mockSearchStore);

                const rooms = mockSearchStore.searchWho.roomsAllocation;

                expect(rooms).toHaveLength(1);
                expect(rooms[0].adults).toHaveLength(2);
                expect(rooms[0].children).toHaveLength(3);
                expect(rooms[0].infants).toHaveLength(0);
            });

            it('should create 3 rooms with 5 adults and 1 children', () => {
                saveDotComDeeplinkRoomsToSearchStore(['5.0'], mockSearchStore);

                const rooms = mockSearchStore.searchWho.roomsAllocation;

                expect(rooms).toHaveLength(3);
                expect(rooms[0].adults).toHaveLength(2);
                expect(rooms[1].adults).toHaveLength(2);
                expect(rooms[2].adults).toHaveLength(1);
                expect(rooms[0].children).toHaveLength(1);
                expect(rooms[0].infants).toHaveLength(0);
            });
        });

        describe('New format: underscore-separated', () => {
            it('should create 1 room with 2 adults', () => {
                saveDotComDeeplinkRoomsToSearchStore(['2_0_0'], mockSearchStore);

                const rooms = mockSearchStore.searchWho.roomsAllocation;

                expect(rooms).toHaveLength(1);
                expect(rooms[0].adults).toHaveLength(2);
                expect(rooms[0].children).toHaveLength(0);
                expect(rooms[0].infants).toHaveLength(0);
            });

            it('should create 1 room with 2 adults', () => {
                saveDotComDeeplinkRoomsToSearchStore(['2__'], mockSearchStore);

                const rooms = mockSearchStore.searchWho.roomsAllocation;

                expect(rooms).toHaveLength(1);
                expect(rooms[0].adults).toHaveLength(2);
                expect(rooms[0].children).toHaveLength(0);
                expect(rooms[0].infants).toHaveLength(0);
            });

            it('should create 1 room with 2 adults and 1 child', () => {
                saveDotComDeeplinkRoomsToSearchStore(['2_1_0'], mockSearchStore);

                const rooms = mockSearchStore.searchWho.roomsAllocation;

                expect(rooms).toHaveLength(1);
                expect(rooms[0].adults).toHaveLength(2);
                expect(rooms[0].children).toHaveLength(1);
                expect(rooms[0].infants).toHaveLength(0);
            });

            it('should create 1 room with 2 adults and 1 infant', () => {
                saveDotComDeeplinkRoomsToSearchStore(['2_0_1'], mockSearchStore);

                const rooms = mockSearchStore.searchWho.roomsAllocation;

                expect(rooms).toHaveLength(1);
                expect(rooms[0].adults).toHaveLength(2);
                expect(rooms[0].children).toHaveLength(0);
                expect(rooms[0].infants).toHaveLength(1);
            });

            it('should create 1 room with 1 adult, 1 child, and 1 infant', () => {
                saveDotComDeeplinkRoomsToSearchStore(['1_1_1'], mockSearchStore);

                const rooms = mockSearchStore.searchWho.roomsAllocation;

                expect(rooms).toHaveLength(1);
                expect(rooms[0].adults).toHaveLength(1);
                expect(rooms[0].children).toHaveLength(1);
                expect(rooms[0].infants).toHaveLength(1);
            });

            it('should create 3 rooms with 5 adults and 1 child', () => {
                saveDotComDeeplinkRoomsToSearchStore(['5_1_0'], mockSearchStore);

                const rooms = mockSearchStore.searchWho.roomsAllocation;

                expect(rooms).toHaveLength(3);
                expect(rooms[0].adults).toHaveLength(2);
                expect(rooms[1].adults).toHaveLength(2);
                expect(rooms[2].adults).toHaveLength(1);
                expect(rooms[0].children).toHaveLength(1);
                expect(rooms[0].infants).toHaveLength(0);
            });
        });
    });

    describe('saveDotComDeeplinkGuestsToSearchStore()', () => {
        it('should create 2 rooms and set max one infant per adult', () => {
            saveDotComDeeplinkGuestsToSearchStore({ adults: 3, children: 0, infants: 4 }, mockSearchStore);

            const rooms = mockSearchStore.searchWho.roomsAllocation;

            expect(rooms).toHaveLength(2);
            expect(rooms[0].adults).toHaveLength(2);
            expect(rooms[0].infants).toHaveLength(2);
            expect(rooms[1].adults).toHaveLength(1);
            expect(rooms[1].infants).toHaveLength(1);
        });
    });

    describe('findClosestMarketByLang', () => {
        const mockMarketFR_CH = { ...mockAllMarketsSettings['fr-CH'], Language: 'fr-CH' } as IMarketSettings;
        const mockMarketDE_CH = { ...mockAllMarketsSettings['de-CH'], Language: 'de-CH' } as IMarketSettings;

        it('should return the first market when market list contain only one item', () => {
            const market = findClosestMarketByLang([mockMarketFR_CH], 'en');

            expect(market).toEqual(mockMarketFR_CH);
        });

        it('should return market with the same language', () => {
            const market = findClosestMarketByLang([mockMarketFR_CH, mockMarketDE_CH], 'ch-de');

            expect(market).toEqual(mockMarketDE_CH);
        });

        it('should return market with the same language group', () => {
            const market = findClosestMarketByLang([mockMarketFR_CH, mockMarketDE_CH], 'fr');

            expect(market).toEqual(mockMarketFR_CH);
        });

        it('should return market with the main language', () => {
            const market = findClosestMarketByLang([mockMarketFR_CH, mockMarketDE_CH], 'fr');

            expect(market).toEqual(mockMarketFR_CH);
        });
    });

    describe('getDotComMarketByDepartureAirports()', () => {
        beforeEach(() => {
            mockAxiosGet.mockResolvedValue({ data: mockAllMarketsSettings });
            mockFindMarketsByDepAirport.mockReturnValue([mockAllMarketsSettings['en']]);
        });

        it('Should return null when no airports', async () => {
            const market = await getMarketFromDotComDeeplink([], 'en');

            expect(mockAxiosGet).not.toHaveBeenCalled();
            expect(market).toBeNull();
        });

        it('Should return null when no markets found', async () => {
            mockFindMarketsByDepAirport.mockReturnValueOnce([]);
            const market = await getMarketFromDotComDeeplink(['LGW'], 'en');

            expect(mockAxiosGet).toHaveBeenCalled();
            expect(mockFindMarketsByDepAirport).toHaveBeenCalledWith(['LGW'], mockAllMarketsSettings);
            expect(market).toBeNull();
        });

        it('Should return null when request fails', async () => {
            mockAxiosGet.mockRejectedValue({});
            const market = await getMarketFromDotComDeeplink(['LGW'], 'en');

            expect(market).toBeNull();
        });

        it('Should return market', async () => {
            const market = await getMarketFromDotComDeeplink(['LGW'], 'en');

            expect(market).toEqual(mockAllMarketsSettings['en']);
        });
    });

    describe('saveDotComDepplinkDestinationToSearchStore', () => {
        const getDestinationByDotComCodes = jest.spyOn(offersService, 'getDestinationByDotComCodes');
        const destinations = '';

        const stores = createMockStores({
            searchStore: {
                searchTo: {
                    setSelectedDestinationCodes: jest.fn(),
                    addDestination: jest.fn(),
                },
            },
        });

        beforeEach(() => {
            jest.resetAllMocks();
        });

        it('should call saveDotComDepplinkDestinationToSearchStore when resorts are NOT empty', async () => {
            getDestinationByDotComCodes.mockResolvedValue({
                countries: ['country'],
                regions: ['region'],
                resorts: ['resort'],
            });

            await saveDotComDepplinkDestinationToSearchStore(destinations, stores.searchStore);

            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).toHaveBeenCalledWith([]);
            expect(stores.searchStore.searchTo.addDestination).toHaveBeenCalledWith({
                code: 'resort',
                name: '',
                type: DestinationType.Resort,
                parents: [
                    {
                        code: '',
                        name: '',
                        type: DestinationType.VirtualCountry,
                        relatedRegions: ['region'],
                        parents: [
                            {
                                code: 'country',
                                name: '',
                                type: DestinationType.Country,
                            },
                        ],
                    },
                ],
            });
        });

        it('should call saveDotComDepplinkDestinationToSearchStore when regions are NOT empty', async () => {
            getDestinationByDotComCodes.mockResolvedValue({
                countries: ['country'],
                regions: ['region'],
                resorts: [],
            });

            await saveDotComDepplinkDestinationToSearchStore(destinations, stores.searchStore);

            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).toHaveBeenCalledWith([]);
            expect(stores.searchStore.searchTo.addDestination).toHaveBeenCalledWith({
                code: 'region',
                name: '',
                type: DestinationType.Region,
                parents: [
                    {
                        code: 'country',
                        name: '',
                        type: DestinationType.Country,
                        parents: [],
                    },
                ],
            });
        });

        it('should call saveDotComDepplinkDestinationToSearchStore when countries are NOT empty', async () => {
            getDestinationByDotComCodes.mockResolvedValue({
                countries: ['country'],
                regions: [],
                resorts: [],
            });

            await saveDotComDepplinkDestinationToSearchStore(destinations, stores.searchStore);

            expect(stores.searchStore.searchTo.setSelectedDestinationCodes).toHaveBeenCalledWith([]);
            expect(stores.searchStore.searchTo.addDestination).toHaveBeenCalledWith({
                code: 'country',
                name: '',
                type: DestinationType.Country,
                parents: [],
            });
        });
    });
});
