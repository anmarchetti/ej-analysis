import React, { FC } from 'react';

import { TrailingZeroDisplay } from 'code/currency';
import FormattedMoney from 'frontend/components/common/FormattedMoney/FormattedMoney';

import { IAmountToPayProps } from './interfaces';

import styles from './PayBlock.module.scss';

const AmountToPay: FC<IAmountToPayProps> = ({ amount, currency }) => {
    if (amount === undefined || currency === undefined) return null;

    return (
        <span className={styles.totalPriceAmount} data-tid='total-payable-amount' data-cs-mask>
            <FormattedMoney
                amount={amount}
                options={{ currency, trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger }}
            />
        </span>
    );
};

export default AmountToPay;
