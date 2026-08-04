import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { PaymentOption } from 'frontend/store/base/amend/BaseAmendPaymentStore';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { PaymentScenario } from 'models/enum/amend/PaymentScenario';
import { IPaymentDetailsProps } from 'frontend/components/renderings/AmendPayment/components/AmendPaymentMetaBlock/interfaces';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

export const getRefundRemindTextMeta = (
    fields: IPaymentPageFields,
    isOnlyCreditRefund: boolean,
    formattedTotalPrice: string,
): {
    description: string;
    title: string;
} => {
    if (isOnlyCreditRefund) {
        return {
            title: fields.AmendRefundCreditsOnlyTitleReminder?.value,
            description: Tokenizer.replaceTokens(fields.AmendRefundCreditsOnlyDescriptionReminder.value, {
                [Tokens.Amount]: `<strong>${formattedTotalPrice}</strong>`,
            }),
        };
    }

    return {
        title: fields.AmendTitleReminder?.value,
        description: fields.AmendRefundDescriptionReminder?.value,
    };
};

export const getRemindTextMeta = (
    fields: IPaymentPageFields,
    totalPrice: number,
    dueDate: Date,
): {
    description: string;
    title: string;
} => {
    if (totalPrice === 0) {
        return {
            title: fields.AmendTitleReminder?.value,
            description: Tokenizer.replaceTokens(fields.AmendZeroPriceDescriptionReminder?.value, {
                [Tokens.Date]: `<strong>${formatDateL10n(dueDate, DATE_FORMATS.L)}</strong>`,
            }),
        };
    }

    return { title: '', description: '' };
};

export const getPaymentScenario = ({
    hasBalance,
    totalPrice,
    paymentMethod,
    includesFee,
}: {
    hasBalance: boolean;
    includesFee: boolean;
    paymentMethod: PaymentOption;
    totalPrice: number;
}): PaymentScenario => {
    const isPayingNow = paymentMethod !== PaymentOption.AddToBalance;

    if (totalPrice < 0) {
        return hasBalance ? PaymentScenario.BalanceOutstandingRefundToBalance : PaymentScenario.BalancePaidRefund;
    }

    if (totalPrice === 0) {
        return hasBalance ? PaymentScenario.BalanceOutstandingNoPriceChange : PaymentScenario.BalancePaidNoPriceChange;
    }

    if (isPayingNow) {
        return hasBalance ? PaymentScenario.BalanceOutstandingPayNow : PaymentScenario.BalancePaidPayNow;
    }

    if (includesFee) {
        return hasBalance
            ? PaymentScenario.BalanceOutstandingPayingOnlyFeeNow
            : PaymentScenario.BalancePaidPayingOnlyFeeNow;
    }

    return hasBalance ? PaymentScenario.BalanceOutstandingPayLater : PaymentScenario.BalancePaidPayLater;
};

export const getPaymentSummaryMeta = ({
    newBalanceAmount,
    totalPrice,
    hasBalance,
    fields,
    usedCredit,
    amountToPay,
    paymentOption,
    totalFeesAmount,
}: {
    amountToPay: number;
    fields: IPaymentPageFields | undefined;
    hasBalance: boolean;
    paymentOption: PaymentOption;
    totalPrice: number;
    usedCredit: number;
    newBalanceAmount?: number;
    totalFeesAmount?: number;
}): IPaymentDetailsProps => {
    const includesFee = !!totalFeesAmount;

    const scenario = getPaymentScenario({ hasBalance, totalPrice, paymentMethod: paymentOption, includesFee });

    const priceToPay = usedCredit ? amountToPay : totalPrice;
    const isFullCreditPayment = !!usedCredit && !amountToPay;

    let result;

    switch (scenario) {
        case PaymentScenario.BalancePaidPayNow:
            result = {
                title: fields?.TotalCost?.value,
                confirmCTA: fields?.ConfirmButtonLabel?.value,
                price: priceToPay,
                shouldPayNow: true,
            };
            break;

        case PaymentScenario.BalancePaidPayLater:
            result = {
                title: fields?.AddToAmendBalanceTotalLabel?.value,
                subtitle: fields?.NewBalanceWarning,
                confirmCTA: fields?.Confirm?.value,
                price: priceToPay,
                shouldPayNow: false,
            };
            break;

        case PaymentScenario.BalancePaidPayingOnlyFeeNow:
            result = {
                title: fields?.TotalCost?.value,
                subtitle: fields?.NewBalanceWarning,
                confirmCTA: fields?.ConfirmButtonLabel?.value,
                price: amountToPay ?? 0,
                shouldPayNow: true,
            };
            break;

        case PaymentScenario.BalanceOutstandingPayNow:
            result = {
                title: fields?.TotalCost?.value,
                subtitle: fields?.RemainingBalanceWarning,
                confirmCTA: fields?.ConfirmButtonLabel?.value,
                price: priceToPay,
                shouldPayNow: true,
            };
            break;

        case PaymentScenario.BalanceOutstandingPayLater:
            result = {
                title: fields?.AddToAmendBalanceTotalLabel?.value,
                subtitle: fields?.UpdatedBalanceWarning,
                confirmCTA: fields?.Confirm?.value,
                price: newBalanceAmount,
                shouldPayNow: false,
            };
            break;

        case PaymentScenario.BalanceOutstandingPayingOnlyFeeNow:
            result = {
                title: fields?.TotalCost?.value,
                subtitle: fields?.UpdatedBalanceWarning,
                confirmCTA: fields?.ConfirmButtonLabel?.value,
                price: amountToPay ?? 0,
                shouldPayNow: true,
            };
            break;

        case PaymentScenario.BalancePaidRefund:
            result = {
                title: fields?.ConfirmRefundTitle?.value,
                confirmCTA: fields?.ConfirmRefund?.value,
                price: Math.abs(totalPrice),
            };
            break;

        case PaymentScenario.BalanceOutstandingRefundToBalance:
            result = {
                title: fields?.ConfirmRefundTitle?.value,
                subtitle: fields?.UpdatedBalanceWarning,
                confirmCTA: fields?.ConfirmRefund?.value,
                price: Math.abs(totalPrice),
            };
            break;

        case PaymentScenario.BalanceOutstandingNoPriceChange:
            result = {
                title: fields?.ConfirmChangesLabel?.value,
                confirmCTA: fields?.ConfirmNoPriceChange?.value,
                subtitle: fields?.RemainingBalanceWarning,
            };
            break;

        case PaymentScenario.BalancePaidNoPriceChange:
            result = {
                title: fields?.ConfirmChangesLabel?.value,
                confirmCTA: fields?.ConfirmNoPriceChange?.value,
            };
            break;

        default:
            result = {};
            break;
    }

    if (isFullCreditPayment) {
        result.isFullCreditPayment = isFullCreditPayment;
        result.confirmCTA = fields?.ConfirmChangesLabel?.value;
    }

    return result;
};
