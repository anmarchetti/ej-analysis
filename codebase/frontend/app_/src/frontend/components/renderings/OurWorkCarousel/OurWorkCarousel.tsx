import { useCallback, useEffect, useState } from 'react';
import { ResponsiveType } from 'react-multi-carousel';

import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import {
    ISitecoreCompositeField,
    ISitecoreField,
    ISitecoreImage,
    ISitecoreLink,
} from 'models/sitecore/generic/ISitecoreField';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import SliderNavButton from 'frontend/components/common/SliderNavButton';

import OurWorkCarouselCard from './components/OurWorkCarouselCard/OurWorkCarouselCard';
import { DESKTOP_ITEMS_AMOUNT, TABLET_ITEMS_AMOUNT } from './constants';

import styles from './OurWorkCarousel.module.scss';

export interface IOurWorkCarouselCardFields {
    Image: ISitecoreField<ISitecoreImage>;
    Link: ISitecoreField<ISitecoreLink>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

interface IOurWorkCarouselFields {
    Cards: ISitecoreCompositeField<IOurWorkCarouselCardFields>[];
}

export type TOurWorkCarouselProps = ISitecoreComponent<IOurWorkCarouselFields>;

const OurWorkCarousel = ({ fields }: TOurWorkCarouselProps) => {
    const { Cards } = fields || {};
    const cardsToShow = Cards?.filter(e => !!e.fields) || [];
    const cardsToShowCount = cardsToShow.length;
    const [maxTitleHeight, setMaxTitleHeight] = useState<number>(0);
    const [allTitlesHeights, setAllTitlesHeights] = useState<number[]>([]);

    // add height value of each title to find the maximum value after rendering in the useEffect hook
    const getCardTitleHeight = useCallback(
        (cardTitleNode: HTMLDivElement | null) => {
            cardTitleNode &&
                allTitlesHeights.length < cardsToShowCount &&
                setAllTitlesHeights(prevState => [...prevState, cardTitleNode.offsetHeight]);
        },
        [allTitlesHeights],
    );

    // find the max height value to make the height of all titles the identical
    useEffect(() => {
        const tallestTitleBlock = allTitlesHeights.reduce(
            (a: number = 0, b: number = 0) => (a >= b ? a : b),
            allTitlesHeights[0],
        );

        setMaxTitleHeight(tallestTitleBlock ?? 0);
    }, [allTitlesHeights]);

    const SliderButtonsGroup = ({ next, previous }: any) => (
        <>
            <SliderNavButton isLeftNav onClick={previous} className={styles.sliderNav} />
            <SliderNavButton onClick={next} className={styles.sliderNav} />
        </>
    );

    const getResponsiveConfig = (): ResponsiveType => ({
        desktop: {
            breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 992 },
            items: cardsToShowCount > DESKTOP_ITEMS_AMOUNT ? DESKTOP_ITEMS_AMOUNT : cardsToShowCount,
        },
        tablet: {
            breakpoint: { max: 991, min: 576 },
            items: cardsToShowCount > TABLET_ITEMS_AMOUNT ? TABLET_ITEMS_AMOUNT : cardsToShowCount,
        },
        mobile: {
            breakpoint: { max: 575, min: 0 },
            items: 1,
        },
    });

    if (!fields || !cardsToShowCount) {
        return null;
    }

    return (
        <div className={styles.container} data-tid='our-work-carousel'>
            <CarouselWrapper
                responsive={getResponsiveConfig()}
                infinite
                showDots={false}
                arrows={false}
                draggable={false}
                swipeable
                containerClass={styles.carouselList}
                itemClass={styles.card}
                renderButtonGroupOutside
                customButtonGroup={<SliderButtonsGroup />}
            >
                {cardsToShow.map((card, index) => (
                    <OurWorkCarouselCard
                        key={`card-${index}`}
                        fields={card.fields}
                        ref={(el: HTMLDivElement | null) => getCardTitleHeight(el)}
                        titleHeight={maxTitleHeight}
                    />
                ))}
            </CarouselWrapper>
        </div>
    );
};

export default OurWorkCarousel;
