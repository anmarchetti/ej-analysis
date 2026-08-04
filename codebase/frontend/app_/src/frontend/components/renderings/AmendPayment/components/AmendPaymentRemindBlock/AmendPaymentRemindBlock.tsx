import React from 'react';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import {
    getRefundRemindTextMeta,
    getRemindTextMeta,
} from 'frontend/components/renderings/AmendPayment/components/AmendPaymentMetaBlock/AmendPaymentMetaBlock.utils';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import styles from './amendPaymentRemind.module.scss';

interface IAmendPaymentRemindBlockProps {
    fields?: IPaymentPageFields;
    moreThenBlockDays?: boolean;
}

function AmendPaymentRemindBlock({ fields, moreThenBlockDays }: IAmendPaymentRemindBlockProps) {
    const { isOnlyCreditRefund, totalPrice, isRefund, addToBalanceDueDate, balanceAmount, currency, formatMoney } =
        useStore((stores: IHolidaysStores) => ({
            totalPrice: stores.amendPaymentStore.totalPrice,
            isOnlyCreditRefund: stores.amendPaymentStore.isOnlyCreditRefund,
            isRefund: stores.amendPaymentStore.isRefund,
            balanceAmount: stores.amendPaymentStore.balanceAmount,
            addToBalanceDueDate: stores.amendPaymentStore.addToBalanceDueDate,
            currency: stores.amendPaymentStore.currency,
            formatMoney: stores.marketStore.formatMoney,
        }));

    if (!fields) return null;

    let remindData = { title: '', description: '' };

    const isShowForLessBlockDays = !moreThenBlockDays && isOnlyCreditRefund;
    const isShowForMoreBlockDays = moreThenBlockDays && balanceAmount > 0 && totalPrice <= 0;
    const isShowForMoreBlockDaysWithRefundToCredits =
        moreThenBlockDays && balanceAmount === 0 && isRefund && isOnlyCreditRefund;

    if (isShowForLessBlockDays || isShowForMoreBlockDays || isShowForMoreBlockDaysWithRefundToCredits) {
        remindData = isRefund
            ? getRefundRemindTextMeta(
                  fields,
                  isOnlyCreditRefund,
                  formatMoney(Math.abs(totalPrice), {
                      currency,
                      trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                  }),
              )
            : getRemindTextMeta(fields, totalPrice, addToBalanceDueDate);
    }

    if (!remindData.title) return null;

    return (
        <div className={styles.credits} data-tid='amend-payment-remind'>
            <h2 className={styles['remind-header']} data-tid='amend-payment-remind-title'>
                {remindData.title}
            </h2>
            <RichTextWithLinks
                field={{ value: remindData.description }}
                className={styles.description}
                dataId='amend-payment-remind-description'
            />
        </div>
    );
}

export default observer(AmendPaymentRemindBlock);
