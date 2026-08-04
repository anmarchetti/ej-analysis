import { CurrencyCode } from 'code/currency';
import { mockAllMarketsSettings } from 'frontend/__mocks__/markets';
import { IMarketSettings, MarketCode } from 'models/data/MarketSettings';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import {
    buildKeyBasedOnMarket,
    findMarketByLang,
    findMarketsByDepAirports,
    getCurrencyFromMarket,
    getDefaultDepositFromMarket,
} from './market.utils';

describe('market.utils', () => {
    describe('buildKeyBasedOnMarket()', () => {
        it('Should build key with market code', () => {
            const key = buildKeyBasedOnMarket(WebStorageKeys.RecentSearches, MarketCode.UK);

            expect(key).toBe('recentSearchesUK');
        });

        it('Should build key without market code', () => {
            const key = buildKeyBasedOnMarket(WebStorageKeys.RecentSearches);

            expect(key).toBe('recentSearches');
        });
    });

    describe('findMarketByLang()', () => {
        it('Should return market settings by lang', () => {
            const market = findMarketByLang('en', mockAllMarketsSettings);

            expect(market).toEqual({ ...mockAllMarketsSettings['en'], Language: 'en' });
        });

        it('Should return null when no market for lang', () => {
            const market = findMarketByLang('xxx', mockAllMarketsSettings);

            expect(market).toBeNull();
        });

        it('Should return null when no markets settings', () => {
            const market = findMarketByLang('en', null);

            expect(market).toBeNull();
        });
    });

    describe('findMarketsByDepAirport()', () => {
        it('Should return all markets that have all provided airports', () => {
            const market = findMarketsByDepAirports(['GVA', 'BSL'], mockAllMarketsSettings);

            expect(market).toEqual([
                { ...mockAllMarketsSettings['fr-CH'], Language: 'fr-CH' },
                { ...mockAllMarketsSettings['de-CH'], Language: 'de-CH' },
            ]);
        });

        it('Should return empty list when no market that have all provided airports', () => {
            const market = findMarketsByDepAirports(['GVA', 'LGW'], mockAllMarketsSettings);

            expect(market).toEqual([]);
        });

        it('Should return empty list when no markets settings', () => {
            const market = findMarketsByDepAirports(['GVA'], null);

            expect(market).toEqual([]);
        });

        it('Should return empty list when no airports', () => {
            const market = findMarketsByDepAirports([], mockAllMarketsSettings);

            expect(market).toEqual([]);
        });
    });

    describe('getCurrency', () => {
        it('should return market currency', () => {
            const mockMarketSettings: IMarketSettings = {
                Currency: { Code: CurrencyCode.EUR },
            };
            const currency = getCurrencyFromMarket(mockMarketSettings);

            expect(currency).toEqual(CurrencyCode.EUR);
        });

        it('should return default currency', () => {
            const currency = getCurrencyFromMarket(null);

            expect(currency).toEqual(CurrencyCode.GBP);
        });
    });

    describe('getDefaultDeposit', () => {
        it('should return market deposit', () => {
            const mockMarketSettings: IMarketSettings = {
                DefaultDepositPrice: 75,
            };
            const deposit = getDefaultDepositFromMarket(mockMarketSettings);

            expect(deposit).toEqual(75);
        });

        it('should return default deposit', () => {
            const deposit = getDefaultDepositFromMarket(null);

            expect(deposit).toEqual(0);
        });
    });
});
