import React, { FC, useRef, useState } from 'react';
import { CarouselInternalState, ResponsiveType } from 'react-multi-carousel';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMediaQuery } from 'frontend/hooks/useMediaQuery';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import CarouselButtonsGroup from 'frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup';
import CarouselWrapper, { TCarouselRef } from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import styles from 'frontend/components/renderings/TilesCarousel/TilesCarousel.module.scss';
import { ITilesCarouselWithClassNamesProps } from 'frontend/components/renderings/TilesCarousel/TilesCarouselInterfaces';

import DescriptionContainer from './components/DescriptionContainer';
import InformationBelowVariantTile from './components/InformationBelowVariantTile';
import { getNewSelectedIndexOnSlide } from './InformationBelowTilesVariant.utils';

export const CAROUSEL_RESPONSIVE: ResponsiveType = {
    desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 768 }, items: 3 },
    tablet: { breakpoint: { max: 767, min: 580 }, items: 2 },
    mobile: { breakpoint: { max: 579, min: 0 }, items: 1, partialVisibilityGutter: 40 },
};

const InformationBelowTilesVariant: FC<ITilesCarouselWithClassNamesProps> = ({
    Title,
    Tiles,
    titleClassName,
    wrapperClassName,
    titleTag,
}) => {
    const { desktop, tablet, mobile } = CAROUSEL_RESPONSIVE;
    const isMobile = useMediaQuery(`(max-width: ${mobile.breakpoint.max}px)`);
    const isTablet = useMediaQuery(`(max-width: ${tablet.breakpoint.max}px)`);

    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const carouselRef = useRef<TCarouselRef>(null);

    const handleSlideChange = (previousSlide: number, state: CarouselInternalState): void => {
        const newActiveIndex = getNewSelectedIndexOnSlide(previousSlide, state, selectedIndex);
        setSelectedIndex(newActiveIndex);
    };

    const isCarousel =
        (isMobile && Tiles.length > mobile.items) ||
        (isTablet && Tiles.length > tablet.items) ||
        Tiles.length > desktop.items;

    return (
        <div
            className={classNames(styles.container, styles.informationBelowTiles, wrapperClassName)}
            data-tid='tiles-carousel-text-on-image-wrapper'
        >
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
                    ref={carouselRef}
                    responsive={CAROUSEL_RESPONSIVE}
                    infinite={false}
                    arrows={false}
                    showDots={isCarousel}
                    partialVisible={isMobile && isCarousel}
                    afterChange={handleSlideChange}
                    dotListClass={styles.carouselDotList}
                    customButtonGroup={
                        isMobile ? undefined : (
                            <CarouselButtonsGroup
                                minNumberOfItems={isTablet ? tablet.items : desktop.items}
                                nextClassName={styles.button}
                                prevClassName={styles.button}
                            />
                        )
                    }
                >
                    {Tiles.map((tile, index) => (
                        <InformationBelowVariantTile
                            key={tile.id}
                            onClick={(): void => setSelectedIndex(index)}
                            isActive={!isMobile && selectedIndex === index}
                            includeDescription={isMobile}
                            {...tile.fields}
                        />
                    ))}
                </CarouselWrapper>

                {!isMobile &&
                    Tiles.map((tile, index) => (
                        <div key={tile.id} className={classNames({ [styles.hidden]: index !== selectedIndex })}>
                            <DescriptionContainer
                                Description={tile.fields.Description}
                                Subtitle={tile.fields.Subtitle}
                                selectedIndex={selectedIndex}
                            />
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default observer(InformationBelowTilesVariant);
