import { FC } from 'react';
import classNames from 'classnames';

import { useMobileViewport, useTabletViewport } from 'frontend/hooks/useMediaQuery';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import SliderButtonsGroup from 'frontend/components/common/SliderButtonsGroup';
import { IPromoBlocksParams } from 'frontend/components/renderings/PromoBlocks/PromoBlocks';
import {
    getItemsCountByDevice,
    getPromoBlocksResponsiveByTheme,
} from 'frontend/components/renderings/PromoBlocks/PromoBlocks.utils';

import IconTextCarouselItem from './components/IconTextCarouselItem';

import styles from './IconTextCarousel.module.scss';

export interface IIconTextCarouselProps {
    items: IPromoBlockFields[];
    params: IPromoBlocksParams;
    titleClassName: string;
}

const IconTextCarousel: FC<IIconTextCarouselProps> = ({ items, params, titleClassName }) => {
    const isMobile = useMobileViewport();
    const isTablet = useTabletViewport();

    const responsive = getPromoBlocksResponsiveByTheme(PromoBlocksThemes.IconTextCarousel, items.length);
    const itemsNumberFromResponsive: number = getItemsCountByDevice(responsive, isMobile, isTablet);

    const shouldRenderCarousel = items.length > itemsNumberFromResponsive;

    const hasShadow = isSitecoreCheckboxSelected(params.AddBackgroundShadow);
    const shouldShowArrows = shouldRenderCarousel && !isMobile;

    return (
        <CarouselWrapper
            centerMode={false}
            className={classNames(styles.carousel, shouldRenderCarousel && styles.showDots)}
            infinite={shouldRenderCarousel}
            responsive={responsive}
            showDots={shouldRenderCarousel}
            arrows={false}
            partialVisible={shouldRenderCarousel && isMobile}
            customButtonGroup={shouldShowArrows ? <SliderButtonsGroup buttonClass={styles.sliderButton} /> : null}
            renderButtonGroupOutside
        >
            {items.map(item => (
                <IconTextCarouselItem
                    key={item.id}
                    item={item}
                    alignment={params.IconAlignment}
                    hasShadow={hasShadow}
                    titleClassName={titleClassName}
                />
            ))}
        </CarouselWrapper>
    );
};

export default IconTextCarousel;
