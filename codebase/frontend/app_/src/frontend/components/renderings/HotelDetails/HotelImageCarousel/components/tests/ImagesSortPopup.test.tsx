import React from 'react';
import { render } from '@testing-library/react';

import ImagesSortPopup from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/ImagesSortPopup';

const createProps = () => ({
    images: [
        {
            index: 1,
            image: { small: 'small', medium: 'medium', large: 'large', description: 'desc1', selected: true },
            totalSlides: 4,
        },
        {
            index: 2,
            image: { small: 'small2', medium: 'medium2', large: 'large2', description: 'desc2' },
            totalSlides: 4,
        },
        {
            index: 3,
            image: { small: 'small3', medium: 'medium3', large: 'large3', description: 'desc3' },
            totalSlides: 4,
        },
        {
            index: 4,
            image: { small: 'small4', medium: 'medium4', large: 'large4', description: 'desc4' },
            totalSlides: 4,
        },
    ],
    onClose: jest.fn(),
    isApplying: false,
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

jest.mock('frontend/components/common/HotelImage/HotelImage', () => () => <div data-tid='hotel-image' />);

describe('<ImagesSortPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render popup', () => {
        const { getByTestId } = render(<ImagesSortPopup {...mockProps} />);

        expect(getByTestId('popup')).toBeInTheDocument();
    });

    it('should render SortableImages', () => {
        const { getAllByTestId } = render(<ImagesSortPopup {...mockProps} />);

        expect(getAllByTestId('hotel-image').length).toBe(4);
    });
});
