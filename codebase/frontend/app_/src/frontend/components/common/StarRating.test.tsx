import React from 'react';
import { render, screen } from '@testing-library/react';

import { IRatingProps, StarRating } from './StarRating';

const resetMocks = (): IRatingProps => ({
    rating: 4,
    fullRate: false,
});

let mocks;

describe('<StarRating />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should empty render when no rating', () => {
        mocks.rating = null;
        render(<StarRating {...mocks} />);

        expect(screen.queryByTestId('star-rating')).not.toBeInTheDocument();
        expect(screen.queryByTestId('star-rating-single-star')).not.toBeInTheDocument();
    });

    it('Should standard render', () => {
        render(<StarRating {...mocks} />);

        expect(screen.queryByTestId('star-rating')).toBeInTheDocument();
        expect(screen.queryAllByTestId('star-rating-single-star')).toHaveLength(4);
    });

    it('Should render full-rate when fullRate flag enabled', () => {
        mocks.fullRate = true;
        render(<StarRating {...mocks} />);

        expect(screen.queryAllByTestId('star-rating-single-star')).toHaveLength(5);
    });

    it('Should apply the passed className prop', () => {
        mocks.className = 'custom-class';
        render(<StarRating {...mocks} />);

        expect(screen.getByTestId('star-rating')).toHaveClass(mocks.className);
    });
});
