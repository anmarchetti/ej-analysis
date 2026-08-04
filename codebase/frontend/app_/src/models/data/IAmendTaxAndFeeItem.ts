export interface IAmendTaxAndFeeItem {
    code: string;
    exchangeRate: number;
    paylocalAmount: number;
    paylocalAmountConverted: number;
    paylocalAmountConvertedCurrency: string;
    paylocalAmountCurrency: string;
}

export type TAmendTaxesAndFees = IAmendTaxAndFeeItem[];
