import React, { FC, useMemo } from 'react';
import classNames from 'classnames';

import { useMoreThenTabletViewport, useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import SliderButtonsGroup from 'frontend/components/common/SliderButtonsGroup';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';
import { IPromoBlockItemBigSpecificProps } from 'frontend/components/renderings/PromoBlocks/components/PromoBlocksSingleItem/components/PromoBlockItemBig/PromoBlockItemBig';
import { IPromoBlocksParams } from 'frontend/components/renderings/PromoBlocks/PromoBlocks';
import {
    getPromoBlocksResponsiveByTheme,
    shouldHidePromoBlock,
} from 'frontend/components/renderings/PromoBlocks/PromoBlocks.utils';

import { PromoBlocksCarouselItems } from './components/PromoBlocksCarouselItems/PromoBlocksCarouselItems';

export interface IPromoBlocksCarouselProps extends IComponentWithRerenderProps, IPromoBlockItemBigSpecificProps {
    blockFields: (IPromoBlockFields | IPromoBlockFields[])[];
    handleClickItem: (item: IPromoBlockFields) => void;
    shouldShowShard: boolean;
    theme: IPromoBlocksParams['Theme'] | undefined;
    titleClassName: string;
    withDarkOverlay?: boolean;
}

const PromoBlocksCarousel: FC<IPromoBlocksCarouselProps> = ({
    blockFields,
    handleClickItem,
    shouldShowShard,
    theme,
    withDarkOverlay,
    pillAlignment,
    titlePlacement,
    titleClassName,
}) => {
    const isXsMobileViewport = useXSMobileViewport();
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    const haveToBeShown = useMemo(() => {
        const totalItemsCount = blockFields.reduce(
            (acc, block) => (Array.isArray(block) ? acc + block.length : acc + 1),
            0,
        );

        return shouldHidePromoBlock(theme, totalItemsCount, isXsMobileViewport, isMoreThenTabletViewport);
    }, [theme, blockFields, isXsMobileViewport, isMoreThenTabletViewport]);

    const containerClass = classNames('promo-blocks-slider', haveToBeShown ? 'show' : 'mobile-show');
    const responsive = getPromoBlocksResponsiveByTheme(theme);
    const isMultiplePromoItems = blockFields.length > 1;

    return (
        <div className={containerClass} data-tid='promo-blocks-slider'>
            <CarouselWrapper
                responsive={responsive}
                infinite={isMultiplePromoItems}
                showDots={isMultiplePromoItems}
                arrows={false}
                customButtonGroup={<SliderButtonsGroup />}
                containerClass='carousel-container'
            >
                {blockFields.map((items, i) => (
                    <div className='slide-wrapper' key={(items as IPromoBlockFields).id + i}>
                        <PromoBlocksCarouselItems
                            items={items}
                            baseIndex={i}
                            handleClickItem={handleClickItem}
                            theme={theme}
                            shouldShowShard={shouldShowShard}
                            withDarkOverlay={withDarkOverlay}
                            pillAlignment={pillAlignment}
                            titlePlacement={titlePlacement}
                            titleClassName={titleClassName}
                        />
                    </div>
                ))}
            </CarouselWrapper>
        </div>
    );
};

export default PromoBlocksCarousel;
