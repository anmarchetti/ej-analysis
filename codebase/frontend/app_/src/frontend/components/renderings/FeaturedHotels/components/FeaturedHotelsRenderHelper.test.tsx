import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ILivePrice } from 'models/data/ILivePrice';

import FeaturedHotelsRenderHelper, { TFeaturedRenderHelperProps } from './FeaturedHotelsRenderHelper';

const mockFeaturedHotelsCarousel = jest.fn();
jest.mock('frontend/components/renderings/FeaturedHotels/components/FeaturedHotelsCarousel', () => props => {
    mockFeaturedHotelsCarousel(props);

    return <div data-tid='featured-hotels-carousel' />;
});

const mockFeaturedHotelsTwoRows = jest.fn();
jest.mock('frontend/components/renderings/FeaturedHotels/components/FeaturedHotelsTwoRows', () => props => {
    mockFeaturedHotelsTwoRows(props);

    return <div data-tid='featured-hotels-two-rows' />;
});

const resetMocks = (): TFeaturedRenderHelperProps => ({
    hotelsWithPrices: [
        {
            Url: '/Url',
            Image: mockSitecoreField(mockSitecoreImageField('src')),
            Name: 'Name',
            BookFrom: new Date().toDateString(),
            StarRating: '4',
            Region: 'Region',
            Country: 'Country',
            BookFromTitle: 'Title',
            BookFromText: 'Text',
            GiataCode: 'GiataCode',
            livePrice: { pricePP: 200 } as ILivePrice,
            isPriceValid: true,
        },
    ],
    fallbackImage: 'fallbackImage',
    handleClickHotel: jest.fn(),
    isShowCarousel: false,
    displayNumberOfNights: true,
});

let mocks;

describe('<FeaturedHotelsRenderHelper />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should not render with Carousel', () => {
        render(<FeaturedHotelsRenderHelper {...mocks} />);

        expect(screen.getByTestId('featured-hotels-two-rows')).toBeInTheDocument();
        expect(screen.queryByTestId('featured-hotels-carousel')).not.toBeInTheDocument();
        expect(mockFeaturedHotelsTwoRows).toHaveBeenCalledWith({
            displayNumberOfNights: true,
            fallbackImage: 'fallbackImage',
            hotels: mocks.hotelsWithPrices,
            onClick: expect.any(Function),
        });
    });

    it('should render with Carousel when more than 4 hotels are provided', () => {
        mocks.isShowCarousel = true;
        render(<FeaturedHotelsRenderHelper {...mocks} />);

        expect(screen.queryByTestId('featured-hotels-two-rows')).not.toBeInTheDocument();
        expect(screen.getByTestId('featured-hotels-carousel')).toBeInTheDocument();
        expect(mockFeaturedHotelsCarousel).toHaveBeenCalledWith({
            displayNumberOfNights: true,
            fallbackImage: 'fallbackImage',
            hotels: mocks.hotelsWithPrices,
            onClick: expect.any(Function),
        });
    });
});
