import { CurrencyCode } from 'code/currency';
import { PaymentOption, RefundPaymentMethod } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';
import { PaymentStep } from 'models/data/AmendInfo';
import { AmendmentType } from 'models/data/IBookingInfo';
import { CardType } from 'models/enum/CardType';

import {
    ButtonStateLabel,
    EVENT_ACTION_AMEND_PAYMENT_TYPE,
    EVENT_ACTION_CLICK_TO_PAY,
    EVENT_ACTION_HOLIDAY_UNAVAILABLE,
    EVENT_ACTION_PAY_FOR_CHANGE_LATER,
    EVENT_ACTION_PAY_FOR_CHANGE_NOW,
    EVENT_ACTION_PAYMENT_ERROR,
    EVENT_ACTION_REFUND_AMENDMENTS,
    EventActionClickToPayType,
    gaBalancePaymentSuccess,
    gaClickAmendStepButton,
    gaClickAmendStepTile,
    gaClickPayAmend,
    gaClickPayBalancePage,
    gaClickToAmendPaymentPage,
    gaClickToPayPaymentPage,
    gaHolidaysUnavailable,
    gaPaymentError,
    gaPaymentSuccess,
    gaRefundAmendmentsSuccess,
    getAmendUnavailabilityReasonFromProduct,
    HolidaysUnavailableReason,
} from './GAPaymentEventHandlers';
import {
    getPaymentErrorMessage,
    getPaymentLabelForBalancePaymentSuccess,
    getPaymentLabelForSuccess,
} from './Payment.utils';

jest.mock('./Payment.utils', () => ({
    getPaymentErrorMessage: jest.fn(),
    getPaymentLabelForSuccess: jest.fn(),
    getPaymentLabelForBalancePaymentSuccess: jest.fn(),
}));

const mockError: IPaymentFailureItem = {
    messageKey: 'error_key',
    descriptionKey: 'error_description',
    code: 'error_code',
    isFatal: true,
};

const EVENT_ACTION_AMEND_PAYMENT_STEP_1 = 'step 1';
const EVENT_ACTION_AMEND_PAYMENT_STEP_2 = 'step 2';
const EVENT_ACTION_AMEND_PAYMENT_STEP_3 = 'step 3';

describe('gaPaymentError', () => {
    it('should return correct event action and label based on the error input', () => {
        jest.mocked(getPaymentErrorMessage).mockReturnValue('Mocked Error Message');

        const result = gaPaymentError(mockError);

        expect(result.event_action).toBe(EVENT_ACTION_PAYMENT_ERROR);
        expect(getPaymentErrorMessage).toHaveBeenCalledWith(mockError);
        expect(result.event_label).toBe('Mocked Error Message');
    });

    it('should return an object with event_action as "payment error"', () => {
        const result = gaPaymentError(mockError);

        expect(result.event_action).toBe(EVENT_ACTION_PAYMENT_ERROR);
    });
});

describe('gaClickToPayPaymentPage', () => {
    it('should return correct event and generic values for different buttonEnabled parameters', () => {
        const event = gaClickToPayPaymentPage(true);
        expect(event.event_action).toBe(EVENT_ACTION_CLICK_TO_PAY);
        expect(event.generic_value_1).toBe(ButtonStateLabel.Active);

        const event2 = gaClickToPayPaymentPage(false);
        expect(event2.event_action).toBe(EVENT_ACTION_CLICK_TO_PAY);
        expect(event2.generic_value_1).toBe(ButtonStateLabel.Inactive);
    });

    it('should return correct event and generic values when buttonEnabled param is not passed', () => {
        const event = gaClickToPayPaymentPage();
        expect(event.event_action).toBe(EVENT_ACTION_CLICK_TO_PAY);
        expect(event.generic_value_1).toBe(ButtonStateLabel.Inactive);
    });

    it('should resolve the correct click-to-pay method based on isDeposit and usedCredit', () => {
        // Deposit without credit
        const event1 = gaClickToPayPaymentPage(true, true, 0);
        expect(event1.generic_value_2).toBe(EventActionClickToPayType.Deposit);

        // Deposit with credit
        const event2 = gaClickToPayPaymentPage(true, true, 50);
        expect(event2.generic_value_2).toBe(EventActionClickToPayType.DepositCredit);

        // Full payment without credit
        const event3 = gaClickToPayPaymentPage(true, false, 0);
        expect(event3.generic_value_2).toBe(EventActionClickToPayType.Full);

        // Full payment with credit
        const event4 = gaClickToPayPaymentPage(true, false, 50);
        expect(event4.generic_value_2).toBe(EventActionClickToPayType.FullCredit);

        // No deposit and no usedCredit (default Full)
        const event5 = gaClickToPayPaymentPage(true, undefined, undefined);
        expect(event5.generic_value_2).toBe(EventActionClickToPayType.Full);
    });
});

describe('gaClickToAmendPaymentPage', () => {
    it('should return correct event and generic values for different buttonEnabled parameters', () => {
        const event = gaClickToAmendPaymentPage(true);
        expect(event.event_action).toBe(EVENT_ACTION_CLICK_TO_PAY);
        expect(event.generic_value_1).toBe(ButtonStateLabel.Active);

        const event2 = gaClickToAmendPaymentPage(false);
        expect(event2.event_action).toBe(EVENT_ACTION_CLICK_TO_PAY);
        expect(event2.generic_value_1).toBe(ButtonStateLabel.Inactive);
    });

    it('should return correct event and generic values when buttonEnabled is not passed', () => {
        const event = gaClickToAmendPaymentPage();
        expect(event.event_action).toBe(EVENT_ACTION_CLICK_TO_PAY);
        expect(event.generic_value_1).toBe(ButtonStateLabel.Inactive);
    });

    it('should resolve the correct click-to-pay method for amends based on paymentOption and usedCredit', () => {
        // Full payment without credit
        const event1 = gaClickToAmendPaymentPage(true, PaymentOption.AddToBalance, 0);
        expect(event1.generic_value_2).toBe(EventActionClickToPayType.Deposit);

        // Full payment with credit
        const event2 = gaClickToAmendPaymentPage(true, PaymentOption.Part, 50);
        expect(event2.generic_value_2).toBe(EventActionClickToPayType.FullCredit);

        // Default to Deposit for undefined paymentOption and usedCredit
        const event3 = gaClickToAmendPaymentPage(true, undefined, undefined);
        expect(event3.generic_value_2).toBe(EventActionClickToPayType.Deposit);

        // Default to Deposit for other cases
        const event4 = gaClickToAmendPaymentPage(true, PaymentOption.Part, 0);
        expect(event4.generic_value_2).toBe(EventActionClickToPayType.Full);
    });
});

describe('gaClickPayBalancePage', () => {
    it('should return correct event and generic values for buttonEnabled', () => {
        const event = gaClickPayBalancePage(true);
        expect(event.event_action).toBe(EVENT_ACTION_CLICK_TO_PAY);
        expect(event.generic_value_1).toBe(ButtonStateLabel.Active);

        const event2 = gaClickPayBalancePage(false);
        expect(event2.event_action).toBe(EVENT_ACTION_CLICK_TO_PAY);
        expect(event2.generic_value_1).toBe(ButtonStateLabel.Inactive);
    });

    it('should handle scenarios for amount, amountToPay, and usedCredit', () => {
        const cases: Array<{
            buttonEnabled: boolean;
            expectedGenericValue2: EventActionClickToPayType | undefined;
            amount?: number;
            amountToPay?: number;
            usedCredit?: number;
        }> = [
            {
                buttonEnabled: true,
                amountToPay: 50,
                amount: 100,
                usedCredit: 20,
                expectedGenericValue2: EventActionClickToPayType.DepositCredit,
            },
            {
                buttonEnabled: true,
                amountToPay: 100,
                amount: 150,
                usedCredit: 50,
                expectedGenericValue2: EventActionClickToPayType.FullCredit,
            },
            {
                buttonEnabled: true,
                amountToPay: 20,
                amount: 100,
                usedCredit: 0,
                expectedGenericValue2: EventActionClickToPayType.Deposit,
            },
            {
                buttonEnabled: true,
                amountToPay: 100,
                amount: 100,
                usedCredit: 0,
                expectedGenericValue2: EventActionClickToPayType.Full,
            },
            {
                buttonEnabled: true,
                amountToPay: 0,
                amount: 1000,
                usedCredit: 1000,
                expectedGenericValue2: EventActionClickToPayType.FullCredit,
            },
            {
                buttonEnabled: true,
                amount: undefined,
                amountToPay: undefined,
                usedCredit: undefined,
                expectedGenericValue2: undefined,
            },
        ];

        cases.forEach(({ buttonEnabled, amount, amountToPay, usedCredit, expectedGenericValue2 }) => {
            const event = gaClickPayBalancePage(buttonEnabled, amount, amountToPay, usedCredit);
            expect(event.generic_value_2).toBe(expectedGenericValue2);
        });
    });

    it('should return correct event and generic_value_1 when buttonEnabled is not passed', () => {
        const event = gaClickPayBalancePage();
        expect(event.event_action).toBe(EVENT_ACTION_CLICK_TO_PAY);
        expect(event.generic_value_1).toBe(ButtonStateLabel.Inactive);
    });
});

describe('gaClickAmendStepButton', () => {
    it('should return correct event action and label for step "Entity"', () => {
        const result = gaClickAmendStepButton(PaymentStep.Entity);
        expect(result).toEqual({
            event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_1,
            event_label: EVENT_ACTION_AMEND_PAYMENT_TYPE.CONTINUE,
        });
    });

    it('should return correct event action and label for step "Option"', () => {
        const result = gaClickAmendStepButton(PaymentStep.Option);
        expect(result).toEqual({
            event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_2,
            event_label: EVENT_ACTION_AMEND_PAYMENT_TYPE.CONTINUE,
        });
    });

    it('should return correct event action and label for step "Confirmation"', () => {
        const result = gaClickAmendStepButton(PaymentStep.Confirmation);
        expect(result).toEqual({
            event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_3,
            event_label: EVENT_ACTION_AMEND_PAYMENT_TYPE.CONTINUE,
        });
    });

    it('should return an empty object for unknown step', () => {
        const result = gaClickAmendStepButton('UnknownStep' as PaymentStep);
        expect(result).toEqual({});
    });
});

describe('gaClickAmendStepTile', () => {
    it('should return correct event action and label for expanded "Entity" step', () => {
        const result = gaClickAmendStepTile(PaymentStep.Entity, true);
        expect(result).toEqual({
            event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_1,
            event_label: EVENT_ACTION_AMEND_PAYMENT_TYPE.EXPAND,
        });
    });

    it('should return correct event action and label for collapsed "Entity" step', () => {
        const result = gaClickAmendStepTile(PaymentStep.Entity, false);
        expect(result).toEqual({
            event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_1,
            event_label: EVENT_ACTION_AMEND_PAYMENT_TYPE.COLLAPSE,
        });
    });

    it('should return correct event action and label for expanded "Option" step', () => {
        const result = gaClickAmendStepTile(PaymentStep.Option, true);
        expect(result).toEqual({
            event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_2,
            event_label: EVENT_ACTION_AMEND_PAYMENT_TYPE.EXPAND,
        });
    });

    it('should return correct event action and label for collapsed "Option" step', () => {
        const result = gaClickAmendStepTile(PaymentStep.Option, false);
        expect(result).toEqual({
            event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_2,
            event_label: EVENT_ACTION_AMEND_PAYMENT_TYPE.COLLAPSE,
        });
    });

    it('should return correct event action and label for expanded "Confirmation" step', () => {
        const result = gaClickAmendStepTile(PaymentStep.Confirmation, true);
        expect(result).toEqual({
            event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_3,
            event_label: EVENT_ACTION_AMEND_PAYMENT_TYPE.EXPAND,
        });
    });

    it('should return correct event action and label for collapsed "Confirmation" step', () => {
        const result = gaClickAmendStepTile(PaymentStep.Confirmation, false);
        expect(result).toEqual({
            event_action: EVENT_ACTION_AMEND_PAYMENT_STEP_3,
            event_label: EVENT_ACTION_AMEND_PAYMENT_TYPE.COLLAPSE,
        });
    });

    it('should return an empty object for unknown step', () => {
        const result = gaClickAmendStepTile('UnknownStep' as PaymentStep, true);
        expect(result).toEqual({});
    });
});

describe('gaRefundAmendmentsSuccess', () => {
    it('should return correct event action and label for refund to credit amendments success', () => {
        const result = gaRefundAmendmentsSuccess(RefundPaymentMethod.Credit);
        expect(result).toEqual({
            event_action: EVENT_ACTION_REFUND_AMENDMENTS,
            event_label: RefundPaymentMethod.Credit,
        });
    });

    it('should return correct event action and label for refund to balance amendments success', () => {
        const result = gaRefundAmendmentsSuccess(RefundPaymentMethod.Balance);
        expect(result).toEqual({
            event_action: EVENT_ACTION_REFUND_AMENDMENTS,
            event_label: RefundPaymentMethod.Balance,
        });
    });

    it('should return correct event action and label for refund to original payment method amendments success', () => {
        const result = gaRefundAmendmentsSuccess(RefundPaymentMethod.Original);
        expect(result).toEqual({
            event_action: EVENT_ACTION_REFUND_AMENDMENTS,
            event_label: RefundPaymentMethod.Original,
        });
    });

    it('should return correct event action and label for refund to unknown method amendments success', () => {
        const result = gaRefundAmendmentsSuccess(RefundPaymentMethod.Unknown);
        expect(result).toEqual({
            event_action: EVENT_ACTION_REFUND_AMENDMENTS,
            event_label: RefundPaymentMethod.Unknown,
        });
    });
});

describe('gaPaymentSuccess', () => {
    const mockCurrency = 'GBP';

    it('should return correct event action and label based on the payment history input', () => {
        const mockPayments = [
            {
                amount: 100,
                paymentDate: '2024-11-19T00:00:00Z',
                isCredit: true,
                card: { code: '111', number: '4444 3333 2222 1111' },
            },
            {
                amount: 50,
                paymentDate: '2024-11-18T00:00:00Z',
                isCredit: false,
                card: { code: '112', number: '4444 3333 2222 1111' },
            },
        ];

        jest.mocked(getPaymentLabelForSuccess).mockReturnValue({
            cash: 50,
            credit: 100,
        });

        const result = gaPaymentSuccess(mockPayments, mockCurrency);

        expect(result.event_action).toBe('payment success');
        expect(getPaymentLabelForSuccess).toHaveBeenCalledWith(mockPayments);
        expect(result.event_label).toBe('paid by card & credit');
        expect(result.generic_value_1).toBe('Visa');
        expect(result.generic_value_2).toBe('GBP');
        expect(result.event_value).toBe(150);
    });

    it('should return correct event when using Apple Pay', () => {
        const mockPayments = [
            {
                amount: 100,
                paymentDate: '2024-11-19T00:00:00Z',
                isCredit: true,
                card: { code: '111', number: '4444 3333 2222 1111' },
            },
            {
                amount: 50,
                paymentDate: '2024-11-18T00:00:00Z',
                isCredit: false,
                card: { code: '112', number: '4444 3333 2222 1111' },
            },
        ];

        jest.mocked(getPaymentLabelForSuccess).mockReturnValue({
            cash: 50,
            credit: 100,
        });

        const result = gaPaymentSuccess(mockPayments, mockCurrency, undefined, true);

        expect(result.event_action).toBe('payment success');
        expect(getPaymentLabelForSuccess).toHaveBeenCalledWith(mockPayments);
        expect(result.event_label).toBe('paid by card & credit');
        expect(result.generic_value_1).toBe('Apple Pay - Visa');
        expect(result.generic_value_2).toBe('GBP');
        expect(result.event_value).toBe(150);
    });

    it('should return correct event data for payments with explicit cardType', () => {
        const mockPayments = [
            {
                amount: 100,
                paymentDate: '2024-11-19T00:00:00Z',
                isCredit: true,
                card: { code: '111', number: '4444 3333 2222 1111' },
            },
        ];

        jest.mocked(getPaymentLabelForSuccess).mockReturnValue({
            cash: 0,
            credit: 100,
        });

        const result = gaPaymentSuccess(mockPayments, mockCurrency, 'MasterCard');

        expect(result.event_action).toBe('payment success');
        expect(getPaymentLabelForSuccess).toHaveBeenCalledWith(mockPayments);
        expect(result.event_label).toBe('paid by credit');
        expect(result.generic_value_1).toBe('MasterCard');
        expect(result.generic_value_2).toBe('GBP');
        expect(result.event_value).toBe(100);
    });

    it('should return correct event data for cash-only payment', () => {
        const mockPayments = [
            {
                amount: 100,
                paymentDate: '2024-11-19T00:00:00Z',
                isCredit: false,
                card: { code: '111', number: '4444 3333 2222 1111' },
            },
        ];

        jest.mocked(getPaymentLabelForSuccess).mockReturnValue({
            cash: 100,
            credit: 0,
        });

        const result = gaPaymentSuccess(mockPayments, mockCurrency);

        expect(result.event_label).toBe('paid by card');
        expect(result.event_value).toBe(100);
    });

    it('should handle empty payment list gracefully', () => {
        jest.mocked(getPaymentLabelForSuccess).mockReturnValue({
            cash: 0,
            credit: 0,
        });

        const result = gaPaymentSuccess([], mockCurrency);

        expect(result.event_label).toBe('paid by credit');
        expect(result.event_value).toBe(0);
    });

    it('should exclude generic_value_1 if cardType cannot be inferred', () => {
        const mockPayments = [
            {
                amount: 100,
                paymentDate: '2024-11-19T00:00:00Z',
                isCredit: true,
                card: { code: '111', number: 'XXX' },
            },
        ];

        jest.mocked(getPaymentLabelForSuccess).mockReturnValue({
            cash: 0,
            credit: 100,
        });

        const result = gaPaymentSuccess(mockPayments, mockCurrency);

        expect(result.generic_value_1).toBe('InvalidType');
        expect(result.event_value).toBe(100);
    });
});

describe('gaBalancePaymentSuccess', () => {
    const mockCurrency = CurrencyCode.GBP;

    it('should return correct event action and label based on the pay details input', () => {
        const mockPayDetails = {
            amount: 150,
            creditAmount: 200,
            cardType: CardType.Visa,
        };

        const mockBookingReference = '1736485';

        jest.mocked(getPaymentLabelForBalancePaymentSuccess).mockReturnValue({
            cash: 150,
            credit: 200,
        });

        const result = gaBalancePaymentSuccess(mockPayDetails, mockCurrency, mockBookingReference);

        expect(result.event_action).toBe('payment success');
        expect(getPaymentLabelForBalancePaymentSuccess).toHaveBeenCalledWith(mockPayDetails);
        expect(result.event_label).toBe('paid by card & credit');
        expect(result.generic_value_1).toBe('Visa');
        expect(result.generic_value_2).toBe('GBP');
        expect(result.event_value).toBe(350);
        expect(result.generic_value_3).toBe('1736485');
    });

    it('should return correct event when using Apple Pay', () => {
        const mockPayDetails = {
            amount: 123,
            creditAmount: 0,
            cardType: CardType.Visa,
        };

        jest.mocked(getPaymentLabelForBalancePaymentSuccess).mockReturnValue({
            cash: 123,
            credit: 0,
        });

        const mockCurrency = CurrencyCode.GBP;
        const mockBookingReference = 'mockBookingRef123';
        const mockIsApplePay = true;

        const result = gaBalancePaymentSuccess(mockPayDetails, mockCurrency, mockBookingReference, mockIsApplePay);

        expect(result.event_action).toBe('payment success');
        expect(result.event_label).toBe('paid by card');
        expect(result.generic_value_1).toBe('Apple Pay - Visa');
        expect(result.generic_value_2).toBe('GBP');
        expect(result.event_value).toBe(123);
        expect(result.generic_value_3).toBe('mockBookingRef123');
    });

    it('should handle undefined payDetails correctly', () => {
        jest.mocked(getPaymentLabelForBalancePaymentSuccess).mockReturnValue({
            cash: 0,
            credit: 0,
        });

        const result = gaBalancePaymentSuccess(undefined);

        expect(result.event_action).toBe('payment success');
        expect(getPaymentLabelForBalancePaymentSuccess).toHaveBeenCalledWith(undefined);
        expect(result.event_label).toBe('paid by credit');
        expect(result.event_value).toBe(0);
    });

    it('should handle undefined payDetails with fallback values', () => {
        jest.mocked(getPaymentLabelForBalancePaymentSuccess).mockReturnValue({
            cash: 0,
            credit: 0,
        });

        const result = gaBalancePaymentSuccess(undefined);

        expect(result.event_action).toBe('payment success');
        expect(getPaymentLabelForBalancePaymentSuccess).toHaveBeenCalledWith(undefined);
        expect(result.event_label).toBe('paid by credit');
        expect(result.event_value).toBe(0);
    });

    it('should correctly exclude generic_value_1 when cardType is undefined', () => {
        const mockPayDetails = {
            creditAmount: 200,
        };

        jest.mocked(getPaymentLabelForBalancePaymentSuccess).mockReturnValue({
            cash: 0,
            credit: 200,
        });

        const result = gaBalancePaymentSuccess(mockPayDetails, mockCurrency);

        expect(result.generic_value_1).toBeUndefined();
        expect(result.event_value).toBe(200);
    });
});

describe('gaHolidaysUnavailable', () => {
    it('should return correct event action and label based on provided reason', () => {
        Object.values(HolidaysUnavailableReason).forEach(reason => {
            const result = gaHolidaysUnavailable(reason);
            expect(result).toEqual({
                event_action: EVENT_ACTION_HOLIDAY_UNAVAILABLE,
                event_label: reason,
            });
        });
    });
});

describe('getAmendUnavailabilityReasonFromProduct', () => {
    it('should return the correct unavailable reason based on the product type', () => {
        const testCases = [
            { input: AmendmentType.Transfer, expected: HolidaysUnavailableReason.TRANSFER },
            { input: AmendmentType.Dates, expected: HolidaysUnavailableReason.DATES },
            { input: AmendmentType.Flight, expected: HolidaysUnavailableReason.FLIGHT },
            { input: AmendmentType.RoomAndBoard, expected: HolidaysUnavailableReason.BOARD },
            { input: AmendmentType.Seats, expected: HolidaysUnavailableReason.SEATS },
            { input: null, expected: HolidaysUnavailableReason.GENERAL },
            { input: undefined, expected: HolidaysUnavailableReason.GENERAL },
        ];

        testCases.forEach(({ input, expected }) => {
            const result = getAmendUnavailabilityReasonFromProduct(input as AmendmentType);
            expect(result).toBe(expected);
        });
    });
});

describe('gaClickPayAmend', () => {
    it('should return "pay for change now" event action if PaymentOption is Full or Part', () => {
        const resultFull = gaClickPayAmend(PaymentOption.Full);
        const resultPart = gaClickPayAmend(PaymentOption.Part);

        expect(resultFull).toEqual({ event_action: EVENT_ACTION_PAY_FOR_CHANGE_NOW });
        expect(resultPart).toEqual({ event_action: EVENT_ACTION_PAY_FOR_CHANGE_NOW });
    });

    it('should return "pay for change later" event action for AddToBalance PaymentOptions', () => {
        const resultAddToBalance = gaClickPayAmend(PaymentOption.AddToBalance);

        expect(resultAddToBalance).toEqual({ event_action: EVENT_ACTION_PAY_FOR_CHANGE_LATER });
    });
});
