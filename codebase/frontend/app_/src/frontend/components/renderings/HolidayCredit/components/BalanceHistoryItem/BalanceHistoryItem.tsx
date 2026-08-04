import React, { FC, useEffect, useState } from 'react';

import { useMoreThenMobileViewport, useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IBalanceHistoryFields, IBalanceHistoryItem, TCreditTypeItem } from 'models/data/IBalanceHistory';
import { BalanceOrderStatuses } from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryChip/BalanceHistoryChip';
import BalanceHistoryDesktopItem from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryDesktopItem/BalanceHistoryDesktopItem';
import BalanceHistoryMobileItem from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryMobileItem/BalanceHistoryMobileItem';
import { META_REASON } from 'frontend/components/renderings/HolidayCredit/constants';
import {
    getCreditStatus,
    getHistoryItemCurrency,
    getMetaDataValueByKey,
    getRedemptionOrigin,
} from 'frontend/components/renderings/HolidayCredit/utils';

export type TBalanceHistoryItemProps = {
    creditItem: IBalanceHistoryItem;
    fields: IBalanceHistoryFields;
    defaultCreditTypeContent?: TCreditTypeItem;
    isDrawerExpanded?: boolean;
    isInsideDrawer?: boolean;
    isRecentCredit?: boolean;
    onItemClick?: () => void;
    withoutBorderTop?: boolean;
};

const BalanceHistoryItem: FC<TBalanceHistoryItemProps> = ({
    creditItem,
    isDrawerExpanded,
    isInsideDrawer,
    isRecentCredit,
    onItemClick,
    fields,
    defaultCreditTypeContent,
    withoutBorderTop,
}) => {
    const getPhrase = useStore((stores: IHolidaysStores) => stores.layoutStore.getPhrase);
    const [isItemExpanded, setIsItemExpanded] = useState(false);
    const isMoreThenMobileViewport = useMoreThenMobileViewport();
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    useEffect(() => {
        setIsItemExpanded(false);
    }, [isMoreThenMobileViewport]);

    const status = getCreditStatus(creditItem, fields?.ExpireSoonWithinDays?.value);
    const currency = getHistoryItemCurrency(creditItem);
    const isDisabled = status === BalanceOrderStatuses.Expired || status === BalanceOrderStatuses.Used;

    const handleExpand = (): void => {
        isMoreThenMobileViewport ? setIsItemExpanded(!isItemExpanded) : onItemClick?.();
    };

    const { Children } = fields;

    const creditTypeSitecoreContent =
        Children?.find(item => item.fields.Key.value === getMetaDataValueByKey(creditItem.metadata, META_REASON))
            ?.fields || defaultCreditTypeContent;

    const { LogoImage, Title } = creditTypeSitecoreContent || {};
    const creditTypeTitle = Title?.value || '';

    const description = getRedemptionOrigin(creditItem.metadata, getPhrase);

    const balanceHistoryItemCommonProps = {
        isDisabled,
        LogoImage,
        creditTypeTitle,
        description,
        currency,
        handleExpand,
        isItemExpanded,
        isRecentCredit,
        creditItem,
        fields,
        status,
    };

    return isMoreThenTabletViewport ? (
        <BalanceHistoryDesktopItem {...balanceHistoryItemCommonProps} />
    ) : (
        <BalanceHistoryMobileItem
            {...balanceHistoryItemCommonProps}
            isDrawerExpanded={!!isDrawerExpanded}
            isInsideDrawer={isInsideDrawer}
            withoutBorderTop={withoutBorderTop}
        />
    );
};

export default BalanceHistoryItem;
