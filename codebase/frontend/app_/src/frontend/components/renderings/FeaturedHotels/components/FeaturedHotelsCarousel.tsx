import React, { FC } from 'react';
import { ResponsiveType } from 'react-multi-carousel';

import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import { splitToChunksArray } from 'frontend/utils/chunkArray';
import { CAROUSEL_DESKTOP_MAX_BREAKPOINT } from 'frontend/utils/getSlidersToShow';
import { FeaturedHotelsMaxItems, IFeaturedHotelsWithPrice } from 'models/data/IFeaturedHotel';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';

import { ButtonGroup } from './ButtonGroup';
import FeaturedHotelCard from './FeaturedHotelCard';
import FeaturedHotelsTwoRows from './FeaturedHotelsTwoRows';

export interface IFeaturedHotelsCarouselProps extends IComponentWithRerenderProps {
    fallbackImage: string;
    hotels: IFeaturedHotelsWithPrice[];
    onClick: (index: number, item: IFeaturedHotelsWithPrice, destination: string) => void;
    displayNumberOfNights?: boolean;
}

export const FeaturedHotelsCarousel: FC<IFeaturedHotelsCarouselProps> = props => {
    const isScreenLessMedium = useXSMobileViewport();

    const responsive: ResponsiveType = {
        desktop: { breakpoint: { max: CAROUSEL_DESKTOP_MAX_BREAKPOINT, min: 1024 }, items: 1 },
        tablet: { breakpoint: { max: 1024, min: 768 }, items: 1 },
        mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
    };
    const chunksArray = splitToChunksArray(
        props.hotels,
        props.wasRerendered && isScreenLessMedium ? FeaturedHotelsMaxItems.Small : FeaturedHotelsMaxItems.Big,
    );

    return (
        <CarouselWrapper
            responsive={responsive}
            showDots={chunksArray.length > 1 ? true : false}
            renderButtonGroupOutside={true}
            arrows={false}
            customButtonGroup={chunksArray.length > 1 ? <ButtonGroup /> : null}
            containerClass='slider-container'
            data-tid='slider-container'
        >
            {chunksArray.map((hotels: IFeaturedHotelsWithPrice[], i) =>
                hotels.length === 1 ? (
                    <FeaturedHotelCard
                        fallbackImage={props.fallbackImage || ''}
                        hotel={hotels[0]}
                        key={hotels[0].Name}
                        onClick={(item, destination) => props.onClick(0, item, destination)}
                        displayNumberOfNights={props.displayNumberOfNights}
                    />
                ) : (
                    <FeaturedHotelsTwoRows
                        fallbackImage={props.fallbackImage || ''}
                        hotels={hotels}
                        key={`${i}_HotelsTwoRows`}
                        onClick={props.onClick}
                        displayNumberOfNights={props.displayNumberOfNights}
                    />
                ),
            )}
        </CarouselWrapper>
    );
};

export default FeaturedHotelsCarousel;
