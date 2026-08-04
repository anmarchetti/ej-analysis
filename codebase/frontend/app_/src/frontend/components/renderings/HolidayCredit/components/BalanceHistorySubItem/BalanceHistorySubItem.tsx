import { FC } from 'react';

import { CurrencyCode } from 'code/currency';
import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IBalanceHistoryFields, IMetadata, IOrder } from 'models/data/IBalanceHistory';
import BalanceHistoryDesktopSubItem from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryDesktopSubItem/BalanceHistoryDesktopSubItem';
import BalanceHistoryMobileSubItem from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryMobileSubItem/BalanceHistoryMobileSubItem';
import { META_BOOKING_REF } from 'frontend/components/renderings/HolidayCredit/constants';
import {
    getMetaDataValueByKey,
    getRedemptionOrigin,
    getSubItemLabel,
} from 'frontend/components/renderings/HolidayCredit/utils';

export type TBalanceHistorySubItemType = {
    fields: IBalanceHistoryFields;
    order: IOrder;
    balance?: number;
    creditTypeTitle?: string;
    currency?: CurrencyCode;
    metadata?: IMetadata[];
};

const BalanceHistorySubItem: FC<TBalanceHistorySubItemType> = ({
    order,
    currency,
    metadata,
    balance,
    fields,
    creditTypeTitle,
}) => {
    const getPhrase = useStore((stores: IHolidaysStores) => stores.layoutStore.getPhrase);
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    const { amount, date, status } = order;

    const holidayRef = getMetaDataValueByKey(metadata || [], META_BOOKING_REF) || '';

    const isAmountMoreThanZero = amount > 0;

    const creditLabel = getSubItemLabel(status, isAmountMoreThanZero, fields, holidayRef, creditTypeTitle);

    const redemptionOrigin = getRedemptionOrigin(metadata, getPhrase);

    const balanceAmount = balance ?? amount;

    const subItemCommonProps = {
        creditLabel,
        redemptionOrigin,
        balanceAmount,
        amount,
        date,
        currency,
        isAmountMoreThanZero,
    };

    return isMoreThenTabletViewport ? (
        <BalanceHistoryDesktopSubItem {...subItemCommonProps} />
    ) : (
        <BalanceHistoryMobileSubItem {...subItemCommonProps} fields={fields} />
    );
};

export default BalanceHistorySubItem;
