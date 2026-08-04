import React from 'react';
import { render, screen } from '@testing-library/react';

import HotelImageCarouselEditMode, { IHotelImageCarouselEditModeProps } from './HotelImageCarouselEditMode';

let mockProps: IHotelImageCarouselEditModeProps;

describe('<HotelImageCarouselEditMode />', () => {
    beforeEach(() => {
        mockProps = {
            amount: 100,
            isLoading: false,
            withoutSelection: true,
        };
    });

    it('should render curate-image when withoutSelection is true', () => {
        render(<HotelImageCarouselEditMode {...mockProps} />);

        expect(screen.getByTestId('add-image')).toBeInTheDocument();
        expect(screen.getByTestId('curate-images')).toBeInTheDocument();
        expect(screen.queryByText(mockProps.amount)).not.toBeInTheDocument();
    });

    it('should NOT render curate-image when withoutSelection is false', () => {
        mockProps.withoutSelection = false;

        render(<HotelImageCarouselEditMode {...mockProps} />);

        expect(screen.getByTestId('add-image')).toBeInTheDocument();
        expect(screen.queryByTestId('curate-images')).not.toBeInTheDocument();
        expect(screen.getByText(`Selected images: :${mockProps.amount}`)).toBeInTheDocument();
    });
});
