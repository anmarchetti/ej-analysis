import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PaymentBaseOption from 'frontend/components/common/PriceOptions/PaymentBaseOption/PaymentBaseOption';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import { getTextMeta } from './PaymentOptionAddToBalance.utils';

import styles from './PaymentOptionAddToBalance.module.scss';

export interface IPaymentOptionAddToBalanceProps {
    isSelected: boolean;
    onChange: () => void;
    fields?: IPaymentPageFields;
}

const PaymentOptionAddToBalance: FC<IPaymentOptionAddToBalanceProps> = ({ isSelected, onChange, fields }) => {
    const { addToBalanceDueDate, totalPrice, balanceAmount, currency, formatMoney, getPhrase, amendmentPaymentInfo } =
        useStore((stores: IHolidaysStores) => ({
            addToBalanceDueDate: stores.amendPaymentStore.addToBalanceDueDate,
            balanceAmount: stores.amendPaymentStore.balanceAmount,
            totalPrice: stores.amendPaymentStore.totalPrice,
            currency: stores.amendPaymentStore.currency,
            formatMoney: stores.marketStore.formatMoney,
            getPhrase: stores.layoutStore.getPhrase,
            amendmentPaymentInfo: stores.amendPaymentStore.amendmentPaymentInfo,
        }));

    const {
        title = '',
        description,
        subdescription,
    } = getTextMeta({
        fields,
        amendmentPaymentInfo,
        dueDate: addToBalanceDueDate,
        balanceAmount,
        totalPrice,
        formatMoney: amount => formatMoney(amount, { currency }),
    });

    return (
        <PaymentBaseOption
            checkboxId='add-to-balance-option'
            isSelected={isSelected}
            onChange={onChange}
            title={title}
            price={totalPrice}
            priceDescription={getPhrase(SitecoreDictionary.CreditConfirmRefundCardsTotal)}
            currency={currency}
        >
            {!!description && (
                <RichTextWithLinks
                    dataId='add-to-balance-option-description'
                    field={description}
                    className='credit-description'
                />
            )}
            {!!subdescription && (
                <RichTextWithLinks
                    dataId='add-to-balance-option-fee-description'
                    field={subdescription}
                    className={styles.feeDescription}
                />
            )}
        </PaymentBaseOption>
    );
};

export default observer(PaymentOptionAddToBalance);
