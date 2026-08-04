import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { ICabinBagsFields } from 'models/data/ICabinBagsFields';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import SvgCrossCircle from 'frontend/components/icons-new/CrossCircle';

import styles from './LCBAddedRow.module.scss';

export interface ILCBAddedRowProps {
    fields: ICabinBagsFields;
    hasLCB: boolean;
    removeBag: () => void;
    price?: string;
}

export const LCBAddedRow: FC<ILCBAddedRowProps> = ({ fields, removeBag, hasLCB, price }) => {
    const { getPhrase, isPriceVisible, isPostBookingPages, isLuxuryPackage } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        isPostBookingPages: stores.layoutStore.isPostBookingPages,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
    }));
    const { OverheadAddedIcon, OverheadBagAddedDropdownLabel } = fields;

    return (
        <div
            className={classNames(
                styles.largeBagAdded,
                !hasLCB && 'd-none',
                isPostBookingPages && styles.largeBagAddedAlt,
            )}
            data-tid='lcb-price-panel-bags-added'
        >
            <span className={styles.extraBag}>
                <JSSImage data-tid='overhead-bag-added-icon' field={OverheadAddedIcon} className={styles.icon} />
                <Text field={OverheadBagAddedDropdownLabel} tag='span' />
            </span>
            {!isPostBookingPages && !isLuxuryPackage && (
                <div
                    className={classNames(styles.priceContainer, !isPriceVisible && styles.priceContainerCenter)}
                    data-tid='remove-container'
                >
                    {isPriceVisible && price && (
                        <div className={styles.price} data-tid='lcb-price-panel-price'>
                            {price}
                        </div>
                    )}
                    <Button
                        className={styles.removeBtn}
                        dataTid='remove-btn'
                        isText
                        onClick={removeBag}
                        aria-label='Remove large cabin bag'
                    >
                        {getPhrase(SitecoreDictionary.GlobalsButtonsRemove)}
                        <SvgCrossCircle />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default observer(LCBAddedRow);
