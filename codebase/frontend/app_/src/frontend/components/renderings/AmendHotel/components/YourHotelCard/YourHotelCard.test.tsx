import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockBooking } from 'frontend/__mocks__';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { IHotel } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import YourHotelCard from './YourHotelCard';

const createProps = () => ({
    booking: mockBooking,
    fallbackImage: 'HotelFallbackImage',
});

let mocksProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock(
    'frontend/components/renderings/SearchResults/components/ImageCarouselContainer/ImageCarouselContainer',
    () => ({
        __esModule: true,
        default: () => <div data-tid='image-carousel-container' />,
    }),
);

const mockOfferCardSliderProps = jest.fn();
jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardSliderProps(props);

        return <div data-tid='offer-card-slider' />;
    },
}));

const mockStarRatingProps = jest.fn();
jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: props => {
        mockStarRatingProps(props);

        return <div data-tid='star-rating' />;
    },
}));

const mockTripAdvisorInfoProps = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({
    __esModule: true,
    default: props => {
        mockTripAdvisorInfoProps(props);

        return <div data-tid='trip-advisor-info' />;
    },
}));

const mockEcoCertifiedPillProps = jest.fn();
jest.mock('frontend/components/common/EcoCertifiedPill', () => ({
    __esModule: true,
    default: props => {
        mockEcoCertifiedPillProps(props);

        return <div data-tid='eco-certified-pill' />;
    },
}));

const mockImageWithFilterProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: props => {
        mockImageWithFilterProps(props);

        return <div data-tid='image-with-filter' />;
    },
    SVGFilterMatrix: {
        grayscale: 'grayscale',
    },
}));

const mockOfferExtrasProps = jest.fn();
jest.mock('frontend/components/renderings/AmendHotel/components/OfferExtras/OfferExtras', () => ({
    __esModule: true,
    default: props => {
        mockOfferExtrasProps(props);

        return <div data-tid='offer-extras' />;
    },
}));

const mockBlockSelectedProps = jest.fn();
jest.mock('frontend/components/common/BlockSelected', () => ({
    __esModule: true,
    default: props => {
        mockBlockSelectedProps(props);

        return <div data-tid='block-selected' />;
    },
}));

describe('<YourHotelCard />', () => {
    beforeEach(() => {
        mocksProps = createProps();
        mockStores = createMockStores();
    });

    it('should render', () => {
        render(<YourHotelCard {...mocksProps} />);

        expect(screen.getByTestId('your-hotel-card')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-images')).toBeInTheDocument();
        expect(screen.getByTestId('offer-card-slider')).toBeInTheDocument();
        expect(mockOfferCardSliderProps).toHaveBeenCalledWith({
            images: mockBooking.hotel?.images,
            fallbackImage: 'HotelFallbackImage',
            showIndex: true,
            isFullScreenEnabled: true,
        });
        expect(screen.getByTestId('hotel-name')).toHaveTextContent(mockBooking.hotel?.name as string);
        expect(screen.getByTestId('hotel-location')).toHaveTextContent('Resort Example, United States, United States');
        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(mockStarRatingProps).toHaveBeenCalledWith({ rating: 4 });
        expect(screen.getByTestId('trip-advisor-info')).toBeInTheDocument();
        expect(mockTripAdvisorInfoProps).toHaveBeenCalledWith({
            rating: mockBooking.hotel?.rating,
            reviews: mockBooking.hotel?.numberOfReviews,
        });
        expect(screen.getByTestId('eco-certified-pill')).toBeInTheDocument();
        expect(mockEcoCertifiedPillProps).toHaveBeenCalledWith({
            title: mockBooking.hotel?.ecoFacility?.name,
            tooltip: mockBooking.hotel?.ecoFacility?.tooltip,
        });
        expect(screen.getByTestId('offer-extras')).toBeInTheDocument();
        expect(mockOfferExtrasProps).toHaveBeenCalledWith({
            boardType: mockBooking.package.accom.rooms[0].boardType,
            roomType: mockBooking.package.accom.rooms[0].roomType,
            transfer: mockBooking.transfers[0],
            className: 'offerExtras',
        });
        expect(screen.getByTestId('block-selected')).toBeInTheDocument();
        expect(mockBlockSelectedProps).toHaveBeenCalledWith({
            siteCoreKey: SitecoreDictionary.TransferButtonsSelected,
            className: 'selected',
        });
    });

    it('should NOT render EcoCertifiedPill if ecoFacility is not provided', () => {
        (mocksProps.booking.hotel as IHotel).ecoFacility = undefined as any;
        render(<YourHotelCard {...mocksProps} />);

        expect(screen.getByTestId('your-hotel-card')).toBeInTheDocument();
        expect(screen.queryByTestId('eco-certified-pill')).not.toBeInTheDocument();
    });

    it('should NOT render hotel name, location and trip advisor info if hotel is not provided', () => {
        mocksProps.booking.hotel = undefined;
        render(<YourHotelCard {...mocksProps} />);

        expect(screen.getByTestId('your-hotel-card')).toBeInTheDocument();
        expect(screen.queryByTestId('hotel-name')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hotel-location')).not.toBeInTheDocument();
        expect(screen.queryByTestId('trip-advisor-info')).not.toBeInTheDocument();
    });
});
