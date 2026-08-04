import settings from 'code/settings';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { createHolidaysAppStores } from 'frontend/store/holidays';
import * as routeUtils from 'frontend/utils/route.utils';
import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import * as alternativeFlightsUtils from 'frontend/components/renderings/AlternativeFlights/AlternativeFlights.utils';

import { ComparePriceStore } from './ComparePriceStore';

const offerMock = {
    pricePP: 100,
    accom: {
        code: 'test',
        packageId: 'packageId',
        unit: [mockedOffer.accom.unit[0]],
        isExt: true,
    },
    date: '2019-08-22T00:00:00',
    transport: {
        routes: [
            {
                id: '170430/2979',
                cycDate: '2019-08-22',
                depPt: 'LGW',
                arrPt: 'PMI',
                arrDate: '2019-08-22T14:00:00',
                routeCd: 'PMILGW4ALGWPMI',
                avail: 177,
                fltNo: 'EZY791',
                car: 'EZY',
                direction: 'outbound',
                depDate: '2019-08-22T11:30:00',
                arrName: 'arrName',
                depName: 'depName',
            } as IRoute,
            {
                id: '170430/2978',
                cycDate: '2019-08-22',
                depPt: 'LGW',
                arrPt: 'PMI',
                arrDate: '2019-08-22T14:00:00',
                routeCd: 'PMILGW4ALGWPMI',
                avail: 177,
                fltNo: 'EZY791',
                car: 'EZY',
                direction: 'inbound',
                depDate: '2019-08-22T11:30:00',
                arrName: 'arrName',
                depName: 'depName',
            } as IRoute,
        ],
    },
} as IOfferWithoutAltBoards;

const offerMock2 = {
    pricePP: 100,
    accom: {
        code: 'test',
        packageId: 'packageId',
        unit: [mockedOffer.accom.unit[0]],
    },
    date: '2019-08-22T00:00:00',
    transport: {
        routes: [
            {
                id: '123456',
                cycDate: '2019-08-22',
                depPt: 'LGW',
                arrPt: 'PMI',
                arrDate: '2019-08-22T14:00:00',
                routeCd: 'PMILGW4ALGWPMI',
                avail: 177,
                fltNo: 'EZY791',
                car: 'EZY',
                direction: 'outbound',
                depDate: '2019-08-22T11:30:00',
                arrName: 'arrName',
                depName: 'depName',
            } as IRoute,
            {
                id: '12345',
                cycDate: '2019-08-22',
                depPt: 'LGW',
                arrPt: 'PMI',
                arrDate: '2019-08-22T14:00:00',
                routeCd: 'PMILGW4ALGWPMI',
                avail: 177,
                fltNo: 'EZY791',
                car: 'EZY',
                direction: 'inbound',
                depDate: '2019-08-22T11:30:00',
                arrName: 'arrName',
                depName: 'depName',
            } as IRoute,
        ],
    },
} as IOfferWithoutAltBoards;

const mockAreRoutesEqual = jest.spyOn(routeUtils, 'areRoutesEqual');
const mockGetNewOfferForPriceGraph = jest
    .spyOn(alternativeFlightsUtils, 'getNewOfferForPriceGraph')
    .mockReturnValue(offerMock);

const mockGetOfferRoutesUniqueId = jest.spyOn(routeUtils, 'getOfferRoutesUniqueId').mockReturnValue('unique-id');

describe('ComparePriceStore', () => {
    let stores;

    beforeEach(() => {
        stores = createHolidaysAppStores();
    });

    describe('setIsDisplayed', () => {
        it('should set isDisplayed prop', () => {
            const store = new ComparePriceStore(stores);

            expect(store.isDisplayed).toBe(false);

            store.setIsDisplayed(true);

            expect(store.isDisplayed).toBe(true);
        });
    });

    describe('setIsLoadingError', () => {
        it('should set isLoadingError prop', () => {
            const store = new ComparePriceStore(stores);

            expect(store.isLoadingError).toBe(false);

            store.setIsLoadingError(true);

            expect(store.isLoadingError).toBe(true);
        });
    });

    describe('currentOffer', () => {
        beforeEach(() => {
            stores.bookingStore.selectedOffer = {} as IOffer;
            stores.bookingStore.alternativeFlights = [{}, {}, {}];
        });

        it('should be undefined when selectedOffer is undefined', () => {
            stores.bookingStore.selectedOffer = undefined;

            const store = new ComparePriceStore(stores);

            expect(store.currentOffer).toBeUndefined();
        });

        it('should be undefined when areRoutesEqual returns false', () => {
            mockAreRoutesEqual.mockReturnValue(false);

            const store = new ComparePriceStore(stores);

            expect(store.currentOffer).toBeUndefined();
        });

        it('should be undefined when areRoutesEqual returns false', () => {
            mockAreRoutesEqual.mockReturnValue(true);

            const store = new ComparePriceStore(stores);

            expect(store.currentOffer).toStrictEqual({});
        });
    });

    describe('currentOfferPP', () => {
        it('should be pricePP from current offer when current offer is NOT undefined', () => {
            const store = new ComparePriceStore(stores);

            jest.spyOn(store, 'currentOffer', 'get').mockReturnValue({ pricePP: 100 } as IOffer);

            expect(store.currentOfferPP).toBe(100);
        });

        it('should be pricePP from selectedOffer when current offer is undefined', () => {
            stores.bookingStore.selectedOffer = { pricePP: 50 } as IOffer;

            const store = new ComparePriceStore(stores);

            jest.spyOn(store, 'currentOffer', 'get').mockReturnValue(undefined);

            expect(store.currentOfferPP).toBe(50);
        });
    });

    describe('setIsLoadingOfferForNewDate', () => {
        it('should set isLoadingOfferForNewDate to true', () => {
            const store = new ComparePriceStore(stores);

            expect(store.isLoadingOfferForNewDate).toBe(false);

            store.setIsLoadingOfferForNewDate(true);

            expect(store.isLoadingOfferForNewDate).toBe(true);
        });
    });

    describe('setShowFlights', () => {
        it('should set showFlights to 10', () => {
            const store = new ComparePriceStore(stores);

            expect(store.showFlights).toBe(2);

            store.setShowFlights(10);

            expect(store.showFlights).toBe(10);
        });
    });

    describe('setOriginalFlightsOrdering', () => {
        it('should set originalFlightsOrdering to prop', () => {
            const store = new ComparePriceStore(stores);

            expect(store.originalFlightsOrdering).toStrictEqual([]);

            store.setOriginalFlightsOrdering(['test']);

            expect(store.originalFlightsOrdering).toStrictEqual(['test']);
        });
    });

    describe('selectOfferOnPriceGraph', () => {
        const alternativeFlights = [offerMock, offerMock2];
        let store;
        let date;

        beforeEach(() => {
            stores.bookingStore.loadAlternativeFlights = jest.fn().mockResolvedValue(alternativeFlights);
            stores.alternativeFlightsStore.clearSelectedFilters = jest.fn();
            stores.alternativeFlightsStore.filterFlights = jest.fn(p => p);
            stores.bookingStore.changeFlight = jest.fn();
            stores.priceGraphStore.rerenderMap = jest.fn();

            store = new ComparePriceStore(stores);
            date = new Date();
            jest.spyOn(store, 'currentOffer', 'get').mockReturnValue(offerMock);
        });

        it('should got alternativeFlights and set new offer', async () => {
            const resetOriginals = jest.spyOn(store, 'resetOriginals');

            store.selectOfferOnPriceGraph({ newDate: date });

            expect(store.isLoadingOfferForNewDate).toBe(true);

            await expect(stores.bookingStore.loadAlternativeFlights).toHaveBeenCalledWith({
                alternativeDate: date,
                boardCode: undefined,
                newAccommodationId: undefined,
                newInboundRouteId: undefined,
                newOutboundRouteId: undefined,
                rooms: undefined,
                saveEmptyOffers: false,
            });

            expect(stores.alternativeFlightsStore.filterFlights).toHaveBeenCalledWith(alternativeFlights);

            await expect(stores.bookingStore.changeFlight).toHaveBeenCalledWith({
                offer: offerMock,
                priceDiff: 0,
                reloadOffer: true,
                isPriceGraphEventTarget: true,
                board: undefined,
                rooms: undefined,
                isExt: true,
                disableLoadAlternativeFlights: true,
            });

            expect(stores.alternativeFlightsStore.clearSelectedFilters).toHaveBeenCalled();
            expect(resetOriginals).toHaveBeenCalled();
            expect(stores.priceGraphStore.rerenderMap).toHaveBeenCalled();
            expect(store.showFlights).toBe(settings.AlternativeFlights.FirstPageFlightsNumber);
            expect(store.isLoadingOfferForNewDate).toBe(false);
            expect(mockGetNewOfferForPriceGraph).toHaveBeenCalledWith(alternativeFlights, undefined, undefined);
        });

        it('should set new offer and call mockGetNewOfferForPriceGraph with inbound and outbound flights', async () => {
            store.selectOfferOnPriceGraph({
                newDate: date,
                board: undefined,
                rooms: undefined,
                inboundRouteId: '10',
                outboundRouteId: '2',
            });

            await expect(stores.bookingStore.loadAlternativeFlights).toHaveBeenCalledWith({
                alternativeDate: date,
                boardCode: undefined,
                newAccommodationId: undefined,
                newInboundRouteId: '10',
                newOutboundRouteId: '2',
                rooms: undefined,
                saveEmptyOffers: false,
            });

            await expect(stores.bookingStore.changeFlight).toHaveBeenCalledWith({
                offer: offerMock,
                priceDiff: 0,
                reloadOffer: true,
                isPriceGraphEventTarget: true,
                board: undefined,
                rooms: undefined,
                isExt: true,
                disableLoadAlternativeFlights: true,
            });

            expect(mockGetNewOfferForPriceGraph).toHaveBeenCalledWith(alternativeFlights, '10', '2');
        });

        it('should pass board and rooms to loadAlternativeFlights and onChangeFlight', async () => {
            const board = 'AI';
            const rooms = [
                {
                    adults: 2,
                    children: 0,
                    childrenAges: [],
                    infants: 0,
                    roomCode: 'TWA1',
                },
            ];

            stores.bookingStore.loadAlternativeFlights.mockReturnValue(alternativeFlights);

            store.selectOfferOnPriceGraph({
                newDate: date,
                board,
                rooms,
                inboundRouteId: '1',
                outboundRouteId: '2',
                newAccommodationId: 'accommodation-id',
            });

            await expect(stores.bookingStore.loadAlternativeFlights).toHaveBeenCalledWith({
                alternativeDate: date,
                boardCode: board,
                newAccommodationId: 'accommodation-id',
                newInboundRouteId: '1',
                newOutboundRouteId: '2',
                rooms: rooms,
                saveEmptyOffers: false,
            });

            await expect(stores.bookingStore.changeFlight).toHaveBeenCalledWith({
                offer: offerMock,
                priceDiff: 0,
                reloadOffer: true,
                isPriceGraphEventTarget: true,
                board,
                rooms,
                isExt: true,
                disableLoadAlternativeFlights: true,
            });
        });

        it('should call handleError and set isLoadingOfferForNewDate to false when loadAlternativeFlights returns empty array', async () => {
            stores.bookingStore.loadAlternativeFlights.mockReturnValue([]);
            const handleError = jest.fn();

            store.selectOfferOnPriceGraph({
                newDate: date,
                board: undefined,
                rooms: undefined,
                inboundRouteId: undefined,
                outboundRouteId: undefined,
                newAccommodationId: undefined,
                handleError,
            });

            await expect(stores.bookingStore.loadAlternativeFlights).toHaveBeenCalledWith({
                alternativeDate: date,
                boardCode: undefined,
                newAccommodationId: undefined,
                newInboundRouteId: undefined,
                newOutboundRouteId: undefined,
                rooms: undefined,
                saveEmptyOffers: false,
            });

            expect(handleError).toHaveBeenCalled();
            expect(stores.bookingStore.changeFlight).not.toHaveBeenCalled();
            expect(store.isLoadingOfferForNewDate).toBe(false);
            expect(mockGetNewOfferForPriceGraph).not.toHaveBeenCalled();
        });
    });

    describe('resetOriginals', () => {
        it('should set originalFlightsOrdering and call mockGetOfferRoutesUniqueId for each flight', () => {
            stores.bookingStore.selectedOffer = offerMock;
            stores.bookingStore.alternativeFlights = [offerMock, offerMock2];

            const store = new ComparePriceStore(stores);

            store.setFlights = jest.fn();
            store.resetOriginals();

            expect(store.setFlights).toHaveBeenCalled();
            expect(store.originalFlightsOrdering).toStrictEqual(['unique-id', 'unique-id']);
            expect(mockGetOfferRoutesUniqueId).toHaveBeenCalledTimes(2);
        });

        it('should set originalFlightsOrdering to empty array when alternativeFlights are empty', () => {
            stores.bookingStore.selectedOffer = undefined;
            stores.bookingStore.alternativeFlights = [];

            const store = new ComparePriceStore(stores);

            store.setFlights = jest.fn();
            store.resetOriginals();

            expect(store.originalFlightsOrdering).toStrictEqual([]);
            expect(mockGetOfferRoutesUniqueId).not.toHaveBeenCalled();
        });
    });

    describe('setFlights', () => {
        beforeEach(() => {
            stores.alternativeFlightsStore.setFilterOptionsCounts = jest.fn();
        });

        it('should set flightsList to empty list when alternativeFlights do NOT exist', () => {
            stores.bookingStore.alternativeFlights = [];

            const store = new ComparePriceStore(stores);

            store.setFlights();

            expect(store.flightsList).toStrictEqual([]);
            expect(stores.alternativeFlightsStore.setFilterOptionsCounts).toHaveBeenCalledWith([]);
        });

        it('should set flightsList and exclude first flight', () => {
            stores.bookingStore.alternativeFlights = [offerMock, offerMock2];

            const store = new ComparePriceStore(stores);

            store.originalFlightsOrdering = ['unique-id', 'unique-id'];

            store.setFlights();

            expect(store.flightsList).toStrictEqual([offerMock, offerMock]);
            expect(stores.alternativeFlightsStore.setFilterOptionsCounts).toHaveBeenCalledWith([offerMock]);
        });
    });
});
