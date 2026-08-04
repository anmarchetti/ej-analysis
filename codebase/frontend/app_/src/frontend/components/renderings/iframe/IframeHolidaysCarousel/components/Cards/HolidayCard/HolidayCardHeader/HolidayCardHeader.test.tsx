import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockIframeOffer } from 'frontend/components/renderings/iframe/IframeHolidaysCarousel/__mocks__/iframe.mocks';

import { HolidayCardHeader } from './HolidayCardHeader';

jest.mock('frontend/components/common/StarRating', () => ({ rating }) => <div data-tid='star-rating'>{rating}</div>);
jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({ rating, reviews }) => (
    <div data-tid='tripadvisor-rating'>
        {rating} {reviews}
    </div>
));

const createProps = () => ({
    offer: { ...mockIframeOffer },
    hotelLink: '/hotel-link',
});

let mockProps;

describe('<HolidayCardHeader />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        const { name: hotelName, starRating, rating, numberOfReviews } = mockProps.offer.hotel;
        render(<HolidayCardHeader {...mockProps} />);

        expect(screen.getByRole('link')).toHaveAttribute('href', '/hotel-link');
        expect(screen.getByRole('heading', { name: hotelName })).toBeInTheDocument();
        expect(screen.getByTestId('hotel-location')).toHaveTextContent('Salou, Costa Dorada');
        expect(screen.getByTestId('star-rating')).toHaveTextContent(starRating);
        expect(screen.getByTestId('tripadvisor-rating')).toHaveTextContent(`${rating} ${numberOfReviews}`);
    });

    it('should not render component if hotel is not defined', () => {
        mockProps.offer.hotel = null;
        const { container } = render(<HolidayCardHeader {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should exclude null values from location', () => {
        mockProps.offer.hotel.resort.name = null;
        render(<HolidayCardHeader {...mockProps} />);

        expect(screen.getByTestId('hotel-location')).toHaveTextContent('Costa Dorada');
    });

    it('should not render tripadvisor info if rating is not defined', () => {
        mockProps.offer.hotel.rating = null;
        render(<HolidayCardHeader {...mockProps} />);

        expect(screen.queryByTestId('tripadvisor-rating')).toBeNull();
    });

    it('should not render tripadvisor info if no numberOfReviews', () => {
        mockProps.offer.hotel.numberOfReviews = 0;
        render(<HolidayCardHeader {...mockProps} />);

        expect(screen.queryByTestId('tripadvisor-rating')).toBeNull();
    });

    it('should not render star rating info if starRating is not defined', () => {
        mockProps.offer.hotel.starRating = null;
        render(<HolidayCardHeader {...mockProps} />);

        expect(screen.queryByTestId('star-rating')).toBeNull();
    });
});
