import { altOffers } from 'frontend/__mocks__/altOffer';
import { allInclusiveBoard, bedBreakfastBoard, halfBoard } from 'frontend/__mocks__/boards';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IUnit } from 'models/data/IOffer';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';

import {
    compare,
    getSelectValueFromSortOrder,
    sortBoardsByPrice,
    sortBy,
    sortFlights,
    sortPrice,
    sortRoomsByName,
    sortRoomsPriceHighLow,
    sortRoomsPriceLowHigh,
} from './sort.utils';

describe('sort.utils', () => {
    describe('sortBy', () => {
        it('should sort array of objects without comparer a < b', () => {
            const a = 1;
            const b = 2;
            const res = sortBy(a, b);
            expect(res).toBe(-1);
        });

        it('should sort array of objects without comparer a > b', () => {
            const a = 4;
            const b = 2;
            const res = sortBy(a, b);
            expect(res).toBe(1);
        });

        it('should sort array of objects without comparer a = b', () => {
            const a = 2;
            const b = 2;
            const res = sortBy(a, b);
            expect(res).toBe(0);
        });

        it('should sort array of objects with comparer a < b', () => {
            const a = { test: 1 };
            const b = { test: 2 };
            const res = sortBy(a, b, val => val.test);
            expect(res).toBe(-1);
        });

        it('should sort array of objects with comparer a > b', () => {
            const a = { test: 5 };
            const b = { test: 2 };
            const res = sortBy(a, b, val => val.test);
            expect(res).toBe(1);
        });

        it('should sort array of objects with comparer a = b', () => {
            const a = { test: 2 };
            const b = { test: 2 };
            const res = sortBy(a, b, val => val.test);
            expect(res).toBe(0);
        });
    });

    describe('compare', () => {
        it('should sort array of objects without key a < b', () => {
            const a = 1;
            const b = 2;
            const res = compare(a, b);
            expect(res).toBe(-1);
        });

        it('should sort array of objects without key a > b', () => {
            const a = 4;
            const b = 2;
            const res = compare(a, b);
            expect(res).toBe(1);
        });

        it('should sort array of objects without key a = b', () => {
            const a = 2;
            const b = 2;
            const res = compare(a, b);
            expect(res).toBe(0);
        });

        it('should sort array of objects with key a < b', () => {
            const a = { test: 1 };
            const b = { test: 2 };
            const res = compare(a, b, 'test');
            expect(res).toBe(-1);
        });

        it('should sort array of objects with key a > b', () => {
            const a = { test: 5 };
            const b = { test: 2 };
            const res = compare(a, b, 'test');
            expect(res).toBe(1);
        });

        it('should sort array of objects with key a = b', () => {
            const a = { test: 2 };
            const b = { test: 2 };
            const res = compare(a, b, 'test');
            expect(res).toBe(0);
        });
    });

    describe.each([
        [
            [100, 200, 50, 80],
            [50, 80, 100, 200],
        ],
        [
            [200, null, 100],
            [200, null, 100],
        ],
    ])('sortPrice()', (arr, expected) => {
        it(`should return ${expected}`, () => {
            expect(sortPrice(arr)).toEqual(expected);
        });
    });

    describe('Sort Rooms', () => {
        describe.each([
            [{ roomType: { title: { value: 'B Room' } } }, { roomType: { title: { value: 'A Room' } } }, 1],
            [{ roomType: { title: { value: 'A Room' } } }, { roomType: { title: { value: 'B Room' } } }, -1],
            [{ roomType: { title: { value: 'A Room' } } }, { roomType: { title: { value: 'A Room' } } }, 0],
            [{}, { roomType: { title: { value: 'A Room' } } }, -1],
        ])('sortRoomsByName()', (leftRoom, rightRoom, expected) => {
            it(`should return ${expected}`, () => {
                expect(sortRoomsByName(leftRoom as IUnit, rightRoom as IUnit)).toEqual(expected);
            });
        });

        describe.each([
            [{ price: 300 }, { price: 500 }, 1],
            [{ price: 500 }, { price: 300 }, -1],
            [{ price: 300 }, { price: 300 }, 0],
            [
                { price: 300, roomType: { title: { value: 'B Room' } } },
                { price: 300, roomType: { title: { value: 'A Room' } } },
                1,
            ],
        ])('sortRoomsPriceHighLow()', (leftRoom, rightRoom, expected) => {
            it(`should return ${expected}`, () => {
                expect(sortRoomsPriceHighLow(leftRoom as IUnit, rightRoom as IUnit)).toEqual(expected);
            });
        });

        describe.each([
            [{ price: 300 }, { price: 500 }, -1],
            [{ price: 500 }, { price: 300 }, 1],
            [{ price: 300 }, { price: 300 }, 0],
            [
                { price: 300, roomType: { title: { value: 'B Room' } } },
                { price: 300, roomType: { title: { value: 'A Room' } } },
                1,
            ],
        ])('sortRoomsPriceLowHigh()', (leftRoom, rightRoom, expected) => {
            it(`should return ${expected}`, () => {
                expect(sortRoomsPriceLowHigh(leftRoom as IUnit, rightRoom as IUnit)).toEqual(expected);
            });
        });
    });

    describe('getSelectValueFromSortOrder', () => {
        it('should return correct value', () => {
            const field = {
                id: '123',
                fields: {
                    Code: {
                        value: 'CodeVal',
                    },
                    Title: {
                        value: 'TitleVal',
                    },
                },
            };

            const result = getSelectValueFromSortOrder(field);
            expect(result.label).toEqual(field.fields.Title.value);
            expect(result.value).toEqual(field.fields.Code.value);
        });
    });

    describe('Sort Flights', () => {
        it('should return initial array if sort by is not set', () => {
            const sortedFlights = sortFlights(altOffers);

            expect(sortedFlights).toEqual(altOffers);
        });

        it('should sort by PriceLowToHigh', () => {
            const sortedFlights = sortFlights(altOffers, AlternativeFlightsSortBy.PriceLowToHigh);

            expect(sortedFlights).toEqual([
                expect.objectContaining({ price: 1000 }),
                expect.objectContaining({ price: 1200 }),
                expect.objectContaining({ price: 1400 }),
            ]);
        });

        it('should sort by PriceHightToLow', () => {
            const sortedFlights = sortFlights(altOffers, AlternativeFlightsSortBy.PriceHightToLow);

            expect(sortedFlights).toEqual([
                expect.objectContaining({ price: 1400 }),
                expect.objectContaining({ price: 1200 }),
                expect.objectContaining({ price: 1000 }),
            ]);
        });

        it('should sort by OutboundEarliestDeparture', () => {
            const sortedFlights = sortFlights(altOffers, AlternativeFlightsSortBy.OutboundEarliestDeparture);

            expect(sortedFlights[0].transport.routes[0].depDate).toEqual('2022-05-14T05:00:00');
            expect(sortedFlights[1].transport.routes[0].depDate).toEqual('2022-05-14T16:30:00');
            expect(sortedFlights[2].transport.routes[0].depDate).toEqual('2022-05-14T18:00:00');
        });

        it('should sort by ReturningEarliestArrival', () => {
            const sortedFlights = sortFlights(altOffers, AlternativeFlightsSortBy.ReturningEarliestArrival);

            expect(sortedFlights[0].transport.routes[1].arrDate).toEqual('2022-05-21T12:40:00');
            expect(sortedFlights[1].transport.routes[1].arrDate).toEqual('2022-05-21T18:40:00');
            expect(sortedFlights[2].transport.routes[1].arrDate).toEqual('2022-05-21T23:00:00');
        });

        it('should sort by NearestAirport', () => {
            const mockOffers = altOffers.map(
                (offer, index) => ({ ...offer, distanceToOriginalAirport: index } as IAlternativeOffer),
            );
            const sortedFlights = sortFlights(mockOffers, AlternativeFlightsSortBy.NearestAirport);

            expect(sortedFlights[0].distanceToOriginalAirport).toEqual(0);
            expect(sortedFlights[1].distanceToOriginalAirport).toEqual(1);
            expect(sortedFlights[2].distanceToOriginalAirport).toEqual(2);
        });
    });

    describe('Sort Boards by price', () => {
        let notValidatedOfferPricePP = 0;

        beforeEach(() => {
            notValidatedOfferPricePP = 0;
        });

        it('should sort boards from the lowest price to the highest', () => {
            const initialBoards = [allInclusiveBoard, bedBreakfastBoard, halfBoard];
            const sortedBoards = sortBoardsByPrice(initialBoards, notValidatedOfferPricePP);

            expect(sortedBoards).toEqual([
                expect.objectContaining({ code: bedBreakfastBoard.code }),
                expect.objectContaining({ code: halfBoard.code }),
                expect.objectContaining({ code: allInclusiveBoard.code }),
            ]);
        });

        it('should sort using notValidatedOfferPricePP when pricesPP and price are undefined', () => {
            notValidatedOfferPricePP = 10;

            const allInclusiveBoardMock = { ...allInclusiveBoard, pricePP: undefined, price: undefined };
            const bedBreakfastBoardBoardMock = { ...bedBreakfastBoard, pricePP: undefined, price: undefined };
            const mockedAllBoards = [halfBoard, allInclusiveBoardMock, bedBreakfastBoardBoardMock];
            const sortedBoards = sortBoardsByPrice(mockedAllBoards, notValidatedOfferPricePP);

            expect(sortedBoards).toEqual([
                expect.objectContaining({ code: allInclusiveBoard.code }),
                expect.objectContaining({ code: bedBreakfastBoard.code }),
                expect.objectContaining({ code: halfBoard.code }),
            ]);
        });

        it('should sort using price when notValidatedOfferPricePP is 0 and pricesPP are undefined', () => {
            notValidatedOfferPricePP = 0;

            const allInclusiveBoardMock = { ...allInclusiveBoard, pricePP: undefined };
            const bedBreakfastBoardBoardMock = { ...bedBreakfastBoard, pricePP: undefined };
            const halfBoardBoardMock = { ...halfBoard, pricePP: undefined };
            const mockedAllBoards = [halfBoardBoardMock, allInclusiveBoardMock, bedBreakfastBoardBoardMock];
            const sortedBoards = sortBoardsByPrice(mockedAllBoards, notValidatedOfferPricePP);

            expect(sortedBoards).toEqual([
                expect.objectContaining({ code: bedBreakfastBoard.code }),
                expect.objectContaining({ code: halfBoard.code }),
                expect.objectContaining({ code: allInclusiveBoard.code }),
            ]);
        });

        it('should sort using price and notValidatedOfferPricePP for default option which have no price', () => {
            notValidatedOfferPricePP = 0;

            const allInclusiveBoardMock = { ...allInclusiveBoard, pricePP: undefined };
            const bedBreakfastBoardBoardMock = { ...bedBreakfastBoard, pricePP: undefined, price: undefined };
            const halfBoardBoardMock = { ...halfBoard, pricePP: undefined };
            const mockedAllBoards = [halfBoardBoardMock, allInclusiveBoardMock, bedBreakfastBoardBoardMock];
            const sortedBoards = sortBoardsByPrice(mockedAllBoards, notValidatedOfferPricePP);

            expect(sortedBoards).toEqual([
                expect.objectContaining({ code: bedBreakfastBoard.code }),
                expect.objectContaining({ code: halfBoard.code }),
                expect.objectContaining({ code: allInclusiveBoard.code }),
            ]);
        });

        it('should sort by name when prices are equal', () => {
            const allInclusiveBoardMock = { ...allInclusiveBoard, pricePP: bedBreakfastBoard.pricePP };
            const mockedAllBoards = [allInclusiveBoardMock, bedBreakfastBoard, halfBoard];
            const sortedBoards = sortBoardsByPrice(mockedAllBoards, notValidatedOfferPricePP);

            expect(sortedBoards).toEqual([
                expect.objectContaining({ code: allInclusiveBoard.code }),
                expect.objectContaining({ code: bedBreakfastBoard.code }),
                expect.objectContaining({ code: halfBoard.code }),
            ]);
        });

        it('should sort by name when prices are equal and when title is empty sting', () => {
            const bedBreakfastBoardBoardMock = { ...bedBreakfastBoard, title: '' };
            const allInclusiveBoardMock = {
                ...allInclusiveBoard,
                ...{ pricePP: bedBreakfastBoard.pricePP, title: '' },
            };

            const mockedAllBoards = [halfBoard, allInclusiveBoardMock, bedBreakfastBoardBoardMock];
            const sortedBoards = sortBoardsByPrice(mockedAllBoards, notValidatedOfferPricePP);

            expect(sortedBoards).toEqual([
                expect.objectContaining({ code: allInclusiveBoard.code }),
                expect.objectContaining({ code: bedBreakfastBoard.code }),
                expect.objectContaining({ code: halfBoard.code }),
            ]);
        });
    });
});
