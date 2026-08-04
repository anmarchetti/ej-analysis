import { TCmsLang } from 'code/cmsLang';
import { CurrencyCode } from 'code/currency';

export enum MarketCode {
    UK = 'UK',
    CH = 'CH',
    FR = 'FR',
    DE = 'DE',
}

export interface IMarketSettings {
    AirportDepartureCodes?: string[];
    Code?: MarketCode;
    Country?: string;
    Currency?: { Code?: CurrencyCode };
    DefaultDepositPrice?: number;
    Language?: TCmsLang;
}

export type TAllMarketsSettings = { [cmsLang: string]: IMarketSettings };
