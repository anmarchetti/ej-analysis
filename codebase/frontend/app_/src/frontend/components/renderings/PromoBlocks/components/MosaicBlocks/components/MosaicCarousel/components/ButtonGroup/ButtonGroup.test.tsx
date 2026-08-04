import React from 'react';
import { fireEvent, render, within } from '@testing-library/react';

import { ButtonGroup } from './ButtonGroup';

jest.mock('frontend/components/icons-new/ChevronLeft', () => ({
    __esModule: true,
    default: () => <div>ChevronLeft</div>,
}));

jest.mock('frontend/components/icons-new/ChevronRight', () => ({
    __esModule: true,
    default: () => <div>ChevronRight</div>,
}));

const resetMocks = () => ({
    carouselState: { currentSlide: 1, totalItems: 3 },
    previous: jest.fn(),
    next: jest.fn(),
});

let mocks;

describe('<ButtonGroup />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        const { getByTestId } = render(<ButtonGroup {...mocks} />);
        const leftButton = getByTestId('mosaic-carousel-arrow-left');
        const rightButton = getByTestId('mosaic-carousel-arrow-right');

        expect(getByTestId('carousel-button-group')).toHaveClass('carousel-button-group');
        expect(leftButton).toHaveClass('arrow--left');
        expect(within(leftButton).getByText('ChevronLeft')).toBeInTheDocument();
        expect(rightButton).toHaveClass('arrow--right');
        expect(within(rightButton).getByText('ChevronRight')).toBeInTheDocument();
    });

    it('should NOT render left chevron button and render right chevron button when', () => {
        mocks.carouselState.currentSlide = 0;
        const { queryByTestId } = render(<ButtonGroup {...mocks} />);

        expect(queryByTestId('carousel-button-group')).toHaveClass('carousel-button-group');
        expect(queryByTestId('mosaic-carousel-arrow-left')).not.toBeInTheDocument();
        expect(queryByTestId('mosaic-carousel-arrow-right')).toBeInTheDocument();
    });

    it('should NOT render right chevron button and render left chevron button when', () => {
        mocks.carouselState.totalItems = 2;
        const { queryByTestId } = render(<ButtonGroup {...mocks} />);

        expect(queryByTestId('carousel-button-group')).toHaveClass('carousel-button-group');
        expect(queryByTestId('mosaic-carousel-arrow-left')).toBeInTheDocument();
        expect(queryByTestId('mosaic-carousel-arrow-right')).not.toBeInTheDocument();
    });

    it('should NOT render both chevron buttons when', () => {
        mocks.carouselState.currentSlide = 0;
        mocks.carouselState.totalItems = 1;
        const { queryByTestId } = render(<ButtonGroup {...mocks} />);

        expect(queryByTestId('carousel-button-group')).toHaveClass('carousel-button-group');
        expect(queryByTestId('mosaic-carousel-arrow-left')).not.toBeInTheDocument();
        expect(queryByTestId('mosaic-carousel-arrow-right')).not.toBeInTheDocument();
    });

    describe('on button click', () => {
        it('should NOT render both chevron buttons when', () => {
            const { getByTestId } = render(<ButtonGroup {...mocks} />);
            const leftButton = getByTestId('mosaic-carousel-arrow-left');

            fireEvent.click(leftButton);

            expect(mocks.previous).toBeCalled();
        });

        it('should NOT render both chevron buttons when', () => {
            const { getByTestId } = render(<ButtonGroup {...mocks} />);
            const rightButton = getByTestId('mosaic-carousel-arrow-right');

            fireEvent.click(rightButton);

            expect(mocks.next).toBeCalled();
        });
    });
});
