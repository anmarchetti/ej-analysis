import React from 'react';
import { render, screen } from '@testing-library/react';

import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RecomendedCarouselFor5ResultsPage from './RecomendedCarouselFor5ResultsPage';

const createProps = () => ({
    fallbackImage: 'image',
    fields: {},
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    bookingStore: { recommendedHotels: [{}, {}] as Nullable<IOffer[]>, onSelectRecommendedOffer: jest.fn() },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRecommendedHotelsCarousel = jest.fn();
jest.mock('../../../common/RecommendedHotels/RecommendedHotelsCarousel/RecommendedHotelsCarousel', () => ({
    __esModule: true,
    default: props => {
        mockRecommendedHotelsCarousel(props);

        return <div data-tid='recommended-hotels-carousel' />;
    },
}));

describe('<RecomendedCarouselFor5ResultsPage />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when recommended hotels are empty', () => {
        mockStores.bookingStore.recommendedHotels = null;

        const { container } = render(<RecomendedCarouselFor5ResultsPage {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when recommended hotels NOT provided', () => {
        mockStores.bookingStore.recommendedHotels = [];

        const { container } = render(<RecomendedCarouselFor5ResultsPage {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render RecommendedHotelsCarousel', () => {
        render(<RecomendedCarouselFor5ResultsPage {...mockProps} />);

        expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
        expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith({
            className: 'hotels-carousel--five-results',
            description: SitecoreDictionary.SearchResultsLabels5ResultsDescriptionForBD4CArousel,
            fallbackImage: 'image',
            fields: {},
            numberOfShowItem: 2,
            offers: [{}, {}],
            onSelectedOffer: expect.any(Function),
            recommendedType: 'recommended-booking',
            title: SitecoreDictionary.SearchResultsLabels5ResultsTittleForBD4CArousel,
        });
    });

    it('should render RecommendedHotelsCarousel with empty fallbackImage when fallbackImage is NOT provided', () => {
        mockProps.fallbackImage = undefined;

        render(<RecomendedCarouselFor5ResultsPage {...mockProps} />);

        expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                fallbackImage: '',
            }),
        );
    });
});
