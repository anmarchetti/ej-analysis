import { deepClone } from 'frontend/utils/array.utils';
import * as utils from 'frontend/utils/livePrice.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IDestinationFields } from 'models/data/IDestinationFields';
import { IRequestedPrice } from 'models/data/IRequestedPrice';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import { IDealsDestinationsCard, IDealsDestinationTileFields } from './interfaces';
import { mockTileFields } from './mocks';
import { collectCardsTrackingInfo, getCardsRequestedPriceCodes, getDestTileRequestedPriceText } from './utils';

const mockRequestedPriceAmountText = 'mockRequestedPriceAmountText';
const mockGetRequestedPriceAmountText = jest
    .spyOn(utils, 'getRequestedPriceAmountText')
    .mockReturnValue(mockRequestedPriceAmountText);

describe('DealsDestination utils', () => {
    const formatMoney = jest.fn();

    describe('getDestTileRequestedPriceText', () => {
        let pricesByDestCodes: Map<string, IRequestedPrice>;
        let fields: IDealsDestinationTileFields;

        beforeEach(() => {
            pricesByDestCodes = { ES: { value: { geog: 'ES' } }, get: jest.fn(p => p) } as unknown as Map<
                string,
                IRequestedPrice
            >;

            fields = deepClone(mockTileFields);
        });

        it('should return result from getRequestedPriceAmountText', () => {
            const res = getDestTileRequestedPriceText(fields, pricesByDestCodes, formatMoney);

            expect(mockGetRequestedPriceAmountText).toHaveBeenCalledWith(
                fields.Destination[0].fields.Code.value,
                fields.PriceMathFunction.fields.Code.value,
                fields.IsRequestedPricePP.value,
                formatMoney,
            );
            expect(res).toBe(mockRequestedPriceAmountText);
        });

        it('should return empty string when isPriceEnabled is false', () => {
            fields.IsRequestedPriceEnabled.value = false;
            const res = getDestTileRequestedPriceText(fields, pricesByDestCodes, formatMoney);

            expect(mockGetRequestedPriceAmountText).not.toHaveBeenCalled();
            expect(res).toBe('');
        });

        it('should return empty string when no destinations', () => {
            fields.Destination = [];
            const res = getDestTileRequestedPriceText(fields, pricesByDestCodes, formatMoney);

            expect(mockGetRequestedPriceAmountText).not.toHaveBeenCalled();
            expect(res).toBe('');
        });
    });

    describe('getCardsRequestedPriceCodes', () => {
        const mockBuildLivePriceCode = jest
            .spyOn(utils, 'buildLivePriceCode')
            .mockImplementation((code, searchName) => `${code}-${searchName || ''}`);

        it('should return codes when tiles have destination and price enabled', () => {
            const cards: IDealsDestinationsCard[] = [
                {
                    fields: {
                        Tiles: [
                            {
                                fields: {
                                    Destination: [{ fields: { Code: mockSitecoreField('ES') } }],
                                    IsRequestedPriceEnabled: mockSitecoreField(true),
                                },
                            } as any,
                        ],
                    },
                } as any,
            ];

            const res = getCardsRequestedPriceCodes(cards, 'search');

            expect(mockBuildLivePriceCode).toHaveBeenCalledWith('ES', 'search');
            expect(res).toEqual(['ES-search']);
        });

        it('should return empty array when no valid tiles', () => {
            const cards: IDealsDestinationsCard[] = [
                {
                    fields: {
                        Tiles: [
                            {
                                fields: {
                                    Destination: [{ fields: { Code: mockSitecoreField('ES') } }],
                                    IsRequestedPriceEnabled: mockSitecoreField(false),
                                },
                            } as any,
                            {
                                fields: {
                                    Destination: [{ fields: { Code: mockSitecoreField(null) } }],
                                    IsRequestedPriceEnabled: mockSitecoreField(true),
                                },
                            } as any,
                        ],
                    },
                } as any,
            ];

            const res = getCardsRequestedPriceCodes(cards);

            expect(res).toEqual([]);
        });
    });

    describe('collectCardsTrackingInfo', () => {
        let pricesByDestCodes: Map<string, IRequestedPrice>;
        let cards: IDealsDestinationsCard[];

        beforeEach(() => {
            pricesByDestCodes = { ES: { value: { geog: 'ES' } }, get: jest.fn(p => p) } as unknown as Map<
                string,
                IRequestedPrice
            >;
            cards = [
                {
                    fields: {
                        Country: {
                            fields: { Name: mockSitecoreField('Spain') },
                        } as ISitecoreCompositeField<IDestinationFields>,
                        Image: mockSitecoreField(mockSitecoreImageField('Image')),
                        Title: mockSitecoreField('MockTitle'),
                        Tiles: [
                            {
                                fields: deepClone(mockTileFields),
                                id: 'tile-0',
                            },
                        ],
                    },
                    id: 'card-0',
                },
            ];
        });

        it('should collect tracking info with destination and price', () => {
            const res = collectCardsTrackingInfo(cards, pricesByDestCodes, formatMoney);

            expect(res).toHaveLength(1);
            expect(res[0].moduleTitle).toBe(cards[0].fields.Title.value);
            expect(res[0].destinationName).toBe(cards[0].fields.Tiles[0].fields.Destination[0].fields.Name.value);
            expect(res[0].price).toBe(mockRequestedPriceAmountText);
        });

        it('should fallback to Country name when no Title', () => {
            cards = [
                {
                    fields: {
                        Country: { fields: { Name: mockSitecoreField('Spain') } },
                        Tiles: [],
                    },
                } as any,
            ];

            const res = collectCardsTrackingInfo(cards, pricesByDestCodes, formatMoney);
            expect(res[0].moduleTitle).toBe('Spain');
        });

        it('should use formatMoney(0) when IsRequestedPriceEnabled is false', () => {
            cards[0].fields.Tiles[0].fields.IsRequestedPriceEnabled.value = false;

            collectCardsTrackingInfo(cards, pricesByDestCodes, formatMoney);

            expect(formatMoney).toHaveBeenCalledWith(0);
        });
    });
});
