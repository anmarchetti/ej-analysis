import React from 'react';
import { render, screen } from '@testing-library/react';

import HotelInfoShimmer, { THotelInfoShimmerProps } from './HotelInfoShimmer';

describe('<HotelInfoShimmer />', () => {
    const resetMocks = (): THotelInfoShimmerProps => ({
        isExtrasPage: false,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('renders shimmer', () => {
        render(<HotelInfoShimmer {...mocks} />);

        expect(screen.getByTestId('shimmer')).toBeInTheDocument();
        expect(screen.getByTestId('placeholder-hotel-info-banner')).toBeInTheDocument();
        expect(screen.getByTestId('placeholder-hotel-info-facilities')).toBeInTheDocument();
    });

    it('does NOT render shimmer for banner and facilities on Extras page', () => {
        mocks.isExtrasPage = true;
        render(<HotelInfoShimmer {...mocks} />);

        expect(screen.getByTestId('shimmer')).toBeInTheDocument();
        expect(screen.queryByTestId('placeholder-hotel-info-banner')).not.toBeInTheDocument();
        expect(screen.queryByTestId('placeholder-hotel-info-facilities')).not.toBeInTheDocument();
    });
});
