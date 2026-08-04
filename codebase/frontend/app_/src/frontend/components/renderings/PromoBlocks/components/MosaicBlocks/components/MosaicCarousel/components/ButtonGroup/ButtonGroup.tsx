import * as React from 'react';

import Button from 'frontend/components/common/Button';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

// Doubled with SliderButtonsGroup - Refactoring required
export const ButtonGroup = props => {
    const { carouselState, previous, next } = props;
    const { currentSlide, totalItems } = carouselState;

    return (
        <div className='carousel-button-group' data-tid='carousel-button-group'>
            {currentSlide !== 0 && (
                <Button onClick={previous} isText className='arrow--left' data-tid='mosaic-carousel-arrow-left'>
                    <SvgChevronLeft />
                </Button>
            )}
            {totalItems !== currentSlide + 1 && (
                <Button onClick={next} isText className='arrow--right' data-tid='mosaic-carousel-arrow-right'>
                    <SvgChevronRight />
                </Button>
            )}
        </div>
    );
};

export default ButtonGroup;
