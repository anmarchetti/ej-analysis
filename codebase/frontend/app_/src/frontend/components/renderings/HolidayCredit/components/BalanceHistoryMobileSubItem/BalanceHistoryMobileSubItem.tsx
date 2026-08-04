import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IBalanceHistoryFields } from 'models/data/IBalanceHistory';
import FormattedMoney, { MIN_FRACTION_DIGITS } from 'frontend/components/common/FormattedMoney/FormattedMoney';
import CreditItemInfo from 'frontend/components/renderings/HolidayCredit/components/CreditItemInfo/CreditItemInfo';

import styles from './BalanceHistoryMobileSubItem.module.scss';

export type TBalanceHistoryMobileSubItemProps = {
    amount: number;
    balanceAmount: number;
    creditLabel: string;
    currency: CurrencyCode | undefined;
    date: string;
    fields: IBalanceHistoryFields;
    isAmountMoreThanZero: boolean;
    redemptionOrigin: string;
};

const BalanceHistoryMobileSubItem: FC<TBalanceHistoryMobileSubItemProps> = ({
    creditLabel,
    redemptionOrigin,
    balanceAmount,
    amount,
    isAmountMoreThanZero,
    date,
    currency,
    fields,
}) => {
    const isMoreThenMobileViewport = useMoreThenMobileViewport();

    return (
        <div className={styles.subItem} data-tid='balance-history-mobile-subitem'>
            <CreditItemInfo
                showLogo={false}
                creditTypeName={creditLabel}
                description={redemptionOrigin}
                dataTid='balance-history-mobile-subitem'
            />
            <div className={styles.balanceContainer}>
                <div className={styles.balance} data-tid='balance-history-mobile-subitem-total-amount'>
                    <div>
                        <FormattedMoney
                            amount={Math.abs(balanceAmount)}
                            options={{ currency, minimumFractionDigits: MIN_FRACTION_DIGITS }}
                        />
                    </div>
                    <Text field={fields.RemainingAmountLabel} component='span' />
                </div>
                <div className={styles.transferPrice} data-tid='balance-history-mobile-subitem-transaction-amount'>
                    {amount ? (
                        <>
                            <div className={isAmountMoreThanZero ? styles.refund : styles.purchase}>
                                {isAmountMoreThanZero ? '+' : '-'}
                                <FormattedMoney
                                    amount={Math.abs(amount)}
                                    options={{ currency, minimumFractionDigits: MIN_FRACTION_DIGITS }}
                                />
                            </div>
                            <div className={styles.date} data-tid='balance-history-mobile-subitem-date'>
                                {isMoreThenMobileViewport && (
                                    <Text field={fields.BalanceChangeOnLabel} component='span' />
                                )}{' '}
                                {formatDateL10n(date, DATE_FORMATS.dateWithAbbrMonthName)}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default BalanceHistoryMobileSubItem;
