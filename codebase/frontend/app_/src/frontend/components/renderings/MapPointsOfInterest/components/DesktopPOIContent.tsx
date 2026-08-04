import { FC, useEffect, useRef } from 'react';
import { ResponsiveType } from 'react-multi-carousel';
import { observer } from 'mobx-react';

import { useTabletViewport } from 'frontend/hooks/useMediaQuery';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import ButtonSwitch from 'frontend/components/common/ButtonSwitch/ButtonSwitch';
import CarouselButtonsGroup from 'frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup';
import CarouselWrapper, { TCarouselRef } from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import TextWithTooltip from 'frontend/components/common/TextWithTooltip/TextWithTooltip';
import { IDesktopMapPOIContentProps } from 'frontend/components/renderings/MapPointsOfInterest/IMapPointsOfInterest';

import SinglePointCard from './SinglePointCard';

import styles from './MapPOIContent.module.scss';

export const CAROUSEL_RESPONSIVE: ResponsiveType = {
    desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 992 }, items: 5 },
    tablet: { breakpoint: { max: 991, min: 768 }, items: 3 },
    mobile: {
        breakpoint: { max: 767, min: 577 },
        partialVisibilityGutter: 7,
        items: 3,
    },
};

const DesktopPOIContent: FC<IDesktopMapPOIContentProps> = ({
    categoriesWithItems,
    disclaimerText,
    disclaimerTooltip,
    activeIndex,
    setActiveIndex,
    handleCategoryClick,
}) => {
    const carouselRef = useRef<TCarouselRef>(null);
    const isTablet = useTabletViewport();
    const activeCategoryItems = categoriesWithItems[activeIndex]?.items || [];
    const minNumberOfItems = isTablet ? CAROUSEL_RESPONSIVE.tablet.items : CAROUSEL_RESPONSIVE.desktop.items;
    const isCarousel = activeCategoryItems.length > minNumberOfItems;

    const onClick = (index: number): void => {
        setActiveIndex(index);
        handleCategoryClick(categoriesWithItems[index].key);
    };

    useEffect(() => {
        if (carouselRef.current) {
            carouselRef.current.goToSlide(0);
        }
    }, [activeIndex]);

    return (
        <>
            <ButtonSwitch items={categoriesWithItems} onClick={onClick} activeIndex={activeIndex}>
                <div className={styles.carouselWrapper}>
                    <CarouselWrapper
                        ref={carouselRef}
                        responsive={CAROUSEL_RESPONSIVE}
                        partialVisible={isCarousel}
                        infinite={false}
                        arrows={false}
                        showDots={isCarousel}
                        containerClass={styles.carouselContainer}
                        dotListClass={styles.carouselDotList}
                        customButtonGroup={
                            <CarouselButtonsGroup
                                minNumberOfItems={minNumberOfItems}
                                nextClassName={styles.next}
                                prevClassName={styles.prev}
                            />
                        }
                    >
                        {activeCategoryItems.map(item => (
                            <SinglePointCard
                                key={item.name}
                                distance={item.distance}
                                name={item.name}
                                categoryName={item.categoryName}
                            />
                        ))}
                    </CarouselWrapper>
                </div>
            </ButtonSwitch>
            <TextWithTooltip
                message={disclaimerText}
                tooltipMessage={disclaimerTooltip}
                wrapperClassName={styles.disclaimer}
                tooltipTriggerClassName={styles.tooltipTrigger}
                dataTid='map-points-of-interest-disclaimer'
                tag='p'
            />
        </>
    );
};

export default observer(DesktopPOIContent);
