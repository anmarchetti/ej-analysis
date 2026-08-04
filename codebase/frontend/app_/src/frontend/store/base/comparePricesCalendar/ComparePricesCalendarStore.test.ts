import { toJS } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import { mockedOffer } from 'frontend/__mocks__/offer';
import comparePricesCalendarService from 'frontend/services/comparePricesCalendar.service';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IUnit } from 'models/data/IOffer';

import { ComparePricesCalendarStore, FreeForKidsChangeState, NewOfferState } from './ComparePricesCalendarStore';

jest.mock('frontend/services/comparePricesCalendar.service');
jest.mock('frontend/utils/url.utils', () => ({
    buildRoomAllocationFromOfferUnitParams: () => roomAllocation,
    getAccommodationIdsString: () => 'accommodationIds',
}));

const roomAllocation = [{ adults: 2, children: 0, infants: 0, roomCode: 'roomCode', childrenAges: [] }];

describe('ComparePricesCalendarStore', () => {
    const createRootStore = () =>
        ({
            layoutStore: {
                isHotelDetailsBookPage: true,
                isCheapestComparePriceOption: false,
            },
            appStore: {
                isScreenMedium: true,
            },
            searchStore: {
                searchWhen: {
                    from: new Date('2022-01-01'),
                },
            },
            alternativeFlightsStore: {
                departureAirportsQuery: 'departureAirportsQuery',
                selectedOutboundDepTimes: [
                    {
                        start: 'outbound deperture start time',
                        end: 'outbound deperture end time',
                    },
                ],
                selectedInboundDepTimes: [{ start: 'inbound deperture start time', end: 'inbound deperture end time' }],
            },
            bookingStore: {
                boardTypeCode: 'boardTypeCode',
                selectedOffer: mockedOffer,
            },
            queryParamsStore: {
                selectedAccommodationCodesFromUrl: 'code1,code2',
                accommodationIdFromUrl: 'code1',
                altAccommodationsFromUrl: [{ accomCode: 'code3', packageId: 'id' }],
            },
        } as any);
    let rootStore = {} as any;

    beforeEach(() => {
        rootStore = createRootStore();
    });

    describe('callLoadAlternativeOffers', () => {
        test('call loadAlternativeOffers', () => {
            const store = new ComparePricesCalendarStore(rootStore);
            const startDate = new Date('2022-05-14');
            const endDate = new Date('2022-05-19');

            comparePricesCalendarService.loadAlternativeOffers = jest.fn();

            store['callLoadAlternativeOffers'](mockedOffer, startDate, endDate);

            expect(comparePricesCalendarService.loadAlternativeOffers).toBeCalledWith(
                store.rootStore.searchStore.searchWhen.from,
                startDate,
                endDate,
                0,
                mockedOffer.stay,
                store.rootStore.alternativeFlightsStore.departureAirportsQuery,
                roomAllocation,
                'accommodationIds',
                store.rootStore.bookingStore.boardTypeCode,
                store.rootStore.alternativeFlightsStore.selectedOutboundDepTimes,
                store.rootStore.alternativeFlightsStore.selectedInboundDepTimes,
                false,
            );
        });

        test('should ignore selectedAccommodationCodesFromUrl when it is empty', () => {
            rootStore.queryParamsStore.selectedAccommodationCodesFromUrl = '';

            const store = new ComparePricesCalendarStore(rootStore);
            const startDate = new Date('2022-05-14');
            const endDate = new Date('2022-05-19');

            comparePricesCalendarService.loadAlternativeOffers = jest.fn();

            store['callLoadAlternativeOffers'](mockedOffer, startDate, endDate);

            expect(comparePricesCalendarService.loadAlternativeOffers).toBeCalledWith(
                store.rootStore.searchStore.searchWhen.from,
                startDate,
                endDate,
                0,
                mockedOffer.stay,
                store.rootStore.alternativeFlightsStore.departureAirportsQuery,
                roomAllocation,
                'accommodationIds',
                store.rootStore.bookingStore.boardTypeCode,
                store.rootStore.alternativeFlightsStore.selectedOutboundDepTimes,
                store.rootStore.alternativeFlightsStore.selectedInboundDepTimes,
                false,
            );
        });

        test('should call loadAlternativeOffers with isCheapestRoom=true when layoutStore.isCheapestComparePriceOption is true', () => {
            rootStore.layoutStore.isCheapestComparePriceOption = true;

            const store = new ComparePricesCalendarStore(rootStore);
            const startDate = new Date('2022-05-14');
            const endDate = new Date('2022-05-19');

            comparePricesCalendarService.loadAlternativeOffers = jest.fn();

            store['callLoadAlternativeOffers'](mockedOffer, startDate, endDate);

            expect(comparePricesCalendarService.loadAlternativeOffers).toBeCalledWith(
                store.rootStore.searchStore.searchWhen.from,
                startDate,
                endDate,
                0,
                mockedOffer.stay,
                store.rootStore.alternativeFlightsStore.departureAirportsQuery,
                roomAllocation,
                'accommodationIds',
                store.rootStore.bookingStore.boardTypeCode,
                store.rootStore.alternativeFlightsStore.selectedOutboundDepTimes,
                store.rootStore.alternativeFlightsStore.selectedInboundDepTimes,
                true,
            );
        });

        test('should call loadAlternativeOffers with isCheapestRoom=false when layoutStore.isCheapestComparePriceOption is false', () => {
            rootStore.layoutStore.isCheapestComparePriceOption = false;

            const store = new ComparePricesCalendarStore(rootStore);
            const startDate = new Date('2022-05-14');
            const endDate = new Date('2022-05-19');

            comparePricesCalendarService.loadAlternativeOffers = jest.fn();

            store['callLoadAlternativeOffers'](mockedOffer, startDate, endDate);

            expect(comparePricesCalendarService.loadAlternativeOffers).toBeCalledWith(
                store.rootStore.searchStore.searchWhen.from,
                startDate,
                endDate,
                0,
                mockedOffer.stay,
                store.rootStore.alternativeFlightsStore.departureAirportsQuery,
                roomAllocation,
                'accommodationIds',
                store.rootStore.bookingStore.boardTypeCode,
                store.rootStore.alternativeFlightsStore.selectedOutboundDepTimes,
                store.rootStore.alternativeFlightsStore.selectedInboundDepTimes,
                false,
            );
        });
    });

    describe('loadAlternativeOffers', () => {
        test('if no selected offer do nothing', () => {
            const store = new ComparePricesCalendarStore(rootStore);

            store.rootStore.bookingStore.selectedOffer = null;
            store.isNeedLoadOffers = jest.fn();
            store['callLoadAlternativeOffers'] = jest.fn();
            store.updateBestPriceOffers = jest.fn();

            store.loadAlternativeOffers();

            expect(store.isNeedLoadOffers).not.toBeCalled();
            expect(store['callLoadAlternativeOffers']).not.toBeCalled();
            expect(store.updateBestPriceOffers).not.toBeCalled();
        });

        test('if not needed to load offers do nothing', () => {
            const store = new ComparePricesCalendarStore(rootStore);
            const startDate = new Date('2022-01-01');
            const endDate = new Date('2022-01-10');

            store.isNeedLoadOffers = jest.fn().mockReturnValue(false);
            store['callLoadAlternativeOffers'] = jest.fn();
            store.updateBestPriceOffers = jest.fn();

            store.loadAlternativeOffers(startDate, endDate);

            expect(store.isNeedLoadOffers).toBeCalledWith(startDate, endDate);
            expect(store['callLoadAlternativeOffers']).not.toBeCalled();
            expect(store.updateBestPriceOffers).not.toBeCalled();
        });

        test('load offers for the first time', async () => {
            const store = new ComparePricesCalendarStore(rootStore);
            const startDate = new Date('2022-01-01');
            const endDate = new Date('2022-01-10');
            const alternativeOffers = [
                {
                    offers: [
                        { date: '2022-01-01', price: 1000, pricePP: 500 },
                        { date: '2022-01-02', price: 2000, pricePP: 1000 },
                    ],
                },
                {
                    offers: [
                        { date: '2022-02-01', price: 1000, pricePP: 500 },
                        { date: '2022-02-02', price: 2000, pricePP: 1000 },
                    ],
                },
            ];
            const datesForFirstLoading = [
                [new Date('2022-01-01'), new Date('2022-02-01')],
                [new Date('2022-02-15'), new Date('2022-03-01')],
            ];

            store.isNeedLoadOffers = jest.fn().mockReturnValue(true);
            store['callLoadAlternativeOffers'] = jest
                .fn()
                .mockResolvedValueOnce(alternativeOffers[0])
                .mockResolvedValueOnce(alternativeOffers[1]);
            store.getDatesForFirstLoading = jest.fn().mockReturnValue(datesForFirstLoading);
            store.updateBestPriceOffers = jest.fn();

            const promise = store.loadAlternativeOffers(startDate, endDate);

            expect(store.isNeedLoadOffers).toBeCalledWith(startDate, endDate);
            expect(store.isLoadingAlternativeDates).toBeTruthy();

            await promise;

            expect(store.getDatesForFirstLoading).toBeCalledWith(
                new Date(store.rootStore.bookingStore.selectedOffer?.date || '2022-01-01'),
            );
            expect(store['callLoadAlternativeOffers']).toBeCalledWith(
                store.rootStore.bookingStore.selectedOffer,
                datesForFirstLoading[0][0],
                datesForFirstLoading[0][1],
            );
            expect(store['callLoadAlternativeOffers']).toBeCalledWith(
                store.rootStore.bookingStore.selectedOffer,
                datesForFirstLoading[1][0],
                datesForFirstLoading[1][1],
            );
            expect(store.alternativeOffers).toEqual(alternativeOffers[0].offers.concat(alternativeOffers[1].offers));
            expect(store.updateBestPriceOffers).toBeCalledWith(
                toJS(alternativeOffers[0].offers.concat(alternativeOffers[1].offers)),
            );
            expect(store.isLoadingAlternativeDates).toBeFalsy();
        });

        test('if load offers for next month add result to the end', async () => {
            const store = new ComparePricesCalendarStore(rootStore);
            const startDate = new Date('2022-03-01');
            const endDate = new Date('2022-03-31');
            const loadedOffers = {
                offers: [
                    { date: '2022-03-01', price: 1000, pricePP: 500 },
                    { date: '2022-03-31', price: 2000, pricePP: 1000 },
                ] as IAlternativeOffer[],
            };
            const initialOffers = [
                { date: '2022-01-01', price: 1000, pricePP: 500 },
                { date: '2022-01-02', price: 2000, pricePP: 1000 },
            ] as IAlternativeOffer[];

            store.alternativeOffers = initialOffers;
            store.isNeedLoadOffers = jest.fn().mockReturnValue(true);
            store['callLoadAlternativeOffers'] = jest.fn().mockResolvedValue(loadedOffers);
            store.getDatesForFirstLoading = jest.fn();
            store.updateBestPriceOffers = jest.fn();

            const promise = store.loadAlternativeOffers(startDate, endDate);

            expect(store.isNeedLoadOffers).toBeCalledWith(startDate, endDate);
            expect(store.isLoadingAlternativeDates).toBeTruthy();

            await promise;

            expect(store.getDatesForFirstLoading).not.toBeCalled();
            expect(store['callLoadAlternativeOffers']).toBeCalledWith(
                store.rootStore.bookingStore.selectedOffer,
                startDate,
                endDate,
            );
            expect(store.alternativeOffers).toEqual(initialOffers.concat(loadedOffers.offers));
            expect(store.updateBestPriceOffers).toBeCalledWith(loadedOffers.offers);
            expect(store.isLoadingAlternativeDates).toBeFalsy();
        });

        test('if load offers for previous month add result to the begining', async () => {
            const store = new ComparePricesCalendarStore(rootStore);
            const startDate = new Date('2022-01-01');
            const endDate = new Date('2022-01-10');
            const loadedOffers = {
                offers: [
                    { date: '2022-01-01', price: 1000, pricePP: 500 },
                    { date: '2022-01-10', price: 2000, pricePP: 1000 },
                ],
            };
            const initialOffers = [
                { date: '2022-02-01', price: 1000, pricePP: 500 },
                { date: '2022-02-28', price: 2000, pricePP: 1000 },
            ] as IAlternativeOffer[];

            store.alternativeOffers = initialOffers;
            store.isNeedLoadOffers = jest.fn().mockReturnValue(true);
            store['callLoadAlternativeOffers'] = jest.fn().mockResolvedValue(loadedOffers);
            store.getDatesForFirstLoading = jest.fn();
            store.updateBestPriceOffers = jest.fn();

            const promise = store.loadAlternativeOffers(startDate, endDate);

            expect(store.isNeedLoadOffers).toBeCalledWith(startDate, endDate);
            expect(store.isLoadingAlternativeDates).toBeTruthy();

            await promise;

            expect(store.getDatesForFirstLoading).not.toBeCalled();
            expect(store['callLoadAlternativeOffers']).toBeCalledWith(
                store.rootStore.bookingStore.selectedOffer,
                startDate,
                endDate,
            );
            expect(store.alternativeOffers).toEqual(loadedOffers.offers.concat(initialOffers));
            expect(store.updateBestPriceOffers).toBeCalledWith(loadedOffers.offers);
            expect(store.isLoadingAlternativeDates).toBeFalsy();
        });
    });

    describe('getDatesForFirstLoading', () => {
        test('get dates for desktop view', () => {
            const store = new ComparePricesCalendarStore(rootStore);

            const dates = store.getDatesForFirstLoading(new Date('2022-01-01'));

            expect(dates[0][0]).toEqual(new Date('2021-12-01T00:00:00'));
            expect(dates[0][1]).toEqual(new Date('2022-01-31T00:00:00'));

            expect(dates[1][0]).toEqual(new Date('2022-02-01T00:00:00'));
            expect(dates[1][1]).toEqual(new Date('2022-03-31T00:00:00'));
        });

        test('get dates for desktop view', () => {
            rootStore.appStore.isScreenMedium = false;
            const store = new ComparePricesCalendarStore(rootStore);

            const dates = store.getDatesForFirstLoading(new Date('2022-01-01'));

            expect(dates[0][0]).toEqual(new Date('2021-12-01T00:00:00'));
            expect(dates[0][1]).toEqual(new Date('2022-02-28T00:00:00'));
        });
    });

    describe('isNeedLoadOffers', () => {
        test('return true if no start, end dates and no offers are loaded', () => {
            const store = new ComparePricesCalendarStore(rootStore);

            const result = store.isNeedLoadOffers();

            expect(result).toBeTruthy();
        });

        test('return true if date of first alternative offer is bigger than start date', () => {
            const store = new ComparePricesCalendarStore(rootStore);
            store.alternativeOffers = [{ date: '2022-02-01' } as IAlternativeOffer];

            const result = store.isNeedLoadOffers(new Date('2022-01-01'), new Date('2022-01-31'));

            expect(result).toBeTruthy();
        });

        test('return true if date of last alternative offer is smaller than end date', () => {
            const store = new ComparePricesCalendarStore(rootStore);
            store.alternativeOffers = [{ date: '2022-02-01' } as IAlternativeOffer];

            const result = store.isNeedLoadOffers(new Date('2022-02-01'), new Date('2022-03-31'));

            expect(result).toBeTruthy();
        });
    });

    describe('changesRequired', () => {
        const date = new Date('2022-01-01');
        let store;

        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(new Date('2022-02-01'));
            rootStore.bookingStore.selectedOffer.date = formatDateL10n(
                new Date('2023-01-01'),
                DATE_FORMATS.dateWithTime,
            );
            store = new ComparePricesCalendarStore(rootStore);
            jest.spyOn(store, 'freeForKidsChangeState').mockReturnValue(FreeForKidsChangeState.Stable);
            jest.spyOn(store, 'getAlternativeAndSelectedOffersInfo').mockReturnValue({
                offer: {} as IAlternativeOffer,
                items: [],
            });
        });

        it('should return false when getAlternativeAndSelectedOffersInfo does NOT return offer', () => {
            jest.spyOn(store, 'getAlternativeAndSelectedOffersInfo').mockReturnValue({
                offer: undefined,
                items: [],
            });

            expect(store.changesRequired(undefined, [], date)).toBe(false);
        });

        it('should return false when getAlternativeAndSelectedOffersInfo does NOT return items', () => {
            jest.spyOn(store, 'getAlternativeAndSelectedOffersInfo').mockReturnValue({
                offer: {} as IAlternativeOffer,
                items: undefined as unknown as IUnit[],
            });

            expect(store.changesRequired({} as IAlternativeOffer, undefined as unknown as IUnit[], date)).toBe(false);
        });

        it('should return true when getBoardAlteration returns items', () => {
            const mockOffer = {} as IAlternativeOffer;
            const mockItems = [] as IUnit[];
            jest.spyOn(store, 'getBoardAlteration').mockReturnValue([{ items: [] }]);

            expect(store.changesRequired(mockOffer, mockItems, date)).toBe(true);
        });

        it('should return true when getRoomAlterations returns items', () => {
            const mockOffer = {} as IAlternativeOffer;
            const mockItems = [] as IUnit[];
            jest.spyOn(store, 'getRoomAlterations').mockReturnValue([{ items: [] }]);

            expect(store.changesRequired(mockOffer, mockItems, date)).toBe(true);
        });

        it('should return true when freeForKidsChangeState is FreeForKidsChangeState.Removed', () => {
            const mockOffer = {} as IAlternativeOffer;
            const mockItems = [] as IUnit[];
            jest.spyOn(store, 'freeForKidsChangeState').mockReturnValue(FreeForKidsChangeState.Removed);

            expect(store.changesRequired(mockOffer, mockItems, date)).toBe(true);
        });

        it('should return false when freeForKidsChangeState is NOT FreeForKidsChangeState.Removed', () => {
            const mockOffer = {} as IAlternativeOffer;
            const mockItems = [] as IUnit[];
            jest.spyOn(store, 'freeForKidsChangeState').mockReturnValue(FreeForKidsChangeState.Stable);

            expect(store.changesRequired(mockOffer, mockItems, date)).toBe(false);

            jest.spyOn(store, 'freeForKidsChangeState').mockReturnValue(FreeForKidsChangeState.Gained);

            expect(store.changesRequired(mockOffer, mockItems, date)).toBe(false);
        });

        it('should return false when selected date is the same as date from props', () => {
            rootStore.bookingStore.selectedOffer.date = formatDateL10n(date, DATE_FORMATS.dateWithTime);

            const store = new ComparePricesCalendarStore(rootStore);
            const mockOffer = {} as IAlternativeOffer;
            const mockItems = [] as IUnit[];
            jest.spyOn(store, 'getBoardAlteration').mockReturnValue([{ items: [] }]);

            expect(store.changesRequired(mockOffer, mockItems, date)).toBe(false);
        });

        it('should return false when isFreeKidsChangeDisabled is true and only free kids state changed', () => {
            const mockOffer = {} as IAlternativeOffer;
            const mockItems = [] as IUnit[];
            jest.spyOn(store, 'freeForKidsChangeState').mockReturnValue(FreeForKidsChangeState.Removed);

            expect(store.changesRequired(mockOffer, mockItems, date, true)).toBe(false);
        });
    });

    describe('getRoomAlterations', () => {
        let store;
        const title = mockSitecoreField('title');
        const subtitle = mockSitecoreField('subtitle');
        const text = mockSitecoreField('text');
        const offer = {
            rooms: [{ roomType: { code: '1' } }, { roomType: { code: '2' } }, { roomType: { code: '3' } }],
        };
        const items = [
            {
                roomType: { code: '1', title: 'title 1', images: [{ small: 'small 1' }] },
            },
            {
                roomType: { code: '3', title: 'title 3', images: [{ small: 'small 3' }] },
            },
        ];

        beforeEach(() => {
            store = new ComparePricesCalendarStore(rootStore);
        });

        it('should return correct room alteration', () => {
            expect(store.getRoomAlterations(offer, items, title, subtitle, text)).toStrictEqual([
                {
                    isBoardAlteration: false,
                    items: [
                        {
                            isKidsPlaceWilBeRemoved: false,
                            newItem: {
                                item: offer.rooms[1],
                                roomIdx: 1,
                            },
                            oldItemImgSrc: 'small 3',
                            oldItemName: 'title 3',
                        },
                    ],
                    subtitle: subtitle,
                    text: text,
                    title: title,
                },
            ]);
        });

        it('should return empty array when offer.rooms are NOT provided', () => {
            expect(store.getRoomAlterations({}, items, title, subtitle, text)).toStrictEqual([]);
        });
    });

    describe('getBoardAlteration', () => {
        let store;
        const title = mockSitecoreField('title');
        const subtitle = mockSitecoreField('subtitle');
        const text = mockSitecoreField('text');
        const offer = {
            board: '2',
            boardType: {},
        };
        const items = [
            {
                board: '1',
                boardType: { title: 'title 1', iconUrl: 'icon 1' },
            },
        ];

        beforeEach(() => {
            store = new ComparePricesCalendarStore(rootStore);
        });

        it('should return correct board alteration', () => {
            expect(store.getBoardAlteration(offer, items, title, subtitle, text)).toStrictEqual([
                {
                    items: [
                        {
                            oldItemImgSrc: items[0].boardType.iconUrl,
                            oldItemName: items[0].boardType.title,
                            newItem: {
                                item: offer?.boardType,
                            },
                        },
                    ],
                    title: title,
                    subtitle: subtitle,
                    text: text,
                    isBoardAlteration: true,
                },
            ]);
        });

        it('should return empty array when offer.boardType is NOT provided', () => {
            expect(store.getBoardAlteration({}, items, title, subtitle, text)).toStrictEqual([]);
        });

        it('should return empty array when offer.board is equal to items board', () => {
            offer.board = '1';

            expect(store.getBoardAlteration(offer, items, title, subtitle, text)).toStrictEqual([]);
        });

        it('should return empty array when items does NOT contain boardType', () => {
            expect(store.getBoardAlteration(offer, [{ board: '1' }], title, subtitle, text)).toStrictEqual([]);
        });
    });

    describe('freeForKidsChangeState', () => {
        let store;
        const offer = {
            rooms: [{ isFreeForKids: false }, { isFreeForKids: true }],
        };
        const items = [{ isFreeForKids: false }, { isFreeForKids: true }];

        beforeEach(() => {
            store = new ComparePricesCalendarStore(rootStore);
        });

        it('should return Stable state when offer is NOT provided', () => {
            expect(store.freeForKidsChangeState({}, items)).toBe(FreeForKidsChangeState.Stable);
        });

        it('should return Stable state when items are NOT provided', () => {
            expect(store.freeForKidsChangeState(offer, undefined)).toBe(FreeForKidsChangeState.Stable);
        });

        it('should return Stable state when items and offer isFreeForKids are the same', () => {
            expect(store.freeForKidsChangeState(offer, items)).toBe(FreeForKidsChangeState.Stable);
        });

        it('should return Removed state when isFreeForKids from items are removed', () => {
            offer.rooms[1].isFreeForKids = false;

            expect(store.freeForKidsChangeState(offer, items)).toBe(FreeForKidsChangeState.Removed);
        });

        it('should return Gained state when isFreeForKids from offers are removed', () => {
            offer.rooms[1].isFreeForKids = true;
            offer.rooms[0].isFreeForKids = true;

            expect(store.freeForKidsChangeState(offer, items)).toBe(FreeForKidsChangeState.Gained);
        });
    });

    describe('getAlternativeOfferPrice', () => {
        let store;

        beforeEach(() => {
            store = new ComparePricesCalendarStore(rootStore);
        });

        it('should return price', () => {
            const mockOffer = { price: 10 } as IAlternativeOffer;

            expect(store.getAlternativeOfferPrice(mockOffer)).toBe(10);
        });

        it('should return 0 when price is NOT provided', () => {
            const mockOffer = { price: undefined } as unknown as IAlternativeOffer;

            expect(store.getAlternativeOfferPrice(mockOffer)).toBe(0);
        });

        it('should return 0 when offer is undefined', () => {
            expect(store.getAlternativeOfferPrice(undefined)).toBe(0);
        });
    });

    describe('setNewOfferState', () => {
        let store;

        beforeEach(() => {
            store = new ComparePricesCalendarStore(rootStore);
        });

        it('should change the value of newOfferState to accepted', () => {
            expect(store.newOfferState).toBe(NewOfferState.NoChange);

            store.setNewOfferState(NewOfferState.Accepted);

            expect(store.newOfferState).toBe(NewOfferState.Accepted);
        });

        it('should change the value of newOfferState to error', () => {
            expect(store.newOfferState).toBe(NewOfferState.NoChange);

            store.setNewOfferState(NewOfferState.Error);

            expect(store.newOfferState).toBe(NewOfferState.Error);
        });
    });

    describe('handleNewOfferError', () => {
        let store;

        beforeEach(() => {
            store = new ComparePricesCalendarStore(rootStore);
            store.setNewOfferState = jest.fn();
        });

        it('should NOT call setNewOfferState when isHotelDetailsBookPage is true', () => {
            store.newOfferState = NewOfferState.Accepted;

            store.handleNewOfferError();

            expect(store.setNewOfferState).not.toHaveBeenCalled();
        });

        it('should NOT call setNewOfferState when newOfferState is NoChange', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = false;

            store.handleNewOfferError();

            expect(store.setNewOfferState).not.toHaveBeenCalled();
        });

        it('should call setNewOfferState when isHotelDetailsBookPage is false and newOfferState is Accepted', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = false;
            store.newOfferState = NewOfferState.Accepted;

            store.handleNewOfferError();

            expect(store.setNewOfferState).toHaveBeenCalledWith(NewOfferState.NoChange);
        });
    });

    describe('resetToInitial', () => {
        let store;

        beforeEach(() => {
            store = new ComparePricesCalendarStore(rootStore);
        });

        it('should reset alternativeOffers', () => {
            store.alternativeOffers = [{}, {}];

            store.resetToInitial();

            expect(store.alternativeOffers).toStrictEqual([]);
        });
    });

    describe('rerenderMap', () => {
        let store;

        beforeEach(() => {
            store = new ComparePricesCalendarStore(rootStore);
        });

        it('should call Math.random and set value of mapRerenderTrigger', () => {
            const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(1);
            store.mapRerenderTrigger = 2;

            store.rerenderMap();

            expect(mockRandom).toHaveBeenCalled();
            expect(store.mapRerenderTrigger).toStrictEqual(1);
        });
    });
});
