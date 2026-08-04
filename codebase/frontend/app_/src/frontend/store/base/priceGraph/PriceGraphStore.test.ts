import { CurrencyCode } from 'code/currency';
import priceGraphService from 'frontend/services/priceGraph.service';
import { ISearchFromStore } from 'frontend/store/base/search/SearchFromStore';
import { TRootStore } from 'frontend/store/IStores';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';

import { PriceGraphStore } from './PriceGraphStore';

jest.mock('frontend/services/logging');
jest.mock('frontend/services/priceGraph.service');

priceGraphService.loadAlternativeOffers = jest.fn(() =>
    Promise.resolve({
        offers: [
            {
                date: '2020-02-04T00:00:00',
                price: 960.61,
                pricePP: 480.31,
            },
            {
                date: '2020-02-05T00:00:00',
                price: 930.94,
                pricePP: 465.47,
            },
            {
                date: '2020-02-06T00:00:00',
                price: 932.58,
                pricePP: 466.29,
            },
        ],
    } as any),
);

describe('PriceGraphStore', () => {
    const resetMocks = () =>
        [
            {
                date: '2020-02-04T00:00:00',
                price: 960.61,
                pricePP: 480.31,
            },
            {
                date: '2020-02-05T00:00:00',
                price: 930.94,
                pricePP: 465.47,
            },
            {
                date: '2020-02-06T00:00:00',
                price: 932.58,
                pricePP: 466.29,
            },
        ] as IAlternativeOffer[];

    const mockRootStore = {
        layoutStore: {
            isTouristTaxEnabled: true,
            isHotelDetailsBookPage: true,
            isCheapestComparePriceOption: false,
        },
        bookingStore: {
            selectedOffer: {
                date: '2020-01-30T00:00:00',
                stay: 7,
                accom: {
                    unit: [],
                },
            },
            totalPrice: 500,
            totalPriceWithTouristTax: 600,
            boardTypeCode: '',
        },
        searchStore: {
            selectedAccommodationCodes: '',
            searchWhen: {
                from: new Date('10-10-2020'),
                flexDays: 0,
                selectedNumberOfNights: 7,
            },
            searchFrom: { origins: ['SP', 'TR'] } as ISearchFromStore,
        },
        queryParamsStore: {
            roomsAllocationFromUrl: [],
            accommodationIdFromUrl: '',
            altAccommodationsFromUrl: [{ accomCode: '456' }, { accomCode: '123' }],
            selectedAccommodationCodesFromUrl: '456,789',
        },
        alternativeFlightsStore: {
            departureAirportsQuery: 'SP,TR',
            selectedOutboundDepTimes: [],
            selectedInboundDepTimes: [],
        },
    } as unknown as TRootStore;

    let offers = resetMocks();

    beforeEach(() => {
        offers = resetMocks();
    });

    describe('resetMiddleDate', () => {
        test('should set new middle date', () => {
            const store = new PriceGraphStore(mockRootStore);
            const date = new Date('2020-03-07T00:00:00');

            store.resetMiddleDate(date);

            expect(store.middleDate).toEqual(date);
        });
    });

    describe('isDataLoaded', () => {
        test('should return true if data is loaded', () => {
            const store = new PriceGraphStore(mockRootStore);
            store.alternativeOffers = offers;
            expect(store.isDataLoaded(new Date('2020-02-05T00:00:00'))).toBeTruthy();
        });

        test('should return false if data is NOT loaded', () => {
            const store = new PriceGraphStore(mockRootStore);
            store.alternativeOffers = offers;

            expect(store.isDataLoaded(new Date('2020-02-10T00:00:00'))).toBeFalsy();
        });
    });

    describe('isDataShouldBeLoaded', () => {
        test('should call isDataLoaded with next edge date if isNext === true', () => {
            const store = new PriceGraphStore(mockRootStore);
            store.alternativeOffers = offers;

            const result = store.isDataShouldBeLoaded(new Date('2020-01-30T00:00:00'), true);

            expect(result).toBeFalsy();
        });

        test('should call isDataLoaded with prev edge date if isNext === false', () => {
            const store = new PriceGraphStore(mockRootStore);
            store.alternativeOffers = offers;

            const result = store.isDataShouldBeLoaded(new Date('2020-02-10T00:00:00'), false);

            expect(result).toBeTruthy();
        });
    });

    describe('makeOffersDistinct', () => {
        test('should make offers unique', () => {
            const store = new PriceGraphStore(mockRootStore);
            offers[2].date = '2020-02-04T00:00:00';
            const alternativeOffers = offers;

            store.makeOffersDistinct(alternativeOffers);

            expect(store.alternativeOffers.length).toEqual(2);
            expect(store.alternativeOffers[0].date).toEqual('2020-02-04T00:00:00');
            expect(store.alternativeOffers[1].date).toEqual('2020-02-05T00:00:00');
        });
    });

    describe('loadAlternativeOffers', () => {
        let store;

        beforeEach(() => {
            store = new PriceGraphStore(mockRootStore);
        });

        it('should NOT do anything if NO selected offer', () => {
            store.rootStore.bookingStore.selectedOffer = undefined;

            store.loadAlternativeOffers();

            expect(priceGraphService.loadAlternativeOffers).not.toBeCalled();
        });

        it('should NOT load items if needed data is loaded', () => {
            store.rootStore.bookingStore.selectedOffer = {};

            store.alternativeOffers = offers;

            store.loadAlternativeOffers(false, new Date('2020-01-30T00:00:00'), true);

            expect(store.middleDate).toEqual(new Date('2020-01-30T00:00:00'));
            expect(priceGraphService.loadAlternativeOffers).not.toBeCalled();
        });

        it('should call priceGraphService.loadAlternativeOffers for isSingleNoResult', () => {
            store.loadAlternativeOffers(true, new Date('2020-01-30T00:00:00'), undefined);

            expect(priceGraphService.loadAlternativeOffers).toHaveBeenCalledWith(
                new Date('2020-01-30T00:00:00'),
                store.rootStore.searchStore.searchWhen.from,
                store.rootStore.searchStore.searchWhen.flexDays,
                store.rootStore.searchStore.searchWhen.selectedNumberOfNights,
                'SP,TR',
                store.rootStore.queryParamsStore.roomsAllocationFromUrl,
                '456,123,789',
                '',
                [],
                [],
                undefined,
                undefined,
            );
        });

        it('should call priceGraphService.loadAlternativeOffers for isSingleNoResult with empty origins when origins are NOT provided', () => {
            store.rootStore.searchStore.searchFrom.origins = undefined;

            store.loadAlternativeOffers(true, undefined, undefined, {});

            expect(priceGraphService.loadAlternativeOffers).toHaveBeenCalledWith(
                store.rootStore.searchStore.searchWhen.from,
                store.rootStore.searchStore.searchWhen.from,
                store.rootStore.searchStore.searchWhen.flexDays,
                store.rootStore.searchStore.searchWhen.selectedNumberOfNights,
                '',
                store.rootStore.queryParamsStore.roomsAllocationFromUrl,
                '456,123,789',
                '',
                [],
                [],
                undefined,
                {},
            );
        });

        it('should call priceGraphService.loadAlternativeOffers with isCheapestRoom=true when layoutStore.isCheapestComparePriceOption is true', async () => {
            store.rootStore.bookingStore.selectedOffer = {
                date: '2020-01-30T00:00:00',
                stay: 7,
                accom: {
                    unit: [],
                },
            };
            store.rootStore.layoutStore.isCheapestComparePriceOption = true;
            store.rootStore.searchStore.searchFrom.origins = ['SP', 'TR'];

            await store.loadAlternativeOffers(false, new Date('2020-01-30T00:00:00'), undefined);

            expect(priceGraphService.loadAlternativeOffers).toHaveBeenCalledWith(
                new Date('2020-01-30T00:00:00'),
                new Date('2020-01-30T00:00:00'),
                0,
                7,
                'SP,TR',
                [],
                '456,123,789',
                '',
                [],
                [],
                true,
                undefined,
            );
        });

        it('should call priceGraphService.loadAlternativeOffers with isCheapestRoom=false when layoutStore.isCheapestComparePriceOption is false', async () => {
            store.rootStore.bookingStore.selectedOffer = {
                date: '2020-01-30T00:00:00',
                stay: 7,
                accom: {
                    unit: [],
                },
            };
            store.rootStore.layoutStore.isCheapestComparePriceOption = false;
            store.rootStore.searchStore.searchFrom.origins = ['SP', 'TR'];

            await store.loadAlternativeOffers(false, new Date('2020-01-30T00:00:00'), undefined);

            expect(priceGraphService.loadAlternativeOffers).toHaveBeenCalledWith(
                new Date('2020-01-30T00:00:00'),
                new Date('2020-01-30T00:00:00'),
                0,
                7,
                'SP,TR',
                [],
                '456,123,789',
                '',
                [],
                [],
                false,
                undefined,
            );
        });
    });

    describe('isMobileView', () => {
        it('should return true when width <= 799', () => {
            const store = new PriceGraphStore({ ...mockRootStore, appStore: { breakpoint: 799 } } as any);

            expect(store.isMobileView).toBeTruthy();
        });

        it('should return false when width > 799', () => {
            const store = new PriceGraphStore({ ...mockRootStore, appStore: { breakpoint: 800 } } as any);
            expect(store.isMobileView).toBeFalsy();
        });
    });

    describe('currency', () => {
        it('should return code from alternativeOffers', () => {
            const store = new PriceGraphStore(mockRootStore);

            store.alternativeOffers = offers.map(item => ({ ...item, currency: { code: CurrencyCode.GBP } }));

            expect(store.currency).toBe(CurrencyCode.GBP);
        });

        it('should return currencyCode from bookingStore when alternativeOffers is empty', () => {
            const store = new PriceGraphStore({
                ...mockRootStore,
                bookingStore: {
                    currency: CurrencyCode.CHF,
                },
            } as any);

            store.alternativeOffers = [];

            expect(store.currency).toBe(CurrencyCode.CHF);
        });
    });

    describe('shouldDisplayPricesWithTouristTax', () => {
        let store;

        beforeEach(() => {
            store = new PriceGraphStore(mockRootStore);
        });

        it('should be true when isTouristTaxEnabled and isHotelDetailsBookPage', () => {
            expect(store['shouldDisplayPricesWithTouristTax']).toBe(true);
        });

        it('should be false when isTouristTaxEnabled is false', () => {
            store.rootStore.layoutStore.isTouristTaxEnabled = false;

            expect(store['shouldDisplayPricesWithTouristTax']).toBe(false);
        });

        it('should be false when isHotelDetailsBookPage is false', () => {
            store.rootStore.layoutStore.isHotelDetailsBookPage = false;

            expect(store['shouldDisplayPricesWithTouristTax']).toBe(false);
        });
    });

    describe('totalPriceForSelectedDate', () => {
        let store;

        beforeEach(() => {
            store = new PriceGraphStore(mockRootStore);
        });

        it('should return totalPriceWithTouristTax when shouldDisplayPricesWithTouristTax is true', () => {
            store.rootStore.layoutStore.isTouristTaxEnabled = true;
            store.rootStore.layoutStore.isHotelDetailsBookPage = true;

            expect(store.totalPriceForSelectedDate).toBe(600);
        });

        it('should return totalPrice when shouldDisplayPricesWithTouristTax is false', () => {
            store.rootStore.layoutStore.isTouristTaxEnabled = false;

            expect(store.totalPriceForSelectedDate).toBe(500);
        });
    });
});
