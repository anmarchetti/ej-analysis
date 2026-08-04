import { render, screen } from '@testing-library/react';

import RatingsDetails, { IRatingsDetailsProps } from './RatingsDetails';

const createMockProps = (): IRatingsDetailsProps => ({
    numberOfReviews: 123,
    rating: 4.5,
    starRating: '3',
});

let mockProps;

const mockStarRatingProps = jest.fn();
jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: props => {
        mockStarRatingProps(props);

        return <div data-tid='star-rating' />;
    },
}));

const mockTripadvisorInfoProps = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({
    __esModule: true,
    default: props => {
        mockTripadvisorInfoProps(props);

        return <div data-tid='tripadvisor-info' />;
    },
}));

describe('<RatingsDetails />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render RatingsDetails component', () => {
        render(<RatingsDetails {...mockProps} />);

        expect(screen.getByTestId('ratings-details')).toBeInTheDocument();
        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(mockStarRatingProps).toHaveBeenCalledWith({ rating: 3 });
        expect(screen.getByTestId('tripadvisor-info')).toBeInTheDocument();
        expect(mockTripadvisorInfoProps).toHaveBeenCalledWith({ rating: 4.5, reviews: 123 });
    });

    it('should render dataTid if provided', () => {
        mockProps.dataTid = 'test-id';
        render(<RatingsDetails {...mockProps} />);

        expect(screen.getByTestId('test-id')).toBeInTheDocument();
    });

    it('should render className if provided', () => {
        mockProps.className = 'test-class';
        render(<RatingsDetails {...mockProps} />);

        expect(screen.getByTestId('ratings-details')).toHaveClass('test-class');
    });

    it('should NOT render RatingsDetails component if starRating is not provided', () => {
        mockProps.starRating = undefined;
        render(<RatingsDetails {...mockProps} />);

        expect(screen.queryByTestId('ratings-details')).not.toBeInTheDocument();
    });

    it('should NOT render TripadvisorInfo component if rating is not provided', () => {
        mockProps.rating = undefined;
        render(<RatingsDetails {...mockProps} />);

        expect(screen.queryByTestId('tripadvisor-info')).not.toBeInTheDocument();
    });

    it('should NOT render TripadvisorInfo component if numberOfReviews is not provided', () => {
        mockProps.numberOfReviews = undefined;
        render(<RatingsDetails {...mockProps} />);

        expect(screen.queryByTestId('tripadvisor-info')).not.toBeInTheDocument();
    });
});
