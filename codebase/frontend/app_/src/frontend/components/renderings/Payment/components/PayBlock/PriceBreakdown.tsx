import React, { FC } from 'react';

import { TrailingZeroDisplay } from 'code/currency';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IPriceBreakdownProps } from './interfaces';

import styles from './PayBlock.module.scss';

const PriceBreakdown: FC<IPriceBreakdownProps> = ({
    amount,
    usedCredit,
    currency,
    formatMoney,
    getPhrase,
    amountLabel,
}) => {
    const showPriceBreakdown = !!usedCredit && usedCredit > 0;

    if (!showPriceBreakdown || !currency || !getPhrase) return null;

    return (
        <>
            {amount !== undefined && amount > 0 && (
                <div className={styles.contentItem}>
                    <span className={styles.description}>{amountLabel ?? 'Holiday'}</span>
                    <span className={styles.price} data-cs-mask>
                        {formatMoney(amount, {
                            currency,
                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        })}
                    </span>
                </div>
            )}
            <div className={styles.contentItem}>
                <span className={styles.description}>{getPhrase(SitecoreDictionary.PaymentLabelsHolidayCredit)}</span>
                <span className={styles.priceDiscount} data-cs-mask>
                    -{' '}
                    {formatMoney(usedCredit, {
                        currency,
                        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                    })}
                </span>
            </div>
        </>
    );
};

export default PriceBreakdown;
