import { CurrencyCode, ICurrencyFormatOptions } from 'code/currency';
import { mockAllMarketsSettings } from 'frontend/__mocks__/markets';
import { findMarketByLang, getCurrencyFromMarket, getDefaultDepositFromMarket } from 'frontend/utils/market.utils';
import { MarketCode } from 'models/data/MarketSettings';
import SiteSettings from 'models/enum/SiteSettings';

import MarketStore, { NumberFormatPartTypes } from './MarketStore';

jest.mock('frontend/utils/market.utils');

const mockFindMarketByLang = findMarketByLang as jest.MockedFn<typeof findMarketByLang>;
const mockGetCurrencyFromMarket = getCurrencyFromMarket as jest.MockedFn<typeof getCurrencyFromMarket>;
const mockGetDefaultDepositFromMarket = getDefaultDepositFromMarket as jest.MockedFn<
    typeof getDefaultDepositFromMarket
>;

describe('MarketStore', () => {
    const createRootStore = () =>
        ({
            layoutStore: {
                lang: 'en',
                getSetting: jest.fn(),
            },
        } as any);

    let rootStore = createRootStore();

    beforeEach(() => {
        jest.restoreAllMocks();
        rootStore = createRootStore();
    });

    describe('deserialize()', () => {
        it('Should deserialize state', () => {
            const store = new MarketStore(rootStore);

            store.deserialize({
                allMarketsSettings: { ...mockAllMarketsSettings },
            });

            expect(store.allMarketsSettings).toEqual(mockAllMarketsSettings);
        });

        it('Should deserialize state with null values', () => {
            const store = new MarketStore(rootStore);

            store.deserialize({});

            expect(store.allMarketsSettings).toBeNull();
        });
    });

    describe('serialize()', () => {
        it('Should return serialized state', () => {
            const store = new MarketStore(rootStore);
            store.allMarketsSettings = { ...mockAllMarketsSettings };

            expect(store.serialize()).toEqual({
                allMarketsSettings: store.allMarketsSettings,
            });
        });

        it('Should return serialized state with null values', () => {
            const store = new MarketStore(rootStore);

            expect(store.serialize()).toEqual({
                allMarketsSettings: null,
            });
        });
    });

    describe('Market Settings', () => {
        it('Should return market settings for current lang', () => {
            mockFindMarketByLang.mockReturnValueOnce(mockAllMarketsSettings.en);
            const store = new MarketStore(rootStore);
            store.allMarketsSettings = { ...mockAllMarketsSettings };

            expect(store.marketSettings).toBe(mockAllMarketsSettings.en);
            expect(mockFindMarketByLang).toHaveBeenCalledWith(rootStore.layoutStore.lang, store.allMarketsSettings);
        });
    });

    describe('Market Code', () => {
        it('Should return current market code', () => {
            const store = new MarketStore(rootStore);
            rootStore.layoutStore.getSetting.mockReturnValue(MarketCode.UK);

            expect(store.marketCode).toBe(MarketCode.UK);
            expect(rootStore.layoutStore.getSetting).toHaveBeenCalledWith(SiteSettings.Market);
        });

        it('Should return UK as default market code when no market settings', () => {
            const store = new MarketStore(rootStore);
            rootStore.layoutStore.getSetting.mockReturnValue(null);

            expect(store.marketCode).toBe(MarketCode.UK);
        });
    });

    describe.each([
        ['currency', CurrencyCode.GBP, 'en', '£'],
        ['group', CurrencyCode.GBP, 'en', ','],
        ['decimal', CurrencyCode.GBP, 'en', '.'],
        ['currency', CurrencyCode.CHF, 'ch-fr', 'CHF'],
        ['group', CurrencyCode.CHF, 'ch-fr', `'`],
        ['decimal', CurrencyCode.CHF, 'ch-fr', '.'],
        ['currency', CurrencyCode.EUR, 'fr', '€'],
        ['group', CurrencyCode.EUR, 'fr', ' '],
        ['decimal', CurrencyCode.EUR, 'fr', ','],
        ['', undefined, 'en', ''],
        ['currency', CurrencyCode.EUR, 'en', '€'], // currency symbol depends on currency code, locale provide format like spaces/dots (1,000/1.000/1'000)
    ])('getFormattingSymbol', (type, currency, market, expected) => {
        it(`should return ${type} symbol '${expected}' for ${currency} and ${market}`, () => {
            rootStore.layoutStore.lang = market;
            const store = new MarketStore(rootStore);
            const res = store.getFormattingSymbol(type as any, currency);

            expect(res).toEqual(expected);
        });
    });

    describe('should return right currency symbol market', () => {
        afterAll(() => {
            mockFindMarketByLang.mockReturnValue(mockAllMarketsSettings.en);
        });

        describe.each([
            [undefined, '£'],
            [CurrencyCode.GBP, '£'],
            [CurrencyCode.CHF, 'CHF'],
            [CurrencyCode.EUR, '€'],
        ])('getCurrencySymbol in UK market', (currency, expected) => {
            it(`should return ${expected} for ${currency}`, () => {
                mockGetCurrencyFromMarket.mockReturnValue(CurrencyCode.GBP);
                rootStore.layoutStore.lang = 'en';
                const store = new MarketStore(rootStore);
                const res = store.getCurrencySymbol(currency);

                expect(res).toEqual(expected);
            });
        });

        describe.each([
            [undefined, 'CHF'],
            [CurrencyCode.GBP, '£'],
            [CurrencyCode.CHF, 'CHF'],
            [CurrencyCode.EUR, 'EUR'],
        ])('getCurrencySymbol in ch-fr market', (currency, expected) => {
            it(`should return ${expected} for ${currency}`, () => {
                mockFindMarketByLang.mockReturnValue(mockAllMarketsSettings['fr-CH']);
                mockGetCurrencyFromMarket.mockReturnValue(CurrencyCode.CHF);
                rootStore.layoutStore.lang = 'ch-fr';
                const store = new MarketStore(rootStore);
                const res = store.getCurrencySymbol(currency);

                expect(res).toEqual(expected);
            });
        });

        describe.each([
            [undefined, 'CHF'],
            [CurrencyCode.GBP, '£'],
            [CurrencyCode.CHF, 'CHF'],
            [CurrencyCode.EUR, 'EUR'],
        ])('getCurrencySymbol in ch-de market', (currency, expected) => {
            it(`should return ${expected} for ${currency}`, () => {
                mockFindMarketByLang.mockReturnValue(mockAllMarketsSettings['de-CH']);
                mockGetCurrencyFromMarket.mockReturnValue(CurrencyCode.CHF);
                rootStore.layoutStore.lang = 'ch-fr';
                const store = new MarketStore(rootStore);
                const res = store.getCurrencySymbol(currency);

                expect(res).toEqual(expected);
            });
        });

        describe.each([
            [undefined, '€'],
            [CurrencyCode.GBP, '£'],
            [CurrencyCode.CHF, 'CHF'],
            [CurrencyCode.EUR, '€'],
        ])('getCurrencySymbol in de market', (currency, expected) => {
            it(`should return ${expected} for ${currency}`, () => {
                mockFindMarketByLang.mockReturnValue(mockAllMarketsSettings.de);
                mockGetCurrencyFromMarket.mockReturnValue(CurrencyCode.EUR);
                rootStore.layoutStore.lang = 'de';
                const store = new MarketStore(rootStore);
                const res = store.getCurrencySymbol(currency);

                expect(res).toEqual(expected);
            });
        });

        describe.each([
            [undefined, '€'],
            [CurrencyCode.GBP, '£'],
            [CurrencyCode.CHF, 'CHF'],
            [CurrencyCode.EUR, '€'],
        ])('getCurrencySymbol in fr market', (currency, expected) => {
            it(`should return ${expected} for ${currency}`, () => {
                mockFindMarketByLang.mockReturnValue(mockAllMarketsSettings.fr);
                mockGetCurrencyFromMarket.mockReturnValue(CurrencyCode.EUR);
                rootStore.layoutStore.lang = 'fr';
                const store = new MarketStore(rootStore);
                const res = store.getCurrencySymbol(currency);

                expect(res).toEqual(expected);
            });
        });
    });

    describe.each([
        [undefined, '', false],
        [CurrencyCode.GBP, 'en', false],
        [CurrencyCode.CHF, 'ch-fr', true],
        [CurrencyCode.EUR, 'fr', true],
        [CurrencyCode.GBP, 'fr', true], // spase depends on locale, not currency
    ])('checkSpaceBetweenCurrencyAndAmount()', (currency, market, expected) => {
        it(`should return ${expected} for ${market}`, () => {
            rootStore.layoutStore.lang = market;
            const store = new MarketStore(rootStore);
            const res = store.checkSpaceBetweenCurrencyAndAmount(currency);

            expect(res).toEqual(expected);
        });
    });

    describe.each([
        [NaN, undefined, '', '', ''],
        [0, undefined, 'en', CurrencyCode.GBP, '£0.00'],
        [1000.1, undefined, 'en', CurrencyCode.GBP, '£1,000.10'],
        [1000.1, { hideCurrencySymbol: true }, 'en', CurrencyCode.GBP, '1,000.1'],
        [1000.1, { currency: CurrencyCode.GBP }, 'ch-fr', undefined, `£ 1'000.10`],
        [1000.1, undefined, 'ch-fr', CurrencyCode.CHF, `CHF 1'000.10`],
        [1000.1, undefined, 'ch-de', CurrencyCode.CHF, `CHF 1'000.10`],
        [1000.1, undefined, 'fr', CurrencyCode.EUR, '1 000,10 €'],
        [1000.1, { currency: CurrencyCode.CHF }, 'ch-fr', undefined, `CHF 1'000.10`],
        [1000.1, { currency: CurrencyCode.CHF }, 'ch-de', undefined, `CHF 1'000.10`],
        [1000.1, { currency: CurrencyCode.EUR }, 'fr', undefined, '1 000,10 €'],
        [
            1000.1,
            { currency: CurrencyCode.CHF, roundUp: true, maximumFractionDigits: 0 },
            'ch-de',
            undefined,
            `CHF 1'001`,
        ],
        [1000.1, { currency: CurrencyCode.EUR, roundUp: true, maximumFractionDigits: 0 }, 'fr', undefined, '1 001 €'],
    ])('formatMoney()', (amount, options: ICurrencyFormatOptions | undefined, market, marketCurrency, expected) => {
        it(`should return [${expected}] for ${market} when market currency is ${marketCurrency} and options currency is ${options?.currency} `, () => {
            rootStore.layoutStore.lang = market;
            const store = new MarketStore(rootStore);
            jest.spyOn(store, 'currency', 'get').mockReturnValue(marketCurrency as CurrencyCode);

            const res = store.formatMoney(amount, options);

            expect(res).toEqual(expected);
        });
    });

    describe('formatMoney error', () => {
        it('should return empty string if throw an error', () => {
            const store = new MarketStore(rootStore);
            jest.spyOn(Intl, 'NumberFormat').mockImplementation(
                () =>
                    ({
                        format: () => {
                            throw new Error();
                        },
                    } as any),
            );

            const res = store.formatMoney(100);

            expect(res).toEqual('');
        });
    });

    describe.each([
        [NaN, undefined, 'en', CurrencyCode.GBP, []],
        [
            0,
            undefined,
            'en',
            CurrencyCode.GBP,
            [
                { type: NumberFormatPartTypes.Currency, value: '£' },
                { type: NumberFormatPartTypes.Integer, value: '0' },
                { type: NumberFormatPartTypes.Decimal, value: '.' },
                { type: NumberFormatPartTypes.Fraction, value: '00' },
            ],
        ],
        [
            0.1,
            undefined,
            'en',
            CurrencyCode.GBP,
            [
                { type: NumberFormatPartTypes.Currency, value: '£' },
                { type: NumberFormatPartTypes.Integer, value: '0' },
                { type: NumberFormatPartTypes.Decimal, value: '.' },
                { type: NumberFormatPartTypes.Fraction, value: '10' },
            ],
        ],
        [
            1000.1,
            undefined,
            'en',
            CurrencyCode.GBP,
            [
                { type: NumberFormatPartTypes.Currency, value: '£' },
                { type: NumberFormatPartTypes.Integer, value: '1' },
                { type: NumberFormatPartTypes.Group, value: ',' },
                { type: NumberFormatPartTypes.Integer, value: '000' },
                { type: NumberFormatPartTypes.Decimal, value: '.' },
                { type: NumberFormatPartTypes.Fraction, value: '10' },
            ],
        ],
        [
            2000.1,
            { currency: CurrencyCode.CHF },
            'ch-fr',
            CurrencyCode.CHF,
            [
                { type: NumberFormatPartTypes.Currency, value: 'CHF' },
                { type: NumberFormatPartTypes.Literal, value: ' ' },
                { type: NumberFormatPartTypes.Integer, value: '2' },
                { type: NumberFormatPartTypes.Group, value: `'` },
                { type: NumberFormatPartTypes.Integer, value: '000' },
                { type: NumberFormatPartTypes.Decimal, value: '.' },
                { type: NumberFormatPartTypes.Fraction, value: '10' },
            ],
        ],
        [
            3000.1,
            { currency: CurrencyCode.EUR },
            'fr',
            CurrencyCode.EUR,
            [
                { type: NumberFormatPartTypes.Integer, value: '3' },
                { type: NumberFormatPartTypes.Group, value: ' ' },
                { type: NumberFormatPartTypes.Integer, value: '000' },
                { type: NumberFormatPartTypes.Decimal, value: ',' },
                { type: NumberFormatPartTypes.Fraction, value: '10' },
                { type: NumberFormatPartTypes.Literal, value: ' ' },
                { type: NumberFormatPartTypes.Currency, value: '€' },
            ],
        ],
    ])('formatMoneyToParts()', (amount, options, market, currencyFromMarketSettings, expected) => {
        it(`should return array of price parts of ${amount} for ${market} market`, () => {
            rootStore.layoutStore.lang = market;
            mockGetCurrencyFromMarket.mockReturnValue(currencyFromMarketSettings);
            const store = new MarketStore(rootStore);
            const res = store.formatMoneyToParts(amount, options);

            expect(res).toEqual(expected);
        });
    });

    describe('formatMoneyToParts error', () => {
        it('should return empty array if throw an error', () => {
            const store = new MarketStore(rootStore);
            jest.spyOn(Intl, 'NumberFormat').mockImplementation(
                () =>
                    ({
                        formatToParts: () => {
                            throw new Error();
                        },
                    } as any),
            );

            const res = store.formatMoneyToParts(1000);

            expect(res).toEqual([]);
        });
    });

    describe.each([
        [NaN, undefined, 'en', CurrencyCode.GBP, ['', '']],
        [0, undefined, 'en', CurrencyCode.GBP, ['£0', '.00']],
        [0.1, undefined, 'en', CurrencyCode.GBP, ['£0', '.10']],
        [1000.1, undefined, 'en', CurrencyCode.GBP, ['£1,000', '.10']],
        [1000.1, { currency: CurrencyCode.CHF }, 'ch-fr', CurrencyCode.CHF, [`CHF 1'000`, '.10']],
        [1000.1, { currency: CurrencyCode.EUR }, 'fr', CurrencyCode.EUR, ['1 000', ',10 €']],
    ])('formatMoneyToIntegerAndDecimal()', (amount, options, market, currencyFromMarketSettings, expected) => {
        it(`should return price divided on integer and decimal for ${amount} in ${market} market`, () => {
            mockGetCurrencyFromMarket.mockReturnValue(currencyFromMarketSettings);
            rootStore.layoutStore.lang = market;
            const store = new MarketStore(rootStore);
            const res = store.formatMoneyToIntegerAndDecimal(amount, options);

            expect(res).toEqual(expected);
        });
    });

    describe('formatMoneyToIntegerAndDecimal error', () => {
        it('should return empty strings array if throw an error', () => {
            const store = new MarketStore(rootStore);
            jest.spyOn(Intl, 'NumberFormat').mockImplementation(
                () =>
                    ({
                        formatToParts: () => {
                            throw new Error();
                        },
                    } as any),
            );

            const res = store.formatMoneyToIntegerAndDecimal(1000);

            expect(res).toEqual(['', '']);
        });
    });

    describe.each([
        [
            NaN,
            undefined,
            'en',
            CurrencyCode.GBP,
            [
                { type: NumberFormatPartTypes.Integer, value: '' },
                { type: NumberFormatPartTypes.Decimal, value: '' },
            ],
        ],
        [
            0,
            undefined,
            'en',
            CurrencyCode.GBP,
            [
                { type: NumberFormatPartTypes.Currency, value: '£' },
                { type: NumberFormatPartTypes.Integer, value: '0' },
                { type: NumberFormatPartTypes.Decimal, value: '.00' },
            ],
        ],
        [
            0.1,
            undefined,
            'en',
            CurrencyCode.GBP,
            [
                { type: NumberFormatPartTypes.Currency, value: '£' },
                { type: NumberFormatPartTypes.Integer, value: '0' },
                { type: NumberFormatPartTypes.Decimal, value: '.10' },
            ],
        ],
        [
            1000.1,
            undefined,
            'en',
            CurrencyCode.GBP,
            [
                { type: NumberFormatPartTypes.Currency, value: '£' },
                { type: NumberFormatPartTypes.Integer, value: '1,000' },
                { type: NumberFormatPartTypes.Decimal, value: '.10' },
            ],
        ],
        [
            2000.1,
            { currency: CurrencyCode.EUR },
            'fr',
            CurrencyCode.EUR,
            [
                { type: NumberFormatPartTypes.Integer, value: '2 000' },
                { type: NumberFormatPartTypes.Decimal, value: ',10' },
                { type: NumberFormatPartTypes.Currency, value: ' €' },
            ],
        ],
        [
            3000.1,
            { currency: CurrencyCode.CHF },
            'ch-fr',
            CurrencyCode.CHF,
            [
                { type: NumberFormatPartTypes.Currency, value: 'CHF ' },
                { type: NumberFormatPartTypes.Integer, value: `3'000` },
                { type: NumberFormatPartTypes.Decimal, value: '.10' },
            ],
        ],
    ])('formatMoneyToIntegerAndDecimalWithTypes', (amount, options, market, currencyFromMarketSettings, expected) => {
        it(`should return object on types for ${amount} in ${market} market`, () => {
            mockGetCurrencyFromMarket.mockReturnValue(currencyFromMarketSettings);
            rootStore.layoutStore.lang = market;
            const store = new MarketStore(rootStore);
            const res = store.formatMoneyToIntegerAndDecimalWithTypes(amount, options);

            expect(res).toEqual(expected);
        });
    });

    describe('formatMoneyToIntegerAndDecimalWithTypes error', () => {
        it('should return empty array if throw an error', () => {
            const store = new MarketStore(rootStore);
            jest.spyOn(Intl, 'NumberFormat').mockImplementation(
                () =>
                    ({
                        formatToParts: () => {
                            throw new Error();
                        },
                    } as any),
            );

            const res = store.formatMoneyToIntegerAndDecimalWithTypes(1000);

            expect(res).toEqual([
                { type: NumberFormatPartTypes.Integer, value: '' },
                { type: NumberFormatPartTypes.Decimal, value: '' },
            ]);
        });
    });

    describe('isValidForMarketAirports', () => {
        it('should return true when all departure airports in list of market airports', () => {
            const store = new MarketStore(rootStore);
            jest.spyOn(store, 'marketSettings', 'get').mockReturnValue(mockAllMarketsSettings['fr-CH']);

            expect(store.isValidForMarketAirports(['BSL', 'GVA'])).toBeTruthy();
        });

        it('should return false departure airports is not in list of market airports', () => {
            const store = new MarketStore(rootStore);
            jest.spyOn(store, 'marketSettings', 'get').mockReturnValue(mockAllMarketsSettings['fr-CH']);

            expect(store.isValidForMarketAirports(['AAA', 'GVA'])).toBeFalsy();
        });
    });

    describe.each([
        ['test', 'en', 'test'],
        [100150000, 'en', '100,150,000'],
        [100150000, 'ch-fr', `100'150'000`],
        [100150000, 'ch-de', `100'150'000`],
        [100150000, 'fr', '100 150 000'],
        [100150000, 'de', '100.150.000'],
        [0.34, 'en', '0.34'],
        [0.34, 'ch-fr', '0.34'],
        [0.34, 'ch-de', '0.34'],
        [0.34, 'fr', '0,34'],
        [0.34, 'de', '0,34'],
    ])('getFormattedNumber', (number, market, expected) => {
        it(`should return ${expected} for ${number} in ${market} market`, () => {
            rootStore.layoutStore.lang = market;
            const store = new MarketStore(rootStore);
            const res = store.getFormattedNumber(number);

            expect(res).toEqual(expected);
        });
    });

    describe.each([
        ['en', CurrencyCode.GBP, '£60'],
        ['fr-CH', CurrencyCode.CHF, 'CHF 75'],
        ['de-CH', CurrencyCode.CHF, 'CHF 75'],
        ['fr', CurrencyCode.EUR, '75 €'],
        ['de', CurrencyCode.EUR, '75 €'],
    ])('getDefaultDepositPrice', (lang, currency, expected) => {
        it(`should return default deposit price ${expected} for ${lang} language, ${currency} currency`, () => {
            rootStore.layoutStore.lang = lang;
            mockFindMarketByLang.mockReturnValue(mockAllMarketsSettings[lang]);
            mockGetCurrencyFromMarket.mockReturnValue(currency);
            mockGetDefaultDepositFromMarket.mockReturnValue(mockAllMarketsSettings[lang].DefaultDepositPrice || 0);
            const store = new MarketStore(rootStore);

            const res = store.getDefaultDepositPrice(lang);

            expect(res).toEqual(expected);
        });
    });

    describe('defaultDepositPrice', () => {
        it('should return default deposit price for the current market', () => {
            rootStore.layoutStore.lang = 'en';
            mockFindMarketByLang.mockReturnValue(mockAllMarketsSettings.en);
            mockGetCurrencyFromMarket.mockReturnValue(CurrencyCode.GBP);
            mockGetDefaultDepositFromMarket.mockReturnValue(mockAllMarketsSettings.en.DefaultDepositPrice || 0);
            const store = new MarketStore(rootStore);

            const res = store.defaultDepositPrice;

            expect(res).toEqual('£60');
        });
    });
});
