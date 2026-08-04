import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IBalanceHistoryFields, IBalanceHistoryItem, TCreditTypeItem } from 'models/data/IBalanceHistory';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import BalanceHistoryItem from 'frontend/components/renderings/HolidayCredit/components/BalanceHistoryItem/BalanceHistoryItem';
import { getRedemptionOrigin } from 'frontend/components/renderings/HolidayCredit/utils';

import styles from './BalanceHistoryItemDrawer.module.scss';

export type TBalanceHistoryItemDrawerProps = {
    creditItem: IBalanceHistoryItem;
    fields: IBalanceHistoryFields;
    isDrawerExpanded: boolean;
    onCloseDrawer: () => void;
    defaultCreditTypeContent?: TCreditTypeItem;
};

const BalanceHistoryItemDrawer: FC<TBalanceHistoryItemDrawerProps> = ({
    creditItem,
    fields,
    isDrawerExpanded,
    onCloseDrawer,
    defaultCreditTypeContent,
}) => {
    const getPhrase = useStore((stores: IHolidaysStores) => stores.layoutStore.getPhrase);
    const redemptionOrigin = getRedemptionOrigin(creditItem.metadata, getPhrase);
    const description =
        defaultCreditTypeContent?.Title.value && redemptionOrigin
            ? `${defaultCreditTypeContent.Title.value} - ${redemptionOrigin}`
            : redemptionOrigin || '';

    return (
        <Drawer open={isDrawerExpanded} className={styles.drawer} dataTid='balance-history-drawer'>
            <Text field={fields.Title} tag='h2' className={styles.title} />
            <p className={styles.description}>{description}</p>
            <div className={styles.table}>
                <BalanceHistoryItem
                    creditItem={creditItem}
                    fields={fields}
                    isDrawerExpanded={isDrawerExpanded}
                    defaultCreditTypeContent={defaultCreditTypeContent}
                    isInsideDrawer={true}
                />
            </div>
            <div className={styles.fixedBottom}>
                <Button isTransparent isFullWidth onClick={onCloseDrawer} dataTid='cancel-btn'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            </div>
        </Drawer>
    );
};

export default BalanceHistoryItemDrawer;
