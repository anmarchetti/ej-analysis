import { getCMSLang, TCmsLang } from 'code/cmsLang';
import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import { IMarketSettings, TAllMarketsSettings } from 'models/data/MarketSettings';

import { Tokenizer } from './tokenizer';

export const buildKeyBasedOnMarket = (key: string, marketCode: string = ''): string =>
    Tokenizer.replaceToken(key, Tokens.Market, marketCode) || key;

export const findMarketByLang = (
    lang: string,
    allMarketsSettings: Nullable<TAllMarketsSettings>,
): Nullable<IMarketSettings> => {
    if (!allMarketsSettings) return null;

    const cmsLang = getCMSLang(lang, '');
    const market = allMarketsSettings[cmsLang];

    return market ? { ...market, Language: cmsLang } : null;
};

/**
 * Find markets by departure airport codes.
 * The market should have all the airports in the list.
 */
export const findMarketsByDepAirports = (
    airportCodes: string[],
    allMarketsSettings: Nullable<TAllMarketsSettings>,
): IMarketSettings[] => {
    if (!allMarketsSettings || !airportCodes.length) return [];

    const markets = [] as IMarketSettings[];

    for (const [cmsLang, market] of Object.entries(allMarketsSettings)) {
        const marketAirports = market.AirportDepartureCodes;

        if (marketAirports && airportCodes.every(airport => marketAirports.includes(airport))) {
            markets.push({ ...market, Language: cmsLang as TCmsLang });
        }
    }

    return markets;
};

export const getCurrencyFromMarket = (marketSettings: Nullable<IMarketSettings>) =>
    marketSettings?.Currency?.Code ?? CurrencyCode.GBP;

export const getDefaultDepositFromMarket = (marketSettings: Nullable<IMarketSettings>): number =>
    marketSettings?.DefaultDepositPrice ?? 0;
