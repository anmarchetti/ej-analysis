import React from 'react';
import { render, screen } from '@testing-library/react';

import HotelImageCarouselShimmer from './HotelImageCarouselShimmer';

describe('<HotelImageCarousel />', () => {
    it('should render HotelMainSidebarShimmer', () => {
        render(<HotelImageCarouselShimmer />);

        const hotelMainSidebarShimmer = screen.getByTestId('hotel-main-sidebar-shimmer');

        expect(hotelMainSidebarShimmer).toBeInTheDocument();
    });
});
