import * as React from 'react';
import { mockAllIsIntersecting } from 'react-intersection-observer/test-utils';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockCustomisableTitleAndDescriptionParams } from 'frontend/__mocks__/customisableParams';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import { FeaturedHotels, TFeaturedHotelsProps } from './FeaturedHotels';

const createStores = () =>
    createMockStores({
        layoutStore: {
            isEditMode: false,
            isFeaturedHotelsLivePriceEnabled: false,
            isNumberOfNightsLabelsEnabled: true,
            isHomePage: false,
            isTouristTaxEnabled: true,
        },
        routerStore: { searchResultsUrl: '' },
        queryParamStore: { buildSearchQueryByLivePrice: '' },
        bookingStore: { setSearchValuesByQueryString: '' },
        hotelsStore: { getLivePrice: jest.fn().mockReturnValue([]) },
        trackingStore: { trackFeaturedHotelsImpression: jest.fn(), trackPersonalizedClick: jest.fn() },
    });

let mockStores;

const mockFeaturedHotelCardComponent = jest.fn();
jest.mock('frontend/components/renderings/FeaturedHotels/components/FeaturedHotelCard', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockFeaturedHotelCardComponent(props);

        return <div data-tid='featured-hotel-card' onClick={onClick} />;
    },
}));

const mockRerenderHelper = jest.fn();
jest.mock('frontend/components/renderings/FeaturedHotels/components/FeaturedHotelsRenderHelper', () => props => {
    mockRerenderHelper(props);

    return <div data-tid='featured-hotels-render-helper' />;
});

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

jest.mock('frontend/utils/livePrice.utils', () => ({
    ...jest.requireActual('frontend/utils/livePrice.utils'),
    getDestinationLivePriceByCode: jest.fn().mockReturnValue({ pricePP: 100, code: '43212' }),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FeaturedHotels />', () => {
    const resetMocks = (): TFeaturedHotelsProps => ({
        fields: {
            Title: mockSitecoreField('Title')!,
            Description: mockSitecoreField('Description'),
            EnableNumberOfNights: mockSitecoreField(true),
            FeaturedHotels: [
                {
                    Url: 'Url',
                    Image: mockSitecoreField(mockSitecoreImageField('src'))!,
                    Name: 'Name',
                    BookFrom: new Date().toDateString(),
                    StarRating: '4',
                    Region: 'Region',
                    Country: 'Country',
                    BookFromTitle: 'Title',
                    BookFromText: 'Text',
                    GiataCode: '43212',
                },
            ],
        },
        params: mockCustomisableTitleAndDescriptionParams,
        rendering: { uid: '1dbe1dff-2128-4701-a0f4-6b1ca4c03468' } as ISitecoreComponent['rendering'],
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should NOT render if fields are NOT provided', () => {
        mocks.fields = null as any;
        const { container } = render(<FeaturedHotels {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if FeaturedHotels are NOT provided', () => {
        mocks.fields!.FeaturedHotels = [];
        const { container } = render(<FeaturedHotels {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render with hotelCard and text-block-header and text-block-description when we have Title, Description without rows or carousel', () => {
        render(<FeaturedHotels {...mocks} />);

        expect(screen.getByTestId('featured-hotels-block')).toBeInTheDocument();
        expect(screen.getByTestId('text-block-header')).toBeInTheDocument();
        expect(screen.getByTestId('text-block-description')).toBeInTheDocument();
        expect(screen.getByTestId('featured-hotel-card')).toBeInTheDocument();
        expect(screen.queryByTestId('featured-hotels-carousel')).not.toBeInTheDocument();
        expect(screen.queryByTestId('featured-hotels-two-rows')).not.toBeInTheDocument();
        expect(mockFeaturedHotelCardComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                displayNumberOfNights: true,
                fallbackImage: 'HotelFallbackImage',
            }),
        );
    });

    it('should render without text-block-header and text-block-description when Title and Description are NOT provided', () => {
        mocks.fields!.Title.value = '';
        mocks.fields!.Description.value = '';
        render(<FeaturedHotels {...mocks} />);

        expect(screen.getByTestId('featured-hotel-card')).toBeInTheDocument();
        expect(screen.queryByTestId('text-block-header')).not.toBeInTheDocument();
        expect(screen.queryByTestId('text-block-description')).not.toBeInTheDocument();
    });

    it('should set isShowCarousel to false when less than 5 hotels are provided', () => {
        mocks.fields!.FeaturedHotels.push({
            Url: 'Url',
            Image: { value: { src: 'src' } },
            Name: 'Name',
            BookFrom: new Date().toDateString(),
            StarRating: '4',
            Region: 'Region',
            Country: 'Country',
            BookFromTitle: 'Title',
            BookFromText: 'Text',
            GiataCode: '42111',
        });
        render(<FeaturedHotels {...mocks} />);

        expect(screen.getByTestId('featured-hotels-render-helper')).toBeInTheDocument();
        expect(mockRerenderHelper).toHaveBeenCalledWith(
            expect.objectContaining({
                isShowCarousel: false,
                displayNumberOfNights: true,
            }),
        );
    });

    it('should set isShowCarousel to true when more than 4 hotels are provided', () => {
        mocks.fields!.FeaturedHotels.push(
            ...mocks.fields!.FeaturedHotels,
            ...mocks.fields!.FeaturedHotels,
            ...mocks.fields!.FeaturedHotels,
            ...mocks.fields!.FeaturedHotels,
            ...mocks.fields!.FeaturedHotels,
        );
        render(<FeaturedHotels {...mocks} />);

        expect(screen.getByTestId('featured-hotels-render-helper')).toBeInTheDocument();
        expect(mockRerenderHelper).toHaveBeenCalledWith(
            expect.objectContaining({
                isShowCarousel: true,
                displayNumberOfNights: true,
            }),
        );
    });

    it('should track featured hotels impression', () => {
        mockStores.layoutStore.isHomePage = true;

        render(<FeaturedHotels {...mocks} />);

        mockAllIsIntersecting(true);
        expect(mockStores.trackingStore.trackFeaturedHotelsImpression).toHaveBeenCalledWith(
            '1dbe1dff-2128-4701-a0f4-6b1ca4c03468',
            [{ ...mocks.fields?.FeaturedHotels[0], livePrice: { pricePP: 100, code: '43212' }, isPriceValid: true }],
        );
    });

    it('should track personalized click on card click', async () => {
        render(<FeaturedHotels {...mocks} />);

        const card = screen.getByTestId('featured-hotel-card');

        await userEvent.click(card);

        expect(mockStores.trackingStore.trackPersonalizedClick).toHaveBeenCalledWith(
            'featured_hotels_module',
            '1dbe1dff-2128-4701-a0f4-6b1ca4c03468',
            'Title',
            undefined,
            undefined,
            { position: '1', price: 'No price displayed' },
        );
    });

    it('should render featured hotels with correct padding class name', () => {
        render(<FeaturedHotels {...mocks} />);

        expect(screen.getByTestId('featured-hotels-block')).toHaveClass('padding-24');
    });

    it('should render title with h1 tag', () => {
        render(<FeaturedHotels {...mocks} />);

        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render title with h2 tag when tag is NOT provided in params', () => {
        mocks.params.TitleTag = undefined;
        render(<FeaturedHotels {...mocks} />);

        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should render title with all customisable class names', () => {
        render(<FeaturedHotels {...mocks} />);

        expect(screen.getByRole('heading')).toHaveClass('mobile-f14-desktop-f16 weight-200 position-left font-rounded');
    });

    it('should render description with position class name', () => {
        render(<FeaturedHotels {...mocks} />);

        expect(screen.getByTestId('text-block-description')).toHaveClass('position-left');
    });

    describe('loadPrices', () => {
        beforeEach(() => {
            mockStores.layoutStore.isFeaturedHotelsLivePriceEnabled = true;
        });

        it('should load prices on initial load', () => {
            render(<FeaturedHotels {...mocks} />);
            expect(mockStores.hotelsStore.getLivePrice).toBeCalledWith(['43212'], true, true, true);
        });

        it('should not load prices on initial load when isFeaturedHotelsLivePriceEnabled is false', () => {
            mockStores.layoutStore.isFeaturedHotelsLivePriceEnabled = false;
            render(<FeaturedHotels {...mocks} />);
            expect(mockStores.hotelsStore.getLivePrice).not.toBeCalled();
        });

        it('should reload prices when FeaturedHotels field updated', () => {
            const { rerender } = render(<FeaturedHotels {...mocks} />);

            rerender(
                <FeaturedHotels
                    {...mocks}
                    fields={{ ...mocks.fields!, FeaturedHotels: [] }}
                    params={mockCustomisableTitleAndDescriptionParams}
                />,
            );
            expect(mockStores.hotelsStore.getLivePrice).toBeCalledTimes(2);
        });

        it('should NOT reload prices when FeaturedHotels field NOT updated', () => {
            const { rerender } = render(<FeaturedHotels {...mocks} />);

            rerender(<FeaturedHotels {...mocks} />);
            expect(mockStores.hotelsStore.getLivePrice).toBeCalledTimes(1);
        });
    });

    describe('Tourist Tax Tooltip', () => {
        it('should render tax info when isTouristTaxEnabled and isFeaturedHotelsLivePriceEnabled are true', async () => {
            mockStores.layoutStore.isFeaturedHotelsLivePriceEnabled = true;
            mockStores.hotelsStore.getLivePrice = jest.fn().mockReturnValue([{ code: '43212', pricePP: 100 }]);
            render(<FeaturedHotels {...mocks} />);

            await waitFor(() => {
                expect(screen.getByTestId('tax-tooltip')).toBeInTheDocument();
            });
        });

        it('should NOT render tax info when isTouristTaxEnabled and isFeaturedHotelsLivePriceEnabled are true, but prices are empty', async () => {
            mockStores.layoutStore.isFeaturedHotelsLivePriceEnabled = true;
            render(<FeaturedHotels {...mocks} />);

            await waitFor(() => {
                expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
            });
        });

        it('should NOT render tax info when isTouristTaxEnabled is false', () => {
            mockStores.layoutStore.isTouristTaxEnabled = false;
            mockStores.layoutStore.isFeaturedHotelsLivePriceEnabled = true;
            render(<FeaturedHotels {...mocks} />);

            expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
        });

        it('should NOT render tax info when isFeaturedHotelsLivePriceEnabled is false', () => {
            mockStores.layoutStore.isFeaturedHotelsLivePriceEnabled = false;
            render(<FeaturedHotels {...mocks} />);

            expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
        });
    });
});
