import { CurrencyCode } from 'code/currency';
import { HolidayThemesTypesCodes } from 'models/enum/HolidayThemes';
import { PriceMathFunction } from 'models/enum/PriceMathFunction';

import { ITouristTax } from './ITouristTax';
import { ITransfer } from './ITransfer';

export interface IRequestedPrice {
    currency: CurrencyCode;
    geog: string;
    requestedPriceByMathFunctions: TRequestedPriceByMathFunctions;
    searchCriteria: {
        adults: number;
        childAges: number[];
        children: number;
        date: string;
        depPt: string;
        duration: number;
        endDate: string;
        id: string;
        infants: number;
        origin: [];
        range: {
            end: string;
            start: string;
        };
        startDate: string;
        themeTypesCodes: HolidayThemesTypesCodes[];
        url: string;
    };
    searchDate: string;
    transfers: ITransfer[];
}

export type TRequestedPriceByMathFunctions = {
    [key in PriceMathFunction]?: IRequestedPriceValues;
};

export interface IRequestedPriceValues extends ITouristTax {
    price: number;
    pricePP: number;
}
