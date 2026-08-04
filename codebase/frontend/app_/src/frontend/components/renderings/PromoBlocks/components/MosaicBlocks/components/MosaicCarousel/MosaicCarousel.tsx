import React, { FunctionComponent } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { splitToChunksArray } from 'frontend/utils/chunkArray';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlocksMaxItems, PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import MosaicOneRow from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/components/MosaicOneRow/MosaicOneRow';
import MosaicTwoRow from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/components/MosaicTwoRows/MosaicTwoRows';
import { IMosaicBlocksProps } from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/MosaicBlocks';
import { getPromoBlocksResponsiveByTheme } from 'frontend/components/renderings/PromoBlocks/PromoBlocks.utils';

import ButtonGroup from './components/ButtonGroup/ButtonGroup';

import styles from './MosaicCarousel.module.scss';

export const MosaicCarousel: FunctionComponent<IMosaicBlocksProps> = ({
    items,
    onClickItem,
    displayNumberOfNights,
    titleClassName,
}) => {
    const { isScreenExtraSmall } = useStore((stores: TStores) => ({
        isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
    }));

    const splitItems = splitToChunksArray(
        items,
        isScreenExtraSmall ? PromoBlocksMaxItems.MobileView : PromoBlocksMaxItems.Mosaic,
    );

    const responsiveMap = getPromoBlocksResponsiveByTheme(PromoBlocksThemes.Mosaic);

    return (
        <CarouselWrapper
            responsive={responsiveMap}
            showDots
            containerClass={styles.sliderContainer}
            renderButtonGroupOutside={true}
            arrows={false}
            customButtonGroup={<ButtonGroup />}
            data-tid='slider-container'
        >
            {splitItems.map((items: IPromoBlockFields[], i) =>
                items.length < PromoBlocksMaxItems.Mosaic ? (
                    <MosaicOneRow
                        items={items}
                        key={`${i}_MosaicOneRow`}
                        onClickItem={onClickItem}
                        displayNumberOfNights={displayNumberOfNights}
                        titleClassName={titleClassName}
                    />
                ) : (
                    <MosaicTwoRow
                        items={items}
                        key={`${i}_MosaicTwoRow`}
                        onClickItem={onClickItem}
                        displayNumberOfNights={displayNumberOfNights}
                        titleClassName={titleClassName}
                    />
                ),
            )}
        </CarouselWrapper>
    );
};

export default MosaicCarousel;
