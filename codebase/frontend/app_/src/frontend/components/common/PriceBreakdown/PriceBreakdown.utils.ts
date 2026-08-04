import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { IPriceBreakdownFields } from './PriceBreakdown';

export const DATA_TID_PREFIX = 'price-breakdown';
export const DATA_TID_DETAILS = `${DATA_TID_PREFIX}-details`;

export const getPaymentField = (
    fields: IPriceBreakdownFields,
    price: number,
    isTrade = false,
): ISitecoreField<string> => {
    if (isTrade) {
        return fields.NoChangeTotal;
    }

    if (price >= 0) {
        return fields.PayNow;
    }

    return fields.RefundAmount;
};
