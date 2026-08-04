import { TTaxesAndFees } from './ITouristTax';

export interface ITouristTaxOfferFields {
    taxesAndFees: TTaxesAndFees | undefined;
    touristTax: number;
    touristTaxPP: number;
}
