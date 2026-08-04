import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { SeatType } from 'models/enum/SeatType';
import { ISeatMapFields } from 'frontend/components/renderings/SeatMap/components/ISeatMapFields';

import {
    generateSeatsFlightKey,
    getSeatPrice,
    getSeatProducts,
    getSelectedSeatsFromWidgetData,
    normalizeSeatMapFields,
} from './seatMap.utils';
import { mockSitecoreField, mockSitecoreImageField } from './tests.utils';

jest.mock('code/endpoints', () => ({ cmsUrls: { media: jest.fn(() => 'media') } }));

describe('seatMap.utils', () => {
    describe('normalizeSeatMapFields', () => {
        it('should return undefined when fields are undefined', () => {
            expect(normalizeSeatMapFields(undefined)).toBeUndefined();
        });

        it('should Set full url for all images', () => {
            const initialFields = {
                BenefitsHeadImageBackground: mockSitecoreField(mockSitecoreImageField('src')),
            } as ISeatMapFields;
            expect(normalizeSeatMapFields(initialFields)).toEqual({
                BenefitsHeadImageBackground: mockSitecoreField(mockSitecoreImageField('media')),
            });
        });

        it('should Set full url for all images inside multilist items', () => {
            const initialFields = {
                BenefitsTable: [
                    {
                        fields: {
                            IncludedIcon: mockSitecoreField(mockSitecoreImageField('src')),
                        },
                    },
                ],
            } as ISeatMapFields;

            expect(normalizeSeatMapFields(initialFields)).toEqual({
                BenefitsTable: [
                    {
                        fields: {
                            IncludedIcon: mockSitecoreField(mockSitecoreImageField('media')),
                        },
                    },
                ],
            });
        });

        it('should check if fields exist in inner item', () => {
            const initialFields = {
                BenefitsTable: [{}],
            } as ISeatMapFields;

            expect(normalizeSeatMapFields(initialFields)).toEqual({
                BenefitsTable: [{}],
            });
        });
    });

    describe('generateSeatsFlightKey', () => {
        it('should generateSeatsFlightKey', () => {
            expect(
                generateSeatsFlightKey({
                    fltNo: 'EZY2291',
                    car: 'EZY',
                    depPt: 'depPt',
                    arrPt: 'arrPt',
                    depDate: '2020-09-03',
                } as any),
            ).toEqual('depPt arrPt 2020-09-03 2291');
        });
    });

    describe('getSelectedSeatsFromWidgetData', () => {
        const value = [
            {
                flightNumber: '1234',
                sectorId: '1',
                seats: [
                    {
                        paxIndex: 1,
                        seatNumber: '11A',
                        price: 100,
                        priceBand: SeatType.Standard,
                        products: [{ id: '1234' }],
                    },
                ],
            },
        ] as any;

        it('should return selected seats without price', () => {
            const result = getSelectedSeatsFromWidgetData(value);

            expect(result).toEqual([
                {
                    flightNumber: '1234',
                    sectorId: '1',
                    seats: [{ paxIndex: 1, seatNumber: '11A', products: [{ id: '1234' }] }],
                },
            ]);
        });

        it('should return selected seats with price and priceBand when shouldIncludePrice is set', () => {
            const result = getSelectedSeatsFromWidgetData(value, true);

            expect(result).toEqual([
                {
                    flightNumber: '1234',
                    sectorId: '1',
                    seats: [
                        {
                            paxIndex: 1,
                            seatNumber: '11A',
                            price: 100,
                            priceBand: SeatType.Standard,
                            products: [{ id: '1234' }],
                        },
                    ],
                },
            ]);
        });

        it('should return selected seats with products', () => {
            const result = getSelectedSeatsFromWidgetData(value);

            expect(result).toEqual([
                {
                    flightNumber: '1234',
                    sectorId: '1',
                    seats: [{ paxIndex: 1, seatNumber: '11A', products: [{ id: '1234' }] }],
                },
            ]);
        });
    });

    describe('getSeatPrice', () => {
        it('should getSeatPrice', () => {
            expect(
                getSeatPrice(
                    [
                        {
                            flightNumber: '123',
                            sectorId: '0',
                            seats: [
                                { paxIndex: 0, seatNumber: '2F', price: 9.99 },
                                { paxIndex: 1, seatNumber: '3F', price: 19.99 },
                            ],
                        },
                        {
                            flightNumber: '124',
                            sectorId: '1',
                            seats: [
                                { paxIndex: 0, seatNumber: '4F', price: 19.99 },
                                { paxIndex: 1, seatNumber: '5F', price: 29.99 },
                            ],
                        },
                    ],
                    '123',
                    '2F',
                ),
            ).toEqual(9.99);
        });

        it('should getSeatPrice without seat number', () => {
            expect(
                getSeatPrice(
                    [
                        {
                            flightNumber: '123',
                            sectorId: '0',
                            seats: [
                                { paxIndex: 0, seatNumber: '2F', price: 9.99 },
                                { paxIndex: 1, seatNumber: '3F', price: 19.99 },
                            ],
                        },
                        {
                            flightNumber: '124',
                            sectorId: '1',
                            seats: [
                                { paxIndex: 0, seatNumber: '4F', price: 19.99 },
                                { paxIndex: 1, seatNumber: '5F', price: 29.99 },
                            ],
                        },
                    ],
                    '123',
                ),
            ).toBeUndefined();
        });

        it('should getSeatPrice with empty arguments', () => {
            expect(
                getSeatPrice([
                    {
                        flightNumber: '123',
                        sectorId: '0',
                        seats: [
                            { paxIndex: 0, seatNumber: '2F', price: 9.99 },
                            { paxIndex: 1, seatNumber: '3F', price: 19.99 },
                        ],
                    },
                    {
                        flightNumber: '124',
                        sectorId: '1',
                        seats: [
                            { paxIndex: 0, seatNumber: '4F', price: 19.99 },
                            { paxIndex: 1, seatNumber: '5F', price: 29.99 },
                        ],
                    },
                ]),
            ).toBeUndefined();
        });
    });
});

describe('getSeatProducts', () => {
    it('should return products for provided seat number', () => {
        const selectedSeats = [
            { flightNumber: '1', seats: [{ seatNumber: '1A', products: [{ id: '12' }] }] },
            { flightNumber: '2', seats: [{ seatNumber: '1A', products: [{ id: '34' }, { id: '56' }] }] },
        ] as ISelectedSeat[];
        const flightNumber = '2';
        const seatNumber = '1A';

        const result = getSeatProducts(selectedSeats, flightNumber, seatNumber);

        expect(result).toEqual([{ id: '34' }, { id: '56' }]);
    });

    it('should return [] if products were not found', () => {
        const selectedSeats = [
            { flightNumber: '1', seats: [{ seatNumber: '1A', products: [{ id: '12' }] }] },
            { flightNumber: '2', seats: [{ seatNumber: '1A', products: [{ id: '34' }, { id: '56' }] }] },
        ] as ISelectedSeat[];
        const flightNumber = '2';
        const seatNumber = '2A';

        const result = getSeatProducts(selectedSeats, flightNumber, seatNumber);

        expect(result).toEqual([]);
    });
});
