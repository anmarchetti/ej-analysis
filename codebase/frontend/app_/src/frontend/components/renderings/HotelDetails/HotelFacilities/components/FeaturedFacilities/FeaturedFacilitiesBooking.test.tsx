import React from 'react';
import { render, screen } from '@testing-library/react';

import { IFeaturedFacility } from 'models/data/IFeaturedFacility';

import FeaturedFacilitiesBooking from './FeaturedFacilitiesBooking';

const createProps = () => ({
    loadFeaturedFacilities: jest.fn(),
    featuredFacilities: [],
    isScreenExtraSmall: false,
    selectedOffer: null,
});

const createStores = () => ({
    bookingStore: {
        loadFeaturedFacilities: jest.fn(),
        featuredFacilities: [
            {
                title: 'title1',
                description: 'description1',
                image: 'image1',
                link: { anchor: 'anchor', linkType: 'anchor', text: 'text', url: 'url', target: 'target' },
                externalImage: { small: 'small', medium: 'medium', large: 'large' },
            },
            {
                title: 'title2',
                description: 'description2',
                image: 'image2',
                link: { anchor: 'anchor', linkType: 'anchor', text: 'text', url: 'url', target: 'target' },
                externalImage: { small: 'small', medium: 'medium', large: 'large' },
            },
            {
                title: 'title3',
                description: 'description3',
                image: 'image3',
                link: { anchor: 'anchor', linkType: 'anchor', text: 'text', url: 'url', target: 'target' },
                externalImage: { small: 'small', medium: 'medium', large: 'large' },
            },
        ] as IFeaturedFacility[],
        selectedOffer: {},
    },
    appStore: { isScreenExtraSmall: false },
    layoutStore: {},
    routerStore: {},
    queryParamStore: {},
    userStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FeaturedFacilities/FeaturedFacilitiesTitle',
    () => () => <div data-tid='featured-facilities-title' />,
);

jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FeaturedFacilities/FeaturedFacilitiesItem',
    () => () => <div data-tid='featured-facilities-item' />,
);

jest.mock('frontend/components/common/SliderButtonsGroup', () => () => <div data-tid='slider-buttons-group' />);

const mockCarousel = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        default: forwardRef(({ children, customButtonGroup, ...props }: any, ref: any) => {
            mockCarousel(props);

            return (
                <div data-tid='carousel' ref={ref}>
                    {children}
                    {customButtonGroup}
                </div>
            );
        }),
    };
});

describe('<FeaturedFacilitiesBooking />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if items not provided', () => {
        mockStores.bookingStore.featuredFacilities = [];

        const { container } = render(<FeaturedFacilitiesBooking {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if no title, description and image', () => {
        mockStores.bookingStore.featuredFacilities = [
            {
                link: { anchor: 'anchor', linkType: 'anchor', text: 'text', url: 'url', target: 'target' },
                externalImage: { small: 'small', medium: 'medium', large: 'large' },
            },
            {
                link: { anchor: 'anchor', linkType: 'anchor', text: 'text', url: 'url', target: 'target' },
                externalImage: { small: 'small', medium: 'medium', large: 'large' },
            },
            {
                link: { anchor: 'anchor', linkType: 'anchor', text: 'text', url: 'url', target: 'target' },
                externalImage: { small: 'small', medium: 'medium', large: 'large' },
            },
        ] as IFeaturedFacility[];

        const { container } = render(<FeaturedFacilitiesBooking {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render FeaturedFacilitiesTitle, Carousel, FeaturedFacilitiesItems and SliderButtonsGroup', () => {
        render(<FeaturedFacilitiesBooking {...mockProps} />);

        expect(screen.getByTestId('featured-facilities-title')).toBeInTheDocument();
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getByTestId('slider-buttons-group')).toBeInTheDocument();
        expect(screen.getAllByTestId('featured-facilities-item')).toHaveLength(6);
        expect(mockCarousel).toHaveBeenCalledWith({
            arrows: false,
            containerClass: 'carousel-container',
            infinite: true,
            responsive: {
                desktop: { breakpoint: { max: 9999, min: 1024 }, items: 3 },
                mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
                tablet: { breakpoint: { max: 1024, min: 768 }, items: 2 },
            },
            showDots: true,
        });
    });

    it('should render hide-down-md class when there is NOT more items than max items', () => {
        render(<FeaturedFacilitiesBooking {...mockProps} />);

        expect(screen.getByTestId('promo-blocks-facilities')).toHaveClass('hide-down-md');
    });

    it('should render hide class when there is more items than max items', () => {
        mockStores.bookingStore.featuredFacilities = [
            ...mockStores.bookingStore.featuredFacilities,
            ...mockStores.bookingStore.featuredFacilities,
            ...mockStores.bookingStore.featuredFacilities,
        ];

        render(<FeaturedFacilitiesBooking {...mockProps} />);

        expect(screen.getByTestId('promo-blocks-facilities')).toHaveClass('hide');
    });

    it('should render hide class when there is NOT more items than max items and isScreenExtraSmall', () => {
        mockStores.appStore.isScreenExtraSmall = true;
        const { container } = render(<FeaturedFacilitiesBooking {...mockProps} />);

        expect(container.getElementsByClassName('hide').length).toBe(1);
    });
});
