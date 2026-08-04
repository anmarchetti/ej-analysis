import React, { FC } from 'react';

import { CurrencyCode } from 'code/currency';

import CountdownPill from './components/CountdownPill/CountdownPill';
import RemainingBalancePill from './components/RemainingBalancePill/RemainingBalancePill';

import styles from './PillsBlock.module.scss';

export interface IPillsBlockProps {
    currency: CurrencyCode | undefined;
    departureDate: Nullable<string>;
    dueDate: string;
    remainingBalance: number;
    children?: any;
    isExternalAgency?: boolean;
}

const PillsBlock: FC<IPillsBlockProps> = ({
    departureDate,
    remainingBalance,
    dueDate,
    children,
    isExternalAgency,
    currency,
}: IPillsBlockProps) => (
    <div className={styles.pillsBlock}>
        <div className={styles.pillsWrapper}>
            {departureDate && <CountdownPill departureDate={departureDate} className={styles.pill} />}
            {!isExternalAgency && remainingBalance > 0 && (
                <RemainingBalancePill
                    value={remainingBalance}
                    dueDate={dueDate}
                    currency={currency}
                    className={styles.pill}
                />
            )}
        </div>
        {children}
    </div>
);

export default PillsBlock;
