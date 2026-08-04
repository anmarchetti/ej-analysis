import React, { FC } from 'react';

import Button from 'frontend/components/common/Button';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

const MIN_TOTAL_ITEMS = 3;

export type TCarouselButtonProps = {
    carouselState?: {
        currentSlide: number;
        slidesToShow: number;
        totalItems: number;
    };
    minItemsNumberToShow?: number;
    next?: () => void;
    previous?: () => void;
};

export const CarouselButton: FC<TCarouselButtonProps> = ({ next, previous, carouselState, minItemsNumberToShow }) => {
    const { currentSlide, totalItems = 0, slidesToShow = 0 } = carouselState || {};

    const minTotalItems = minItemsNumberToShow ?? MIN_TOTAL_ITEMS;

    if (totalItems <= minTotalItems) {
        return null;
    }

    return (
        <div className='carousel-button-group' data-tid='carousel-button-group'>
            {currentSlide !== 0 && (
                <Button
                    onClick={previous}
                    isText
                    className='hotels-carousel__button prev'
                    data-tid='prev'
                    aria-label='carousel-btn-prev'
                >
                    <SvgChevronLeft />
                </Button>
            )}
            {totalItems - slidesToShow !== currentSlide && (
                <Button
                    onClick={next}
                    isText
                    className='hotels-carousel__button next'
                    data-tid='next'
                    aria-label='carousel-btn-next'
                >
                    <SvgChevronRight />
                </Button>
            )}
        </div>
    );
};
