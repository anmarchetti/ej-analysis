import React from 'react';
import { render } from '@testing-library/react';

import StarRatingNew from './StarRatingNew';

const createProps = () => ({
    rating: 3.3,
    showOnlyFull: false,
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<StarRatingNew />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render when rating NOT provided', () => {
        mockProps.rating = 0;
        const { queryByTestId } = render(<StarRatingNew {...mockProps} />);

        expect(queryByTestId('star-icon')).not.toBeInTheDocument();
    });

    it('should render 3 full stars', () => {
        mockProps.showOnlyFull = true;
        const { getAllByTestId } = render(<StarRatingNew {...mockProps} />);

        expect(getAllByTestId('star-icon').length).toBe(3);
    });

    it('should render 4 full stars', () => {
        mockProps.showOnlyFull = true;
        mockProps.rating = 3.5;
        const { getAllByTestId } = render(<StarRatingNew {...mockProps} />);

        expect(getAllByTestId('star-icon').length).toBe(4);
    });

    it('should render star rating', () => {
        const { getByTestId } = render(<StarRatingNew {...mockProps} />);

        expect(getByTestId('star-rating')).toBeInTheDocument();
    });

    it('should render 6 stars - 3 filled and one partially filled', () => {
        const { getAllByTestId, container } = render(<StarRatingNew {...mockProps} />);

        expect(getAllByTestId('star-icon').length).toBe(6);
        expect(container.getElementsByClassName('star-rating__svg-box--filled').length).toBe(3);
        expect(container.getElementsByClassName('star-rating__svg-box-fill').length).toBe(1);
    });
});
