import { FunctionComponent } from 'react';

import { ONE, THREE, TWO } from 'code/commonNumbers';
import MosaicBlocksItem from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/components/MosaicBlocksItem/MosaicBlocksItem';
import { TMosaicRowProps } from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/MosaicBlocks';
import mosaicStyles from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/MosaicBlocks.module.scss';

const SLIDE_GROUPS = [[0], [ONE, TWO], [THREE]];

export const MosaicTwoRows: FunctionComponent<TMosaicRowProps> = ({
    items,
    onClickItem,
    displayNumberOfNights,
    titleClassName,
}) => (
    <div className={mosaicStyles.promoSlide} data-tid='mosaic-two-rows'>
        {SLIDE_GROUPS.map(group => (
            <div key={group[0]} className={mosaicStyles.promoSlideCol} data-tid='promo-slide-col'>
                {group.map(itemIndex => (
                    <MosaicBlocksItem
                        key={itemIndex}
                        item={items[itemIndex]}
                        onClick={(): void => onClickItem(items[itemIndex])}
                        displayNumberOfNights={displayNumberOfNights}
                        titleClassName={titleClassName}
                    />
                ))}
            </div>
        ))}
    </div>
);

export default MosaicTwoRows;
