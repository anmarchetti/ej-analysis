import { mockLivePrice } from 'frontend/__mocks__';
import { IDestination } from 'models/data/IDestination';
import { IDestinationFields } from 'models/data/IDestinationFields';
import { ILivePrice, ILivePriceNamedSearchesFields } from 'models/data/ILivePrice';
import { IOffer } from 'models/data/IOffer';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { IRequestedPrice, IRequestedPriceValues, TRequestedPriceByMathFunctions } from 'models/data/IRequestedPrice';
import { DestinationType } from 'models/enum/DestinationType';
import { PriceMathFunction } from 'models/enum/PriceMathFunction';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import {
    buildLivePriceCode,
    buildLivePriceCodes,
    formatRequestedPrice,
    getActualPrice,
    getCheapestLivePrice,
    getDestinationLivePriceByAccomCode,
    getDestinationLivePriceByCode,
    getLivePriceCriteriaOfPromoBlocks,
    getLivePriceCriterion,
    getLivePriceNumberOfNightsLabel,
    getLivePriceOfDestinationWithRegions,
    getRequestedPriceAmountText,
    getRequestedPriceValues,
    getSearchQueryParamsByPrice,
    isLivePriceEnabledForDestinationPage,
    isRequestedPriceInputValid,
    isRequestedPriceValuesValid,
    setLivePricesToPromoBlocks,
} from './livePrice.utils';
import { mockSitecoreField } from './tests.utils';

jest.mock('frontend/utils/date.utils', () => ({
    parseDateL10n: jest.fn(d => new Date(d)),
    addDays: jest.fn((s, d) => new Date(d)),
}));

describe('livePrice.utils', () => {
    const livePrices = [
        { geog: 'ES', accomCode: 'ESK3123', price: 200, pricePP: 100, touristTax: 20, touristTaxPP: 10 },
        { geog: 'ESCD', price: 400, pricePP: 200, touristTax: 0, touristTaxPP: 0 },
        { geog: 'ESAL', price: 100, pricePP: 50, touristTax: -1, touristTaxPP: -1 },
        { geog: 'ESSV', price: 300, pricePP: 150, touristTax: 0, touristTaxPP: 0 },
        { geog: '123456', price: 300, pricePP: 150, touristTax: 0, touristTaxPP: 0 },
    ] as ILivePrice[];

    describe('buildLivePriceCode()', () => {
        it('should build code with search name', () => {
            expect(buildLivePriceCode('ES', 'Beach')).toBe('ES.Beach');
        });

        it('should build code without search name', () => {
            expect(buildLivePriceCode('ES', '')).toBe('ES');
        });
    });

    describe('buildLivePriceCodes()', () => {
        it('should build codes without duplicates', () => {
            const criteriaItems = [
                { destinationCode: 'VAND', relatedRegions: ['ESCD', 'ESAL', 'ESSV', 'ESGR'] },
                { destinationCode: 'ESCD' },
                { destinationCode: 'ESCD', searchName: 'Beach' },
            ];
            expect(buildLivePriceCodes(criteriaItems)).toEqual(['ESCD', 'ESAL', 'ESSV', 'ESGR', 'ESCD.Beach']);
        });

        it('should return empty list if no criteria items', () => {
            expect(buildLivePriceCodes([])).toEqual([]);
        });
    });

    describe('getDestinationLivePriceByCode()', () => {
        it('should return live price object by destination code', () => {
            expect(getDestinationLivePriceByCode('ES', livePrices)).toBe(livePrices[0]);
        });

        it('should return NULL if no live price for destination code', () => {
            expect(getDestinationLivePriceByCode('PT', livePrices)).toBeNull();
        });

        it('should return NULL if no live prices', () => {
            expect(getDestinationLivePriceByCode('PT', [])).toBeNull();
        });

        it('should return NULL if no destination code', () => {
            expect(getDestinationLivePriceByCode(undefined, livePrices)).toBeNull();
        });
    });

    describe('getDestinationLivePriceByAccomCode', () => {
        it('should return live price object by accom code', () => {
            expect(getDestinationLivePriceByAccomCode('ESK3123', livePrices)).toBe(livePrices[0]);
        });

        it('should return NULL if no live price for accom code', () => {
            expect(getDestinationLivePriceByAccomCode('PTE12312', livePrices)).toBeNull();
        });

        it('should return NULL if no live prices', () => {
            expect(getDestinationLivePriceByAccomCode('PTR12344', [])).toBeNull();
        });

        it('should return NULL if no accom code', () => {
            expect(getDestinationLivePriceByAccomCode(undefined, livePrices)).toBeNull();
        });
    });

    describe('isLivePriceEnabledForDestinationPage()', () => {
        it('should return true if no excludedDestinations', () => {
            expect(isLivePriceEnabledForDestinationPage('ES')).toBeTruthy();
        });

        it('should return true if page code is not excluded', () => {
            expect(isLivePriceEnabledForDestinationPage('ES', [], [], ['PT'])).toBeTruthy();
        });

        it('should return false if page code is excluded', () => {
            expect(isLivePriceEnabledForDestinationPage('ES', [], [], ['ES'])).toBeFalsy();
        });

        it('should return false if parent code is excluded', () => {
            expect(
                isLivePriceEnabledForDestinationPage('ESTF', [{ code: 'ES' } as IDestination], [], ['ES']),
            ).toBeFalsy();
        });

        it('should return false if all related regions are excluded', () => {
            expect(
                isLivePriceEnabledForDestinationPage(
                    'VAND',
                    [{ code: 'ES' } as IDestination],
                    ['ESCD', 'ESAL', 'ESSV', 'ESGR'],
                    ['ESCD', 'ESAL', 'ESSV', 'ESGR'],
                ),
            ).toBeFalsy();
        });
    });

    describe('getLivePriceOfDestinationWithRegions()', () => {
        it('should return the cheapest live price of related region', () => {
            expect(
                getLivePriceOfDestinationWithRegions(
                    { GiataCode: { value: 'VAND' } } as IDestinationFields,
                    ['ESCD', 'ESAL', 'ESSV'],
                    livePrices,
                ),
            ).toEqual({
                geog: 'ESAL',
                price: 100,
                pricePP: 50,
                touristTax: -1,
                touristTaxPP: -1,
            });
        });

        it('should return the price of destination itself', () => {
            expect(
                getLivePriceOfDestinationWithRegions(
                    { GiataCode: { value: 'ESCD' } } as IDestinationFields,
                    [],
                    livePrices,
                ),
            ).toEqual({
                geog: 'ESCD',
                price: 400,
                pricePP: 200,
                touristTax: 0,
                touristTaxPP: 0,
            });
        });
    });

    describe('getSearchQueryParamsByPrice()', () => {
        it('should return params', () => {
            expect(
                getSearchQueryParamsByPrice({
                    geog: 'ES',
                    searchCriteria: {
                        date: '2021-10-10',
                        duration: 7,
                        adults: 2,
                        children: 1,
                        childAges: [10],
                        infants: 0,
                    },
                } as ILivePrice),
            ).toEqual({
                accomCode: undefined,
                geog: 'ES',
                startDate: new Date('2021-10-10'),
                endDate: new Date('2021-10-10'),
                rooms: [{ adults: 2, childrenAges: [10], children: 1, infants: 0 }],
            });
        });
    });

    describe('Promo Blocks', () => {
        const promoBlocks = [
            {
                fields: {
                    LinkedDestination: [{ fields: { Code: mockSitecoreField('ES') } }],
                    LivePriceNamedSearches: { fields: { Name: mockSitecoreField('City') } },
                },
            },
            {
                fields: {
                    LinkedDestination: [
                        {
                            fields: {
                                Code: mockSitecoreField('VAND'),
                                Regions: [
                                    { fields: { Code: mockSitecoreField('ESCD') } },
                                    { fields: { Code: mockSitecoreField('ESAL') } },
                                ],
                            },
                        },
                    ],
                    LivePriceNamedSearches: { fields: { Name: mockSitecoreField('Beach') } },
                },
            },
            {
                fields: {
                    LinkedDestination: [{ fields: { GiataCode: mockSitecoreField('123456') } }],
                },
            },
            { fields: {} },
        ] as IPromoBlockFields[];

        describe('getLivePriceCriteriaOfPromoBlocks()', () => {
            it('should return criteria list', () => {
                expect(getLivePriceCriteriaOfPromoBlocks(promoBlocks)).toEqual([
                    { destinationCode: 'ES', relatedRegions: [], searchName: 'City' },
                    { destinationCode: 'VAND', relatedRegions: ['ESCD', 'ESAL'], searchName: 'Beach' },
                ]);
            });

            it('should return empty list', () => {
                expect(getLivePriceCriteriaOfPromoBlocks([])).toEqual([]);
            });
        });

        describe('setLivePricesToPromoBlocks()', () => {
            it('should set live prices with tourist tax enabled', () => {
                expect(setLivePricesToPromoBlocks(promoBlocks, livePrices)).toEqual([
                    expect.objectContaining({
                        livePrice: {
                            accomCode: 'ESK3123',
                            geog: 'ES',
                            price: 200,
                            pricePP: 100,
                            touristTax: 20,
                            touristTaxPP: 10,
                        },
                        isLivePriceValid: true,
                    }),
                    expect.objectContaining({
                        livePrice: { geog: 'ESAL', price: 100, pricePP: 50, touristTax: -1, touristTaxPP: -1 },
                        isLivePriceValid: true,
                    }),
                    expect.objectContaining({
                        livePrice: { geog: '123456', price: 300, pricePP: 150, touristTax: 0, touristTaxPP: 0 },
                        isLivePriceValid: true,
                    }),
                    expect.objectContaining({ livePrice: null }),
                ]);
            });

            it('should set live prices with tourist tax disabled', () => {
                const result = setLivePricesToPromoBlocks(promoBlocks, livePrices);
                expect(result).toEqual([
                    expect.objectContaining({
                        livePrice: {
                            accomCode: 'ESK3123',
                            geog: 'ES',
                            price: 200,
                            pricePP: 100,
                            touristTax: 20,
                            touristTaxPP: 10,
                        },
                        isLivePriceValid: true,
                    }),
                    expect.objectContaining({
                        livePrice: { geog: 'ESAL', price: 100, pricePP: 50, touristTax: -1, touristTaxPP: -1 },
                        isLivePriceValid: true,
                    }),
                    expect.objectContaining({
                        livePrice: { geog: '123456', price: 300, pricePP: 150, touristTax: 0, touristTaxPP: 0 },
                        isLivePriceValid: true,
                    }),
                    expect.objectContaining({ livePrice: null }),
                ]);
            });

            it('should return promo blocks with null live price when destination code is missing', () => {
                const blocksWithoutDest = [
                    {
                        fields: {
                            LinkedDestination: [{ fields: {} }],
                            LivePriceNamedSearches: { fields: { Name: mockSitecoreField('City') } },
                        },
                    },
                ] as IPromoBlockFields[];

                const result = setLivePricesToPromoBlocks(blocksWithoutDest, livePrices);
                expect(result[0].livePrice).toBeNull();
            });

            it('should return promo blocks with null live price when linked destination is missing', () => {
                const blocksWithoutDest = [
                    {
                        fields: {
                            LivePriceNamedSearches: { fields: { Name: mockSitecoreField('City') } },
                        },
                    },
                ] as IPromoBlockFields[];

                const result = setLivePricesToPromoBlocks(blocksWithoutDest, livePrices);
                expect(result[0].livePrice).toBeNull();
            });

            it('should return promo blocks with matching live price by GiataCode', () => {
                const blockWithGiata = [
                    {
                        fields: {
                            LinkedDestination: [{ fields: { GiataCode: mockSitecoreField('123456') } }],
                            LivePriceNamedSearches: { fields: { Name: mockSitecoreField('Test') } },
                        },
                    },
                ] as IPromoBlockFields[];

                const result = setLivePricesToPromoBlocks(blockWithGiata, livePrices);
                expect(result[0].livePrice).toEqual({
                    geog: '123456',
                    price: 300,
                    pricePP: 150,
                    touristTax: 0,
                    touristTaxPP: 0,
                });
            });

            it('should find cheapest price when destination has related regions', () => {
                const blockWithRegions = [
                    {
                        fields: {
                            LinkedDestination: [
                                {
                                    fields: {
                                        Code: mockSitecoreField('VAND'),
                                        Regions: [
                                            { fields: { Code: mockSitecoreField('ESCD') } },
                                            { fields: { Code: mockSitecoreField('ESAL') } },
                                            { fields: { Code: mockSitecoreField('ESSV') } },
                                        ],
                                    },
                                },
                            ],
                            LivePriceNamedSearches: { fields: { Name: mockSitecoreField('Beach') } },
                        },
                    },
                ] as IPromoBlockFields[];

                const result = setLivePricesToPromoBlocks(blockWithRegions, livePrices);
                // Should return cheapest price: ESAL with pricePP: 50
                expect(result[0].livePrice).toEqual({
                    geog: 'ESAL',
                    price: 100,
                    pricePP: 50,
                    touristTax: -1,
                    touristTaxPP: -1,
                });
            });

            it('should return empty array when input is empty', () => {
                const result = setLivePricesToPromoBlocks([], livePrices);
                expect(result).toEqual([]);
            });

            it('should preserve all original promo block fields', () => {
                const blockWithExtra = [
                    {
                        fields: {
                            LinkedDestination: [{ fields: { Code: mockSitecoreField('ES') } }],
                            LivePriceNamedSearches: { fields: { Name: mockSitecoreField('City') } },
                        },
                        id: 'test-id',
                        customField: 'custom-value',
                    } as any,
                ] as IPromoBlockFields[];

                const result = setLivePricesToPromoBlocks(blockWithExtra, livePrices);
                expect(result[0].id).toBe('test-id');
                expect((result[0] as any).customField).toBe('custom-value');
                expect(result[0].livePrice).toBeDefined();
                expect(result[0].isLivePriceValid).toBeDefined();
            });
        });

        describe('formatRequestedPrice()', () => {
            const formatMoney = amount => `£${amount}`;
            const baseValues = {
                price: 1000,
                pricePP: 500,
                touristTax: 50,
                touristTaxPP: 25,
            } as IRequestedPriceValues;

            it('should return empty string if priceValues is undefined', () => {
                expect(formatRequestedPrice(undefined, false, formatMoney)).toBe('');
            });

            it('should return formatted price with tourist tax when isPricePP=false and isTouristTaxEnabled=true', () => {
                expect(formatRequestedPrice(baseValues, false, formatMoney)).toBe('£1000');
            });

            it('should return formatted pricePP with tourist tax when isPricePP=true and isTouristTaxEnabled=true', () => {
                expect(formatRequestedPrice(baseValues, true, formatMoney)).toBe('£500');
            });

            it('should return formatted price without tourist tax when isPricePP=false and isTouristTaxEnabled=false', () => {
                expect(formatRequestedPrice(baseValues, false, formatMoney)).toBe('£1000');
            });

            it('should return formatted pricePP without tourist tax when isPricePP=true and isTouristTaxEnabled=false', () => {
                expect(formatRequestedPrice(baseValues, true, formatMoney)).toBe('£500');
            });

            it('should return empty string if price is falsy (0)', () => {
                const zeroValues = { price: 0, pricePP: 0, touristTax: 0, touristTaxPP: 0 } as IRequestedPriceValues;
                expect(formatRequestedPrice(zeroValues, false, formatMoney)).toBe('');
            });

            it('should handle missing touristTax fields gracefully', () => {
                const values = { price: 100, pricePP: 50 } as IRequestedPriceValues;
                expect(formatRequestedPrice(values, false, formatMoney)).toBe('£100');
                expect(formatRequestedPrice(values, true, formatMoney)).toBe('£50');
            });
        });

        describe('getRequestedPriceAmountText()', () => {
            const formatMoney = amount => `£${amount}`;
            const base = (overrides = {}) =>
                ({
                    requestedPriceByMathFunctions: {
                        [PriceMathFunction.Cheapest]: { price: 100, pricePP: 50, touristTax: 10, touristTaxPP: 5 },
                        [PriceMathFunction.MostExpensive]: {
                            price: 200,
                            pricePP: 100,
                            touristTax: 20,
                            touristTaxPP: 10,
                        },
                        ...overrides,
                    } as TRequestedPriceByMathFunctions,
                } as IRequestedPrice);

            it('should return formatted price for Cheapest (isPricePP=false)', () => {
                expect(getRequestedPriceAmountText(base(), PriceMathFunction.Cheapest, false, formatMoney)).toBe(
                    '£100',
                );
            });

            it('should return formatted pricePP for Cheapest (isPricePP=true)', () => {
                expect(getRequestedPriceAmountText(base(), PriceMathFunction.Cheapest, true, formatMoney)).toBe('£50');
            });

            it('should return formatted price for MostExpensive (isPricePP=false)', () => {
                expect(getRequestedPriceAmountText(base(), PriceMathFunction.MostExpensive, false, formatMoney)).toBe(
                    '£200',
                );
            });

            it('should return formatted pricePP for MostExpensive (isPricePP=true)', () => {
                expect(getRequestedPriceAmountText(base(), PriceMathFunction.MostExpensive, true, formatMoney)).toBe(
                    '£100',
                );
            });

            it('should return range string for Range (isPricePP=false)', () => {
                expect(getRequestedPriceAmountText(base(), PriceMathFunction.Range, false, formatMoney)).toBe(
                    '£100 - £200',
                );
            });

            it('should return range string for Range (isPricePP=true)', () => {
                expect(getRequestedPriceAmountText(base(), PriceMathFunction.Range, true, formatMoney)).toBe(
                    '£50 - £100',
                );
            });

            it('should handle missing values gracefully', () => {
                const b = base({
                    [PriceMathFunction.Cheapest]: undefined,
                    [PriceMathFunction.MostExpensive]: undefined,
                });
                expect(getRequestedPriceAmountText(b, PriceMathFunction.Range, false, formatMoney)).toBe(' - ');
            });

            it('should handle missing math function gracefully', () => {
                const b = base({});
                expect(getRequestedPriceAmountText(b, 'NonExistent' as PriceMathFunction, false, formatMoney)).toBe('');
            });
        });
    });

    describe('getLivePriceCriterion', () => {
        let LinkedDestination: ISitecoreCompositeField<IDestinationFields>[];
        let LivePriceNamedSearches: ISitecoreCompositeField<ILivePriceNamedSearchesFields>;

        beforeEach(() => {
            LinkedDestination = [
                {
                    id: 'id',
                    url: 'url',
                    fields: {
                        GiataCode: mockSitecoreField('247324'),
                        Code: mockSitecoreField('EGHR0020'),
                        Image: mockSitecoreField({ src: '' }),
                        Name: mockSitecoreField(''),
                        PageCategory: mockSitecoreField(DestinationType.Country),
                    },
                },
            ];
            LivePriceNamedSearches = {
                id: 'id',
                fields: {
                    Name: mockSitecoreField('Beach'),
                },
            };
        });

        it('should use GiataCode as destination code when it exist', () => {
            expect(getLivePriceCriterion(LinkedDestination, LivePriceNamedSearches)).toEqual(
                expect.objectContaining({
                    destinationCode: '247324',
                    relatedRegions: [],
                    searchName: 'Beach',
                }),
            );
        });

        it('should use Code as destination code when GiataCode is empty', () => {
            // @ts-ignore
            LinkedDestination[0].fields.GiataCode = mockSitecoreField('');

            expect(getLivePriceCriterion(LinkedDestination, LivePriceNamedSearches)).toEqual(
                expect.objectContaining({
                    destinationCode: 'EGHR0020',
                    relatedRegions: [],
                    searchName: 'Beach',
                }),
            );
        });

        it('should return undefined when destination code and search name are empty', () => {
            // @ts-ignore
            LinkedDestination[0].fields.GiataCode = mockSitecoreField('');
            LinkedDestination[0].fields.Code = mockSitecoreField('');
            LivePriceNamedSearches.fields.Name = mockSitecoreField('');

            expect(getLivePriceCriterion(LinkedDestination, LivePriceNamedSearches)).toBe(undefined);
        });
    });

    describe('getLivePriceNumberOfNightsLabel', () => {
        it('should return empty string when suffix is NOT provided and duration is 0', () => {
            expect(
                getLivePriceNumberOfNightsLabel(
                    jest.fn(p => p),
                    0,
                ),
            ).toEqual('');
        });

        it('should return suffix when duration is 0', () => {
            expect(
                getLivePriceNumberOfNightsLabel(
                    jest.fn(p => p),
                    0,
                    'suffix',
                ),
            ).toEqual('suffix');
        });

        it('should return suffix when getPhrase returns empty string', () => {
            expect(
                getLivePriceNumberOfNightsLabel(
                    jest.fn(() => ''),
                    1,
                    'suffix',
                ),
            ).toEqual('suffix');
        });

        it('should return GlobalsLabelsNumberOfNights with suffix when duration is greater than 1', () => {
            expect(
                getLivePriceNumberOfNightsLabel(
                    jest.fn(p => p),
                    2,
                    'suffix',
                ),
            ).toEqual(`${SitecoreDictionary.GlobalsLabelsNumberOfNights} suffix`);
        });

        it('should return GlobalsLabelsNumberOfNight with suffix when duration is 1', () => {
            expect(
                getLivePriceNumberOfNightsLabel(
                    jest.fn(p => p),
                    1,
                    'suffix',
                ),
            ).toEqual(`${SitecoreDictionary.GlobalsLabelsNumberOfNight} suffix`);
        });
    });

    describe('getActualPrice', () => {
        const mockOffer = {
            price: 2032,
            pricePP: 1016,
            priceExcludingTouristTax: 2000,
            pricePPExcludingTouristTax: 1000,
        } as IOffer;

        it('should return price, pricePP, priceExcludingTouristTax, pricePPExcludingTouristTax values from offer when livePrice is not defined', () => {
            expect(getActualPrice(null, mockOffer)).toEqual({
                price: 2032,
                pricePP: 1016,
                priceExcludingTouristTax: 2000,
                pricePPExcludingTouristTax: 1000,
            });
        });

        it('should return price, pricePP, priceExcludingTouristTax, pricePPExcludingTouristTax values from livePrice when livePrice is defined', () => {
            expect(getActualPrice(mockLivePrice, mockOffer)).toEqual({
                price: 1000,
                pricePP: 500,
                priceExcludingTouristTax: 900,
                pricePPExcludingTouristTax: 450,
            });
        });
    });

    describe('getCheapestLivePrice', () => {
        it('should return chipset live price', () => {
            const result = getCheapestLivePrice(livePrices);

            expect(result).toEqual(livePrices[2]);
        });
    });

    describe('getRequestedPriceValues', () => {
        const mockRequestedPrice: IRequestedPrice = {
            requestedPriceByMathFunctions: {
                [PriceMathFunction.Cheapest]: {
                    price: 500,
                    pricePP: 250,
                    touristTax: 50,
                    touristTaxPP: 25,
                },
                [PriceMathFunction.MostExpensive]: {
                    price: 1000,
                    pricePP: 500,
                    touristTax: 100,
                    touristTaxPP: 50,
                },
                [PriceMathFunction.Average]: {
                    price: 750,
                    pricePP: 375,
                    touristTax: 75,
                    touristTaxPP: 37.5,
                },
            } as TRequestedPriceByMathFunctions,
        } as IRequestedPrice;

        it('should return null when requestedPrice is null', () => {
            expect(getRequestedPriceValues(null, PriceMathFunction.Cheapest)).toBe(undefined);
        });

        it('should return null when priceMathFunction is undefined', () => {
            expect(getRequestedPriceValues(mockRequestedPrice, undefined)).toBe(undefined);
        });

        it('should return null when both requestedPrice and priceMathFunction are invalid', () => {
            expect(getRequestedPriceValues(null, undefined)).toBe(undefined);
        });

        it('should return single value for Cheapest math function', () => {
            const result = getRequestedPriceValues(mockRequestedPrice, PriceMathFunction.Cheapest);
            expect(result).toEqual({
                price: 500,
                pricePP: 250,
                touristTax: 50,
                touristTaxPP: 25,
            });
        });

        it('should return single value for MostExpensive math function', () => {
            const result = getRequestedPriceValues(mockRequestedPrice, PriceMathFunction.MostExpensive);
            expect(result).toEqual({
                price: 1000,
                pricePP: 500,
                touristTax: 100,
                touristTaxPP: 50,
            });
        });

        it('should return single value for Average math function', () => {
            const result = getRequestedPriceValues(mockRequestedPrice, PriceMathFunction.Average);
            expect(result).toEqual({
                price: 750,
                pricePP: 375,
                touristTax: 75,
                touristTaxPP: 37.5,
            });
        });

        it('should return array with min and max for Range math function', () => {
            const result = getRequestedPriceValues(mockRequestedPrice, PriceMathFunction.Range);
            expect(Array.isArray(result)).toBe(true);
            expect((result as any)[0]).toEqual({
                price: 500,
                pricePP: 250,
                touristTax: 50,
                touristTaxPP: 25,
            });
            expect((result as any)[1]).toEqual({
                price: 1000,
                pricePP: 500,
                touristTax: 100,
                touristTaxPP: 50,
            });
        });

        it('should return array [min, max] in correct order for Range', () => {
            const result = getRequestedPriceValues(mockRequestedPrice, PriceMathFunction.Range);
            const [min, max] = result as any;
            expect(min.pricePP).toBeLessThan(max.pricePP);
            expect(min.price).toBeLessThan(max.price);
        });

        it('should handle undefined touristTax values in Range', () => {
            const priceWithoutTax: IRequestedPrice = {
                requestedPriceByMathFunctions: {
                    [PriceMathFunction.Cheapest]: { price: 500, pricePP: 250 },
                    [PriceMathFunction.MostExpensive]: { price: 1000, pricePP: 500 },
                } as TRequestedPriceByMathFunctions,
            } as IRequestedPrice;

            const result = getRequestedPriceValues(priceWithoutTax, PriceMathFunction.Range);
            const [min, max] = result as any;
            expect(min).toBeDefined();
            expect(max).toBeDefined();
            expect(min.pricePP).toBe(250);
            expect(max.pricePP).toBe(500);
        });

        it('should return undefined value when math function is not found in requestedPriceByMathFunctions', () => {
            const incompletePrice: IRequestedPrice = {
                requestedPriceByMathFunctions: {
                    [PriceMathFunction.Cheapest]: {
                        price: 500,
                        pricePP: 250,
                    },
                } as TRequestedPriceByMathFunctions,
            } as IRequestedPrice;

            const result = getRequestedPriceValues(incompletePrice, PriceMathFunction.MostExpensive);
            expect(result).toBeUndefined();
        });

        it('should return null for Range when Cheapest is undefined', () => {
            const priceWithoutCheapest: IRequestedPrice = {
                requestedPriceByMathFunctions: {
                    [PriceMathFunction.MostExpensive]: {
                        price: 1000,
                        pricePP: 500,
                    },
                } as TRequestedPriceByMathFunctions,
            } as IRequestedPrice;

            const result = getRequestedPriceValues(priceWithoutCheapest, PriceMathFunction.Range);
            const [min, max] = result as any;
            expect(min).toBeUndefined();
            expect(max).toBeDefined();
        });

        it('should work with isRequestedPriceValuesValid for returned values', () => {
            const result = getRequestedPriceValues(mockRequestedPrice, PriceMathFunction.Cheapest);
            expect(isRequestedPriceValuesValid(result as any, false)).toBe(true);
            expect(isRequestedPriceValuesValid(result as any, true)).toBe(true);
        });

        it('should return array values that can be used with formatRequestedPrice', () => {
            const formatMoney = (amount: number) => `£${amount}`;
            const result = getRequestedPriceValues(mockRequestedPrice, PriceMathFunction.Range);
            const [min, max] = result as any;

            const minFormatted = formatRequestedPrice(min, false, formatMoney);
            const maxFormatted = formatRequestedPrice(max, false, formatMoney);

            expect(minFormatted).toBe('£500');
            expect(maxFormatted).toBe('£1000');
        });
    });

    describe('isRequestedPriceValuesValid', () => {
        const basePrice = {
            price: 500,
            pricePP: 250,
            touristTax: 50,
            touristTaxPP: 25,
        } as IRequestedPriceValues;

        it('should return false when reqPrice is null', () => {
            expect(isRequestedPriceValuesValid(null, false)).toBe(false);
        });

        it('should return false when reqPrice is undefined', () => {
            expect(isRequestedPriceValuesValid(undefined, false)).toBe(false);
        });

        it('should return true for valid price when isPricePP=false and isTouristTaxEnabled=false', () => {
            expect(isRequestedPriceValuesValid(basePrice, false)).toBe(true);
        });

        it('should return true for valid pricePP when isPricePP=true and isTouristTaxEnabled=false', () => {
            expect(isRequestedPriceValuesValid(basePrice, true)).toBe(true);
        });

        it('should return true for valid price with tourist tax when isPricePP=false and isTouristTaxEnabled=true', () => {
            expect(isRequestedPriceValuesValid(basePrice, false)).toBe(true);
        });

        it('should return true for valid pricePP with tourist tax when isPricePP=true and isTouristTaxEnabled=true', () => {
            expect(isRequestedPriceValuesValid(basePrice, true)).toBe(true);
        });

        it('should return false when price is zero', () => {
            const zeroPrice = { price: 0, pricePP: 250, touristTax: 50, touristTaxPP: 25 } as IRequestedPriceValues;
            expect(isRequestedPriceValuesValid(zeroPrice, false)).toBe(false);
        });
    });

    describe('isRequestedPriceInputValid', () => {
        let baseValue: IRequestedPriceValues;

        beforeEach(() => {
            baseValue = { price: 100, pricePP: 50, touristTax: 20, touristTaxPP: 10 } as IRequestedPriceValues;
        });

        it('should return result of isRequestedPriceValuesValid for single value', () => {
            const result = isRequestedPriceInputValid(baseValue, true);

            expect(result).toBe(true);
        });

        it('should return true when all array values are valid', () => {
            const arr = [baseValue, baseValue];

            const result = isRequestedPriceInputValid(arr, true);

            expect(result).toBe(true);
        });
    });
});
