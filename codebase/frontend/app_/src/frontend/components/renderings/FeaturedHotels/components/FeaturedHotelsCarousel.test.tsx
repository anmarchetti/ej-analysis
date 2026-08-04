import React from 'react';
import { render, screen } from '@testing-library/react';

import { FeaturedHotelsCarousel, IFeaturedHotelsCarouselProps } from './FeaturedHotelsCarousel';

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => false,
}));

jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='carousel'>{children}</div>,
}));

const mockFeaturedHotelCardComponent = jest.fn();
jest.mock(
    'frontend/components/renderings/FeaturedHotels/components/FeaturedHotelCard',
    () =>
        ({ onClick, ...props }) => {
            mockFeaturedHotelCardComponent(props);

            return <div data-tid='featured-hotel-card' onClick={onClick} />;
        },
);

const mockFeaturedHotelsTwoRowsComponent = jest.fn();
jest.mock('frontend/components/renderings/FeaturedHotels/components/FeaturedHotelsTwoRows', () => props => {
    mockFeaturedHotelsTwoRowsComponent(props);

    return <div data-tid='featured-hotels-two-rows' />;
});

const createProps = (): IFeaturedHotelsCarouselProps => ({
    hotels: [{}, {}, {}] as any,
    fallbackImage: 'fallback',
    onClick: jest.fn(),
    wasRerendered: true,
    displayNumberOfNights: true,
});

let mockProps;

describe('<FeaturedHotelsCarousel />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render carousel', () => {
        render(<FeaturedHotelsCarousel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
    });

    it('should render FeaturedHotelsTwoRows when more than 1 hotel is displayed', () => {
        render(<FeaturedHotelsCarousel {...mockProps} />);

        expect(screen.getByTestId('featured-hotels-two-rows')).toBeInTheDocument();
        expect(mockFeaturedHotelsTwoRowsComponent).toHaveBeenCalledWith({
            displayNumberOfNights: true,
            fallbackImage: 'fallback',
            hotels: [{}, {}, {}],
            onClick: expect.any(Function),
        });
        expect(screen.queryByTestId('featured-hotel-card')).not.toBeInTheDocument();
    });

    it('should render FeaturedHotelCard when only 1 hotel is displayed', () => {
        mockProps.hotels = [{ Name: 'hotel' } as any];
        render(<FeaturedHotelsCarousel {...mockProps} />);

        expect(screen.getByTestId('featured-hotel-card')).toBeInTheDocument();
        expect(mockFeaturedHotelCardComponent).toHaveBeenCalledWith({
            displayNumberOfNights: true,
            fallbackImage: 'fallback',
            hotel: { Name: 'hotel' },
        });
        expect(screen.queryByTestId('featured-hotels-two-rows')).not.toBeInTheDocument();
    });
});
