import React, { useEffect, useRef, useState } from 'react';
import { ResponsiveType } from 'react-multi-carousel';

import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { ICustomerFeedback } from 'models/data/ICustomerFeedback';
import CarouselButtonsGroup from 'frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup';
import CarouselWrapper, { TCarouselRef } from 'frontend/components/common/CarouselWrapper/CarouselWrapper';

import CustomerFeedbackCard from './CustomerFeedbackCard';

import styles from './CustomersFeedbackCarousel.module.scss';

interface ICustomersFeedbackCarouselProps {
    items: ICustomerFeedback[];
    itemsPerSlideDesktop: number;
    itemsPerSlideMobile: number;
    showTitlesAndComments?: boolean;
}

interface IIndicatorProps {
    activeIdx: number;
    itemsCount: number;
    maxDots: number;
    onClick: (index) => void;
}

/**
 * Carousel Dots-Indicator, clickable, Instagram-style behaviour
 * returns a styled component based on the passed-in value of the current slide index,
 * the maximum number of visible dots
 * and the total amount of slides
 */
const CarouselIndicator = ({ activeIdx, maxDots, itemsCount, onClick }: IIndicatorProps) => {
    const [range, setRange] = useState({ min: 0, max: maxDots });

    /**
     * calcVisibleDotsRange() sets the range of visible dots
     * after each change of the active slide considering the current range min-max values
     * and max dots setting
     */
    const calcVisibleDotsRange = () => {
        if (activeIdx === range.min) {
            setRange({
                min: activeIdx - 1,
                max: activeIdx - 1 + maxDots,
            });
        }

        if (range.max + 1 < itemsCount) {
            if (activeIdx === range.max) {
                setRange({
                    min: activeIdx + 1 - maxDots,
                    max: activeIdx + 1,
                });
            }

            if (activeIdx === itemsCount - 1) {
                setRange({
                    min: itemsCount - 1 - maxDots,
                    max: itemsCount - 1,
                });
            }
        }

        if (activeIdx <= 1) {
            setRange({
                min: 0,
                max: maxDots,
            });
        }
    };

    /**
     * getDotClass() returns className string for the element
     * based on current min-max range and index of active element
     */
    const getDotClass = (idx: number): string => {
        if (idx === activeIdx) {
            return 'active';
        }

        if ((idx === range.min && idx - 1 >= 0) || (idx === range.max && idx + 1 <= itemsCount - 1)) {
            return 'small';
        }

        if (idx >= range.min && idx <= range.max) {
            return 'regular';
        }

        return 'hidden';
    };

    useEffect(() => {
        calcVisibleDotsRange();
    }, [activeIdx]);

    return (
        <ul className={styles['carousel-dot-list']}>
            {Array.from({ length: itemsCount }, (v, k) => k).map(e => (
                <li
                    key={`dot-item-${e}`}
                    onClick={() => onClick(e)}
                    className={`${styles['carousel-dot']} ${styles['carousel-dot--' + getDotClass(e)]}`}
                />
            ))}
        </ul>
    );
};

export const CustomersFeedbackCarousel = (props: ICustomersFeedbackCarouselProps) => {
    const [activeIdx, setActiveEl] = useState<number>(0);
    const carouselRef = useRef<TCarouselRef>(null);
    const responsive: ResponsiveType = {
        desktop: {
            breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 },
            items: 4,
            slidesToSlide: props.itemsPerSlideDesktop,
        },
        tablet: { breakpoint: { max: 1024, min: 768 }, items: 2, slidesToSlide: 2 },
        mobile: { breakpoint: { max: 768, min: 0 }, items: 1, slidesToSlide: props.itemsPerSlideMobile },
    };

    const handleDotClick = (index: number): void => {
        if (carouselRef?.current) {
            carouselRef.current.goToSlide(index);
            setActiveEl(index);
        }
    };

    return (
        <div className={styles['feedback-carousel-wrapper']} data-tid='feedback-carousel-container'>
            <CarouselWrapper
                ref={carouselRef}
                responsive={responsive}
                showDots={props.items.length > 1 ? true : false}
                arrows={false}
                customButtonGroup={<CarouselButtonsGroup />}
                containerClass={`${styles['feedback-carousel-container']} feedback-carousel__container`}
                dotListClass={`${styles['feedback-carousel-dot-list']} feedback-carousel__dot-list`}
                itemClass={`${styles['feedback-carousel-item']} feedback-carousel__item`}
                sliderClass='feedback-carousel__slider'
                afterChange={(_, { currentSlide }) => {
                    setActiveEl(currentSlide);
                }}
            >
                {props.items.map((item: ICustomerFeedback, i) => (
                    <CustomerFeedbackCard
                        showTitleAndComment={props.showTitlesAndComments}
                        item={item}
                        key={item.title}
                        dataId={`feedback-card__${i}`}
                    />
                ))}
            </CarouselWrapper>
            <CarouselIndicator
                maxDots={4}
                itemsCount={props.items.length}
                activeIdx={activeIdx}
                onClick={handleDotClick}
            />
        </div>
    );
};

export default CustomersFeedbackCarousel;
