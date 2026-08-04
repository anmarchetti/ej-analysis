import React from 'react';
import { render } from '@testing-library/react';

import ViewBookingHotelGallery from './ViewBookingHotelGallery';

const createProps = () => ({
    fallbackImage: 'fallback',
    images: [
        { small: 'small1', medium: 'medium1', large: 'large1' },
        { small: 'small2', medium: 'medium2', large: 'large2' },
        { small: 'small3', medium: 'medium3', large: 'large3' },
        { small: 'small4', medium: 'medium4', large: 'large4' },
        { small: 'small5', medium: 'medium5', large: 'large5' },
        { small: 'small6', medium: 'medium6', large: 'large6' },
    ],
    isPrintPreview: false,
});

const createStores = () => ({
    appStore: { isScreenLarge: false },
    layoutStore: { isTradePortal: false, isConfirmationPage: false, isExtrasPage: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockHotelImageComponent = jest.fn();
jest.mock('frontend/components/common/HotelImage/HotelImage', () => props => {
    mockHotelImageComponent(props);

    return <div data-tid='hotel-image' />;
});

jest.mock('frontend/components/renderings/SearchResults/components/SliderImage', () => () => (
    <div data-tid='slider-image' />
));

describe('<ViewBookingHotelGallery />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render 5 HotelImages if isScreenLarge and images length >= 5', () => {
        mockStores.appStore.isScreenLarge = true;
        const { getAllByTestId } = render(<ViewBookingHotelGallery {...mockProps} />);

        expect(getAllByTestId('hotel-image').length).toBe(5);
    });

    it('should render 2 HotelImages if isScreenLarge', () => {
        mockStores.appStore.isScreenLarge = true;
        mockProps.images = [
            { small: 'small1', medium: 'medium1', large: 'large1' },
            { small: 'small2', medium: 'medium2', large: 'large2' },
        ];
        const { getAllByTestId } = render(<ViewBookingHotelGallery {...mockProps} />);

        expect(getAllByTestId('hotel-image').length).toBe(2);
    });

    it('should render 2 SliderImage if screen is not large', () => {
        mockProps.images = [
            { small: 'small1', medium: 'medium1', large: 'large1' },
            { small: 'small2', medium: 'medium2', large: 'large2' },
        ];
        const { getAllByTestId } = render(<ViewBookingHotelGallery {...mockProps} />);

        expect(getAllByTestId('slider-image').length).toBe(2);
    });

    describe('image filtering', () => {
        it('should exclude large-only images from the desktop grid', () => {
            mockProps.isPrintPreview = true;
            mockProps.images = [
                { small: 'small1', medium: 'medium1', large: 'large1' },
                { small: '', medium: '', large: 'large2' },
                { small: 'small3', medium: 'medium3', large: 'large3' },
                { small: 'small4', medium: 'medium4', large: 'large4' },
                { small: 'small5', medium: 'medium5', large: 'large5' },
            ];

            const { getAllByTestId } = render(<ViewBookingHotelGallery {...mockProps} />);

            expect(getAllByTestId('hotel-image').length).toBe(4);
        });

        it('should exclude large-only images from the mobile slider', () => {
            mockProps.images = [
                { small: 'small1', medium: 'medium1', large: 'large1' },
                { small: '', medium: '', large: 'large2' },
                { small: 'small3', medium: 'medium3', large: 'large3' },
            ];

            const { getAllByTestId } = render(<ViewBookingHotelGallery {...mockProps} />);

            expect(getAllByTestId('slider-image').length).toBe(2);
        });
    });
});
