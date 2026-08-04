import { FunctionComponent } from 'react';
import classNames from 'classnames';

import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import MosaicBlocksItem from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/components/MosaicBlocksItem/MosaicBlocksItem';
import { TMosaicRowProps } from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/MosaicBlocks';
import mosaicStyles from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/MosaicBlocks.module.scss';

import styles from './MosaicOneRow.module.scss';

export const MosaicOneRow: FunctionComponent<TMosaicRowProps> = ({
    items,
    onClickItem,
    displayNumberOfNights,
    titleClassName,
}) => {
    const isSingleItem = items.length === 1;

    return (
        <div className={mosaicStyles.promoSlide} data-tid='mosaic-one-row'>
            {items.map((item: IPromoBlockFields) => (
                <div
                    className={classNames(mosaicStyles.promoSlideCol, {
                        [styles.singleColumn]: isSingleItem,
                    })}
                    key={item.id}
                    data-tid='promo-slide-col'
                >
                    <MosaicBlocksItem
                        item={item}
                        onClick={(): void => onClickItem(item)}
                        displayNumberOfNights={displayNumberOfNights}
                        className={classNames({
                            [styles.oneItem]: isSingleItem,
                        })}
                        titleClassName={titleClassName}
                    />
                </div>
            ))}
        </div>
    );
};

export default MosaicOneRow;
