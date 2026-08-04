import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockBooking } from 'frontend/__mocks__';

import TradePortalViewBookingQuote, { ITradePortalViewBookingQuoteProps } from './TradePortalViewBookingQuote';

const mockHotelLocationLabelsProps = jest.fn();
jest.mock('frontend/components/renderings/TradePortalViewBooking/components/HotelLocationLabels', () => ({
    __esModule: true,
    HotelLocationLabels: props => {
        mockHotelLocationLabelsProps(props);

        return <div data-tid='hotel-location-labels' />;
    },
}));

const locationLinks = ['Location 1', 'Location 2'];
const hotelImages = ['test image'];
jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel.utils', () => ({
    getHotelMeta: jest.fn().mockReturnValue({
        hotelName: 'Hotel Name',
        hotelLocationLinks: locationLinks,
        hotelImages: hotelImages,
        starRating: 5,
        accom: {
            startDate: '01-02-2024',
            endDate: 'datesLabel 2',
        },
    }),
}));

const mockStarRatingProps = jest.fn();
jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: props => {
        mockStarRatingProps(props);

        return <div data-tid='star-rating' />;
    },
}));

jest.mock('frontend/hooks/viewBooking.hooks', () => ({
    useNightsLabel: jest.fn().mockReturnValue('Test Number of Nights'),
}));

const mockHotelGalleryProps = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotelGallery', () => ({
    __esModule: true,
    default: props => {
        mockHotelGalleryProps(props);

        return <div data-tid='hotel-gallery' />;
    },
}));

const createProps = (): ITradePortalViewBookingQuoteProps => ({
    booking: mockBooking,
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn((p: string) => p),
        getSetting: jest.fn().mockReturnValue('test setting'),
    },
});

let props: ITradePortalViewBookingQuoteProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TradePortalViewBookingQuote />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render HotelLocationLabels component', () => {
        render(<TradePortalViewBookingQuote {...props} />);

        expect(screen.getByTestId('hotel-location-labels')).toBeInTheDocument();
        expect(mockHotelLocationLabelsProps).toHaveBeenCalledWith({ locationLinks: locationLinks });
    });

    it('should render StarRating component', () => {
        render(<TradePortalViewBookingQuote {...props} />);

        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(mockStarRatingProps).toHaveBeenCalledWith({ rating: 5 });
    });

    it('should render dates', () => {
        render(<TradePortalViewBookingQuote {...props} />);

        expect(screen.getByTestId('dates-label')).toHaveTextContent('Thu 01 Feb - Test Number of Nights');
    });

    it('should render HotelGallery component', () => {
        render(<TradePortalViewBookingQuote {...props} />);

        expect(screen.getByTestId('hotel-gallery')).toBeInTheDocument();
        expect(mockHotelGalleryProps).toHaveBeenCalledWith({
            images: hotelImages,
            fallbackImage: 'test setting',
            isPrintPreview: true,
        });
    });
});
