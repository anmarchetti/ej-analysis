import React, { FC, useMemo } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { IPriceBreakdownItem } from 'frontend/components/common/PriceBreakdown/components/PriceBreakdownItem/PriceBreakdownItem';
import PriceBreakdown, { IPriceBreakdownBaseFields } from 'frontend/components/common/PriceBreakdown/PriceBreakdown';

import styles from './RefundBreakdown.module.scss';

export interface IRefundBreakdownFields extends IPriceBreakdownBaseFields {
    CreditRefundLabel: ISitecoreField<string>;
    OriginalMethodRefundLabel: ISitecoreField<string>;
}

export type TRefundBreakdownProps = ISitecoreComponent<IRefundBreakdownFields>;

export const RefundBreakdown: FC<TRefundBreakdownProps> = ({ fields }) => {
    const { booking, isTradePortal } = useStore(({ viewBookingStore, layoutStore }: TStores) => ({
        booking: viewBookingStore.booking,
        isTradePortal: layoutStore.isTradePortal,
    }));

    const { creditRefundAmount, cashRefundAmount } = booking?.cancelledBookingSummary || {};
    const creditRefundLabel = fields?.CreditRefundLabel.value || '';
    const originalMethodRefundLabel = fields?.OriginalMethodRefundLabel.value || '';

    const priceBreakdownItems = useMemo(() => {
        const items: IPriceBreakdownItem[] = [];

        if (creditRefundAmount && creditRefundAmount > 0) {
            items.push({
                amount: creditRefundAmount,
                breakdownTitle: creditRefundLabel,
                className: styles.itemBreakdown,
                uniqueKey: 'creditRefund',
            });
        }

        if (cashRefundAmount && cashRefundAmount > 0) {
            items.push({
                amount: cashRefundAmount,
                breakdownTitle: originalMethodRefundLabel,
                className: styles.itemBreakdown,
                uniqueKey: 'cashRefund',
            });
        }

        return items;
    }, [creditRefundLabel, originalMethodRefundLabel, creditRefundAmount, cashRefundAmount]);

    const canViewRefundBreakdown = useMemo(() => {
        const hasPermission = booking?.isLoggedInAsLeadPassenger || isTradePortal;
        const isAllowedBookingType = isTradePortal || !booking?.isExternalAgency;

        return hasPermission && isAllowedBookingType;
    }, [booking, isTradePortal]);

    if (
        !fields ||
        !booking?.cancelledBookingSummary ||
        !Object.keys(booking.cancelledBookingSummary).length ||
        !canViewRefundBreakdown
    ) {
        return null;
    }

    const { RefundAmount, PriceBreakdownTitle } = fields;
    const { currency, totalRefundAmount } = booking.cancelledBookingSummary;
    const titleClassName = priceBreakdownItems.length > 0 ? styles.title : `${styles.title} ${styles.noPadding}`;

    return (
        <PriceBreakdown
            totalPrice={totalRefundAmount}
            fields={fields}
            priceBreakdownItems={priceBreakdownItems}
            totalPriceLabelField={RefundAmount}
            priceBreakdownTitle={PriceBreakdownTitle}
            currency={currency}
            containerClassName={styles.breakdownContainer}
            titleClassName={titleClassName}
            showStickyDesignOnMobile={false}
        />
    );
};

export default observer(RefundBreakdown);
