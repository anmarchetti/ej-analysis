import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import SliderNavButton from 'frontend/components/common/SliderNavButton';

import MasonryItem from './components/MasonryItem/MasonryItem';
import OneRowTemplate from './components/OneRowTemplate';
import TwoColumnsTemplate from './components/TwoColumnsTemplate';
import TwoRowsTemplate from './components/TwoRowsTemplate';
import MasonryCarousel, { IDestination, TMasonryCarouselProps } from './MasonryCarousel';

const mockReactImageGallery = jest.fn();
jest.mock('react-image-gallery', () => ({
    __esModule: true,
    default: props => {
        mockReactImageGallery(props);

        return <div data-tid='react-image-gallery' />;
    },
}));

const mockMasonryItem = jest.fn();
jest.mock('./components/MasonryItem/MasonryItem', () => ({
    __esModule: true,
    default: props => {
        mockMasonryItem(props);

        return <div data-tid='masonry-item' />;
    },
}));

let mockIsMoreThenMobileScreen = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenMobileViewport: () => mockIsMoreThenMobileScreen,
}));

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

jest.mock('frontend/utils/livePrice.utils', () => ({
    __esModule: true,
    getDestinationLivePriceByCode: jest.fn().mockReturnValue({
        pricePP: 100,
        currency: undefined,
        price: 200,
        touristTaxPP: 10,
        touristTax: 20,
        priceExcludingTouristTax: 180,
        pricePPExcludingTouristTax: 90,
    }),
}));

const createStores = () =>
    createMockStores({
        hotelsStore: {
            getLivePrice: jest.fn(),
            getDestinationsAvailability: jest.fn(),
        },
        layoutStore: {
            isMasonryCarouselLivePriceEnabled: true,
            isLivePriceEnabledForDestination: jest.fn(),
            destinationCode: 'test',
            isDestinationUnavailableBannerEnabled: true,
            isTouristTaxEnabled: true,
        },
    });

const initialFields: ISitecoreChildren<IDestination> = {
    id: 'id',
    name: 'Test Destination',
    displayName: 'Test Destination',
    fields: {
        Image: {
            value: {
                src: '/test.jpg',
                alt: 'Test Destination',
                width: 800,
                height: 600,
            },
        },
        Name: { value: 'Test Destination' },
        Code: { value: 'Code' },
        HotelTheme: {
            fields: {
                Code: mockSitecoreField('CodeTheme'),
                Description: mockSitecoreField('Description'),
                DestinationGuideTitle: mockSitecoreField('DestinationGuideTitle'),
                DestinationGuideUrl: mockSitecoreField('DestinationGuideUrl'),
                Icon: mockSitecoreImageField('icon'),
                Name: mockSitecoreField('Name'),
                PackageIcons: [],
            },
            id: 'HotelThemeId',
        },
        HotelThemeType: [
            {
                fields: {
                    Bd4ThemeTypeCode: mockSitecoreField('Bd4ThemeTypeCode'),
                    Code: mockSitecoreField('CodeType'),
                    Description: mockSitecoreField('DescriptionType'),
                    DestinationGuideTitle: mockSitecoreField('DestinationGuideTitleType'),
                    DestinationGuideUrl: mockSitecoreField('DestinationGuideUrlType'),
                    Icon: mockSitecoreField(mockSitecoreImageField('icon')),
                    Name: mockSitecoreField('NameType'),
                },
                id: 'HotelThemeTypeId-0',
            },
        ],
    },
};

const resetMocks = (): TMasonryCarouselProps => ({
    fields: {
        items: [initialFields],
    },
    params: {},
    rendering: {},
});

let mockStores;
let mocks: TMasonryCarouselProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<MasonryCarousel />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should be empty render', () => {
        mocks.fields = undefined;
        const { container } = render(<MasonryCarousel {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call getLivePrice and getDestinationsAvailability', () => {
        mockStores.layoutStore.isLivePriceEnabledForDestination = jest.fn().mockReturnValue(true);
        render(<MasonryCarousel {...mocks} />);
        expect(mockStores.hotelsStore.getLivePrice).toHaveBeenCalledWith(['Code']);
        expect(mockStores.hotelsStore.getDestinationsAvailability).toHaveBeenCalledWith('Code');
    });

    it('should NOT call getLivePrice and getDestinationsAvailability when settings disabled', () => {
        mockStores.layoutStore.isMasonryCarouselLivePriceEnabled = false;
        mockStores.layoutStore.isDestinationUnavailableBannerEnabled = false;
        render(<MasonryCarousel {...mocks} />);
        expect(mockStores.hotelsStore.getLivePrice).not.toHaveBeenCalled();
        expect(mockStores.hotelsStore.getDestinationsAvailability).not.toHaveBeenCalled();
    });

    describe('Carousel with grouped items on medium screens', () => {
        beforeEach(() => {
            mockIsMoreThenMobileScreen = true;
        });

        it('should render 2 slides with nav and without dots', () => {
            mocks.fields!.items = Array.from({ length: 8 }, () => ({ ...initialFields }));
            render(<MasonryCarousel {...mocks} />);
            expect(mockReactImageGallery).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: [
                        mocks
                            .fields!.items.map(item => ({
                                ...item,
                                pricePP: 100,
                                currency: undefined,
                                touristTaxPP: 10,
                                priceExcludingTouristTax: 180,
                                pricePPExcludingTouristTax: 90,
                                touristTax: 20,
                                isPriceValid: true,
                            }))
                            .slice(0, 7),
                        [
                            {
                                ...mocks.fields!.items[7],
                                pricePP: 100,
                                currency: undefined,
                                touristTaxPP: 10,
                                pricePPExcludingTouristTax: 90,
                                priceExcludingTouristTax: 180,
                                touristTax: 20,
                                isPriceValid: true,
                            },
                        ],
                    ],
                    showThumbnails: false,
                    showFullscreenButton: false,
                    showPlayButton: false,
                    showNav: true,
                    showBullets: false,
                    availability: null,
                }),
            );
            const { renderLeftNav, renderRightNav } = mockReactImageGallery.mock.calls[0][0];

            const onClick = jest.fn();
            const leftNav = renderLeftNav(onClick);
            const rightNav = renderRightNav(onClick);

            expect(leftNav.type).toBe(SliderNavButton);
            expect(leftNav.props).toMatchObject({
                isLeftNav: true,
                onClick,
            });
            expect(rightNav.type).toBe(SliderNavButton);
            expect(rightNav.props).toMatchObject({
                onClick,
            });
        });

        it('should render OneRowTemplate for 1 item', async () => {
            mocks.fields!.items = Array.from({ length: 1 }, () => ({ ...initialFields }));

            render(<MasonryCarousel {...mocks} />);

            const { renderItem, items } = mockReactImageGallery.mock.calls[0][0];

            const element = renderItem(items[0]);

            expect(element.type).toBe(OneRowTemplate);
            expect(element.props).toMatchObject({
                items: items[0],
                className: '',
                destinationsAvailability: null,
            });
        });

        it('should render OneRowTemplate for 2 items', () => {
            mocks.fields!.items = Array.from({ length: 2 }, () => ({ ...initialFields }));

            render(<MasonryCarousel {...mocks} />);

            const { renderItem, items } = mockReactImageGallery.mock.calls[0][0];

            const element = renderItem(items[0]);

            expect(element.type).toBe(OneRowTemplate);
            expect(element.props).toMatchObject({
                items: items[0],
                className: '',
                destinationsAvailability: null,
            });
        });

        it('should render OneRowTemplate for 3 items', () => {
            mocks.fields!.items = Array.from({ length: 3 }, () => ({ ...initialFields }));

            render(<MasonryCarousel {...mocks} />);

            const { renderItem, items } = mockReactImageGallery.mock.calls[0][0];

            const element = renderItem(items[0]);

            expect(element.type).toBe(OneRowTemplate);
            expect(element.props).toMatchObject({
                items: items[0],
                className: '',
                destinationsAvailability: null,
            });
        });

        it('should render TwoRowsTemplate for 4 items', () => {
            mocks.fields!.items = Array.from({ length: 4 }, () => ({ ...initialFields }));

            render(<MasonryCarousel {...mocks} />);

            const { renderItem, items } = mockReactImageGallery.mock.calls[0][0];

            const element = renderItem(items[0]);

            expect(element.type).toBe(TwoRowsTemplate);
            expect(element.props).toMatchObject({
                items: items[0],
                destinationsAvailability: null,
            });
        });

        it('should render TwoRowsTemplate for 6 items', () => {
            mocks.fields!.items = Array.from({ length: 6 }, () => ({ ...initialFields }));

            render(<MasonryCarousel {...mocks} />);

            const { renderItem, items } = mockReactImageGallery.mock.calls[0][0];

            const element = renderItem(items[0]);

            expect(element.type).toBe(TwoRowsTemplate);
            expect(element.props).toMatchObject({
                items: items[0],
                destinationsAvailability: null,
            });
        });

        it('should render TwoColumnsTemplate for 5 items', () => {
            mocks.fields!.items = Array.from({ length: 5 }, () => ({ ...initialFields }));

            render(<MasonryCarousel {...mocks} />);

            const { renderItem, items } = mockReactImageGallery.mock.calls[0][0];

            const element = renderItem(items[0]);

            expect(element.type).toBe(TwoColumnsTemplate);
            expect(element.props).toMatchObject({
                items: items[0],
                destinationsAvailability: null,
            });
        });

        it('should render TwoColumnsTemplate for 7 items', () => {
            mocks.fields!.items = Array.from({ length: 7 }, () => ({ ...initialFields }));

            render(<MasonryCarousel {...mocks} />);

            const { renderItem, items } = mockReactImageGallery.mock.calls[0][0];

            const element = renderItem(items[0]);

            expect(element.type).toBe(TwoColumnsTemplate);
            expect(element.props).toMatchObject({
                items: items[0],
                destinationsAvailability: null,
            });
        });

        it('should render MasonryItem', () => {
            mocks.fields!.items = Array.from({ length: 1 }, () => ({ ...initialFields }));

            render(<MasonryCarousel {...mocks} />);

            const { renderItem, items } = mockReactImageGallery.mock.calls[0][0];

            const element = renderItem(items[0][0]);

            expect(element.type).toBe(MasonryItem);
            expect(element.props).toMatchObject({
                item: items[0][0],
                isUnavailable: false,
            });
        });
    });

    describe('Carousel with one item per slide on small screens', () => {
        beforeEach(() => {
            mockIsMoreThenMobileScreen = false;
        });

        it('should render one slide without dots', () => {
            render(<MasonryCarousel {...mocks} />);
            expect(mockReactImageGallery).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: [
                        {
                            ...mocks.fields!.items[0],
                            pricePP: 100,
                            currency: undefined,
                            touristTaxPP: 10,
                            priceExcludingTouristTax: 180,
                            pricePPExcludingTouristTax: 90,
                            touristTax: 20,
                            isPriceValid: true,
                        },
                    ],
                    showThumbnails: false,
                    showFullscreenButton: false,
                    showPlayButton: false,
                    showNav: false,
                    showBullets: false,
                    availability: null,
                }),
            );
        });

        it('should render one slide without dots', () => {
            mocks.fields!.items = Array.from({ length: 2 }, () => ({ ...initialFields }));

            render(<MasonryCarousel {...mocks} />);
            expect(mockReactImageGallery).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: mocks.fields!.items.map(item => ({
                        ...item,
                        pricePP: 100,
                        touristTaxPP: 10,
                        priceExcludingTouristTax: 180,
                        pricePPExcludingTouristTax: 90,
                        touristTax: 20,
                        currency: undefined,
                        isPriceValid: true,
                    })),

                    showThumbnails: false,
                    showFullscreenButton: false,
                    showPlayButton: false,
                    showNav: true,
                    showBullets: true,
                    availability: null,
                }),
            );
        });
    });

    it('should render tax info when isTouristTaxEnabled is true', () => {
        render(<MasonryCarousel {...mocks} />);

        expect(screen.getByTestId('tax-tooltip')).toBeInTheDocument();
    });

    it('should NOT render tax info when isTouristTaxEnabled is false', () => {
        mockStores.layoutStore.isTouristTaxEnabled = false;
        render(<MasonryCarousel {...mocks} />);

        expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
    });
});
