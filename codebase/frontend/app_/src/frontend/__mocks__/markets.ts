import { CurrencyCode } from 'code/currency';
import { MarketCode, TAllMarketsSettings } from 'models/data/MarketSettings';

export const mockAllMarketsSettings = {
    en: {
        Code: MarketCode.UK,
        CountryCode: 'GB',
        Currency: { Code: CurrencyCode.GBP },
        AirportDepartureCodes: ['LGW', 'LTN', 'LPL', 'MAN'],
        DefaultDepositPrice: 60,
    },
    'fr-CH': {
        Code: MarketCode.CH,
        CountryCode: 'CH',
        Currency: { Code: CurrencyCode.CHF },
        AirportDepartureCodes: ['BSL', 'GVA', 'ZRH'],
        DefaultDepositPrice: 75,
    },
    'de-CH': {
        Code: MarketCode.CH,
        CountryCode: 'CH',
        Currency: { Code: CurrencyCode.CHF },
        AirportDepartureCodes: ['BSL', 'GVA', 'ZRH'],
        DefaultDepositPrice: 75,
    },
    fr: {
        Code: MarketCode.FR,
        CountryCode: 'FR',
        Currency: { Code: CurrencyCode.EUR },
        AirportDepartureCodes: ['BIQ', 'BOD', 'CLY'],
        DefaultDepositPrice: 75,
    },
    de: {
        Code: MarketCode.DE,
        CountryCode: 'DE',
        Currency: { Code: CurrencyCode.EUR },
        AirportDepartureCodes: ['BER', 'FDH', 'HAM'],
        DefaultDepositPrice: 75,
    },
} as TAllMarketsSettings;
