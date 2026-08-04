import React, { FC, memo } from 'react';

import { IFeaturedHotelsWithPrice } from 'models/data/IFeaturedHotel';

import FeaturedHotelsCarousel from './FeaturedHotelsCarousel';
import FeaturedHotelsTwoRows from './FeaturedHotelsTwoRows';

export type TFeaturedRenderHelperProps = {
    fallbackImage: string;
    handleClickHotel: (index: number, item: IFeaturedHotelsWithPrice, destination: string) => void;
    hotelsWithPrices: IFeaturedHotelsWithPrice[];
    isShowCarousel: boolean;
    displayNumberOfNights?: boolean;
};

const FeaturedHotelsRenderHelper: FC<TFeaturedRenderHelperProps> = ({
    isShowCarousel,
    fallbackImage,
    hotelsWithPrices,
    handleClickHotel,
    displayNumberOfNights,
}) =>
    isShowCarousel ? (
        <div className='featured-hotels featured-hotels--slider' data-tid='featured-hotels--slider'>
            <FeaturedHotelsCarousel
                fallbackImage={fallbackImage || ''}
                hotels={hotelsWithPrices}
                onClick={handleClickHotel}
                displayNumberOfNights={displayNumberOfNights}
            />
        </div>
    ) : (
        <div className='featured-hotels' data-tid='featured-hotels'>
            <FeaturedHotelsTwoRows
                fallbackImage={fallbackImage || ''}
                hotels={hotelsWithPrices}
                onClick={handleClickHotel}
                displayNumberOfNights={displayNumberOfNights}
            />
        </div>
    );

export default memo(FeaturedHotelsRenderHelper);
