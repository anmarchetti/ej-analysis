import React from 'react';
import { render } from '@testing-library/react';

import ImagesMultipleSortPopup from './ImagesMultipleSortPopup';

const images = [
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
];

const createProps = () => ({
    images: images,
    onClose: jest.fn(),
    deleteSitecoreImages: jest.fn(),
    isApplying: false,
    isSorting: false,
    sortingItemIndex: 1,
    itemIndexesToDelete: [2, 3],
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

jest.mock('frontend/components/common/HotelImage/HotelImage', () => ({ children }) => (
    <div data-tid='hotel-image'>{children}</div>
));

describe('<ImagesMultipleSortPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render popup', () => {
        const { getByTestId } = render(<ImagesMultipleSortPopup {...mockProps} />);

        expect(getByTestId('popup')).toBeInTheDocument();
    });

    it('should render SortableImages', () => {
        const { getAllByTestId } = render(<ImagesMultipleSortPopup {...mockProps} />);

        expect(getAllByTestId('hotel-image').length).toBe(4);
    });

    it('should render button for each image', () => {
        const { getAllByRole } = render(<ImagesMultipleSortPopup {...mockProps} />);

        expect(getAllByRole('button').length).toBe(4);
    });

    it('should NOT render button if images not provided', () => {
        mockProps.images = [];
        const { queryByRole } = render(<ImagesMultipleSortPopup {...mockProps} />);

        expect(queryByRole('button')).not.toBeInTheDocument();
    });
});
