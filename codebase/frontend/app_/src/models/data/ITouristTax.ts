import { CurrencyCode } from 'code/currency';

export type TTaxesAndFees = Partial<
    Record<
        CurrencyCode,
        {
            currency: CurrencyCode;
            exchRt: number;
            totalLocalPrice: number;
            totalLocalPricePP: number;
        }
    >
>;

export interface IExcludingTouristTaxPrice {
    priceExcludingTouristTax: number;
    pricePPExcludingTouristTax: number;
}

export interface ITouristTax extends IExcludingTouristTaxPrice {
    touristTax: number;
    touristTaxPP: number;
    taxesAndFees?: TTaxesAndFees; // currently absent from the API response when touristTax = 0
}

export interface IPackageTaxesAndFees {
    code: string;
    exchangeRate: number;
    paylocalAmount: number;
    paylocalAmountConverted: number;
    paylocalAmountConvertedCurrency: string;
    paylocalAmountCurrency: string;
    paylocalAmountPPConverted: number;
}
