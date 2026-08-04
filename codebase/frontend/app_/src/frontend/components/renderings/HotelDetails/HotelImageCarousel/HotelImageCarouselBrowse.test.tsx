import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, imageMock } from 'frontend/__mocks__';
import SiteSettings from 'models/enum/SiteSettings';

import HotelImageCarouselBrowse from './HotelImageCarouselBrowse';

const createProps = () => ({
    rendering: { fields: {} },
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            layout: {
                sitecore: { route: { fields: { Name: { value: 'test' } } } },
            },
        },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockHotelImageCarousel = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/HotelImageCarousel/components/HotelImageCarousel', () => ({
    __esModule: true,
    default: props => {
        mockHotelImageCarousel(props);

        return <div data-tid='hotel-image-carousel' />;
    },
}));

describe('<HotelImageCarouselBrowse />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render HotelImageCarousel without images when images are NOT provided', () => {
        render(<HotelImageCarouselBrowse {...mockProps} />);

        expect(screen.getByTestId('hotel-image-carousel')).toBeInTheDocument();
        expect(mockHotelImageCarousel).toHaveBeenCalledWith({
            fallbackImage: SiteSettings.HotelFallbackImage,
            offer: { accom: { isExt: false }, hotel: { images: [], name: 'test' } },
            rendering: { fields: {} },
            withoutSelection: true,
        });
    });

    it('should render HotelImageCarousel with images from fields', () => {
        mockProps.rendering.fields = [imageMock];

        render(<HotelImageCarouselBrowse {...mockProps} />);

        expect(mockHotelImageCarousel).toHaveBeenCalledWith({
            fallbackImage: SiteSettings.HotelFallbackImage,
            offer: {
                accom: { isExt: false },
                hotel: {
                    images: [
                        {
                            description: 'image_Description',
                            id: 'image_id',
                            large: 'image_large',
                            medium: 'image_medium',
                            small: 'image_small',
                        },
                    ],
                    name: 'test',
                },
            },
            rendering: mockProps.rendering,
            withoutSelection: true,
        });
    });

    it('should include images that have medium or both large+small, and exclude large-only or small-only', () => {
        mockProps.rendering.fields = {
            images: [
                imageMock,
                { medium: 'medium1', small: 'small1' },
                { large: 'large1', small: 'small1' },
                { large: 'large1', medium: 'medium1' },
                { large: 'large-only' },
                { small: 'small-only' },
            ],
            Name: { value: 'test title' },
        };

        render(<HotelImageCarouselBrowse {...mockProps} />);

        expect(mockHotelImageCarousel).toHaveBeenCalledWith({
            fallbackImage: SiteSettings.HotelFallbackImage,
            offer: {
                accom: { isExt: false },
                hotel: {
                    images: [
                        {
                            description: 'image_Description',
                            id: 'image_id',
                            large: 'image_large',
                            medium: 'image_medium',
                            small: 'image_small',
                        },
                        { medium: 'medium1', small: 'small1' },
                        { large: 'large1', small: 'small1' },
                        { large: 'large1', medium: 'medium1' },
                    ],
                    name: 'test',
                },
            },
            rendering: mockProps.rendering,
            withoutSelection: true,
        });
    });
});
