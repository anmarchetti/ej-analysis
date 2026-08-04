import * as React from 'react';
import { render } from '@testing-library/react';

import reviewsService from 'frontend/services/reviews.service';
import { prepareReviewsData } from 'frontend/utils/hotelReviews.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';

import HotelReviewsBrowse, { getServerSideProps } from './HotelReviewsBrowse';

jest.mock('frontend/services/reviews.service', () => ({
    __esModule: true,
    default: { fetchReviews: jest.fn() },
}));

jest.mock('frontend/utils/hotelReviews.utils', () => ({
    prepareReviewsData: jest.fn(),
}));

const mockReviewsProps = jest.fn();

jest.mock('./components/Reviews', () => ({
    __esModule: true,
    default: props => {
        mockReviewsProps(props);

        return <div data-tid='reviews' />;
    },
}));

const createStores = () => ({
    layoutStore: {
        pageFields: {
            HotelRating: mockSitecoreField('4'),
            TotalNumberOfReviews: mockSitecoreField('27'),
            TripAdvisorId: mockSitecoreField('pageFieldsTripAdvisorId'),
        },
    },
});

const createProps = () => ({
    rendering: {},
    fields: { TripAdvisorId: { value: 'fieldsTripAdvisorId' } },
    params: { Anchor: '' },
});

let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HotelReviewsBrowse />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<HotelReviewsBrowse {...mockProps} />);

        expect(mockReviewsProps).toHaveBeenCalledWith({
            rating: 4,
            reviews: 27,
            tripadvisorId: mockStores.layoutStore.pageFields.TripAdvisorId.value,
            SSRData: undefined,
            anchor: mockProps.params.Anchor,
            showRatingValue: true,
        });
    });

    it('should pass TripAdvisorId value from fields when TripAdvisorId from pageFields is not available', () => {
        mockStores.layoutStore.pageFields.TripAdvisorId = undefined;
        render(<HotelReviewsBrowse {...mockProps} />);

        expect(mockReviewsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                tripadvisorId: mockProps.fields.TripAdvisorId.value,
            }),
        );
    });

    it('should pass reviews as null when pageFields.TotalNumberOfReviews is not defined', () => {
        mockProps.fields = undefined;
        mockStores.layoutStore.pageFields.TotalNumberOfReviews = undefined;
        render(<HotelReviewsBrowse {...mockProps} />);

        expect(mockReviewsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                reviews: null,
            }),
        );
    });

    it('should pass rating as null when pageFields.HotelRating is not defined', () => {
        mockStores.layoutStore.pageFields.HotelRating = undefined;
        render(<HotelReviewsBrowse {...mockProps} />);

        expect(mockReviewsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rating: null,
            }),
        );
    });

    it('should not render if no fields provided', () => {
        mockStores.layoutStore.pageFields = null;
        const { container } = render(<HotelReviewsBrowse {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('getServerSideProps', () => {
        it('should return null when TripAdvisorId is missing', async () => {
            const mockLayout = { sitecore: { route: { fields: {} } } } as ISitecoreLayout;
            const result = await getServerSideProps({} as any, mockLayout, {} as any);

            expect(result).toBeNull();
            expect(reviewsService.fetchReviews).not.toHaveBeenCalled();
        });

        it('should fetch reviews and return prepared data', async () => {
            const mockLayout = {
                sitecore: { route: { fields: { TripAdvisorId: { value: 'layoutTripAdvisorId' } } } },
            } as ISitecoreLayout;
            const mockRawData = { reviews: [] };
            const mockPrepared = { rating: 4, reviews: [] };
            (reviewsService.fetchReviews as jest.Mock).mockResolvedValue(mockRawData);
            (prepareReviewsData as jest.Mock).mockReturnValue(mockPrepared);

            const result = await getServerSideProps({} as any, mockLayout, {} as any);

            expect(reviewsService.fetchReviews).toHaveBeenCalledWith(
                mockLayout.sitecore.route.fields.TripAdvisorId.value,
            );
            expect(prepareReviewsData).toHaveBeenCalledWith(mockRawData);
            expect(result).toBe(mockPrepared);
        });
    });
});
