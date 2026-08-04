import { IAmendDatesSummaryFields } from './AmendDatesSummary';

export const getAmendDatesPriceLabel = (amendDatesFields: IAmendDatesSummaryFields, amendPrice: number = 0) =>
    amendPrice >= 0 ? amendDatesFields.AdditionalCostLabel : amendDatesFields.RefundLabel;
