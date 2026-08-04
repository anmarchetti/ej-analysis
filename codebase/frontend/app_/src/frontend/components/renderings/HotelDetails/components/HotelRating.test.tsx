import React from 'react';
import { render, screen } from '@testing-library/react';

import HotelRating from './HotelRating';

describe('<HotelRating />', () => {
    const resetMocks = () =>
        ({
            rating: 4,
        } as any);

    let props = resetMocks();

    beforeEach(() => {
        props = resetMocks();
    });

    it('should render the correct number of stars for a given rating', () => {
        const rating = 4;
        const { container } = render(<HotelRating {...props} />);

        const ratingContainer = container.querySelector('.star_rating');
        expect(ratingContainer).toBeInTheDocument();

        const starIcons = screen.getAllByRole('img', { hidden: true });
        expect(starIcons).toHaveLength(rating);

        starIcons.forEach(star => {
            expect(star).toHaveAttribute('data-icon', 'star');
            expect(star).toHaveClass('svg-inline--fa fa-star fa-w-18');
        });
    });

    it('should render nothing (null) if the rating is 0', () => {
        props.rating = 0;

        const { container } = render(<HotelRating {...props} />);

        expect(container.firstChild).toBeNull();
        expect(screen.queryAllByRole('img', { hidden: true })).toHaveLength(0);
    });

    it('should render nothing (null) if the rating is falsy', () => {
        props.rating = undefined;

        const { container } = render(<HotelRating {...props} />);

        expect(container.firstChild).toBeNull();
        expect(screen.queryAllByRole('img')).toHaveLength(0);
    });

    it('should render 5 stars if rating is 5', () => {
        props.rating = 5;

        render(<HotelRating {...props} />);

        const starIcons = screen.getAllByRole('img', { hidden: true });
        expect(starIcons).toHaveLength(5);
    });
});
