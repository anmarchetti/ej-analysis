import * as React from 'react';
import { render } from '@testing-library/react';

import { mockHotel } from 'frontend/__mocks__/hotel';
import { deepClone } from 'frontend/utils/array.utils';

import { HotelReviewsBooking } from './HotelReviewsBooking';

const mockReviewsProps = jest.fn();

jest.mock('./components/Reviews', () => ({
    __esModule: true,
    default: props => {
        mockReviewsProps(props);

        return <div data-tid='reviews' />;
    },
}));

const createStores = () => ({
    bookingStore: { hotel: deepClone(mockHotel) },
});

const createProps = () => ({
    params: { Anchor: '' },
    rendering: {},
    fields: undefined,
});

let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HotelReviewsBooking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<HotelReviewsBooking {...mockProps} />);

        expect(mockReviewsProps).toHaveBeenCalledWith({
            rating: mockStores.bookingStore.hotel.rating,
            reviews: mockStores.bookingStore.hotel.numberOfReviews,
            tripadvisorId: mockStores.bookingStore.hotel.tripAdvisorId,
            anchor: mockProps.params.Anchor,
            showRatingValue: true,
        });
    });
});
