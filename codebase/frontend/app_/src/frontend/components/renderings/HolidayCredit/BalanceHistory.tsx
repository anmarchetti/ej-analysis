import React, { useEffect, useMemo, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { CurrencyCode } from 'code/currency';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IBalanceHistoryFields, IBalanceHistoryItem } from 'models/data/IBalanceHistory';
import SitePath from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Link from 'frontend/components/common/Link';
import { Spinner } from 'frontend/components/common/Spinner';

import { BalanceOrderStatuses } from './components/BalanceHistoryChip/BalanceHistoryChip';
import BalanceHistoryItem from './components/BalanceHistoryItem/BalanceHistoryItem';
import BalanceHistoryItemDrawer from './components/BalanceHistoryItemDrawer/BalanceHistoryItemDrawer';
import { getCreditStatus, getOriginalVoucherCode, getRedemptionBookingRef } from './utils';

import styles from './BalanceHistory.module.scss';

export interface IBalanceHistoryProps extends ISitecoreComponent<IBalanceHistoryFields> {
    activeCurrency: CurrencyCode;
}

const orderedStatusKeys = [
    BalanceOrderStatuses.ExpireSoon,
    BalanceOrderStatuses.Active,
    BalanceOrderStatuses.Expired,
    BalanceOrderStatuses.Used,
];

const BalanceHistory: React.FC<IBalanceHistoryProps> = ({ activeCurrency, fields }) => {
    const [selectedCreditItem, setSelectedCreditItem] = useState<Nullable<IBalanceHistoryItem>>(null);

    const {
        balanceHistory,
        isHistoryLoading,
        recentCreditedBooking,
        isGiftCardRedemptionEnabled,
        lastRedeemedVoucherCode,
        marketCurrency,
    } = useStore((stores: IHolidaysStores) => ({
        balanceHistory: stores.holidayCreditStore.balanceHistory,
        isHistoryLoading: stores.holidayCreditStore.isHistoryLoading,
        recentCreditedBooking: stores.holidayCreditStore.booking,
        isGiftCardRedemptionEnabled: stores.layoutStore.isGiftCardRedemptionEnabled,
        lastRedeemedVoucherCode: stores.redeemVoucherStore.lastRedeemedVoucherCode,
        marketCurrency: stores.marketStore.currency,
    }));

    const isMoreThenMobileViewport = useMoreThenMobileViewport();

    useEffect(() => {
        setSelectedCreditItem(undefined);
    }, [isMoreThenMobileViewport]);

    const bookingRef = recentCreditedBooking?.bookingReference;
    const balanceHistoryByCurrency = balanceHistory[activeCurrency];
    const isRedeemVoucherShown = isGiftCardRedemptionEnabled && activeCurrency === marketCurrency;

    const balanceHistorySorted = useMemo(() => {
        const sorted = balanceHistoryByCurrency?.length ? [...balanceHistoryByCurrency] : [];

        return sorted.sort((a, b) => {
            const statusDiff =
                orderedStatusKeys.indexOf(getCreditStatus(a, fields?.ExpireSoonWithinDays?.value)) -
                orderedStatusKeys.indexOf(getCreditStatus(b, fields?.ExpireSoonWithinDays?.value));

            if (statusDiff !== 0) return statusDiff;

            return +new Date(a.expires) - +new Date(b.expires);
        });
    }, [balanceHistoryByCurrency, fields]);

    if ((!balanceHistorySorted?.length && !isRedeemVoucherShown) || !fields) {
        return null;
    }

    const {
        Title,
        StatusColumnTitle,
        ExpiryColumnTitle,
        RemainingColumnTitle,
        CreditTypeColumnTitle,
        RedeemVoucherButtonLabel,
        Children,
    } = fields;

    const onCloseDrawer = (): void => {
        setSelectedCreditItem(null);
    };

    const onCreditItemClick = (item: IBalanceHistoryItem): void => {
        setSelectedCreditItem(item);
    };

    const defaultSitecoreCreditType = Children?.find(item => item.fields.Key.value === '')?.fields;

    const isRecent = (creditItem: IBalanceHistoryItem): boolean =>
        bookingRef === getRedemptionBookingRef(creditItem.metadata) ||
        lastRedeemedVoucherCode === getOriginalVoucherCode(creditItem.metadata);

    return (
        <div className={styles.container} data-tid='balance-history'>
            <div className={styles.titleContainer}>
                <Text field={Title} tag='h4' className={styles.title} />
                {isRedeemVoucherShown && (
                    <Link
                        href={SitePath.RedeemVoucher}
                        data-tid='balance-history-redeem-voucher-btn'
                        className={styles.linkBtn}
                    >
                        {RedeemVoucherButtonLabel.value}
                    </Link>
                )}
            </div>
            {isHistoryLoading && <Spinner />}
            {!isHistoryLoading && (
                <>
                    <div className={styles.table} data-tid='balance-history-table'>
                        <div className={styles.tableHeader}>
                            <Text field={StatusColumnTitle} tag='span' />
                            <Text field={ExpiryColumnTitle} tag='span' />
                            <Text field={CreditTypeColumnTitle} tag='span' />
                            <span />
                            <span />
                            <Text field={RemainingColumnTitle} tag='span' className={styles.remainingTitle} />
                            <span />
                        </div>
                        {balanceHistorySorted.map((creditItem, idx) => (
                            <BalanceHistoryItem
                                key={creditItem.id}
                                creditItem={creditItem}
                                isRecentCredit={isRecent(creditItem)}
                                fields={fields}
                                defaultCreditTypeContent={defaultSitecoreCreditType}
                                onItemClick={(): void => onCreditItemClick(creditItem)}
                                withoutBorderTop={idx === 0}
                            />
                        ))}
                    </div>
                    {!isMoreThenMobileViewport && selectedCreditItem && (
                        <BalanceHistoryItemDrawer
                            isDrawerExpanded={!!selectedCreditItem}
                            creditItem={selectedCreditItem}
                            onCloseDrawer={onCloseDrawer}
                            fields={fields}
                            defaultCreditTypeContent={defaultSitecoreCreditType}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default observer(BalanceHistory);
