import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { IReviewsListProps, ReviewsList } from './ReviewsList';

describe('<ReviewsList />', () => {
    const resetMocks = (): IReviewsListProps => ({
        reviewsData: {
            averageRating: 4,
            totalReviewsAmount: 5,
            reviews: [],
            reviewRatingAmounts: [],
            subratings: [],
            certificates: [],
            webUrl: '',
        },
        isExpanded: true,
    });

    const mocks = resetMocks();

    it('should standart render', () => {
        render(<ReviewsList {...mocks} />);
        expect(screen.getByTestId('reviews-list')).toBeInTheDocument();
    });

    it('should render with correct aria-hidden attribute', () => {
        render(<ReviewsList {...mocks} />);

        expect(screen.getByTestId('reviews-list')).toHaveAttribute('aria-hidden', `${!mocks.isExpanded}`);
    });
});
