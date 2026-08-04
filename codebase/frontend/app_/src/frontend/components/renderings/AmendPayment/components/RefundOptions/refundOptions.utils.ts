import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getTotalBookingRefund } from 'frontend/utils/viewBooking.utils';
import { IBookingRefund } from 'models/data/IBookingInfo';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export const getRefundField = (
    descriptionTemplate: string = '',
    formatMoney: (amount: number) => string,
    refundData?: IBookingRefund,
): ISitecoreField<string> => {
    if (descriptionTemplate) {
        const credit = formatMoney(refundData?.refund?.credit ?? 0);
        const cash = formatMoney(refundData?.refund?.cash ?? 0);
        const totalAmount = formatMoney(!!refundData ? getTotalBookingRefund(false, refundData) : 0);

        return {
            value: Tokenizer.replaceTokens(descriptionTemplate, {
                [Tokens.CashAmount]: `<strong data-cs-mask="true">${cash}</strong>`,
                [Tokens.CreditAmount]: `<strong data-cs-mask="true">${credit}</strong>`,
                [Tokens.Amount]: `<strong data-cs-mask="true">${totalAmount}</strong>`,
            }),
        };
    }

    return { value: '' };
};

export const getCreditField = (description: string = '', formattedPrice: string) => {
    if (description) {
        return {
            value: Tokenizer.replaceToken(
                description,
                Tokens.Amount,
                `<strong data-cs-mask="true">${formattedPrice}</strong>`,
            ),
        };
    }

    return { value: '' };
};
