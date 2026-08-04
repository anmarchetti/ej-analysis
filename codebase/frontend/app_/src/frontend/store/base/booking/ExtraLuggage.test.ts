import { CurrencyCode, SignDisplay } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import {
    bookingExtrasMock,
    cabinBagsMock,
    extraLuggageInfoMock,
    generateLuggageInfoItemMock,
    luggageInfoMock,
    luggageInfoMockAlt,
    luggagePricesMock,
    luggageTypesMock,
    mockDefaultBags,
    smallSportEquipmentMock,
} from 'frontend/__mocks__/extraLuggage';
import { ExtraLuggage } from 'frontend/store/base/booking/ExtraLuggage';
import * as utils from 'frontend/utils/luggage.utils';
import { buildLuggageQuery } from 'frontend/utils/url.utils';
import { HoldLuggageCategory } from 'models/enum/HoldLuggage';
import { EventTypes } from 'models/enum/tracking/EventTypes';

const lugObj = {
    description: 'Description',
    icon: 'src',
    name: '23kg Extra Hold Bag',
    quantity: 1,
};
const bikeObj = {
    description: 'Description',
    icon: 'src',
    name: 'Bike',
    quantity: 1,
};

const extraLuggageInfoWithDefaultBags = {
    items: [
        generateLuggageInfoItemMock('2', '1', 'GBAG', 'SEC', 1, 37),
        generateLuggageInfoItemMock('1', '1', 'GBAG', 'SEC', 1, 37),
        generateLuggageInfoItemMock('2', '2', 'BIKE', 'SEO', 1, 45),
        generateLuggageInfoItemMock('1', '2', 'BIKE', 'SEO', 1, 45),
        ...mockDefaultBags,
    ],
};

jest.mock('frontend/utils/luggage.utils', () => ({
    generateExtraLuggageFullInfo: jest.fn().mockReturnValue([{ LUG: lugObj }, { BIKE: bikeObj }]),
    generateLargeSportEquipmentInfo: jest.fn().mockReturnValue({ BIKE: bikeObj }),
    generateSmallSportEquipmentInfo: jest.fn().mockReturnValue({ GBAG: 2 }),
}));

jest.mock('frontend/utils/url.utils', () => ({
    __esModule: true,
    buildLuggageQuery: jest.fn(luggage => (Object.keys(luggage).length ? 'luggageQuery' : undefined)),
}));

const createRootStore = () =>
    createMockStores({
        flightsPassengersStore: { clearAllPassengersLCB: jest.fn() },
        queryParamsStore: {
            luggageSelectionFromUrl: { LUG: 3 },
            sportEquipmentSelectionFromUrl: { BIKE: 3, GBAG: 2 },
            outboundLCBSelectionFromUrl: '1|2|3',
            inboundLCBSelectionFromUrl: '4|5|6',
            updatePageWithLCBQuery: jest.fn(),
            buildHotelDetailsQuery: jest.fn(() => 'hotelDetailsQuery'),
        },
        guestDetailsStore: {
            adultsAndChildrenNumber: 3,
        },
        layoutStore: {
            isExtraLuggageEnabled: true,
            isConfirmationPage: false,
            isViewBookingPage: false,
            holdLuggageCategoryCodes: ['BAGE'],
            sportEquipmentCategoryCodes: ['SEO', 'SEC'],
            largeCabinBagCode: 'SCB1',
            largeSportEquipmentCategoryCode: 'SEO',
            maxNumberOfAdditionalLuggage: 3,
            maxNumberOfSportEquipments: 1,
            maxNumberOfLargeSportsEquipment: 6,
        },
        searchStore: {
            searchWho: { totalPaidGuestPlaces: 3 },
        },
        bookingStore: {
            isFlightExternal: true,
            selectedOffer: {
                extraLuggageInfo: extraLuggageInfoWithDefaultBags,
            },
            togglePriceManipulating: jest.fn(),
            validatePackage: jest.fn(),
            showSEAccommodationPopupIfNeeded: jest.fn(),
        },
        marketStore: {
            currency: CurrencyCode.GBP,
        },
        trackingStore: { trackLCBChange: jest.fn(), trackBookingExtrasUpdate: jest.fn() },
        routerStore: { updateCurrentPage: jest.fn() },
    });

describe('ExtraLuggage', () => {
    let rootStore: any = createRootStore();
    let store: ExtraLuggage;

    beforeEach(() => {
        jest.restoreAllMocks();
        rootStore = createRootStore();
        store = new ExtraLuggage(rootStore);
    });

    describe('cheapestLuggage', () => {
        it('should execute getCheapestLuggage and return its value after calling cheapestHoldLuggage', () => {
            store.getCheapestLuggage = jest.fn().mockReturnValueOnce(13);

            expect(store.cheapestHoldLuggage).toBe(13);
            expect(store.getCheapestLuggage).toHaveBeenCalledWith(HoldLuggageCategory.Bag);
        });

        it('should execute getCheapestLuggage and return its value after calling cheapestSportLuggage', () => {
            store.getCheapestLuggage = jest.fn().mockReturnValueOnce(50);

            expect(store.cheapestSportLuggage).toBe(50);
            expect(store.getCheapestLuggage).toHaveBeenCalledWith(HoldLuggageCategory.SportBag);
        });
    });

    describe('convertExtraLuggage', () => {
        it('should return undefined if luggage is not provided', () => {
            const roomsAllocation = [
                {
                    adults: 2,
                    children: 0,
                    childrenAges: [],
                    infants: 0,
                    roomCode: 'ANY',
                },
            ];
            const isSportEquipment = false;

            expect(store.convertExtraLuggage(roomsAllocation, isSportEquipment)).toEqual(undefined);
        });

        it('should be executed successfully for several room allocation with no children', () => {
            const roomsAllocation = [
                {
                    adults: 1,
                    children: 0,
                    childrenAges: [],
                    infants: 0,
                    roomCode: 'ANY',
                },
                {
                    adults: 1,
                    children: 0,
                    childrenAges: [],
                    infants: 0,
                    roomCode: 'ANY',
                },
            ];
            const isSportEquipment = false;
            const luggage = { LUG: 4 };

            expect(store.convertExtraLuggage(roomsAllocation, isSportEquipment, luggage)).toEqual({
                adultsLuggage: { LUG: 4 },
                childrenLuggage: {},
            });
        });

        it('should be executed successfully for several room allocation with children', () => {
            const roomsAllocation = [
                {
                    adults: 1,
                    children: 0,
                    childrenAges: [],
                    infants: 0,
                    roomCode: 'ANY',
                },
                {
                    adults: 1,
                    children: 1,
                    childrenAges: [],
                    infants: 0,
                    roomCode: 'ANY',
                },
            ];
            const isSportEquipment = true;
            const luggage = { BIKE: 3 };

            expect(store.convertExtraLuggage(roomsAllocation, isSportEquipment, luggage)).toEqual({
                adultsLuggage: { BIKE: 2 },
                childrenLuggage: { BIKE: 1 },
            });
        });

        it('should be executed successfully for several room allocation with children with different luggage', () => {
            const roomsAllocation = [
                {
                    adults: 2,
                    children: 2,
                    childrenAges: [],
                    infants: 0,
                    roomCode: 'ANY',
                },
                {
                    adults: 1,
                    children: 1,
                    childrenAges: [],
                    infants: 0,
                    roomCode: 'ANY',
                },
            ];
            const isSportEquipment = false;
            const luggage = { LUG: 12, LUS: 3, CUM: 3 };

            expect(store.convertExtraLuggage(roomsAllocation, isSportEquipment, luggage)).toEqual({
                adultsLuggage: { CUM: 0, LUG: 9, LUS: 0 },
                childrenLuggage: { CUM: 3, LUG: 3, LUS: 3 },
            });
        });
    });

    describe('selectionFromUrl', () => {
        it('should get luggageSelectionFromUrl', () => {
            const selection = store.luggageSelectionFromUrl;

            expect(selection).toEqual({ LUG: 3 });
        });

        it('should get sportEquipmentSelectionFromUrl', () => {
            const selection = store.sportEquipmentSelectionFromUrl;

            expect(selection).toEqual({ BIKE: 3, GBAG: 2 });
        });

        it('should return total number for all selected bags after calling selectedLuggageNumberFromUrl', () => {
            jest.spyOn(store, 'luggageSelectionFromUrl', 'get').mockReturnValue({
                bag1: 2,
                bag2: 3,
                bag3: 10,
            });

            expect(store.selectedLuggageNumberFromUrl).toBe(15);
        });

        it('should return total number for all selected equipments after calling selectedSportEquipmentNumberFromUrl', () => {
            jest.spyOn(store, 'sportEquipmentSelectionFromUrl', 'get').mockReturnValue({
                bag1: 2,
                bag2: 3,
                bag3: 10,
            });

            expect(store.selectedSportEquipmentNumberFromUrl).toBe(15);
        });
    });

    describe('setBookingExtra', () => {
        it('should set booking extra', () => {
            expect(store.bookingExtras).toEqual(null);

            store.setBookingExtra(bookingExtrasMock);

            expect(store.bookingExtras).toEqual(bookingExtrasMock);
        });
    });

    describe('setExtraLuggageInfo', () => {
        it('should set extra luggage info', () => {
            const mockExtraLuggageInfo = {
                items: [],
            };
            expect(store.extraLuggageInfo).toEqual(null);

            store.setExtraLuggageInfo(mockExtraLuggageInfo);

            expect(store.extraLuggageInfo).toEqual(mockExtraLuggageInfo);
        });
    });

    describe('setLuggagePricesAndTypes', () => {
        it('should skip when no bookingExtras', () => {
            store.setLuggagePricesAndTypes();

            expect(store.luggagePrices).toEqual({});
            expect(store.luggageTypes).toEqual({});
            expect(store.cabinBagsPrices.length).toBe(0);
        });

        it('should set all luggage categories and names from booking extras and count and save price for each bag type', () => {
            store.bookingExtras = bookingExtrasMock;

            store.setLuggagePricesAndTypes();

            expect(store.luggageTypes).toEqual(luggageTypesMock);
            expect(store.luggagePrices).toEqual(luggagePricesMock);
            expect(store.cabinBagsPrices).toEqual([15.99, 15.99]);
        });
    });

    describe('actualizeLuggageParams', () => {
        const mockSelectedLuggage = { BAG: 5 };
        const mockSelectedSportEquipment = { BIKE: 3 };

        beforeEach(() => {
            store.generateExtraLuggageItems = jest.fn().mockReturnValue(luggageInfoMock.items);
            store.setExtraLuggageInfo = jest.fn();
            jest.spyOn(store, 'defaultBags', 'get').mockReturnValue(mockDefaultBags);
            jest.spyOn(store, 'existingLCBItems', 'get').mockReturnValue(cabinBagsMock.items);
        });

        it('should call all necessary function', async () => {
            await store.actualizeLuggageParams(mockSelectedLuggage, mockSelectedSportEquipment);

            expect(buildLuggageQuery).toHaveBeenNthCalledWith(1, mockSelectedLuggage);
            expect(buildLuggageQuery).toHaveBeenNthCalledWith(2, mockSelectedSportEquipment);
            expect(rootStore.queryParamsStore.buildHotelDetailsQuery).toHaveBeenCalledWith(undefined, {
                equip: 'luggageQuery',
                lug: 'luggageQuery',
            });
            expect(rootStore.routerStore.updateCurrentPage).toHaveBeenCalledWith('hotelDetailsQuery');
            expect(rootStore.trackingStore.trackBookingExtrasUpdate).toHaveBeenCalledWith(EventTypes.ExtrasBagsUpdate);
        });

        it('should skip adding luggage queries when selected luggages are empty', async () => {
            await store.actualizeLuggageParams({}, {});

            expect(buildLuggageQuery).toHaveBeenNthCalledWith(1, {});
            expect(buildLuggageQuery).toHaveBeenNthCalledWith(2, {});
            expect(rootStore.queryParamsStore.buildHotelDetailsQuery).toHaveBeenCalledWith(undefined, {
                equip: '',
                lug: '',
            });
        });
    });

    describe('confirmExtraLuggage', () => {
        const mockSelectedLuggage = { BAG: 5 };
        const mockSelectedSportEquipment = { BIKE: 3 };
        const onErrorMock = jest.fn();

        beforeEach(() => {
            store.generateExtraLuggageItems = jest.fn().mockReturnValue(luggageInfoMock.items);
            store.setExtraLuggageInfo = jest.fn();
            store.actualizeLuggageParams = jest.fn();
            jest.spyOn(store, 'defaultBags', 'get').mockReturnValue(mockDefaultBags);
            jest.spyOn(store, 'existingLCBItems', 'get').mockReturnValue(cabinBagsMock.items);
        });

        it('should call all necessary function', () => {
            store.confirmExtraLuggage(mockSelectedLuggage, mockSelectedSportEquipment, onErrorMock);

            expect(store.generateExtraLuggageItems).toHaveBeenCalledWith(
                mockSelectedLuggage,
                mockSelectedSportEquipment,
            );
            expect(store.setExtraLuggageInfo).toHaveBeenCalledWith({
                items: [...mockDefaultBags, ...cabinBagsMock.items, ...luggageInfoMock.items],
            });

            expect(rootStore.bookingStore.togglePriceManipulating).toHaveBeenCalledWith(true);
            expect(rootStore.bookingStore.validatePackage).toHaveBeenCalledWith(
                undefined,
                undefined,
                undefined,
                expect.any(Function),
                onErrorMock,
            );
        });

        describe('onSuccess', () => {
            it('should call actualizeLuggageParams AND showSEAccommodationPopupIfNeeded onSuccess', async () => {
                rootStore.bookingStore.validatePackage.mockImplementationOnce(
                    (_1, _2, _3, onSuccess) =>
                        new Promise(resolve => {
                            onSuccess();
                            resolve({});
                        }),
                );

                await store.confirmExtraLuggage(mockSelectedLuggage, mockSelectedSportEquipment, onErrorMock);

                expect(store.actualizeLuggageParams).toHaveBeenCalledWith(
                    mockSelectedLuggage,
                    mockSelectedSportEquipment,
                );
                expect(rootStore.bookingStore.showSEAccommodationPopupIfNeeded).toHaveBeenCalled();
            });
        });
    });

    describe('sportEquipmentNumber', () => {
        beforeEach(() => {
            store.extraLuggageInfo = luggageInfoMock;
        });

        it('should return 0 when extraLuggageInfo are an empty array', () => {
            store.extraLuggageInfo = null;

            expect(store.sportEquipmentNumber).toEqual(0);
        });

        it('should return valid number of sport equipment', () => {
            expect(store.sportEquipmentNumber).toEqual(1);
        });

        it('should NOT return 0 when there no are prices AND isConfirmationPage is true', () => {
            rootStore.layoutStore.isConfirmationPage = true;
            store.extraLuggageInfo = {
                items: luggageInfoMock.items.map(item => ({ ...item, price: 0 })),
            };

            expect(store.sportEquipmentNumber).toEqual(1);
        });

        it('should NOT return 0 when there are no prices AND isViewBookingPage is true', () => {
            rootStore.layoutStore.isViewBookingPage = true;
            store.extraLuggageInfo = {
                items: luggageInfoMock.items.map(item => ({ ...item, price: 0 })),
            };

            expect(store.sportEquipmentNumber).toEqual(1);
        });

        it('should return 0 when no prices AND isConfirmationPage is false AND isViewBookingPage is false', () => {
            store.extraLuggageInfo = {
                items: luggageInfoMock.items.map(item => ({ ...item, price: 0 })),
            };

            expect(store.sportEquipmentNumber).toEqual(0);
        });
    });

    describe('largeSportEquipmentNumber', () => {
        beforeEach(() => {
            store.extraLuggageInfo = {
                items: [
                    ...mockDefaultBags,
                    ...cabinBagsMock.items,
                    ...luggageInfoMock.items,
                    ...luggageInfoMock.items,
                    ...smallSportEquipmentMock.items,
                ],
            };
        });

        it('should return 0 when extraLuggageInfo does NOT exist', () => {
            store.extraLuggageInfo = null;

            expect(store.largeSportEquipmentNumber).toBe(0);
        });

        it('should return valid number of large sport equipment', () => {
            expect(store.largeSportEquipmentNumber).toBe(2);
        });
    });

    describe('getExtraLuggageProductsForTracking ', () => {
        it('should return an empty array when luggage is disabled', async () => {
            rootStore.layoutStore.isExtraLuggageEnabled = false;
            store.extraLuggageInfo = {
                items: luggageInfoMock.items.map(item => ({ ...item, price: 0 })),
            };

            const products = await store.getExtraLuggageProductsForTracking();

            expect(products).toEqual([]);
        });

        it('should return an empty array when no extraLuggageInfo', async () => {
            store.extraLuggageInfo = null;

            const products = await store.getExtraLuggageProductsForTracking();

            expect(products).toEqual([]);
        });

        it('should return luggage tracking products', async () => {
            store.extraLuggageInfo = luggageInfoMock;

            const products = await store.getExtraLuggageProductsForTracking();

            expect(products).toEqual([
                { price: 40, quantity: 1, routeId: '1', title: '23kg Extra Hold Bag' },
                { price: 90, quantity: 1, routeId: '1', title: 'Bike' },
                { price: 40, quantity: 1, routeId: '2', title: '23kg Extra Hold Bag' },
                { price: 90, quantity: 1, routeId: '2', title: 'Bike' },
            ]);
        });

        it('should group similar products', async () => {
            store.extraLuggageInfo = {
                items: [...luggageInfoMock.items, ...luggageInfoMock.items, ...luggageInfoMock.items],
            };

            const products = await store.getExtraLuggageProductsForTracking();

            expect(products).toEqual([
                { price: 40, quantity: 3, routeId: '1', title: '23kg Extra Hold Bag' },
                { price: 90, quantity: 3, routeId: '1', title: 'Bike' },
                { price: 40, quantity: 3, routeId: '2', title: '23kg Extra Hold Bag' },
                { price: 90, quantity: 3, routeId: '2', title: 'Bike' },
            ]);
        });

        it('should filter cabin bags from extra luggage', async () => {
            store.extraLuggageInfo = extraLuggageInfoMock;

            const products = await store.getExtraLuggageProductsForTracking();

            expect(products).toEqual([
                { price: 40, quantity: 1, routeId: '1', title: '23kg Extra Hold Bag' },
                { price: 90, quantity: 1, routeId: '1', title: 'Bike' },
                { price: 40, quantity: 1, routeId: '2', title: '23kg Extra Hold Bag' },
                { price: 90, quantity: 1, routeId: '2', title: 'Bike' },
            ]);
        });
    });

    describe('getLargeCabinBagsPriceByRoute ', () => {
        it('should skip when no extraLuggageInfo and no cabinBagsPrices', () => {
            store.extraLuggageInfo = { items: [] };
            store.cabinBagsPrices = [];
            expect(store.getLargeCabinBagsPriceByRoute(true)).toBeUndefined();
        });

        it('should return lcb price from outbound lcb item of extraLuggageInfo when isOutbound == true', () => {
            store.extraLuggageInfo = extraLuggageInfoMock;

            expect(store.getLargeCabinBagsPriceByRoute(true)).toBe(60);
        });

        it('should return lcb price from inbound lcb item of extraLuggageInfo when isOutbound == false', () => {
            store.extraLuggageInfo = extraLuggageInfoMock;

            expect(store.getLargeCabinBagsPriceByRoute(false)).toBe(30);
        });

        it('should return outbound cabin bags price when isOutbound == true and no extraLuggageInfo', () => {
            store.cabinBagsPrices = [15, 30];
            store.extraLuggageInfo = null;

            expect(store.getLargeCabinBagsPriceByRoute(true)).toBe(15);
        });

        it('should return return cabin bags price when isOutbound == false and no extraLuggageInfo', () => {
            store.cabinBagsPrices = [15, 30];
            store.extraLuggageInfo = null;

            expect(store.getLargeCabinBagsPriceByRoute(false)).toBe(30);
        });
    });

    describe('getLargeCabinBagsFormattedPrice ', () => {
        it('should skip when NO cabinBagsPrices', () => {
            expect(store.getLargeCabinBagsFormattedPrice()).toBe('');
        });

        it('should return sum of outbound and return lcb prices when cabinBagsPrices exists', () => {
            store.cabinBagsPrices = [20, 30];

            const price = store.getLargeCabinBagsFormattedPrice(false, true);

            expect(rootStore.marketStore.formatMoney).toHaveBeenCalledWith(25, {
                currency: rootStore.marketStore.currency,
                minimumFractionDigits: 2,
            });
            expect(price).toBe('£25');
        });

        it('should call formatMoney with signDisplay Always when withSign == true', () => {
            store.cabinBagsPrices = [20, 30];
            store.getLargeCabinBagsFormattedPrice(true);

            expect(rootStore.marketStore.formatMoney).toHaveBeenCalledWith(50, {
                currency: rootStore.marketStore.currency,
                minimumFractionDigits: 2,
                signDisplay: SignDisplay.Always,
            });
        });
    });

    describe('largeSportEquipmentList', () => {
        it('should return empty string when no extraLuggageInfo', () => {
            expect(store.largeSportEquipmentList).toEqual('');
        });

        it('should return list of large sport equipment', () => {
            store.extraLuggageInfo = luggageInfoMock;

            const list = store.largeSportEquipmentList;

            expect(utils.generateLargeSportEquipmentInfo).toHaveBeenCalledWith(
                store.extraLuggageInfo.items,
                rootStore.layoutStore.largeSportEquipmentCategoryCode,
            );
            expect(list).toBe('(1 x Bike)');
        });
    });

    describe('extraLuggageFullInfo', () => {
        it('should return [{},{}] when no extraLuggageInfo', () => {
            expect(store.extraLuggageFullInfo).toEqual([{}, {}]);
        });

        it('should parse extra luggage info', () => {
            store.extraLuggageInfo = luggageInfoMock;
            store.luggagePrices = {
                LUG: 80,
                BIKE: 180,
            };

            const [selectedLuggage, selectedSportEquipment] = store.extraLuggageFullInfo;

            expect(utils.generateExtraLuggageFullInfo).toHaveBeenCalledWith(
                store.extraLuggageInfo.items,
                rootStore.layoutStore.sportEquipmentCategoryCodes,
                rootStore.layoutStore.holdLuggageCategoryCodes,
            );
            expect(selectedLuggage).toEqual({
                LUG: { ...lugObj, price: 80 },
            });
            expect(selectedSportEquipment).toEqual({ BIKE: { ...bikeObj, price: 180 } });
        });
    });

    describe('LCBCount', () => {
        it('should count number of LCB selected', () => {
            jest.spyOn(store, 'existingLCBItems', 'get').mockReturnValue(cabinBagsMock.items);

            expect(store.LCBCount).toBe(1);
        });
    });

    describe('generateExtraLuggageItems', () => {
        const lug = {
            itemCategoryCode: 'BAGE',
            itemCode: 'LUG',
            quantity: 1,
            passengerId: '1',
        };
        const bike = {
            itemCategoryCode: 'SEO',
            itemCode: 'BIKE',
            quantity: 1,
            passengerId: '1',
        };

        beforeEach(() => {
            store.bookingExtras = bookingExtrasMock;
            store.luggagePrices = luggagePricesMock;
            store.luggageTypes = luggageTypesMock;
        });

        it('should return [] when no passengers', () => {
            rootStore.guestDetailsStore.adultsAndChildrenNumber = 0;

            expect(store.generateExtraLuggageItems({ LUG: 1 }, { BIKE: 1 })).toEqual([]);
        });

        it('should return [] when isExtraLuggageEnabled == false', () => {
            rootStore.layoutStore.isExtraLuggageEnabled = false;

            expect(store.generateExtraLuggageItems({ LUG: 1 }, { BIKE: 1 })).toEqual([]);
        });

        it('should return [] when no bookingExtras', () => {
            store.bookingExtras = null;

            expect(store.generateExtraLuggageItems({ LUG: 1 }, { BIKE: 1 })).toEqual([]);
        });

        it('should return [] when no luggagePrices', () => {
            store.luggagePrices = {};

            expect(store.generateExtraLuggageItems({ LUG: 1 }, { BIKE: 1 })).toEqual([]);
        });

        it('should return [] when no luggageTypes', () => {
            store.luggageTypes = {};

            expect(store.generateExtraLuggageItems({ LUG: 1 }, { BIKE: 1 })).toEqual([]);
        });

        it('should generate extra luggage info', () => {
            expect(store.generateExtraLuggageItems({ LUG: 1 }, { BIKE: 1 })).toEqual([
                { ...lug, routeId: '1', price: 25 },
                { ...bike, routeId: '1', price: 40 },
                { ...lug, routeId: '2', price: 15 },
                { ...bike, routeId: '2', price: 50 },
            ]);
        });

        it('should ignore codes which do not exist in luggageTypes', () => {
            expect(store.generateExtraLuggageItems({ LUG: 1, PUG: 4 }, { BIKE: 1, CAKE: 3 })).toEqual([
                { ...lug, routeId: '1', price: 25 },
                { ...bike, routeId: '1', price: 40 },
                { ...lug, routeId: '2', price: 15 },
                { ...bike, routeId: '2', price: 50 },
            ]);
        });
    });

    describe('getCheapestLuggage', () => {
        beforeEach(() => {
            store.bookingExtras = bookingExtrasMock;
        });

        it('should return null when no bookingExtras', () => {
            store.bookingExtras = null;

            expect(store.getCheapestLuggage(HoldLuggageCategory.Bag)).toBeNull();
        });

        it('should find cheapest price for Bag category', () => {
            expect(store.getCheapestLuggage(HoldLuggageCategory.Bag)).toEqual({
                name: 'Hold Baggage 23kg',
                price: 40,
            });
        });

        it('should find cheapest price for Sport category', () => {
            expect(store.getCheapestLuggage(HoldLuggageCategory.SportBag)).toEqual({
                name: 'Golf Bag',
                price: 74,
            });
        });
    });

    describe('LCBMaxQuantity', () => {
        it('should return 0 when availableLCBQuantity is an empty array', () => {
            store.availableLCBQuantity = [];

            expect(store.LCBMaxQuantity).toBe(0);
        });

        it('should return smaller quantity from availableLCBQuantity', () => {
            store.availableLCBQuantity = [15, 78];

            expect(store.LCBMaxQuantity).toBe(15);
        });
    });

    describe('isLCBAlmostFull', () => {
        it('should return false when availableLCBQuantity is an empty array', () => {
            store.availableLCBQuantity = [];

            expect(store.isLCBAlmostFull).toBe(false);
        });

        it('should return false when lcb capacity more then number of guests', () => {
            store.availableLCBQuantity = [15, 78];

            expect(store.isLCBAlmostFull).toBe(false);
        });

        it('should return true when lcb capacity less then number of guests', () => {
            store.availableLCBQuantity = [1, 78];

            expect(store.isLCBAlmostFull).toBe(true);
        });
    });

    describe('isLCBFull', () => {
        it('should return FALSE when availableLCBQuantity is an empty array', () => {
            store.availableLCBQuantity = [];

            expect(store.isLCBFull).toBe(false);
        });

        it('should return FALSE when lcb are available', () => {
            store.availableLCBQuantity = [15, 78];

            expect(store.isLCBFull).toBe(false);
        });

        it('should return TRUE when lcb are NOT available', () => {
            store.availableLCBQuantity = [0, 0];

            expect(store.isLCBFull).toBe(true);
        });

        it('should return TRUE when lcb is NOT available for one outbound flight', () => {
            store.availableLCBQuantity = [0, 54];

            expect(store.isLCBFull).toBe(true);
        });

        it('should return TRUE when lcb is NOT available for one inbound flight', () => {
            store.availableLCBQuantity = [54, 0];

            expect(store.isLCBFull).toBe(true);
        });
    });

    it('should clear store items after calling clearExtraLuggage', () => {
        store.luggagePrices = {
            LUG: 2,
        };
        store.luggageTypes = {
            CODE: {
                categoryCode: 'BAGE',
                categoryType: HoldLuggageCategory.Bag,
                name: 'bags',
            },
        };
        store.cabinBagsPrices = [1, 2];
        store.availableLCBQuantity = [5, 8];
        store.setBookingExtra = jest.fn();
        store.setExtraLuggageInfo = jest.fn();

        store.clearExtraLuggage();

        expect(store.setBookingExtra).toHaveBeenCalledWith(null);
        expect(store.setExtraLuggageInfo).toHaveBeenCalledWith(null);
        expect(store.luggageTypes).toEqual({});
        expect(store.luggagePrices).toEqual({});
        expect(store.cabinBagsPrices).toEqual([]);
        expect(store.availableLCBQuantity).toEqual([]);
    });

    describe('isSportsEquipmentAvailable', () => {
        beforeEach(() => {
            rootStore.layoutStore.isSportsEquipmentEnabled = true;
        });

        it('should return TRUE when there is cheapestSportLuggage', () => {
            store.getCheapestLuggage = jest.fn().mockReturnValueOnce(20);

            expect(store.isSportsEquipmentAvailable).toEqual(true);
        });

        it('should return FALSE when there is NO cheapestSportLuggage', () => {
            store.getCheapestLuggage = jest.fn().mockReturnValueOnce(null);

            expect(store.isSportsEquipmentAvailable).toEqual(false);
        });

        it('should return FALSE when isSportsEquipmentEnabled is false', () => {
            rootStore.layoutStore.isSportsEquipmentEnabled = false;
            store.getCheapestLuggage = jest.fn().mockReturnValueOnce(20);

            expect(store.isSportsEquipmentAvailable).toEqual(false);
        });
    });

    describe('isHoldLuggageAvailable', () => {
        beforeEach(() => {
            rootStore.layoutStore.isHoldLuggageEnabled = true;
        });

        it('should return TRUE when there is cheapestHoldLuggage', () => {
            store.getCheapestLuggage = jest.fn().mockReturnValueOnce(20);

            expect(store.isHoldLuggageAvailable).toEqual(true);
        });

        it('should return FALSE when there is NO cheapestHoldLuggage', () => {
            store.getCheapestLuggage = jest.fn().mockReturnValueOnce(null);

            expect(store.isHoldLuggageAvailable).toEqual(false);
        });

        it('should return FALSE when isHoldLuggageEnabled is false', () => {
            rootStore.layoutStore.isHoldLuggageEnabled = false;
            store.getCheapestLuggage = jest.fn().mockReturnValueOnce(20);

            expect(store.isHoldLuggageAvailable).toEqual(false);
        });
    });

    describe('extraLuggagePriceTotal', () => {
        beforeEach(() => {
            rootStore.layoutStore.isSportsEquipmentEnabled = true;
            rootStore.layoutStore.isHoldLuggageEnabled = true;
            rootStore.layoutStore.holdLuggageCategoryCodes = ['BAGE'];
            rootStore.layoutStore.sportEquipmentCategoryCodes = ['SEO', 'SEC'];
            rootStore.layoutStore.isCabinBagsEnabled = true;
        });

        it('should return 0 if extra luggage and cabin bags are not enabled', () => {
            rootStore.layoutStore.isExtraLuggageEnabled = false;
            rootStore.layoutStore.isCabinBagsEnabled = false;

            expect(store.extraLuggagePriceTotal).toBe(0);
        });

        it('should return 0 if there are no luggage items', () => {
            expect(store.extraLuggagePriceTotal).toBe(0);
        });

        it('should calculate total luggage price correctly', () => {
            store.extraLuggageInfo = luggageInfoMock;

            expect(store.extraLuggagePriceTotal).toBe(260);
        });

        it('should calculate total luggage price correctly for alternative info structure', () => {
            store.extraLuggageInfo = luggageInfoMockAlt;

            expect(store.extraLuggagePriceTotal).toBe(300);
        });

        it('should calculate total luggage price correctly when isHoldLuggageEnabled is false', () => {
            rootStore.layoutStore.isHoldLuggageEnabled = false;
            store.extraLuggageInfo = luggageInfoMock;

            expect(store.extraLuggagePriceTotal).toBe(180);
        });

        it('should calculate total luggage price correctly when isSportsEquipmentEnabled is false', () => {
            rootStore.layoutStore.isSportsEquipmentEnabled = false;
            store.extraLuggageInfo = luggageInfoMock;

            expect(store.extraLuggagePriceTotal).toBe(80);
        });

        it('should calculate cabin bags price correctly', () => {
            store.extraLuggageInfo = cabinBagsMock;

            expect(store.extraLuggagePriceTotal).toBe(90);
        });

        it('should calculate ONLY cabin bags price when hold luggage and sport equipment are not enabled', () => {
            store.extraLuggageInfo = { items: [...cabinBagsMock.items, ...luggageInfoMock.items] };
            rootStore.layoutStore.isHoldLuggageEnabled = false;
            rootStore.layoutStore.isSportsEquipmentEnabled = false;

            expect(store.extraLuggagePriceTotal).toBe(90);
        });

        it('should calculate cabin bags and hold luggage prices correctly', () => {
            store.extraLuggageInfo = { items: [...cabinBagsMock.items, ...luggageInfoMock.items] };

            expect(store.extraLuggagePriceTotal).toBe(350);
        });
    });

    describe('extraLuggagePricePP', () => {
        it('should return the per person price for extra luggage', () => {
            jest.spyOn(store, 'extraLuggagePriceTotal', 'get').mockReturnValue(60);
            expect(store.extraLuggagePricePP).toBe(20);
        });
    });

    describe('selectedLargeSportEquipmentNumberFromUrl', () => {
        it('should return proper amount of large sports equipment', () => {
            expect(store.selectedLargeSportEquipmentNumberFromUrl).toBe(3);
        });

        it('should return 0 when selectedSportsEquipment is undefined', () => {
            jest.spyOn(store, 'sportEquipmentSelectionFromUrl', 'get').mockReturnValue(undefined);

            expect(store.selectedLargeSportEquipmentNumberFromUrl).toBe(0);
        });

        it('should return 0 when selectedLuggageFromOffer is undefined', () => {
            delete rootStore.bookingStore.selectedOffer.extraLuggageInfo;

            expect(store.selectedLargeSportEquipmentNumberFromUrl).toBe(0);
        });
    });

    describe('sportEquipmentPossibleToTransfer', () => {
        beforeEach(() => {
            store.extraLuggageInfo = luggageInfoMock;
        });

        it('should return empty object when we cant accommodate all transfer', () => {
            expect(store.sportEquipmentPossibleToTransfer).toEqual({});
        });

        it('should return empty object when NO extraLuggageInfo', () => {
            store.extraLuggageInfo = null;

            expect(store.sportEquipmentPossibleToTransfer).toEqual({});
        });

        it('should return result of generateSmallSportEquipmentInfo when isTransferRemoveLargeSE is true', () => {
            rootStore.bookingStore.isTransferRemoveLargeSE = true;

            const result = store.sportEquipmentPossibleToTransfer;

            expect(utils.generateSmallSportEquipmentInfo).toHaveBeenCalledWith(
                store.extraLuggageInfo!.items,
                rootStore.layoutStore.sportEquipmentCategoryCodes,
                rootStore.layoutStore.largeSportEquipmentCategoryCode,
            );
            expect(result).toEqual({ GBAG: 2 });
        });

        it('should return result of generateSmallSportEquipmentInfo when isLargeSERemoveTransfer is true', () => {
            rootStore.bookingStore.isLargeSERemoveTransfer = true;

            const result = store.sportEquipmentPossibleToTransfer;

            expect(utils.generateSmallSportEquipmentInfo).toHaveBeenCalledWith(
                store.extraLuggageInfo!.items,
                rootStore.layoutStore.sportEquipmentCategoryCodes,
                rootStore.layoutStore.largeSportEquipmentCategoryCode,
            );
            expect(result).toEqual({ GBAG: 2 });
        });
    });

    describe('outboundLCBSelectionFromUrl', () => {
        it('should return an array of passengers indexes with lcb from URL', () => {
            expect(store.outboundLCBSelectionFromUrl).toEqual(['1', '2', '3']);
        });

        it('should return an empty array when outboundLCBSelectionFromUrl is empty string', () => {
            rootStore.queryParamsStore.outboundLCBSelectionFromUrl = '';

            expect(store.outboundLCBSelectionFromUrl).toEqual([]);
        });
    });

    describe('inboundLCBSelectionFromUrl', () => {
        it('should return an array of passengers indexes with lcb from URL', () => {
            expect(store.inboundLCBSelectionFromUrl).toEqual(['4', '5', '6']);
        });

        it('should return an empty array when inboundLCBSelectionFromUrl is empty string', () => {
            rootStore.queryParamsStore.inboundLCBSelectionFromUrl = '';

            expect(store.inboundLCBSelectionFromUrl).toEqual([]);
        });
    });

    describe('isExtraLuggageFromUrlValid', () => {
        it('should return true when all the conditions are NOT met', () => {
            rootStore.guestDetailsStore.adultsAndChildrenNumber = 6;
            expect(store.isExtraLuggageFromUrlValid).toBe(true);
        });

        it('should return false when amount of extra luggage exceeds limit from sitecore setting multiplied by number of guests', () => {
            jest.spyOn(store, 'selectedLuggageNumberFromUrl', 'get').mockReturnValue(100);

            expect(store.isExtraLuggageFromUrlValid).toBe(false);
        });

        it('should return false when amount of sports equipment exceeds number of guests', () => {
            jest.spyOn(store, 'selectedSportEquipmentNumberFromUrl', 'get').mockReturnValue(100);

            expect(store.isExtraLuggageFromUrlValid).toBe(false);
        });

        it('should return false when amount of large sports equipment exceeds limit from sitecore settings ', () => {
            jest.spyOn(store, 'selectedLargeSportEquipmentNumberFromUrl', 'get').mockReturnValue(100);

            expect(store.isExtraLuggageFromUrlValid).toBe(false);
        });
    });

    describe('generatePassengerLCBItems', () => {
        it('should return LCB items for passenger', () => {
            jest.spyOn(store, 'lcbInfoFromBookingExtras', 'get').mockReturnValue({
                '1': bookingExtrasMock[0].flightExtraCategories[3],
                '2': bookingExtrasMock[1].flightExtraCategories[3],
            });
            const lcbOut = bookingExtrasMock[0].flightExtraCategories[3].flightExtras[0];
            const lcbIn = bookingExtrasMock[1].flightExtraCategories[3].flightExtras[0];

            expect(store.generatePassengerLCBItems('5')).toEqual([
                generateLuggageInfoItemMock(
                    '1',
                    '5',
                    'SCB1',
                    'CABI',
                    1,
                    15.99,
                    false,
                    lcbOut.name,
                    lcbOut.description,
                    lcbOut.icon,
                ),
                generateLuggageInfoItemMock(
                    '2',
                    '5',
                    'SCB1',
                    'CABI',
                    1,
                    15.99,
                    false,
                    lcbIn.name,
                    lcbIn.description,
                    lcbIn.icon,
                ),
            ]);
        });
    });

    describe('existingLCBItems', () => {
        it('should return [] when no extraLuggageInfo', () => {
            expect(store.existingLCBItems).toEqual([]);
        });

        it('should return LCB items from extraLuggageInfo', () => {
            store.extraLuggageInfo = {
                items: [...luggageInfoMock.items, ...cabinBagsMock.items],
            };

            expect(store.existingLCBItems).toEqual(cabinBagsMock.items);
        });
    });

    describe('existingExtraLuggageItems', () => {
        it('should return [] when no extraLuggageInfo', () => {
            expect(store.existingExtraLuggageItems).toEqual([]);
        });

        it('should return Hold Luggage items from extraLuggageInfo', () => {
            store.extraLuggageInfo = {
                items: [...luggageInfoMock.items, ...cabinBagsMock.items],
            };

            expect(store.existingExtraLuggageItems).toEqual(luggageInfoMock.items);
        });
    });

    describe('existingExtraLuggageItemsNumber', () => {
        it('should consider quantity number of each item', () => {
            store.extraLuggageInfo = {
                items: [
                    ...luggageInfoMock.items,
                    ...cabinBagsMock.items,
                    generateLuggageInfoItemMock('1', '1', 'LUS', 'BAGE', 2, 40, false, '23kg Extra Hold Bag'),
                    generateLuggageInfoItemMock('1', '1', 'LUS', 'BAGE', 2, 40, false, '23kg Extra Hold Bag'),
                ],
            };

            expect(store.existingExtraLuggageItemsNumber).toEqual(4);
        });

        it('should return number of Hold Luggage divided by number of routes', () => {
            store.extraLuggageInfo = {
                items: [...luggageInfoMock.items, ...cabinBagsMock.items],
            };

            expect(store.existingExtraLuggageItemsNumber).toEqual(2);
        });
    });

    describe('validateLCB', () => {
        it('should validate luggage', async () => {
            rootStore.bookingStore.validatePackage.mockImplementationOnce(
                (_1, _2, _3, onSuccess) =>
                    new Promise(resolve => {
                        onSuccess();
                        resolve({});
                    }),
            );
            store.setExtraLuggageInfo = jest.fn();

            await store.validateLCB(cabinBagsMock.items, false);

            expect(store.setExtraLuggageInfo).toHaveBeenCalledWith(cabinBagsMock);
            expect(rootStore.bookingStore.togglePriceManipulating).toHaveBeenCalledWith(true);
            expect(rootStore.bookingStore.validatePackage).toHaveBeenCalled();
            expect(rootStore.queryParamsStore.updatePageWithLCBQuery).toHaveBeenCalled();
        });

        describe('tracking', () => {
            beforeEach(() => {
                rootStore.bookingStore.validatePackage.mockImplementationOnce(
                    (_1, _2, _3, onSuccess) =>
                        new Promise(resolve => {
                            onSuccess();
                            resolve({});
                        }),
                );
                store.setExtraLuggageInfo = jest.fn();
            });

            it('should track AddLCBForAllPassengers when isSingle = false and hasLCB = undefined', async () => {
                jest.spyOn(store, 'existingLCBItems', 'get').mockReturnValueOnce(cabinBagsMock.items);

                await store.validateLCB(
                    [
                        generateLuggageInfoItemMock('1', '2', 'SCB1', 'CABI', 1, 60),
                        generateLuggageInfoItemMock('2', '2', 'SCB1', 'CABI', 1, 60),
                        ...cabinBagsMock.items,
                    ],
                    false,
                );

                expect(rootStore.trackingStore.trackLCBChange).toHaveBeenCalledWith(
                    EventTypes.AddLCBForAllPassengers,
                    1,
                    false,
                );
            });

            it('should track AddLCBForAllPassengers with the right quantity when isSingle = false and not all items to validate are LCB items', async () => {
                jest.spyOn(store, 'existingLCBItems', 'get').mockReturnValueOnce(cabinBagsMock.items);

                await store.validateLCB(
                    [
                        generateLuggageInfoItemMock('1', '2', 'LUG', 'CABI', 1, 60),
                        generateLuggageInfoItemMock('2', '2', 'LUG', 'CABI', 1, 60),
                        generateLuggageInfoItemMock('1', '2', 'SCB1', 'CABI', 1, 60),
                        generateLuggageInfoItemMock('2', '2', 'SCB1', 'CABI', 1, 60),
                        ...cabinBagsMock.items,
                    ],
                    false,
                );

                expect(rootStore.trackingStore.trackLCBChange).toHaveBeenCalledWith(
                    EventTypes.AddLCBForAllPassengers,
                    1,
                    false,
                );
            });

            it('should track AddToBasket when isSingle = true and isAddEvent = true', async () => {
                await store.validateLCB(cabinBagsMock.items, true, true);

                expect(rootStore.trackingStore.trackLCBChange).toHaveBeenCalledWith(EventTypes.AddToBasket, 1, false);
            });

            it('should track RemoveFromBasket when isSingle = true and isAddEvent = false', async () => {
                await store.validateLCB(cabinBagsMock.items, true, false);

                expect(rootStore.trackingStore.trackLCBChange).toHaveBeenCalledWith(
                    EventTypes.RemoveFromBasket,
                    1,
                    false,
                );
            });
        });
    });

    describe('passengersAvailableForLCBCount', () => {
        it('should return LCBMaxQuantity when LCBMaxQuantity < adultsAndChildrenNumber', () => {
            store.availableLCBQuantity = [2, 4];

            expect(store.passengersAvailableForLCBCount).toBe(2);
        });

        it('should return adultsAndChildrenNumber when  adultsAndChildrenNumber < LCBMaxQuantity', () => {
            store.availableLCBQuantity = [10, 20];

            expect(store.passengersAvailableForLCBCount).toBe(3);
        });
    });

    it('should set value to isLCBFullPopupShown after calling setLCBFullPopupShown', () => {
        expect(store.isLCBFullPopupShown).toBe(false);

        store.setLCBFullPopupShown(true);

        expect(store.isLCBFullPopupShown).toBe(true);
    });

    describe('LCBAvailabilityCheckFlow', () => {
        it('should do nothing when LCB is not full', () => {
            jest.spyOn(store, 'isLCBFull', 'get').mockReturnValue(false);
            store.setExtraLuggageInfo = jest.fn();
            store.setLCBFullPopupShown = jest.fn();
            store.extraLuggageInfo = cabinBagsMock;

            store.LCBAvailabilityCheckFlow();

            expect(store.rootStore.flightsPassengersStore.clearAllPassengersLCB).not.toHaveBeenCalled();
            expect(store.rootStore.queryParamsStore.updatePageWithLCBQuery).not.toHaveBeenCalled();
            expect(store.setExtraLuggageInfo).not.toHaveBeenCalled();
            expect(store.setLCBFullPopupShown).not.toHaveBeenCalled();
        });

        it('should do nothing when LCB is full and there is NO selected lcb', () => {
            jest.spyOn(store, 'isLCBFull', 'get').mockReturnValue(true);
            store.setExtraLuggageInfo = jest.fn();
            store.setLCBFullPopupShown = jest.fn();

            store.LCBAvailabilityCheckFlow();

            expect(store.rootStore.flightsPassengersStore.clearAllPassengersLCB).not.toHaveBeenCalled();
            expect(store.rootStore.queryParamsStore.updatePageWithLCBQuery).not.toHaveBeenCalled();
            expect(store.setExtraLuggageInfo).not.toHaveBeenCalled();
            expect(store.setLCBFullPopupShown).not.toHaveBeenCalled();
        });

        it('should clear LCB when LCB is full and there is selected lcb', () => {
            jest.spyOn(store, 'isLCBFull', 'get').mockReturnValue(true);
            store.setExtraLuggageInfo = jest.fn();
            store.setLCBFullPopupShown = jest.fn();
            store.extraLuggageInfo = extraLuggageInfoMock;

            store.LCBAvailabilityCheckFlow();

            expect(store.rootStore.flightsPassengersStore.clearAllPassengersLCB).toHaveBeenCalled();
            expect(store.rootStore.queryParamsStore.updatePageWithLCBQuery).toHaveBeenCalled();
            expect(store.setExtraLuggageInfo).toHaveBeenCalledWith({
                items: [...store.defaultBags, ...store.existingExtraLuggageItems],
            });
            expect(store.setLCBFullPopupShown).toHaveBeenCalledWith(true);
        });

        it('should call trackLCBChange function', () => {
            jest.spyOn(store, 'isLCBFull', 'get').mockReturnValue(true);
            store.extraLuggageInfo = extraLuggageInfoMock;

            store.LCBAvailabilityCheckFlow();

            expect(rootStore.trackingStore.trackLCBChange).toHaveBeenCalledWith(EventTypes.RemoveFromBasket, 3, true);
        });
    });

    describe('canAddHoldLuggage', () => {
        it('should return false when isExtraLuggageEnabled == false', () => {
            rootStore.layoutStore.isExtraLuggageEnabled = false;

            expect(store.canAddHoldLuggage).toBe(false);
        });

        it('should return false when isFlightExternal == false', () => {
            rootStore.bookingStore.isFlightExternal = false;

            expect(store.canAddHoldLuggage).toBe(false);
        });

        it('should return false when it is luxury package', () => {
            rootStore.bookingStore.isLuxuryPackage = true;

            expect(store.canAddHoldLuggage).toBe(false);
        });

        it('should return false when cheapestSportLuggage == null && cheapestHoldLuggage == null', () => {
            jest.spyOn(store, 'cheapestSportLuggage', 'get').mockReturnValue(null);
            jest.spyOn(store, 'cheapestHoldLuggage', 'get').mockReturnValue(null);

            expect(store.canAddHoldLuggage).toBe(false);
        });

        it('should return true when cheapestSportLuggage == null && cheapestHoldLuggage has value', () => {
            jest.spyOn(store, 'cheapestSportLuggage', 'get').mockReturnValue(null);
            jest.spyOn(store, 'cheapestHoldLuggage', 'get').mockReturnValue({ name: 'Bag', price: 10 });

            expect(store.canAddHoldLuggage).toBe(true);
        });

        it('should return true when cheapestHoldLuggage == null && cheapestSportLuggage has value', () => {
            jest.spyOn(store, 'cheapestSportLuggage', 'get').mockReturnValue({ name: 'Bag', price: 10 });
            jest.spyOn(store, 'cheapestHoldLuggage', 'get').mockReturnValue(null);

            expect(store.canAddHoldLuggage).toBe(true);
        });
    });

    describe('defaultBags AND defaultBagsNumber', () => {
        beforeEach(() => {
            store.extraLuggageInfo = extraLuggageInfoWithDefaultBags;
        });

        it('should return [] when no selected offer', () => {
            store.extraLuggageInfo = null;

            expect(store.defaultBags).toEqual([]);
            expect(store.defaultBagsNumber).toBe(0);
        });

        it('should return items where isComplimentary == true from extraLuggageInfo', () => {
            expect(store.defaultBags).toEqual(mockDefaultBags);
            expect(store.defaultBagsNumber).toBe(2);
        });

        it('should return correct items after calling defaultBagsOneDirection', () => {
            expect(store.defaultBagsOneDirection).toEqual(mockDefaultBags.slice(0, 2));
        });

        it('should return first item from defaultBags after calling defaultBag', () => {
            expect(store.defaultBag).toEqual(mockDefaultBags[0]);
        });
    });

    describe('isLCBAddingUnavailable', () => {
        beforeEach(() => {
            rootStore.layoutStore.isCabinBagsEnabled = true;
            rootStore.bookingStore = {
                cabinBagsCategoriesExist: true,
                isFlightExtrasFailed: false,
                isFlightExternal: true,
            };
            jest.spyOn(store, 'isLCBFull', 'get').mockReturnValue(false);
            store.getLargeCabinBagsFormattedPrice = jest.fn(() => 'price');
        });

        it('should return false when lcb available', () => {
            expect(store.isLCBAddingUnavailable).toBe(false);
        });

        it('should be unavailable when cabinBagsCategoriesExist == false', () => {
            rootStore.bookingStore.cabinBagsCategoriesExist = false;

            expect(store.isLCBAddingUnavailable).toBe(true);
        });

        it('should be unavailable when isFlightExtrasFailed == true', () => {
            rootStore.bookingStore.isFlightExtrasFailed = true;

            expect(store.isLCBAddingUnavailable).toBe(true);
        });

        it('should be unavailable when isFlightExternal == false', () => {
            rootStore.bookingStore.isFlightExternal = false;

            expect(store.isLCBAddingUnavailable).toBe(true);
        });

        it('should be unavailable when isCabinBagsEnabled == false', () => {
            rootStore.layoutStore.isCabinBagsEnabled = false;

            expect(store.isLCBAddingUnavailable).toBe(true);
        });

        it('should be unavailable when isLCBFull == true', () => {
            jest.spyOn(store, 'isLCBFull', 'get').mockReturnValue(true);

            expect(store.isLCBAddingUnavailable).toBe(true);
        });

        it('should be unavailable when no lcb price', () => {
            store.getLargeCabinBagsFormattedPrice = jest.fn();

            expect(store.isLCBAddingUnavailable).toBe(true);
        });
    });

    it('should return correct number of items after calling totalHoldLuggageItemsNumber', () => {
        store.extraLuggageInfo = extraLuggageInfoWithDefaultBags;

        expect(store.totalHoldLuggageItemsNumber).toBe(4);
    });

    describe('green promo', () => {
        it('should set isLCBGreenPromoShown to the expected value when setLCBGreenPromoShown is called', () => {
            expect(store.isLCBGreenPromoShown).toBe(false);
            store.setLCBGreenPromoShown(true);
            expect(store.isLCBGreenPromoShown).toBe(true);
            store.setLCBGreenPromoShown(false);
            expect(store.isLCBGreenPromoShown).toBe(false);
        });

        it('should set isHGGreenPromoShown to the expected value when setHBGreenPromoShown is called', () => {
            expect(store.isHBGreenPromoShown).toBe(false);
            store.setHBGreenPromoShown(true);
            expect(store.isHBGreenPromoShown).toBe(true);
            store.setHBGreenPromoShown(false);
            expect(store.isHBGreenPromoShown).toBe(false);
        });
    });
});
