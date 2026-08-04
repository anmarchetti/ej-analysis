import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

export interface IPaymentDetailsProps {
    confirmCTA?: string;
    isFullCreditPayment?: boolean;
    price?: number;
    shouldPayNow?: boolean;
    subtitle?: ISitecoreField<string>;
    title?: string;
    updatedBalanceAmount?: number;
}

export interface IAmendPaymentMetaBlockProps {
    fields: IPaymentPageFields | undefined;
}
