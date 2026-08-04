import React, { memo } from 'react';

import { isIndexInRange } from 'frontend/utils/offer.utils';
import { ImageSize } from 'models/enum/ImageSize';
import HotelImage from 'frontend/components/common/HotelImage/HotelImage';
import { ISliderImage } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';

interface ISliderImageProps {
    item: ISliderImage;
    slideIndex: number;
    fallbackImage?: string;
    hadInteraction?: boolean;
    slideSize?: ImageSize;
}

function SliderImage(props: ISliderImageProps) {
    const hadInteraction = props.hadInteraction === undefined ? true : props.hadInteraction;
    const inRange = hadInteraction
        ? isIndexInRange(props.item.index + 1, props.slideIndex + 1, props.item.totalSlides, 1) // if slider was interacted, then render current index, +1 and -1
        : props.item.index === 0 || props.item.index === 1; // if slider was not previously interacted, then render only first 2 images

    if (!inRange) {
        return null;
    }

    return (
        <HotelImage
            image={props.item.image}
            defaultSize={props.slideSize || ImageSize.Medium}
            className='hotel-card-img'
            fallbackImage={props.fallbackImage}
        />
    );
}

export default memo(SliderImage);
