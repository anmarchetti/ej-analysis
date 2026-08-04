import { IPayBalancePageFields, IPaymentPageFields } from 'frontend/components/renderings/Payment/interfaces';

export interface IPaymentDetailsFormProps {
    fields: IPaymentPageFields | IPayBalancePageFields | undefined;
    isDisabled?: boolean;
}
