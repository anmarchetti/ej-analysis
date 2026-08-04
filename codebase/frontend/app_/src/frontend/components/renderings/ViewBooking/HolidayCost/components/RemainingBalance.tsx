import React, { FC } from 'react';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { canPayRemainingBalance, formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import styles from 'frontend/components/renderings/ViewBooking/HolidayCost/HolidayCost.module.scss';

interface IRemainingBalanceProps {
    allowPayBalanceDueDate: string;
    balanceDueAmount: number;
    balanceDueDate: string;
    currency: CurrencyCode | undefined;
    departureDate: string;
    payBalance?: () => void;
    subtitleClassName?: string;
}

export const RemainingBalance: FC<IRemainingBalanceProps> = ({
    allowPayBalanceDueDate,
    balanceDueDate,
    balanceDueAmount,
    currency,
    payBalance,
    subtitleClassName,
}) => {
    const { getPhrase, formatMoney } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
    }));
    const canPay = canPayRemainingBalance(allowPayBalanceDueDate);

    return (
        <div className={styles.remainingBalance} data-tid='view-booking-cost-remaining-balance'>
            <div className={styles.details} data-tid='remaining-balance'>
                <h3 className={classNames(styles.subtitle, subtitleClassName)} data-tid='remaining-balance-subtitle'>
                    {getPhrase(SitecoreDictionary.BookingPaymentLabelsPayRemainingBalance)}
                </h3>
                <div className={styles.tableRow}>
                    <span data-tid='payment-due-label'>
                        {Tokenizer.replaceToken(
                            getPhrase(SitecoreDictionary.BookingPaymentLabelsRemainingBalanceDueDate),
                            Tokens.Date,
                            formatDateL10n(balanceDueDate, DATE_FORMATS.L),
                        )}
                    </span>
                    <span className={styles.paymentDueAmount} data-tid='payment-due-amount' data-cs-mask>
                        {formatMoney(balanceDueAmount, { currency })}
                    </span>
                </div>
            </div>
            {canPay && (
                <Button
                    isSmall
                    className={classNames(styles.payButton, 'no-print')}
                    dataTid='pay-remaining-btn'
                    onClick={payBalance}
                >
                    <span>{getPhrase(SitecoreDictionary.BookingPaymentButtonsPayRemainingBalance)}</span>
                </Button>
            )}
        </div>
    );
};

export default RemainingBalance;
