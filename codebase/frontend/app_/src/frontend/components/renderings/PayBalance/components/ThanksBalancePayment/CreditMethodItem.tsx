import React from 'react';
import classNames from 'classnames';

import { TrailingZeroDisplay } from 'code/currency';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ICreditMethodItemProps } from './interfaces';

import styles from './ThanksBalancePayment.module.scss';

export const CreditMethodItem: React.FC<ICreditMethodItemProps> = ({
    creditAmount,
    showSplitAmount,
    currency,
    formatMoney,
    getPhrase,
}) => (
    <div className={classNames(styles.listItem)}>
        <span>{getPhrase(SitecoreDictionary.BookingPaymentLabelsPaymentMethod)}</span>
        <div className={styles.paymentMethodWrapper}>
            <span className={styles.greyText}>{getPhrase(SitecoreDictionary.BookingPaymentLabelsCreditOption)}</span>
            {showSplitAmount && (
                <span className={styles.price}>
                    {formatMoney(creditAmount ?? 0, {
                        currency,
                        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                    })}
                </span>
            )}
        </div>
    </div>
);
