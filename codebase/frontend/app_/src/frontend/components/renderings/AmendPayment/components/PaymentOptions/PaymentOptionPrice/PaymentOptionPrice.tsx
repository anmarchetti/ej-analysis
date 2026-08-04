import React, { FC } from 'react';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';

import styles from './paymentOptionPrice.module.scss';

export interface IPaymentOptionPriceProps {
    description: string;
    currency?: CurrencyCode;
    isTotal?: boolean;
    price?: number;
}

const PaymentOptionPrice: FC<IPaymentOptionPriceProps> = ({ description, price = 0, isTotal, currency }) => {
    const { formatMoney } = useStore((stores: IHolidaysStores) => ({
        formatMoney: stores.marketStore.formatMoney,
    }));

    return (
        <div
            className={classNames(styles.description, {
                [styles.total]: isTotal,
            })}
            data-tid='amend-payment-option'
        >
            <span className={styles.label} data-tid='amend-payment-option-label'>
                {description}
            </span>
            <span className={styles.separator} />
            <span className={styles.price} data-tid='amend-payment-option-price' data-cs-mask>
                {formatMoney(price, { currency })}
            </span>
        </div>
    );
};

export default PaymentOptionPrice;
