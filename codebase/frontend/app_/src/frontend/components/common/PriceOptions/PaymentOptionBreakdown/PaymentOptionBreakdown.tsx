import React, { FC } from 'react';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';

import styles from './PaymentOptionBreakdown.module.scss';

export interface IRefundBreakdownProps {
    label: string;
    className?: string;
    currency?: CurrencyCode;
    dataTid?: string;
    value?: number;
}

const PaymentOptionBreakdown: FC<IRefundBreakdownProps> = ({ value = 0, label, className, dataTid, currency }) => {
    const { formatMoney } = useStore((stores: IHolidaysStores) => ({
        formatMoney: stores.marketStore.formatMoney,
    }));

    const currentLabel = label
        .split(' ')
        .reduce((acc, word) => [...acc, `<span>${word}</span>`], [])
        .join(' ');

    return (
        <div data-tid={dataTid} className={classNames(styles.container, className)}>
            <div
                data-tid={`${dataTid}-label`}
                className={styles.label}
                dangerouslySetInnerHTML={{ __html: currentLabel }}
            />
            <div data-tid={`${dataTid}-price`} className={styles.price}>
                {formatMoney(value, { currency })}
            </div>
        </div>
    );
};

export default PaymentOptionBreakdown;
