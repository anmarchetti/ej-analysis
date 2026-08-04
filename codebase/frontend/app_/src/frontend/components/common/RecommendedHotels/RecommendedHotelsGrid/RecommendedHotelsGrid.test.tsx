import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RecommendedHotelsGrid from './RecommendedHotelsGrid';

const createProps = () => ({
    initialNumberOfHotelsMobile: 3,
    initialNumberOfHotelsDesktop: 2,
    title: 'title',
    offers: [1, 2, 3, 4] as any,
    fallbackImage: 'image',
});

const createStores = () => ({
    bookingStore: { onSelectRecommendedOffer: jest.fn() },
    appStore: { isScreenMedium: true },
    layoutStore: { getPhrase: jest.fn(p => p) },
    trackingStore: {
        trackRecommenderLoaded: jest.fn(),
        trackRecommenderPagination: jest.fn(),
        trackRecommenderHotelClick: jest.fn(),
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockCarouselOfferCard = jest.fn();
jest.mock('../../../renderings/SearchResults/components/CarouselOfferCard', () => ({
    __esModule: true,
    default: props => {
        mockCarouselOfferCard(props);

        return <div data-tid='carousel-offer-card' />;
    },
}));

describe('<RecommendedHotelsGrid />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if offers are NOT provided', () => {
        mockProps.offers = [];
        const { container } = render(<RecommendedHotelsGrid {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render title', () => {
        const { getByRole } = render(<RecommendedHotelsGrid {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('title');
    });

    it('should NOT render recommended-hotels-grid__offers--one-row when screen is NOT medium', () => {
        mockStores.appStore.isScreenMedium = false;
        const { container } = render(<RecommendedHotelsGrid {...mockProps} />);

        expect(container.getElementsByClassName('recommended-hotels-grid__offers--one-row').length).toBe(0);
    });

    it('should NOT render recommended-hotels-grid__offers--one-row when there is NOT less offers than MAX_ITEMS_IN_ROW', () => {
        const { container } = render(<RecommendedHotelsGrid {...mockProps} />);

        expect(container.getElementsByClassName('recommended-hotels-grid__offers--one-row').length).toBe(0);
    });

    it('should render recommended-hotels-grid__offers--one-row', () => {
        mockProps.offers = [1, 2, 3];
        const { container } = render(<RecommendedHotelsGrid {...mockProps} />);

        expect(container.getElementsByClassName('recommended-hotels-grid__offers--one-row').length).toBe(1);
    });

    it('should render 2 CarouselOfferCards on desktop', () => {
        const { getAllByTestId } = render(<RecommendedHotelsGrid {...mockProps} />);

        expect(getAllByTestId('carousel-offer-card').length).toBe(2);
    });

    it('should render 3 CarouselOfferCards on mobile', () => {
        mockStores.appStore.isScreenMedium = false;
        const { getAllByTestId } = render(<RecommendedHotelsGrid {...mockProps} />);

        expect(getAllByTestId('carousel-offer-card').length).toBe(3);
    });

    it('should render Load More button when offers exceed initial number of hotels', () => {
        render(<RecommendedHotelsGrid {...mockProps} />);

        expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.SearchResultsButtonsLoadMore);
    });

    it('should render Collapse button when all offers are shown and exceed initial number of hotels', async () => {
        render(<RecommendedHotelsGrid {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsCollapse);
    });

    it('should NOT render button when offers are fewer than the initial number of hotels', () => {
        mockProps.offers = [1];
        const { queryByRole } = render(<RecommendedHotelsGrid {...mockProps} />);

        expect(queryByRole('button')).not.toBeInTheDocument();
    });

    it('should pass displaySponsoredLabel prop to CarouselOfferCard when displaySponsoredLabel is true', () => {
        mockProps.displaySponsoredLabel = true;
        mockProps.offers = [1];

        render(<RecommendedHotelsGrid {...mockProps} />);

        expect(mockCarouselOfferCard).toHaveBeenCalledWith(
            expect.objectContaining({
                displaySponsoredLabel: true,
            }),
        );
    });

    it('should pass displaySponsoredLabel prop to CarouselOfferCard when displaySponsoredLabel is false', () => {
        mockProps.displaySponsoredLabel = false;
        mockProps.offers = [1];

        render(<RecommendedHotelsGrid {...mockProps} />);

        expect(mockCarouselOfferCard).toHaveBeenCalledWith(
            expect.objectContaining({
                displaySponsoredLabel: false,
            }),
        );
    });

    it('should pass displaySponsoredLabel prop to CarouselOfferCard when displaySponsoredLabel is undefined', () => {
        mockProps.displaySponsoredLabel = undefined;
        mockProps.offers = [1];

        render(<RecommendedHotelsGrid {...mockProps} />);

        expect(mockCarouselOfferCard).toHaveBeenCalledWith(
            expect.objectContaining({
                displaySponsoredLabel: undefined,
            }),
        );
    });
});
