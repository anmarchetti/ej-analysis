import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';

export const getPaymentFormKey = (errors: IPaymentFailureItem[] | undefined, trigger: number): string =>
    errors?.length ? `${errors.map(el => el.code).join(',')}_${trigger}` : `payment-form_${trigger}`;
