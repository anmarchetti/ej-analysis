import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as dateUtils from 'frontend/utils/date.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';

import { NoResults } from './NoResults';

const resetMocks = () => ({
    onSetSelectedOfferIndex: jest.fn(),
    fallbackImage: '',
    isReferer: false,
    setNeedOpenWhenField: jest.fn(),
    getSetting: jest.fn(p => p),
    recommendedHotels: null,
    trackSearchProductClick: jest.fn(),
    alternativeOffers: [],
    showParentOffers: false,
    startDate: '10-10-2023',
    holidayDurationSingleSearch: null,
    onChangeDates: jest.fn(),
    grabSearchValuesFromSearchStore: jest.fn(),
    fetchOffers: jest.fn(),
    onSelectRecommendedOffer: jest.fn(),
    getPhrase: jest.fn(p => p),
    fields: {
        DefaultText: mockSitecoreField('test default'),
        HoldBagText: mockSitecoreField('test hold bag'),
    },
    isPromoPage: false,
    isOfferCardsABTesting: false,
});

const mockAddDays = jest.spyOn(dateUtils, 'addDays').mockReturnValue(new Date('12-12-2023'));

const mockNoResultsErrorBlock = jest.fn();
jest.mock('./NoResultsErrorBlock/NoResultsErrorBlock', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockNoResultsErrorBlock(props);

        return <div data-tid='no-results-error-block'>{children}</div>;
    },
}));

const mockPriceGraphForNoResults = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/PriceGraphForNoResults', () => ({
    __esModule: true,
    default: ({ resetSelectedOffer, ...props }) => {
        mockPriceGraphForNoResults(props);

        return <button data-tid='price-graph-for-no-results' onClick={resetSelectedOffer} onKeyDown={jest.fn()} />;
    },
}));

const mockRecommendedHotelsCarousel = jest.fn();
jest.mock('../../../common/RecommendedHotels/RecommendedHotelsCarousel/RecommendedHotelsCarousel', () => ({
    __esModule: true,
    default: props => {
        mockRecommendedHotelsCarousel(props);

        return <div data-tid='recommended-hotels-carousel' />;
    },
}));

const mockOffersCarousel = jest.fn();
jest.mock('./OffersCarousel/OffersCarousel', () => ({
    __esModule: true,
    default: ({ onSelectOffer, ...props }) => {
        mockOffersCarousel(props);

        return <button data-tid='offers-carousel' onClick={onSelectOffer} onKeyDown={jest.fn()} />;
    },
}));

let mocks;

describe('<NoResults />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render PriceGraphForNoResults when alternativeOffers are provided', () => {
        mocks.alternativeOffers = [1, 2];

        render(<NoResults {...mocks} />);

        expect(screen.getByTestId('price-graph-for-no-results')).toBeInTheDocument();
        expect(mockPriceGraphForNoResults).toHaveBeenCalledWith({
            holidayDuration: 0,
            selectedDate: new Date(mocks.startDate),
        });
    });

    it('should render PriceGraphForNoResults with holidayDuration from props when holidayDurationSingleSearch is provided', async () => {
        mocks.alternativeOffers = [1, 2];
        mocks.holidayDurationSingleSearch = 5;

        render(<NoResults {...mocks} />);

        await userEvent.click(screen.getByTestId('price-graph-for-no-results'));

        expect(mockPriceGraphForNoResults).toHaveBeenCalledWith(expect.objectContaining({ holidayDuration: 5 }));
    });

    it('should call addDays, onChangeDates, grabSearchValuesFromSearchStore and fetchOffers on resetSelectedOffer', async () => {
        mocks.alternativeOffers = [1, 2];

        render(<NoResults {...mocks} />);

        await userEvent.click(screen.getByTestId('price-graph-for-no-results'));

        expect(mockAddDays).toHaveBeenCalled();
        expect(mocks.onChangeDates).toHaveBeenCalled();
        expect(mocks.grabSearchValuesFromSearchStore).toHaveBeenCalled();
        expect(mocks.fetchOffers).toHaveBeenCalledWith(true);
    });

    it('should render RecommendedHotelsCarousel when recommendedHotels are provided', () => {
        mocks.recommendedHotels = [1, 2];

        render(<NoResults {...mocks} />);

        expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
        expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith({
            description: null,
            fallbackImage: '',
            fields: mocks.fields,
            numberOfShowItem: 2,
            offers: [1, 2],
            onSelectedOffer: expect.any(Function),
            recommendedType: 'recommended-booking',
            title: SitecoreDictionary.SearchResultsLabelsParentDestinationCarouselTitle,
        });
    });

    it('should render RecommendedHotelsCarousel with promo page props when isPromoPage is true', () => {
        mocks.recommendedHotels = [1, 2];
        mocks.isPromoPage = true;
        mocks.fallbackImage = 'test-image';

        render(<NoResults {...mocks} />);

        expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                fallbackImage: 'test-image',
                title: SitecoreDictionary.SearchResultsLabelsBd4CarouselTitle,
                description: SitecoreDictionary.SearchResultsNotificationsBd4NoResultsPromo,
            }),
        );
    });

    it('should render OffersCarousel when showParentOffers is true', () => {
        mocks.showParentOffers = true;

        render(<NoResults {...mocks} />);

        expect(screen.getByTestId('offers-carousel')).toBeInTheDocument();
        expect(mockOffersCarousel).toHaveBeenCalledWith({
            fallbackImage: '',
            fields: mocks.fields,
        });
    });

    it('should render OffersCarousel with fallback from props', () => {
        mocks.showParentOffers = true;
        mocks.fallbackImage = 'test-image';

        render(<NoResults {...mocks} />);

        expect(screen.getByTestId('offers-carousel')).toBeInTheDocument();
        expect(mockOffersCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                fallbackImage: 'test-image',
            }),
        );
    });

    it('should call onSetSelectedOfferIndex and trackSearchProductClick on OffersCarousel click', async () => {
        mocks.showParentOffers = true;

        render(<NoResults {...mocks} />);

        await userEvent.click(screen.getByTestId('offers-carousel'));

        expect(mocks.onSetSelectedOfferIndex).toHaveBeenCalled();
        expect(mocks.trackSearchProductClick).toHaveBeenCalled();
    });

    it('should render NoResultsErrorBlock with title, description and icon from settings', () => {
        render(<NoResults {...mocks} />);

        expect(screen.getByTestId('no-results-error-block')).toBeInTheDocument();
        expect(mockNoResultsErrorBlock).toHaveBeenCalledWith({
            title: SiteSettings.NoResultsErrorBlockTitle,
            description: SiteSettings.NoResultsErrorBlockDescription,
            icon: SiteSettings.NoResultsErrorBlockIcon,
        });
    });

    it('should render NoResultsErrorBlock with icon, button, SearchResultsErrorsNoOffersFound and SearchResultsErrorsAdjustDates when isReferer', () => {
        mocks.isReferer = true;

        render(<NoResults {...mocks} />);

        expect(screen.getByTestId('no-results-error-block')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchResultsErrorsNoOffersFound)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchResultsErrorsAdjustDates)).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.SearchResultsButtonsEditYourDates);
        expect(mockNoResultsErrorBlock).toHaveBeenCalledWith({
            icon: SiteSettings.NoResultsErrorBlockIcon,
        });
    });

    it('should call setNeedOpenWhenField on button click', async () => {
        mocks.isReferer = true;

        render(<NoResults {...mocks} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mocks.setNeedOpenWhenField).toHaveBeenCalled();
    });
});
