import React, { FC, useRef, useState } from 'react';
import { ButtonGroupProps, ResponsiveType } from 'react-multi-carousel';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import CarouselWrapper, { TCarouselRef } from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import SliderNavButton from 'frontend/components/common/SliderNavButton';
import { withRerender } from 'frontend/components/hoc';

import LogoCarouselContentCard from './components/LogoCarouselContentCard/LogoCarouselContentCard';
import LogoCarouselImage from './components/LogoCarouselImage/LogoCarouselImage';
import { DESKTOP_ITEMS_AMOUNT, TABLET_ITEMS_AMOUNT } from './constants';

import styles from './LogoCarousel.module.scss';

export interface ILogoCarouselCardFields {
    Description: ISitecoreField<string>;
    Logo: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

interface ILogoCarouselFields {
    Cards: ISitecoreCompositeField<ILogoCarouselCardFields>[];
    ReadLess: ISitecoreField<string>;
    ReadMore: ISitecoreField<string>;
}

export type TLogoCarouselProps = ISitecoreComponent<ILogoCarouselFields>;

const LogoCarousel: FC<TLogoCarouselProps> = ({ fields }) => {
    const carouselRef = useRef<TCarouselRef>(null);
    const [currentArticleIdx, setCurrentArticleIdx] = useState(0);
    const [carouselMovingEnd, setCarouselMovingEnd] = useState(true);

    const isMobile = useMobileViewport();

    const { Cards = [], ReadMore, ReadLess } = fields || {};
    const cardsAmount = Cards.length;

    if (!fields || !cardsAmount) {
        return null;
    }

    const getResponsiveConfig = (): ResponsiveType => ({
        desktop: {
            breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 992 },
            items: Math.min(DESKTOP_ITEMS_AMOUNT, cardsAmount),
        },
        tablet: {
            breakpoint: { min: 576, max: 991 },
            items: Math.min(TABLET_ITEMS_AMOUNT, cardsAmount),
        },
        mobile: {
            breakpoint: { min: 0, max: 575 },
            items: 1,
        },
    });

    const images = Cards.map((card, idx) => {
        // isActive cont does not work properly when only one item visible on the screen (breakpoints config responsible for this)
        const isActive = carouselMovingEnd && !isMobile && currentArticleIdx === idx;

        // on mobile devices we show logos with content cards to make the whole block swipeable
        if (isMobile) {
            return (
                <React.Fragment key={`${card.id}-image`}>
                    <LogoCarouselImage image={card.fields.Logo} />
                    <LogoCarouselContentCard title={card.fields?.Title} description={card.fields?.Description} />
                </React.Fragment>
            );
        }

        return (
            <LogoCarouselImage
                key={`${card.id}-image`}
                dataSlideIndex={idx}
                image={card.fields.Logo}
                isActive={isActive}
            />
        );
    });

    const SliderButtonsGroup = ({ next, previous }: ButtonGroupProps) => (
        <>
            <SliderNavButton isLeftNav onClick={previous} className={styles.sliderNav} />
            <SliderNavButton onClick={next} className={styles.sliderNav} />
        </>
    );

    return (
        <div className={styles.container} data-tid='logo-carousel'>
            <CarouselWrapper
                ref={carouselRef}
                responsive={getResponsiveConfig()}
                containerClass={styles.carouselList}
                itemClass={styles.card}
                focusOnSelect
                showDots={false}
                arrows={false}
                draggable={false}
                swipeable
                infinite
                renderButtonGroupOutside
                customButtonGroup={<SliderButtonsGroup />}
                transitionDuration={300}
                beforeChange={(nextSlide, { currentSlide }) => {
                    if (nextSlide !== currentSlide) {
                        setCarouselMovingEnd(false);
                    }
                }}
                afterChange={(_, { currentSlide }) => {
                    const slideNode = carouselRef.current?.containerRef?.current?.querySelector(
                        `[data-index="${currentSlide}"]`,
                    );
                    const realSlideIndex = slideNode
                        ?.querySelector('[data-tid="logo-carousel-image-wrapper"]')
                        ?.getAttribute('data-slide-index');

                    if (realSlideIndex && Number(realSlideIndex) !== currentArticleIdx) {
                        setCurrentArticleIdx(Number(realSlideIndex));
                        setCarouselMovingEnd(true);
                    }
                }}
            >
                {images}
            </CarouselWrapper>
            {!isMobile &&
                Cards.map((card, idx) => (
                    <LogoCarouselContentCard
                        key={`content-card-${card.id}`}
                        title={card.fields.Title}
                        description={card.fields.Description}
                        readMoreButtonText={ReadMore}
                        readLessButtonText={ReadLess}
                        isExpandable
                        activeIdx={currentArticleIdx}
                        isActive={currentArticleIdx === idx}
                    />
                ))}
        </div>
    );
};

export default withRerender(observer(LogoCarousel));
