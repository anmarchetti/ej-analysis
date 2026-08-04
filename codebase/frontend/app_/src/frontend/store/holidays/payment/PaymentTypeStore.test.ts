import { PaymentType } from 'models/enum/PaymentType';

import { PaymentTypeStore } from './PaymentTypeStore';

describe('paymentTypeStore', () => {
    it('should set selected payment type', () => {
        const paymentTypeStore = new PaymentTypeStore();

        paymentTypeStore.setSelectedPaymentType(PaymentType.ApplePay);

        expect(paymentTypeStore.selectedPaymentType).toBe(PaymentType.ApplePay);
    });

    it('should return default payment types', () => {
        const paymentTypeStore = new PaymentTypeStore();

        expect(paymentTypeStore.paymentTypes).toEqual([PaymentType.Card]);
    });

    it('should return all payment types when apple pay is available ', () => {
        const paymentTypeStore = new PaymentTypeStore();

        paymentTypeStore.setApplePayAvailable();

        expect(paymentTypeStore.paymentTypes).toEqual([PaymentType.Card, PaymentType.ApplePay]);
    });

    it('should not select Apple Pay just because it Apple Pay is available', () => {
        const paymentTypeStore = new PaymentTypeStore();

        paymentTypeStore.setApplePayAvailable();

        expect(paymentTypeStore.selectedPaymentType).not.toBe(PaymentType.ApplePay);
    });

    it('should select Credit Card when Apple Pay is not available', () => {
        const paymentTypeStore = new PaymentTypeStore();

        paymentTypeStore.setApplePayAvailable();
        paymentTypeStore.setApplePayUnavailable();

        expect(paymentTypeStore.selectedPaymentType).toBe(PaymentType.Card);
    });
});
