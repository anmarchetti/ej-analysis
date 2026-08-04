import { PaymentOption } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PaymentScenario } from 'models/enum/amend/PaymentScenario';
import {
    getPaymentScenario,
    getPaymentSummaryMeta,
    getRefundRemindTextMeta,
    getRemindTextMeta,
} from 'frontend/components/renderings/AmendPayment/components/AmendPaymentMetaBlock/AmendPaymentMetaBlock.utils';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import { IPaymentDetailsProps } from './interfaces';

jest.mock('frontend/utils/date.utils', () => ({ formatDateL10n: jest.fn(() => '01/01/2020') }));

const mockFields = {
    AmendRefundCreditsOnlyTitleReminder: { value: 'AmendRefundCreditsOnlyTitleReminder' },
    AmendTitleReminder: { value: 'AmendTitleReminder' },
    AmendRefundCreditsOnlyDescriptionReminder: { value: 'AmendRefundCreditsOnlyDescriptionReminder {amount}' },
    AmendRefundDescriptionReminder: { value: 'AmendRefundDescriptionReminder' },
    AmendZeroPriceDescriptionReminder: { value: 'AmendZeroPriceDescriptionReminder {date}' },
} as IPaymentPageFields;

describe('amendPaymentMetaBlock.utils', () => {
    describe('getRemindTextMeta', () => {
        it('should return empty title and description if total balance is not 0', () => {
            const totalPrice = 20;
            const remindTextMeta = getRemindTextMeta(mockFields, totalPrice, new Date());

            expect(remindTextMeta).toStrictEqual({ description: '', title: '' });
        });

        it('should return title and description if total balance is  0', () => {
            const totalPrice = 0;
            const remindTextMeta = getRemindTextMeta(mockFields, totalPrice, new Date());

            expect(remindTextMeta).toStrictEqual({
                description: 'AmendZeroPriceDescriptionReminder <strong>01/01/2020</strong>',
                title: 'AmendTitleReminder',
            });
        });
    });

    describe('getRemindTextMeta', () => {
        it('should return amend reminders when no isOnlyCreditRefund', () => {
            const isOnlyCreditRefund = false;
            const remindTextMeta = getRefundRemindTextMeta(mockFields, isOnlyCreditRefund, `£10`);

            expect(remindTextMeta).toStrictEqual({
                description: 'AmendRefundDescriptionReminder',
                title: 'AmendTitleReminder',
            });
        });

        it('should return amend credits only reminders when isOnlyCreditRefund', () => {
            const isOnlyCreditRefund = true;
            const remindTextMeta = getRefundRemindTextMeta(mockFields, isOnlyCreditRefund, `£10`);

            expect(remindTextMeta).toStrictEqual({
                description: 'AmendRefundCreditsOnlyDescriptionReminder <strong>£10</strong>',
                title: 'AmendRefundCreditsOnlyTitleReminder',
            });
        });
    });

    describe('getPaymentSummaryMeta', () => {
        const mocks = {
            totalPrice: 100,
            usedCredit: 10,
            amountToPay: 50,
            paymentOption: PaymentOption.AddToBalance,
            totalFeesAmount: 0,
            hasBalance: false,
            newBalanceAmount: 0,
            fields: {
                ConfirmChangesLabel: mockSitecoreField('ConfirmChangesLabel'),
                ConfirmRefund: mockSitecoreField('ConfirmRefund'),
                Confirm: mockSitecoreField('Confirm'),
                ConfirmRefundTitle: mockSitecoreField('ConfirmRefundTitle'),
                AddToAmendBalanceTotalLabel: mockSitecoreField('AddToAmendBalanceTotalLabel'),
                TotalCost: mockSitecoreField('TotalCost'),
                ConfirmButtonLabel: mockSitecoreField('ConfirmButtonLabel'),
                NewBalanceWarning: mockSitecoreField('NewBalanceWarning'),
                RemainingBalanceWarning: mockSitecoreField('RemainingBalanceWarning'),
                UpdatedBalanceWarning: mockSitecoreField('UpdatedBalanceWarning'),
                ConfirmNoPriceChange: mockSitecoreField('ConfirmNoPriceChange'),
            } as any,
        };

        describe('Balance has been paid', () => {
            beforeEach(() => {
                mocks.totalPrice = 5;
            });

            it('should return correct properties when user is creating new balance', () => {
                mocks.usedCredit = 0;
                mocks.paymentOption = PaymentOption.AddToBalance;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.AddToAmendBalanceTotalLabel.value,
                    subtitle: mocks.fields.NewBalanceWarning,
                    price: mocks.totalPrice,
                    confirmCTA: mocks.fields.Confirm.value,
                    shouldPayNow: false,
                });
            });

            it('should return correct properties when user is paying separately for seats (Credit only)', () => {
                mocks.usedCredit = mocks.totalPrice;
                mocks.paymentOption = PaymentOption.Full;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.TotalCost.value,
                    subtitle: undefined,
                    price: 0,
                    confirmCTA: mocks.fields.ConfirmChangesLabel.value,
                    shouldPayNow: true,
                    isFullCreditPayment: true,
                });
            });

            it('should return correct values when user is paying separately for seats (Credit + Card)', () => {
                mocks.usedCredit = mocks.totalPrice - 1;
                mocks.paymentOption = PaymentOption.Full;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.TotalCost.value,
                    subtitle: undefined,
                    price: mocks.amountToPay,
                    confirmCTA: mocks.fields.ConfirmButtonLabel.value,
                    shouldPayNow: true,
                });
            });

            it('should return correct properties when totalPrice = 0', () => {
                mocks.totalPrice = 0;
                mocks.usedCredit = 10;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.ConfirmChangesLabel.value,
                    subtitle: undefined,
                    price: undefined,
                    confirmCTA: mocks.fields.ConfirmNoPriceChange.value,
                    shouldPayNow: undefined,
                });
            });

            it('should return correct properties when user has refunds and totalPrice < 0', () => {
                mocks.totalPrice = -10;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.ConfirmRefundTitle.value,
                    subtitle: undefined,
                    price: Math.abs(mocks.totalPrice),
                    confirmCTA: mocks.fields.ConfirmRefund.value,
                    shouldPayNow: undefined,
                });
            });

            it('should return correct properties when user is paying only for fees', () => {
                mocks.totalPrice = 10;
                mocks.totalFeesAmount = 10;
                mocks.paymentOption = PaymentOption.AddToBalance;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.TotalCost.value,
                    subtitle: mocks.fields.NewBalanceWarning,
                    price: mocks.amountToPay,
                    confirmCTA: mocks.fields.ConfirmButtonLabel.value,
                    shouldPayNow: true,
                });
            });
        });

        describe('Balance outstanding', () => {
            beforeEach(() => {
                mocks.totalPrice = 5;
                mocks.hasBalance = true;
                mocks.newBalanceAmount = 10;
                mocks.totalFeesAmount = 0;
            });

            it('should return correct properties when user is paying for costs and balance', () => {
                mocks.usedCredit = 0;
                mocks.paymentOption = PaymentOption.AddToBalance;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.AddToAmendBalanceTotalLabel.value,
                    subtitle: mocks.fields.UpdatedBalanceWarning,
                    confirmCTA: mocks.fields.Confirm.value,
                    price: mocks.newBalanceAmount,
                    shouldPayNow: false,
                });
            });

            it('should return correct properties when user is paying only for costs with card', () => {
                mocks.usedCredit = 0;
                mocks.paymentOption = PaymentOption.Full;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.TotalCost.value,
                    subtitle: mocks.fields.RemainingBalanceWarning,
                    confirmCTA: mocks.fields.ConfirmButtonLabel.value,
                    price: mocks.totalPrice,
                    shouldPayNow: true,
                });
            });

            it('should return correct properties when user is paying only for costs with credit', () => {
                mocks.usedCredit = mocks.totalPrice;
                mocks.paymentOption = PaymentOption.Full;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.TotalCost.value,
                    subtitle: mocks.fields.RemainingBalanceWarning,
                    confirmCTA: mocks.fields.ConfirmChangesLabel.value,
                    price: 0,
                    shouldPayNow: true,
                    isFullCreditPayment: true,
                });
            });

            it('should return correct properties when user is paying only for costs with credit AND card', () => {
                mocks.usedCredit = mocks.totalPrice - 1;
                mocks.paymentOption = PaymentOption.Full;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.TotalCost.value,
                    subtitle: mocks.fields.RemainingBalanceWarning,
                    confirmCTA: mocks.fields.ConfirmButtonLabel.value,
                    price: mocks.amountToPay,
                    shouldPayNow: true,
                });
            });

            it('should return correct properties when user has refunds and totalPrice < 0', () => {
                mocks.totalPrice = -10;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.ConfirmRefundTitle.value,
                    subtitle: mocks.fields.UpdatedBalanceWarning,
                    confirmCTA: mocks.fields.ConfirmRefund.value,
                    price: Math.abs(mocks.totalPrice),
                    shouldPayNow: undefined,
                });
            });

            it('should return correct properties when totalPrice = 0', () => {
                mocks.totalPrice = 0;
                mocks.amountToPay = mocks.totalPrice - mocks.usedCredit;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.ConfirmChangesLabel.value,
                    subtitle: mocks.fields.RemainingBalanceWarning,
                    confirmCTA: mocks.fields.ConfirmNoPriceChange.value,
                    price: undefined,
                    shouldPayNow: undefined,
                });
            });

            it('should return correct properties when user is paying only for fees', () => {
                mocks.totalPrice = 10;
                mocks.totalFeesAmount = 10;
                mocks.paymentOption = PaymentOption.AddToBalance;
                const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

                expect(result).toEqual({
                    title: mocks.fields.TotalCost.value,
                    subtitle: mocks.fields.UpdatedBalanceWarning,
                    price: mocks.amountToPay,
                    confirmCTA: mocks.fields.ConfirmButtonLabel.value,
                    shouldPayNow: true,
                });
            });
        });

        it('should return correct properties when user is paying later for changes with credit', () => {
            mocks.totalPrice = 10;
            mocks.totalFeesAmount = 5;
            mocks.amountToPay = 0;
            mocks.usedCredit = 5;
            mocks.paymentOption = PaymentOption.AddToBalance;
            const result: IPaymentDetailsProps = getPaymentSummaryMeta(mocks);

            expect(result).toEqual({
                title: mocks.fields.TotalCost.value,
                subtitle: mocks.fields.UpdatedBalanceWarning,
                price: mocks.amountToPay,
                confirmCTA: mocks.fields.ConfirmChangesLabel.value,
                shouldPayNow: true,
                isFullCreditPayment: true,
            });
        });
    });

    describe('getPaymentScenario', () => {
        const mocks = {
            hasBalance: false,
            totalPrice: 100,
            paymentMethod: PaymentOption.Full,
            includesFee: false,
        };

        describe('Balance has been paid', () => {
            it('should return BalancePaidPayNow when user is paying now', () => {
                const scenario = getPaymentScenario(mocks);

                expect(scenario).toEqual(PaymentScenario.BalancePaidPayNow);
            });

            it('should return BalancePaidPayLater when user is adding to balance', () => {
                mocks.paymentMethod = PaymentOption.AddToBalance;
                const scenario = getPaymentScenario(mocks);

                expect(scenario).toEqual(PaymentScenario.BalancePaidPayLater);
            });

            it('should return BalancePaidRefund when user is owed a refund', () => {
                mocks.totalPrice = -10;
                const scenario = getPaymentScenario(mocks);

                expect(scenario).toEqual(PaymentScenario.BalancePaidRefund);
            });

            it('should return BalancePaidNoPriceChange when user has no price change', () => {
                mocks.totalPrice = 0;
                const scenario = getPaymentScenario(mocks);

                expect(scenario).toEqual(PaymentScenario.BalancePaidNoPriceChange);
            });

            it('should return BalancePaidPayingOnlyFeeNow when user is paying only fees', () => {
                mocks.includesFee = true;
                mocks.totalPrice = 10;
                mocks.paymentMethod = PaymentOption.AddToBalance;
                const scenario = getPaymentScenario(mocks);

                expect(scenario).toEqual(PaymentScenario.BalancePaidPayingOnlyFeeNow);
            });
        });

        describe('Balance outstanding', () => {
            beforeEach(() => {
                mocks.hasBalance = true;
                mocks.totalPrice = 5;
                mocks.paymentMethod = PaymentOption.Full;
                mocks.includesFee = false;
            });

            it('should return BalanceOutstandingPayNow when user is paying now', () => {
                const scenario = getPaymentScenario(mocks);

                expect(scenario).toEqual(PaymentScenario.BalanceOutstandingPayNow);
            });

            it('should return BalanceOutstandingPayLater when user is adding to balance', () => {
                mocks.paymentMethod = PaymentOption.AddToBalance;
                const scenario = getPaymentScenario(mocks);

                expect(scenario).toEqual(PaymentScenario.BalanceOutstandingPayLater);
            });

            it('should return BalanceOutstandingRefundToBalance when user is owed a refund', () => {
                mocks.totalPrice = -10;
                const scenario = getPaymentScenario(mocks);

                expect(scenario).toEqual(PaymentScenario.BalanceOutstandingRefundToBalance);
            });

            it('should return BalanceOutstandingNoPriceChange when user has no price change', () => {
                mocks.totalPrice = 0;
                const scenario = getPaymentScenario(mocks);

                expect(scenario).toEqual(PaymentScenario.BalanceOutstandingNoPriceChange);
            });

            it('should return BalanceOutstandingPayingOnlyFeeNow when user is paying only fees', () => {
                mocks.includesFee = true;
                mocks.totalPrice = 10;
                mocks.paymentMethod = PaymentOption.AddToBalance;
                const scenario = getPaymentScenario(mocks);

                expect(scenario).toEqual(PaymentScenario.BalanceOutstandingPayingOnlyFeeNow);
            });
        });
    });
});
