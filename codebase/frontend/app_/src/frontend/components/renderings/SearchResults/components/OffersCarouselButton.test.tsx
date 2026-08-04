import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { CarouselButton, TCarouselButtonProps } from './OffersCarouselButton';

(window as any).BASEPATH = '';

describe('<OffersCarouselButton />', () => {
    const resetMocks = (): TCarouselButtonProps => ({
        carouselState: {
            currentSlide: 1,
            totalItems: 5,
            slidesToShow: 2,
        },
        next: jest.fn(),
        previous: jest.fn(),
        minItemsNumberToShow: 2,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it("shouldn't render", () => {
        mocks.carouselState!.totalItems = 2;
        render(<CarouselButton {...mocks} />);
        expect(screen.queryByTestId('carousel-button-group')).not.toBeInTheDocument();
    });

    it('should NOT render previous button', () => {
        mocks.carouselState!.currentSlide = 0;
        render(<CarouselButton {...mocks} />);
        expect(screen.queryByTestId('prev')).not.toBeInTheDocument();
        const nextButton = screen.getByTestId('next');
        expect(nextButton).toBeInTheDocument();

        fireEvent.click(nextButton);
        expect(mocks.next).toHaveBeenCalled();
    });

    it('should NOT render next button', () => {
        mocks.carouselState!.currentSlide = 3;
        render(<CarouselButton {...mocks} />);
        expect(screen.queryByTestId('next')).not.toBeInTheDocument();
        const prevButton = screen.getByTestId('prev');
        expect(prevButton).toBeInTheDocument();

        fireEvent.click(prevButton);
        expect(mocks.previous).toHaveBeenCalled();
    });

    it('should NOT render when carouselState is not provided', () => {
        mocks.carouselState = undefined;
        render(<CarouselButton {...mocks} />);
        expect(screen.queryByTestId('carousel-button-group')).not.toBeInTheDocument();
    });
});
