import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { responsive, responsiveCarouselSlim } from 'frontend/utils/getSlidersToShow';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import {
    IRecommendedHotelsCarouselProps,
    RecommendedHotelsCarousel,
    responsiveCarousel3Items,
} from './RecommendedHotelsCarousel';

(window as any).BASEPATH = '';

const mockCarouselOfferCard = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/CarouselOfferCard', () => ({
    __esModule: true,
    default: props => {
        mockCarouselOfferCard(props);

        return <div data-tid='carousel-offer-card' />;
    },
}));

jest.mock('frontend/components/renderings/SearchResults/components/OffersCarouselButton', () => ({
    __esModule: true,
    CarouselButton: () => <div data-tid='carousel-buttons' />,
}));

const mockCarousel = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        default: forwardRef(({ children, customButtonGroup, ...props }: any, ref: any) => {
            ref.current = {
                state: { currentSlide: 0 },
                ...ref.current,
            };
            mockCarousel(props);

            return (
                <div data-tid='carousel'>
                    {children}
                    {customButtonGroup}
                </div>
            );
        }),
    };
});

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

jest.mock('frontend/components/renderings/SearchResults/components/ShortlistManaging', () => () => (
    <div data-tid='shortlist-managing' />
));

jest.mock('frontend/services/logging');
jest.mock('code/env');

const createProps = (): IRecommendedHotelsCarouselProps => ({
    offers: [{} as any, {} as any, {} as any, {} as any, {} as any, {} as any],
    onSelectedOffer: jest.fn(),
    fallbackImage: '',
    title: 'title',
    numberOfShowItem: 9,
    recommendedType: '',
    description: null,
    isSlimCardsDesign: false,
    openLinksInNewTab: true,
    isLeftAligned: true,
    fields: {
        DefaultText: mockSitecoreField('test default'),
        HoldBagText: mockSitecoreField('test hold bag'),
    },
});

let mockProps = createProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

import { envAll } from 'code/env';
import { logger } from 'frontend/services/logging';

const mockEnvAll = jest.mocked(envAll) as any;
const mockLogger = jest.mocked(logger);

describe('<RecommendedHotelsCarousel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        mockEnvAll.ENABLE_BD4_LOGGING = false;
        mockLogger.info.mockClear();
    });

    it('should not render', () => {
        mockProps.offers = [];

        const { container } = render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render carousel', () => {
        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getByTestId('carousel-buttons')).toBeInTheDocument();
        expect(screen.getAllByTestId('carousel-offer-card')).toHaveLength(mockProps.offers!.length);
    });

    it('should render title with destination Name', () => {
        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(screen.getByTestId('title')).toHaveTextContent(
            `${mockProps.title} ${mockStores.layoutStore.displayName}`,
        );
    });

    it('should render without carousel when isScreenLarge and only 3 offers are provided', () => {
        mockStores.isScreenLarge = true;
        mockProps.offers = [{} as any, {} as any, {} as any];

        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
        expect(screen.queryByTestId('carousel-buttons')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('carousel-offer-card')).toHaveLength(mockProps.offers.length);
    });

    it('should render mobile view with carousel when isScreenExtraSmall', () => {
        mockStores.appStore.isScreenExtraSmall = true;
        mockStores.appStore.isScreenMedium = false;
        mockProps.offers = [{} as any, {} as any];

        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getByTestId('carousel-buttons')).toBeInTheDocument();
        expect(screen.getAllByTestId('carousel-offer-card')).toHaveLength(mockProps.offers.length);
    });

    it('should render one card', () => {
        mockProps.offers = [{} as any];

        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
        expect(screen.queryByTestId('carousel-buttons')).not.toBeInTheDocument();
        expect(screen.getByTestId('carousel-offer-card')).toBeInTheDocument();
        expect(mockCarouselOfferCard).toHaveBeenCalledWith(
            expect.objectContaining({
                fallbackImage: '',
                fields: mockProps.fields,
                offer: {},
                offerIndex: 0,
                onImageSliderArrowClick: expect.any(Function),
                onSelect: expect.any(Function),
                openLinkInNewTab: mockProps.openLinksInNewTab,
                recommendedType: '',
            }),
        );
    });

    it('should pass correct responsive prop to Carousel if slim card design', () => {
        mockProps.isSlimCardsDesign = true;
        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(mockCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                responsive: responsive,
            }),
        );
    });

    it('should pass correct responsive prop to Carousel on Promo page', () => {
        mockStores.layoutStore.isPromoPage = true;
        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(mockCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                responsive: responsiveCarouselSlim,
            }),
        );
    });

    it('should pass correct responsive prop to Carousel on SearchResults page', () => {
        mockStores.layoutStore.isSearchResultsPage = true;
        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(mockCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                responsive: responsiveCarouselSlim,
            }),
        );
    });

    it('should pass correct responsive prop to Carousel on Post Travel page', () => {
        mockStores.viewBookingStore.isPostTravelPage = true;
        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(mockCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                responsive: responsiveCarousel3Items,
            }),
        );
    });

    it('should pass correct responsive prop to Carousel on Cancelled page', () => {
        mockStores.layoutStore.isCancelledBookingPage = true;
        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(mockCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                responsive: responsiveCarousel3Items,
            }),
        );
    });

    it('should pass correct left aligned className if left aligned prop true', () => {
        mockProps.isLeftAligned = true;
        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(screen.getByText(`${mockProps.title} ${mockStores.layoutStore.displayName}`)).toHaveClass(
            'hotels-carousel__title leftAlignedTitle',
        );
    });

    it('should pass displaySponsoredLabel prop to CarouselOfferCard when displaySponsoredLabel is true', () => {
        mockProps.displaySponsoredLabel = true;
        mockProps.offers = [{} as any];

        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(mockCarouselOfferCard).toHaveBeenCalledWith(
            expect.objectContaining({
                displaySponsoredLabel: true,
            }),
        );
    });

    it('should pass displaySponsoredLabel prop to CarouselOfferCard when displaySponsoredLabel is false', () => {
        mockProps.displaySponsoredLabel = false;
        mockProps.offers = [{} as any];

        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(mockCarouselOfferCard).toHaveBeenCalledWith(
            expect.objectContaining({
                displaySponsoredLabel: false,
            }),
        );
    });

    it('should pass displaySponsoredLabel prop to CarouselOfferCard when displaySponsoredLabel is undefined', () => {
        mockProps.displaySponsoredLabel = undefined;
        mockProps.offers = [{} as any];

        render(<RecommendedHotelsCarousel {...mockProps} />);

        expect(mockCarouselOfferCard).toHaveBeenCalledWith(
            expect.objectContaining({
                displaySponsoredLabel: undefined,
            }),
        );
    });

    it('should return null when offers is empty', () => {
        const { container } = render(<RecommendedHotelsCarousel {...mockProps} offers={[]} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('useEffect tracking behavior', () => {
        it('should call trackRecommenderLoaded when offers exist', () => {
            mockProps.offers = [{} as any, {} as any];

            render(<RecommendedHotelsCarousel {...mockProps} />);

            expect(mockStores.trackingStore.trackRecommenderLoaded).toHaveBeenCalledWith(
                mockProps.offers,
                expect.objectContaining({
                    currentSlide: 0,
                    previousSlide: 0,
                    slidesToShow: 2,
                    slidesToSlide: 1,
                    totalItems: 2,
                }),
            );
        });

        it('should not call trackRecommenderLoaded when no offers exist', () => {
            mockProps.offers = [];

            render(<RecommendedHotelsCarousel {...mockProps} />);

            expect(mockStores.trackingStore.trackRecommenderLoaded).not.toHaveBeenCalled();
        });

        it('should not call trackRecommenderLoaded when offers is null', () => {
            mockProps.offers = null;

            render(<RecommendedHotelsCarousel {...mockProps} />);

            expect(mockStores.trackingStore.trackRecommenderLoaded).not.toHaveBeenCalled();
        });

        it('should log when BD4 logging is enabled and offers exist', () => {
            mockEnvAll.ENABLE_BD4_LOGGING = true;
            mockProps.offers = [{} as any, {} as any];

            render(<RecommendedHotelsCarousel {...mockProps} />);

            expect(mockLogger.info).toHaveBeenCalledWith('RecommendedHotelsCarousel call trackRecommenderLoaded');
            expect(mockLogger.info).toHaveBeenCalledWith('Offers: 2');
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('SlidesOptions:'));
        });

        it('should log componentDidUpdate on subsequent useEffect calls', () => {
            mockEnvAll.ENABLE_BD4_LOGGING = true;
            mockProps.offers = [{} as any];

            const { rerender } = render(<RecommendedHotelsCarousel {...mockProps} />);

            expect(mockLogger.info).toHaveBeenCalledWith('RecommendedHotelsCarousel call trackRecommenderLoaded');

            mockLogger.info.mockClear();
            rerender(<RecommendedHotelsCarousel {...mockProps} offers={[{} as any, {} as any]} />);

            expect(mockLogger.info).toHaveBeenCalledWith('RecommendedHotelsCarousel componentDidUpdate');
            expect(mockLogger.info).toHaveBeenCalledWith('Offers: 2');
        });

        it('should log when BD4 logging is enabled and no offers', () => {
            mockEnvAll.ENABLE_BD4_LOGGING = true;
            mockProps.offers = [];

            render(<RecommendedHotelsCarousel {...mockProps} />);

            expect(mockLogger.info).toHaveBeenCalledWith("RecommendedHotelsCarousel don't get offers: []");
        });
    });

    describe('pagination tracking behavior', () => {
        const getCarouselAfterChangeCallback = (): (() => void) | undefined =>
            mockCarousel.mock.calls.find(call => call[0]?.afterChange)?.[0]?.afterChange;

        it('should NOT track pagination on slide change when hasTrackedInitialLoad is false', () => {
            mockProps.offers = [{} as any, {} as any, {} as any, {} as any];

            render(<RecommendedHotelsCarousel {...mockProps} />);

            const afterChange = getCarouselAfterChangeCallback();

            mockStores.trackingStore.trackRecommenderPagination.mockClear();

            afterChange?.();

            expect(mockStores.trackingStore.trackRecommenderPagination).not.toHaveBeenCalled();
        });
    });
});
