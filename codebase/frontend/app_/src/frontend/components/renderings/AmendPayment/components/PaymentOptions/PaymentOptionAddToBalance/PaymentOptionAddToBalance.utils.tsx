import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IAmendPaymentInfo } from 'models/data/IAmendBookingFlights';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

export const getTextMeta = ({
    fields,
    dueDate,
    totalPrice,
    amendmentPaymentInfo,
    balanceAmount,
    formatMoney,
}: {
    balanceAmount: number;
    dueDate: Date;
    formatMoney: (amount: number) => string;
    totalPrice: number;
    amendmentPaymentInfo?: IAmendPaymentInfo;
    fields?: IPaymentPageFields;
}): {
    description: ISitecoreField<string>;
    subdescription?: ISitecoreField<string>;
    title?: string;
} => {
    const includesFee = amendmentPaymentInfo?.totalFeesAmount && amendmentPaymentInfo.totalFeesAmount > 0;
    const totalBalance = formatMoney((totalPrice ?? 0) + balanceAmount - (amendmentPaymentInfo?.totalFeesAmount ?? 0));
    const description = balanceAmount
        ? fields?.OutstandingPaymentOptionDescriptionExtraPrice?.value
        : fields?.AddAmendToBalanceDescription?.value;

    const subdescription = includesFee
        ? Tokenizer.replaceToken(
              fields?.ChangeFeeDescription?.value,
              Tokens.Amount,
              `<strong data-cs-mask="true">${formatMoney(amendmentPaymentInfo?.totalFeesAmount ?? 0)}</strong>`,
          )
        : '';

    const textDescription = description
        ? Tokenizer.replaceTokens(description, {
              [Tokens.Amount]: `<strong data-cs-mask="true">${formatMoney(
                  includesFee ? amendmentPaymentInfo?.amendmentChargesWithoutFees : totalPrice ?? 0,
              )}</strong>`,
              [Tokens.Date]: `<strong>${formatDateL10n(dueDate, DATE_FORMATS.L)}</strong>`,
              [Tokens.Price]: `<strong data-cs-mask="true">${totalBalance}</strong>`,
          }) ?? ''
        : '';

    return {
        title: fields?.AddAmendToBalanceTitle?.value,
        description: { value: textDescription },
        subdescription: { value: subdescription },
    };
};
