import { CurrencyCode } from 'code/currency';
import creditManagementService from 'frontend/services/creditManagement.service';
import { failuresConfig, IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';
import * as dateUtils from 'frontend/utils/date.utils';
import { IMyCreditInfo } from 'models/data/MyCreditInfo';
import { BillingInfo } from 'models/data/payment/BillingInfo';
import { PaymentType } from 'models/enum/PaymentType';

import { PayStore } from './PayStore';
jest.mock('frontend/services/booking.service');

const mockCredits = [
    { balance: 100, currency: CurrencyCode.GBP },
    { balance: 200, currency: CurrencyCode.CHF },
] as IMyCreditInfo[];

describe('payStore', () => {
    const createRootStore = () => ({
        paymentTypeStore: {
            selectedPaymentType: PaymentType.Card,
        },
    });
    let rootStore;

    beforeEach(() => {
        rootStore = createRootStore();
    });

    it('should clear store', () => {
        const payStore = new PayStore(rootStore);
        payStore.clearCardInfo = jest.fn();
        payStore.clearUI = jest.fn();
        payStore.clearStore();
        expect(payStore.amount).toBe(0);
        expect(payStore.clearUI).toBeCalled();
        expect(payStore.clearCardInfo).toBeCalled();
    });

    describe('canPay', () => {
        it('should return true when amount is 0', () => {
            const payStore = new PayStore(rootStore);
            payStore.setAmount(0);
            expect(payStore.canPay).toBe(true);
        });

        it('should return true when amount is negative', () => {
            const payStore = new PayStore(rootStore);
            payStore.setAmount(-10);
            expect(payStore.canPay).toBe(true);
        });

        it('should return true when all forms are valid and confirm policy checked', () => {
            const payStore = new PayStore(rootStore);
            payStore.setAmount(10);
            payStore.billingInfo = new BillingInfo('test', 'test', 'test', 'CR0 3RL');
            payStore.cardInfo.cardNumber = '2294744492299775';
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10/30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';
            expect(payStore.canPay).toBe(true);
        });

        it('should return false when all billing form are invalid valid', () => {
            const payStore = new PayStore(rootStore);
            payStore.setAmount(10);
            payStore.billingInfo = new BillingInfo('', 'test', 'test', 'CR0 3RL');
            payStore.cardInfo.cardNumber = '2294744492299775';
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10/30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';
            expect(payStore.canPay).toBe(false);
        });

        it('should return false when all payment form are invalid valid', () => {
            const payStore = new PayStore(rootStore);
            payStore.setAmount(10);
            payStore.billingInfo = new BillingInfo('test', 'test', 'test', 'CR0 3RL');
            payStore.cardInfo.cardNumber = '1';
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10/30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';
            expect(payStore.canPay).toBe(false);
        });

        it('should return true when ApplePay payment is selected and confirm policy checked', () => {
            rootStore.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            const payStore = new PayStore(rootStore);
            payStore.setAmount(10);
            expect(payStore.canPay).toBe(true);
        });

        it('should return false when undefined payment is selected', () => {
            rootStore.paymentTypeStore.selectedPaymentType = '';
            const payStore = new PayStore(rootStore);
            payStore.setAmount(10);
            expect(payStore.canPay).toBe(false);
        });
    });

    describe('toggleFocusPaymentBlock', () => {
        it('should toggle toggleFocusPaymentBlock', () => {
            const payStore = new PayStore(rootStore);
            expect(payStore.paymentBlockInFocus).toBe(false);
            payStore.toggleFocusPaymentBlock(true);
            expect(payStore.paymentBlockInFocus).toBe(true);
        });
    });

    describe('toggleFocusBillingAddressBlock', () => {
        it('should toggle billingAddressBlokInFocus', () => {
            const payStore = new PayStore(rootStore);
            expect(payStore.billingAddressBlokInFocus).toBe(false);
            payStore.toggleFocusBillingAddressBlock(true);
            expect(payStore.billingAddressBlokInFocus).toBe(true);
        });
    });

    describe('toggleFocusBillingAddressBlock', () => {
        it('should set forceFieldErrors to true and call toggleFocusPaymentBlock when is Card payment type', () => {
            rootStore.paymentTypeStore.selectedPaymentType = PaymentType.Card;
            const payStore = new PayStore(rootStore);
            payStore.billingInfo = new BillingInfo('test', 'test', 'test', 'test');
            payStore.cardInfo.cardNumber = '1';
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10/30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';
            payStore.toggleFocusPaymentBlock = jest.fn();
            payStore.toggleFocusBillingAddressBlock = jest.fn();
            expect(payStore.forceFieldErrors).toBe(false);
            payStore.onForceErrors(true);
            expect(payStore.forceFieldErrors).toBe(true);
            expect(payStore.toggleFocusPaymentBlock).toBeCalled();
            expect(payStore.toggleFocusBillingAddressBlock).not.toBeCalled();
        });

        it('should set forceFieldErrors to true and call toggleFocusBillingAddressBlock when selected payment type is Card', () => {
            rootStore.paymentTypeStore.selectedPaymentType = PaymentType.Card;
            const payStore = new PayStore(rootStore);
            payStore.billingInfo = new BillingInfo('', 'test', 'test', 'test');
            payStore.cardInfo.cardNumber = '2294744492299775';
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10/30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';
            payStore.toggleFocusPaymentBlock = jest.fn();
            payStore.toggleFocusBillingAddressBlock = jest.fn();
            expect(payStore.forceFieldErrors).toBe(false);
            payStore.onForceErrors(true);
            expect(payStore.forceFieldErrors).toBe(true);
            expect(payStore.toggleFocusPaymentBlock).not.toBeCalled();
            expect(payStore.toggleFocusBillingAddressBlock).toBeCalled();
        });

        it('should set forceFieldErrors to false', () => {
            const payStore = new PayStore(rootStore);
            payStore.toggleFocusPaymentBlock = jest.fn();
            payStore.toggleFocusBillingAddressBlock = jest.fn();
            expect(payStore.forceFieldErrors).toBe(false);
            payStore.onForceErrors(false);
            expect(payStore.forceFieldErrors).toBe(false);
            expect(payStore.toggleFocusPaymentBlock).not.toBeCalled();
            expect(payStore.toggleFocusBillingAddressBlock).not.toBeCalled();
        });

        it('should set forceFieldErrors and call toggleFocusBillingAddressBlock when ApplePay and billing info is invalid', () => {
            rootStore.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            const payStore = new PayStore(rootStore);

            payStore.billingInfo = new BillingInfo('', 'test', 'test', 'test');
            payStore.toggleFocusPaymentBlock = jest.fn();
            payStore.toggleFocusBillingAddressBlock = jest.fn();

            payStore.onForceErrors(true);

            expect(payStore.forceFieldErrors).toBe(true);
            expect(payStore.toggleFocusBillingAddressBlock).toHaveBeenCalledWith(true);
            expect(payStore.toggleFocusPaymentBlock).not.toHaveBeenCalled();
        });
    });

    describe('getCredit()', () => {
        it('should load user credits', async () => {
            creditManagementService.loadCreditBalance = jest.fn().mockResolvedValue(mockCredits);

            const payStore = new PayStore(rootStore);
            await payStore.getCredit();

            expect(payStore.userAllCredits).toEqual(mockCredits);
            expect(payStore.userCreditError).toBe(false);
        });

        it('should set error when loading user credits fails', async () => {
            creditManagementService.loadCreditBalance = jest.fn().mockRejectedValue(new Error('error'));

            const payStore = new PayStore(rootStore);
            await payStore.getCredit();

            expect(payStore.userAllCredits).toEqual([]);
            expect(payStore.userCreditError).toBe(true);
        });

        it('should not set error when loading user credits fails with authorized error', async () => {
            creditManagementService.loadCreditBalance = jest.fn().mockRejectedValue({ response: { status: 401 } });

            const payStore = new PayStore(rootStore);
            await payStore.getCredit();

            expect(payStore.userAllCredits).toEqual([]);
            expect(payStore.userCreditError).toBe(false);
        });
    });

    describe('userCreditAmount', () => {
        it('should return 0 when userAllCredits is empty', () => {
            const payStore = new PayStore(rootStore);
            payStore.userAllCredits = [];

            expect(payStore.userCreditAmount).toEqual(0);
        });

        it('should return 0 when currency is not defined', () => {
            const payStore = new PayStore(rootStore);
            payStore.userAllCredits = mockCredits;

            expect(payStore.userCreditAmount).toEqual(0);
        });

        it('should return credit in current currency', () => {
            const payStore = new PayStore(rootStore);
            payStore.setCurrency(CurrencyCode.GBP);
            payStore.userAllCredits = mockCredits;

            expect(payStore.userCreditAmount).toEqual(100);
        });
    });

    describe('get paymentInfo', () => {
        it('should convert expiration date market specific separator to /', () => {
            const payStore = new PayStore(rootStore);

            payStore.setAmount(10);
            payStore.cardInfo.cvv = '123';
            payStore.cardInfo.expirationDate = '10.30';
            payStore.cardInfo.issueNumber = '1234';
            payStore.cardInfo.nameOnCard = 'test';

            jest.spyOn(dateUtils, 'getLocalizedFormatValue').mockReturnValueOnce('MM.AA');

            expect(payStore.paymentInfo).toStrictEqual(
                expect.objectContaining({
                    amount: 10,
                    billingInfo: {
                        address: '',
                        address2: '',
                        city: '',
                        fullName: '',
                        postCode: '',
                    },
                    cardNumber: '',
                    cardType: 'InvalidType',
                    cvv: '123',
                    expirationDate: '10/30',
                    issueNumber: '1234',
                    nameOnCard: 'test',
                }),
            );
        });
    });

    describe('Apple Pay errors', () => {
        it('should return Apple Pay error from computed applePayValidationError', () => {
            const payStore = new PayStore(rootStore);
            const error: IPaymentFailureItem = {
                code: 'apple_merchant_validation_failed',
                descriptionKey: 'x',
                isFatal: false,
                messageKey: 'mocked.message.key',
            };
            payStore.paymentErrors = [error];

            const result = payStore.applePayValidationError;

            expect(result).toEqual(error);
        });

        it('should return undefined if no apple_merchant_validation_failed in paymentErrors', () => {
            const payStore = new PayStore(rootStore);
            payStore.paymentErrors = [
                {
                    code: 'some_other_error',
                    descriptionKey: 'x',
                    isFatal: false,
                    messageKey: 'mocked.message.key',
                },
            ];

            expect(payStore.applePayValidationError).toBeUndefined();
        });

        it('should use configured failure if it exists', () => {
            const payStore = new PayStore(rootStore);
            const details = 'Some details';

            const expected = {
                ...failuresConfig.find(f => f.code === 'apple_merchant_validation_failed')!,
                details,
            };

            const enriched = payStore.setMerchantValidationFailure(details);

            expect(enriched).toEqual(expected);
            expect(payStore.paymentErrors).toContainEqual(expected);
        });

        it('should use default failure if config does not include it', async () => {
            jest.resetModules();

            jest.doMock('frontend/store/holidays/payment/payment-failures.config', () => ({
                failuresConfig: [],
                defaultFailure: {
                    code: 'default',
                    descriptionKey: 'fallback',
                    isFatal: false,
                    messageKey: 'fallback.message.key',
                },
            }));

            const { PayStore } = await import('./PayStore');
            const payStore = new PayStore(rootStore);

            const enriched = payStore.setMerchantValidationFailure('Some details');

            expect(enriched).toEqual({
                code: 'default',
                descriptionKey: 'fallback',
                isFatal: false,
                messageKey: 'fallback.message.key',
                details: 'Some details',
            });

            expect(payStore.paymentErrors).toContainEqual(enriched);
        });
    });

    describe('PayStore selectedPaymentType', () => {
        it('should return selectedPaymentType when PayStore is defined', () => {
            const payStore = new PayStore(rootStore);

            const result = payStore.selectedPaymentType;

            expect(result).toEqual(PaymentType.Card);
        });

        it('should return blank as selectedPaymentType when PayStore is undefined', () => {
            rootStore.paymentTypeStore = undefined;
            const payStore = new PayStore(rootStore);

            const result = payStore.selectedPaymentType;

            expect(result).toEqual('');
        });
    });

    describe('PayStore setPaymentErrors', () => {
        let payStore: PayStore;
        let rootStore: any;

        beforeEach(() => {
            rootStore = {
                payStore: {
                    selectedPaymentType: PaymentType.Card,
                },
            };
            payStore = new PayStore(rootStore);
            payStore.clearCardInfo = jest.fn();
            payStore.toggleHighlightFields = jest.fn();
            payStore.toggleFocusPaymentBlock = jest.fn();
        });

        it('should map innerErrors to paymentErrors and deduplicate by code', () => {
            failuresConfig.push(
                { code: 'err1', descriptionKey: '', isFatal: false, messageKey: '' },
                { code: 'err2', descriptionKey: '', isFatal: false, messageKey: '' },
            );
            const apiError = {
                correlationId: 'corr-1',
                innerErrors: [
                    { code: 'err1', message: 'msg1' },
                    { code: 'err1', message: 'msg1-dup' },
                    { code: 'err2', message: 'msg2' },
                ],
            };
            payStore.setPaymentErrors(apiError as any);

            expect(payStore.paymentErrors.map(e => e.code)).toEqual(['err1', 'err2']);
            expect(payStore.paymentErrors[0].correlationId).toBe('corr-1');
            expect(payStore.paymentErrors[0].details).toBe('msg1');
        });

        it('should push defaultFailure if no innerErrors', () => {
            const apiError = { correlationId: 'corr-2', innerErrors: [] };
            payStore.setPaymentErrors(apiError as any);

            expect(payStore.paymentErrors.length).toBe(1);
            expect(payStore.paymentErrors[0].code).toBeDefined();
        });

        it('should call clearCardInfo, toggleHighlightFields, and toggleFocusPaymentBlock for Card and not fatal', () => {
            jest.spyOn(payStore, 'fatalPaymentError', 'get').mockReturnValue(false);
            const apiError = { correlationId: 'corr-3', innerErrors: [{ code: 'err3', message: 'msg3' }] };
            payStore.setPaymentErrors(apiError as any);

            expect(payStore.clearCardInfo).toHaveBeenCalled();
            expect(payStore.toggleHighlightFields).toHaveBeenCalledWith(true);
            expect(payStore.toggleFocusPaymentBlock).toHaveBeenCalledWith(true);
        });

        it('should not call Card-specific methods if fatalPaymentError is true', () => {
            jest.spyOn(payStore, 'fatalPaymentError', 'get').mockReturnValue(true);
            const apiError = { correlationId: 'corr-4', innerErrors: [{ code: 'err4', message: 'msg4' }] };
            payStore.setPaymentErrors(apiError as any);

            expect(payStore.clearCardInfo).not.toHaveBeenCalled();
            expect(payStore.toggleHighlightFields).not.toHaveBeenCalled();
            expect(payStore.toggleFocusPaymentBlock).not.toHaveBeenCalled();
        });

        it('should not call Card-specific methods if selectedPaymentType is not Card', () => {
            rootStore.payStore.selectedPaymentType = PaymentType.ApplePay;
            payStore = new PayStore(rootStore);
            payStore.clearCardInfo = jest.fn();
            payStore.toggleHighlightFields = jest.fn();
            payStore.toggleFocusPaymentBlock = jest.fn();

            const apiError = { correlationId: 'corr-5', innerErrors: [{ code: 'err5', message: 'msg5' }] };
            payStore.setPaymentErrors(apiError as any);

            expect(payStore.clearCardInfo).not.toHaveBeenCalled();
            expect(payStore.toggleHighlightFields).not.toHaveBeenCalled();
            expect(payStore.toggleFocusPaymentBlock).not.toHaveBeenCalled();
        });
    });

    describe('PayStore applePayPaymentInfo', () => {
        const createEvent = (network: string) =>
            ({
                payment: {
                    token: {
                        paymentMethod: { network },
                    },
                },
            } as unknown as ApplePayJS.ApplePayPaymentAuthorizedEvent);

        it('should return Apple Pay info with required fields when amountToPay > 0', () => {
            rootStore.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            const payStore = new PayStore(rootStore);

            payStore.setAmount(150);
            payStore.billingInfo = new BillingInfo('John Doe', '123 Main St', 'Springfield', '12345', 'US');

            const event = createEvent('Visa');
            const paymentInfo = payStore.applePayPaymentInfo(event);
            expect(paymentInfo).toEqual({
                amount: 150,
                token: event.payment.token,
                paymentType: 'ApplePay',
                billingInfo: {
                    address: '123 Main St',
                    address2: 'US',
                    city: 'Springfield',
                    fullName: 'John Doe',
                    postCode: '12345',
                },
                cardType: 'Visa',
            });
        });

        it('should normalize cardType from amex to AmericanExpress', () => {
            rootStore.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            const payStore = new PayStore(rootStore);

            payStore.setAmount(150);

            const event = createEvent('amex');
            const paymentInfo = payStore.applePayPaymentInfo(event);
            expect(paymentInfo.cardType).toBe('AmericanExpress');
        });

        it('should set correct creditAmount when usedCredit > 0 ', () => {
            rootStore.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            const payStore = new PayStore(rootStore);

            payStore.setAmount(150);
            payStore.usedCredit = 50;

            const event = createEvent('Visa');
            const paymentInfo = payStore.applePayPaymentInfo(event);
            expect(paymentInfo.creditAmount).toBe(50);
        });

        it('should return empty object when amountToPay = 0', () => {
            rootStore.paymentTypeStore.selectedPaymentType = PaymentType.ApplePay;
            const payStore = new PayStore(rootStore);

            payStore.setAmount(0);

            const event = createEvent('Visa');
            const paymentInfo = payStore.applePayPaymentInfo(event);
            expect(paymentInfo).toEqual({});
        });
    });
});
