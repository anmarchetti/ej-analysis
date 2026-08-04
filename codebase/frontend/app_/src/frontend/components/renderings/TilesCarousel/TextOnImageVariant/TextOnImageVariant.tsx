import React, { FC } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import CarouselButtonsGroup from 'frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import styles from 'frontend/components/renderings/TilesCarousel/TilesCarousel.module.scss';
import { ITilesCarouselWithClassNamesProps } from 'frontend/components/renderings/TilesCarousel/TilesCarouselInterfaces';

import TextOnImageTile from './components/TextOnImageTile';

export const CAROUSEL_RESPONSIVE: ResponsiveType = {
    desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 768 }, items: 3 },
    mobile: { breakpoint: { max: 767, min: 0 }, items: 1, partialVisibilityGutter: 40 },
};

const TextOnImageVariant: FC<ITilesCarouselWithClassNamesProps> = ({
    Title,
    Tiles,
    titleClassName,
    wrapperClassName,
    titleTag,
}) => {
    const isMobile = useMobileViewport();
    const { desktop, mobile } = CAROUSEL_RESPONSIVE;
    const isCarousel = (!isMobile && Tiles.length > desktop.items) || (isMobile && Tiles.length > mobile.items);

    return (
        <div className={classNames(styles.container, wrapperClassName)} data-tid='tiles-carousel-text-on-image-wrapper'>
            <Text
                field={Title}
                className={classNames(styles.title, titleClassName)}
                tag={titleTag}
                data-tid='text-on-image-title'
            />
            <div
                className={classNames(styles.carouselWrapper, { [styles.wrapper]: !isCarousel })}
                data-tid='text-on-image-carousel-wrapper'
            >
                <CarouselWrapper
                    responsive={CAROUSEL_RESPONSIVE}
                    infinite={false}
                    arrows={false}
                    showDots={isCarousel}
                    partialVisible={isMobile && isCarousel}
                    dotListClass={styles.carouselDotList}
                    customButtonGroup={
                        isMobile ? undefined : (
                            <CarouselButtonsGroup
                                minNumberOfItems={desktop.items}
                                nextClassName={styles.button}
                                prevClassName={styles.button}
                            />
                        )
                    }
                >
                    {Tiles.map(tile => (
                        <TextOnImageTile key={tile.id} {...tile.fields} />
                    ))}
                </CarouselWrapper>
            </div>
        </div>
    );
};

export default observer(TextOnImageVariant);
