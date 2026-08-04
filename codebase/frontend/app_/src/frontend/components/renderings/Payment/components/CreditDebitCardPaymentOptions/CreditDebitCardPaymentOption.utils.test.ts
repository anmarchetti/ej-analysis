import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';

import { getPaymentFormKey } from './CreditDebitCardPaymentOptions.utils';

const createError = (code: string): IPaymentFailureItem => ({
    code,
    descriptionKey: `desc-${code}`,
    isFatal: false,
    messageKey: `msg-${code}`,
});

describe('getPaymentFormKey', () => {
    it('should return error-based key if errors exist', () => {
        const result = getPaymentFormKey([createError('E1'), createError('E2')], 1);
        expect(result).toBe('E1,E2_1');
    });

    it('should return fallback key if no errors', () => {
        const result = getPaymentFormKey(undefined, 2);
        expect(result).toBe('payment-form_2');
    });

    it('should return fallback key if empty errors array', () => {
        const result = getPaymentFormKey([], 3);
        expect(result).toBe('payment-form_3');
    });
});
