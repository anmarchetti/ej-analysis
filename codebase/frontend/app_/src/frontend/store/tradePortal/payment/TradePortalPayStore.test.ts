import { BillingInfo } from 'models/data/payment/BillingInfo';

import TradePortalPayStore from './TradePortalPayStore';

jest.mock('frontend/services/booking.service');

describe('payStore', () => {
    it('should clear store', () => {
        const payStore = new TradePortalPayStore();
        payStore.clearCardInfo = jest.fn();
        payStore.clearUI = jest.fn();
        payStore.clearStore();
        expect(payStore.amount).toBe(0);
        expect(payStore.clearUI).toBeCalled();
        expect(payStore.clearCardInfo).toBeCalled();
    });

    describe('canPay', () => {
        it('should return true if all forms are valid and confirm policy checked', () => {
            const payStore = new TradePortalPayStore();
            payStore.billingInfo = new BillingInfo('test', 'test', 'test', 'CR0 3RL');
            payStore.cardInfo.cardNumber = '2294744492299775';
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10/30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';
            expect(payStore.canPay).toBeTruthy();
        });

        it('should return false if all billing form are invalid valid', () => {
            const payStore = new TradePortalPayStore();
            payStore.setAmount(10);
            payStore.billingInfo = new BillingInfo('', 'test', 'test', 'CR0 3RL');
            payStore.cardInfo.cardNumber = '2294744492299775';
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10/30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';
            expect(payStore.canPay).toBeFalsy();
        });

        it('should return false if all payment form are invalid valid', () => {
            const payStore = new TradePortalPayStore();
            payStore.setAmount(10);
            payStore.billingInfo = new BillingInfo('test', 'test', 'test', 'CR0 3RL');
            payStore.cardInfo.cardNumber = '1';
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10/30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';
            expect(payStore.canPay).toBeFalsy();
        });
    });

    describe('toggleFocusPaymentBlock', () => {
        it('should toggle toggleFocusPaymentBlock', () => {
            const payStore = new TradePortalPayStore();
            expect(payStore.paymentBlockInFocus).toBeFalsy();
            payStore.toggleFocusPaymentBlock(true);
            expect(payStore.paymentBlockInFocus).toBeTruthy();
        });
    });

    describe('toggleFocusBillingAddressBlock', () => {
        it('should toggle billingAddressBlokInFocus', () => {
            const payStore = new TradePortalPayStore();
            expect(payStore.billingAddressBlokInFocus).toBeFalsy();
            payStore.toggleFocusBillingAddressBlock(true);
            expect(payStore.billingAddressBlokInFocus).toBeTruthy();
        });
    });

    describe('toggleFocusBillingAddressBlock', () => {
        it('should set forceFieldErrors to true and call toggleFocusPaymentBlock', () => {
            const payStore = new TradePortalPayStore();
            payStore.billingInfo = new BillingInfo('test', 'test', 'test', 'test');
            payStore.cardInfo.cardNumber = '1';
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10/30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';
            payStore.toggleFocusPaymentBlock = jest.fn();
            payStore.toggleFocusBillingAddressBlock = jest.fn();
            expect(payStore.forceFieldErrors).toBeFalsy();
            payStore.onForceErrors(true);
            expect(payStore.forceFieldErrors).toBeTruthy();
            expect(payStore.toggleFocusPaymentBlock).toBeCalled();
            expect(payStore.toggleFocusBillingAddressBlock).not.toBeCalled();
        });

        it('should set forceFieldErrors to true and call toggleFocusBillingAddressBlock', () => {
            const payStore = new TradePortalPayStore();
            payStore.billingInfo = new BillingInfo('', 'test', 'test', 'test');
            payStore.cardInfo.cardNumber = '2294744492299775';
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10/30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';
            payStore.toggleFocusPaymentBlock = jest.fn();
            payStore.toggleFocusBillingAddressBlock = jest.fn();
            expect(payStore.forceFieldErrors).toBeFalsy();
            payStore.onForceErrors(true);
            expect(payStore.forceFieldErrors).toBeTruthy();
            expect(payStore.toggleFocusPaymentBlock).not.toBeCalled();
            expect(payStore.toggleFocusBillingAddressBlock).toBeCalled();
        });

        it('should set forceFieldErrors to false', () => {
            const payStore = new TradePortalPayStore();
            payStore.toggleFocusPaymentBlock = jest.fn();
            payStore.toggleFocusBillingAddressBlock = jest.fn();
            expect(payStore.forceFieldErrors).toBeFalsy();
            payStore.onForceErrors(false);
            expect(payStore.forceFieldErrors).toBeFalsy();
            expect(payStore.toggleFocusPaymentBlock).not.toBeCalled();
            expect(payStore.toggleFocusBillingAddressBlock).not.toBeCalled();
        });
    });
});
