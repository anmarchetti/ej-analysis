import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ICabinBagsFields } from 'models/data/ICabinBagsFields';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './LCBIsNotAddedRow.module.scss';

export interface ILCBIsNotAddedRowProps {
    fields: ICabinBagsFields;
    hasLCB: boolean;
    isLackOfCapacity: boolean;
}

export const LCBIsNotAddedRow: FC<ILCBIsNotAddedRowProps> = ({ fields, hasLCB, isLackOfCapacity }) => {
    const { isPostBookingPages } = useStore((stores: TStores) => ({
        isPostBookingPages: stores.layoutStore.isPostBookingPages,
    }));
    const { OverheadBagDropdownLabel, OverheadIcon, NoMoreLCBCapacityLabel } = fields;

    if (isLackOfCapacity && !isPostBookingPages) {
        return (
            <div className={styles.noCapacity} data-tid='lcb-price-panel-bags-no-capacity'>
                <Text field={NoMoreLCBCapacityLabel} tag='span' />
            </div>
        );
    }

    return (
        <span className={classNames(styles.extraBag, hasLCB && 'd-none')} data-tid='lcb-price-panel-bags-no-added'>
            <JSSImage data-tid='overhead-bag-not-added-icon' field={OverheadIcon} className={styles.icon} />
            <Text field={OverheadBagDropdownLabel} tag='span' />
        </span>
    );
};

export default LCBIsNotAddedRow;
