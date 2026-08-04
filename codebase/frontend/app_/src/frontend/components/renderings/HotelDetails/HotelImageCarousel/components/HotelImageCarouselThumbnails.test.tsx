import React from 'react';
import { render, screen } from '@testing-library/react';

import HotelImageCarouselThumbnails from './HotelImageCarouselThumbnails';

let mockProps;

describe('<HotelImageCarouselThumbnails />', () => {
    beforeEach(() => {
        mockProps = {
            isLoading: true,
        };
    });

    it('should render skeleton when isLoading is true', () => {
        render(<HotelImageCarouselThumbnails {...mockProps} />);

        expect(screen.getByTestId('placeholder-thumbnails')).toBeInTheDocument();
        expect(screen.queryByTestId('img-carousel-thumbnails')).not.toBeInTheDocument();
    });

    it('should render figure when isLoading is false', () => {
        mockProps.isLoading = false;

        render(<HotelImageCarouselThumbnails {...mockProps} />);

        expect(screen.queryByTestId('placeholder-thumbnails')).not.toBeInTheDocument();
        expect(screen.getByTestId('img-carousel-thumbnails')).toBeInTheDocument();
    });
});
