import React from 'react';
import { render, screen } from '@testing-library/react';

import TripadvisorRating, { ITripadvisorRatingProps } from './TripadvisorRating';

jest.mock('frontend/components/icons-new/TripAdvisor', () => ({
    __esModule: true,
    default: () => <div data-tid='mock-tripadvisor-icon' />,
}));

const resetMocks = (): ITripadvisorRatingProps => ({
    rating: 4,
});

let mocks: ITripadvisorRatingProps;

describe('TripadvisorRating', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('Rating rounding logic', () => {
        const testCases = [
            { input: 3.1, expectedFull: 3, expectedHalf: 0 },
            { input: 3.2, expectedFull: 3, expectedHalf: 0 },
            { input: 3.3, expectedFull: 3, expectedHalf: 1 },
            { input: 3.4, expectedFull: 3, expectedHalf: 1 },
            { input: 3.5, expectedFull: 3, expectedHalf: 1 },
            { input: 3.6, expectedFull: 3, expectedHalf: 1 },
            { input: 3.7, expectedFull: 3, expectedHalf: 1 },
            { input: 3.8, expectedFull: 4, expectedHalf: 0 },
            { input: 3.9, expectedFull: 4, expectedHalf: 0 },
            { input: 4, expectedFull: 4, expectedHalf: 0 },
        ];

        testCases.forEach(({ input, expectedFull, expectedHalf }) => {
            it(`should correctly render rating ${input}`, () => {
                mocks.rating = input;
                const { container } = render(<TripadvisorRating {...mocks} />);

                expect(container.getElementsByClassName('active')).toHaveLength(expectedFull);
                expect(container.getElementsByClassName('active--half')).toHaveLength(expectedHalf);
            });
        });
    });

    it('should render with Tripadvisor icon when hasIcon is true', () => {
        mocks.hasIcon = true;
        render(<TripadvisorRating {...mocks} />);

        expect(screen.getByTestId('mock-tripadvisor-icon')).toBeInTheDocument();
    });

    it('should not render Tripadvisor icon when hasIcon is false', () => {
        mocks.hasIcon = false;
        render(<TripadvisorRating {...mocks} />);

        expect(screen.queryByTestId('mock-tripadvisor-icon')).not.toBeInTheDocument();
    });

    it('should render exactly 5 stars', () => {
        const { container } = render(<TripadvisorRating {...mocks} />);

        expect(container.querySelectorAll('.tripadvisor_rating > span')).toHaveLength(5);
    });

    it('should apply custom class when customClass is provided', () => {
        mocks.customClass = 'customClass';
        const { container } = render(<TripadvisorRating {...mocks} />);

        expect(container.firstChild).toHaveClass('customClass');
    });

    it('should render rating value when showRatingValue is true', () => {
        mocks.showRatingValue = true;
        render(<TripadvisorRating {...mocks} />);

        expect(screen.getByTestId('tripadvisor-rating-value')).toHaveTextContent(mocks.rating.toString());
    });
});
