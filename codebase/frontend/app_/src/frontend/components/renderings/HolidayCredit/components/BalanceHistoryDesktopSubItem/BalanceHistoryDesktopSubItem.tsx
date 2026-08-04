import React, { FC } from 'react';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import FormattedMoney, { MIN_FRACTION_DIGITS } from 'frontend/components/common/FormattedMoney/FormattedMoney';
import CreditItemInfo from 'frontend/components/renderings/HolidayCredit/components/CreditItemInfo/CreditItemInfo';
import { dataTid } from 'frontend/components/renderings/PriceChanged/PriceChanged';

import styles from './BalanceHistoryDesktopSubItem.module.scss';

export type TBalanceHistoryDesktopSubItemProps = {
    amount: number;
    balanceAmount: number;
    creditLabel: string;
    currency: CurrencyCode | undefined;
    date: string;
    isAmountMoreThanZero: boolean;
    redemptionOrigin: string;
};

const BalanceHistoryDesktopSubItem: FC<TBalanceHistoryDesktopSubItemProps> = ({
    creditLabel,
    redemptionOrigin,
    balanceAmount,
    amount,
    date,
    currency,
    isAmountMoreThanZero,
}) => (
    <div className={styles.subItemWrapper} data-tid='balance-history-subitem'>
        <div />
        <div className={styles.subItem}>
            <div />
            <CreditItemInfo
                showLogo={false}
                creditTypeName={creditLabel}
                description={redemptionOrigin}
                dataTid='balance-history-subitem'
            />

            <div className={classNames(styles.date)} data-tid={`${dataTid}-date`}>
                {formatDateL10n(date, DATE_FORMATS.dateWithAbbrMonthName)}
            </div>
            <div
                className={classNames(styles.transferPrice, isAmountMoreThanZero ? styles.refund : styles.purchase)}
                data-tid={`${dataTid}-transaction-amount`}
            >
                {amount ? (
                    <>
                        {isAmountMoreThanZero ? '+' : '-'}
                        <FormattedMoney
                            amount={Math.abs(amount)}
                            options={{ currency, minimumFractionDigits: MIN_FRACTION_DIGITS }}
                        />
                    </>
                ) : null}
            </div>
            <div className={styles.balance} data-tid='balance-history-subitem-total-amount'>
                <FormattedMoney
                    amount={Math.abs(balanceAmount)}
                    options={{ currency, minimumFractionDigits: MIN_FRACTION_DIGITS }}
                />
            </div>

            <div />
        </div>
    </div>
);

export default BalanceHistoryDesktopSubItem;
