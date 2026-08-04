import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('frontend/components/common/HotelImage/HotelImage', () => ({
    __esModule: true,
    default: () => <div data-tid='hotel-card-img' />,
}));

import SliderImage from './SliderImage';

describe('<SliderImage />', () => {
    const resetMocks = () => ({
        item: {
            image: {
                small: 'small',
                medium: 'medium',
                large: 'large',
            },
            index: 1,
            totalSlides: 10,
        },
        slideIndex: 1,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render image if index is in range', () => {
        render(<SliderImage {...mocks} />);

        expect(screen.getAllByTestId('hotel-card-img')).toHaveLength(1);
    });

    it('should NOT render image if index is not in range', () => {
        mocks.item.index = 5;
        render(<SliderImage {...mocks} />);

        expect(screen.queryAllByTestId('hotel-card-img')).toHaveLength(0);
    });
});
