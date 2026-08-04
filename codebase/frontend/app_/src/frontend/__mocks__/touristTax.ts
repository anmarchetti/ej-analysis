import { CurrencyCode } from 'code/currency';
import { ITouristTax } from 'models/data/ITouristTax';
import { ITouristTaxOfferFields } from 'models/data/ITouristTaxOfferFields';

export const mockTouristTaxFields: ITouristTaxOfferFields = {
    touristTax: 10.01,
    touristTaxPP: 5.01,
    taxesAndFees: {
        [CurrencyCode.EUR]: {
            currency: CurrencyCode.EUR,
            totalLocalPrice: 10,
            totalLocalPricePP: 5,
            exchRt: 1.19,
        },
    },
};

export const mockMultiCurrencyTouristTaxFields: ITouristTaxOfferFields = {
    touristTax: 64.01,
    touristTaxPP: 32.01,
    taxesAndFees: {
        [CurrencyCode.EUR]: {
            currency: CurrencyCode.EUR,
            totalLocalPrice: 12,
            totalLocalPricePP: 6,
            exchRt: 1.19,
        },
        [CurrencyCode.CHF]: {
            currency: CurrencyCode.CHF,
            totalLocalPrice: 49.68,
            totalLocalPricePP: 24.84,
            exchRt: 1.1557,
        },
    },
};
export const mockTouristTaxEmptyFields: ITouristTaxOfferFields = {
    touristTax: 0,
    touristTaxPP: 0,
    taxesAndFees: undefined,
};

export const mockTouristTaxErrorFields: ITouristTaxOfferFields = {
    touristTax: -1,
    touristTaxPP: -1,
    taxesAndFees: undefined,
};

export const mockTouristTax: ITouristTax = {
    priceExcludingTouristTax: 200,
    pricePPExcludingTouristTax: 100,
    touristTax: 6.01,
    touristTaxPP: 3.01,
    taxesAndFees: {
        [CurrencyCode.EUR]: {
            currency: CurrencyCode.EUR,
            totalLocalPrice: 4,
            totalLocalPricePP: 2,
            exchRt: 1.5,
        },
    },
};
