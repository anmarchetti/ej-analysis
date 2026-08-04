import React from 'react';
import { observer } from 'mobx-react';

import { ICurrencyFormatOptions } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

interface IPaymentDescriptionProps {
    fields: IPaymentPageFields | undefined;
}

const PaymentDescription = (props: IPaymentDescriptionProps) => {
    const { fields } = props;

    const {
        totalPrice,
        balanceAmount,
        amountTakenFromBalance,
        isRefund,
        isCreditRefund,
        refundData,
        hasBalance,
        isFlightSelected,
        isTransferSelected,
        currency,
        formatMoney,
    } = useStore((stores: IHolidaysStores) => ({
        balanceAmount: stores.amendPaymentStore.balanceAmount,
        totalPrice: stores.amendPaymentStore.totalPrice,
        amountTakenFromBalance: stores.amendPaymentStore.amountTakenFromBalance,
        isRefund: stores.amendPaymentStore.isRefund,
        isCreditRefund: stores.amendPaymentStore.isCreditRefund,
        refundData: stores.amendPaymentStore.refundData,
        hasBalance: stores.amendPaymentStore.hasBalance,
        isFlightSelected: !!stores.amendFlightsStore.selectedFlight,
        isTransferSelected: !!stores.amendTransfersStore.selectedTransfer,
        currency: stores.amendPaymentStore.currency,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const remainingBalance = balanceAmount - Math.abs(totalPrice);

    let description = '';

    if (isFlightSelected) {
        description = fields?.TakeFromBalanceForFlightDescription?.value ?? '';
    }

    if (isTransferSelected) {
        description = fields?.TakeFromBalanceForTransferDescription?.value ?? '';
    }

    if (remainingBalance <= 0) {
        description += ' ' + fields?.BalanceWillBePaidDescription?.value ?? '';
    }

    if (remainingBalance < 0) {
        if (!isCreditRefund) {
            description += ' ' + fields?.EligibleForOMOPRefundDescription?.value ?? '';
        }

        description += ' ' + fields?.EligibleForCreditRefundDescription?.value ?? '';
    }

    if (description) {
        const currencyOptions: ICurrencyFormatOptions = {
            currency,
        };
        const amount = formatMoney(amountTakenFromBalance ?? 0, currencyOptions);
        const totalBalanceAmount = formatMoney(balanceAmount ?? 0, currencyOptions);
        const remainingBalanceAmount = formatMoney(remainingBalance ?? 0, currencyOptions);

        let creditRefundAmount = '';
        let omopRefundAmount = '';

        if (isCreditRefund) {
            creditRefundAmount = formatMoney(refundData?.credit?.credit ?? 0, currencyOptions);
        } else {
            creditRefundAmount = formatMoney(refundData?.refund?.credit ?? 0, currencyOptions);
            omopRefundAmount = formatMoney(refundData?.refund?.cash ?? 0, currencyOptions);
        }

        description = Tokenizer.replaceTokens(description, {
            [Tokens.Amount]: `<strong>${amount}</strong>`,
            [Tokens.RemainingAmount]: `<strong>${remainingBalanceAmount}</strong>`,
            [Tokens.BalanceAmount]: `<strong>${totalBalanceAmount}</strong>`,
            [Tokens.CreditAmount]: `<strong>${creditRefundAmount}</strong>`,
            [Tokens.CashAmount]: `<strong>${omopRefundAmount}</strong>`,
        });
    }

    if (!(isRefund && hasBalance)) {
        return null;
    }

    return <RichTextWithLinks field={{ value: description }} />;
};

export default observer(PaymentDescription);
