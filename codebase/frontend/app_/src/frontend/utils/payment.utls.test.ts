import { PayStore } from 'frontend/store/holidays/payment/PayStore';
import { IBookingPaymentInfo, ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';
import { IPaymentInfo } from 'models/data/IPaymentInfo';
import { CardType } from 'models/enum/CardType';
import { IPaymentAuthorizationCode } from 'models/enum/IPaymentAuthorizationCode';

import { fillMDFor3DS1, getCardType, getTotalPaidAmount, removeCardNumberFor3DS2 } from './payment.utls';

describe('payment.utls.test', () => {
    describe('getCardType', () => {
        test('should return American Express', () => {
            const cardType = getCardType('344238716403663');

            expect(cardType).toEqual(CardType.AmericanExpress);
        });

        test('should return Maestro', () => {
            const cardType = getCardType('5018200195671768');

            expect(cardType).toEqual(CardType.Maestro);
        });

        test('should return Mastercard', () => {
            const cardType = getCardType('2485255812713113');

            expect(cardType).toEqual(CardType.Mastercard);
        });

        test('should return Visa', () => {
            const cardType = getCardType('4146453010646790');

            expect(cardType).toEqual(CardType.Visa);
        });

        test('should return Invalid card type', () => {
            const cardType = getCardType('1442387164031663');

            expect(cardType).toEqual(CardType.InvalidType);
        });
    });

    describe('getTotalPaidAmount', () => {
        it('should return 0 if no paymnet history', () => {
            const paymentInfo = { totalPrice: 600, paymentHistory: [] };
            const res = getTotalPaidAmount(paymentInfo as any);

            expect(res).toEqual(0);
        });

        it('should return total price if total paid sum is greater then total price', () => {
            const canBeGreaterThanTotal = false;
            const paymentInfo = {
                totalPrice: 100,
                paymentHistory: [{ amount: 50 }, { amount: 100 }, { amount: 150 }],
            } as IPaymentInfo;
            const res = getTotalPaidAmount(paymentInfo, canBeGreaterThanTotal);

            expect(res).toEqual(100);
        });

        it("should return total paid sum even if it's grater total price", () => {
            const canBeGreaterThanTotal = true;
            const paymentInfo = {
                totalPrice: 100,
                paymentHistory: [{ amount: 50 }, { amount: 100 }, { amount: 150 }],
            } as IPaymentInfo;
            const res = getTotalPaidAmount(paymentInfo, canBeGreaterThanTotal);

            expect(res).toEqual(300);
        });
    });

    describe('removeCardNumberFor3DS2', () => {
        it('should remove cardNumber for 3ds2 Identify step', () => {
            const payStore = {
                paymentAuthorization: {
                    resultCode: IPaymentAuthorizationCode.Identify,
                },
            } as PayStore;
            const bookingBody = {
                paymentInfo: {
                    cardNumber: '123',
                },
            } as ICommitBookingRequestBody;

            removeCardNumberFor3DS2(payStore, bookingBody);
            const { cardNumber } = bookingBody.paymentInfo as IBookingPaymentInfo;
            expect(cardNumber).toEqual('');
        });

        it('should remove cardNumber for 3ds2 Challenge step', () => {
            const payStore = {
                paymentAuthorization: {
                    resultCode: IPaymentAuthorizationCode.Challenge,
                },
            } as PayStore;
            const bookingBody = {
                paymentInfo: {
                    cardNumber: '123',
                },
            } as ICommitBookingRequestBody;

            removeCardNumberFor3DS2(payStore, bookingBody);
            const { cardNumber } = bookingBody.paymentInfo as IBookingPaymentInfo;
            expect(cardNumber).toEqual('');
        });

        it('should not remove cardNumber for 3ds1 Redirect', () => {
            const payStore = {
                paymentAuthorization: {
                    resultCode: IPaymentAuthorizationCode.Redirect,
                },
            } as PayStore;
            const bookingBody = {
                paymentInfo: {
                    cardNumber: '123',
                },
            } as ICommitBookingRequestBody;

            removeCardNumberFor3DS2(payStore, bookingBody);
            const { cardNumber } = bookingBody.paymentInfo as IBookingPaymentInfo;
            expect(cardNumber).toEqual('123');
        });

        it('should not remove cardNumber if auth step is not defined', () => {
            const payStore = {
                paymentAuthorization: {},
            } as PayStore;
            const bookingBody = {
                paymentInfo: {
                    cardNumber: '123',
                },
            } as ICommitBookingRequestBody;

            removeCardNumberFor3DS2(payStore, bookingBody);
            const { cardNumber } = bookingBody.paymentInfo as IBookingPaymentInfo;
            expect(cardNumber).toEqual('123');
        });
    });

    describe('fillMDFor3DS1', () => {
        it('should use MD from prev step for 3ds1 Redirect step if it is empty', () => {
            const payStore = {
                paymentAuthorization: {
                    resultCode: IPaymentAuthorizationCode.Redirect,
                },
                md: 'from-pay-store',
            } as PayStore;
            const bookingBody = {
                paymentInfo: {
                    md: '',
                },
            } as ICommitBookingRequestBody;

            fillMDFor3DS1(payStore, bookingBody);
            const { md } = bookingBody.paymentInfo as IBookingPaymentInfo;
            expect(md).toEqual('from-pay-store');
        });

        it('should not rewrite MD if it is defined', () => {
            const payStore = {
                paymentAuthorization: {
                    resultCode: IPaymentAuthorizationCode.Redirect,
                },
                md: 'from-pay-store',
            } as PayStore;
            const bookingBody = {
                paymentInfo: {
                    md: '123',
                },
            } as ICommitBookingRequestBody;

            fillMDFor3DS1(payStore, bookingBody);
            const { md } = bookingBody.paymentInfo as IBookingPaymentInfo;
            expect(md).toEqual('123');
        });

        it('should not rewrite MD if it is not 3ds1 Redirect step', () => {
            const payStore = {
                paymentAuthorization: {
                    resultCode: IPaymentAuthorizationCode.Identify,
                },
                md: 'from-pay-store',
            } as PayStore;
            const bookingBody = {
                paymentInfo: {
                    md: '',
                },
            } as ICommitBookingRequestBody;

            fillMDFor3DS1(payStore, bookingBody);
            const { md } = bookingBody.paymentInfo as IBookingPaymentInfo;
            expect(md).toEqual('');
        });
    });
});
