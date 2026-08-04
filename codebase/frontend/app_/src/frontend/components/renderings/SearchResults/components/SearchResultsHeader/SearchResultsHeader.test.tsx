import React from 'react';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { DataStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import SearchResultsHeader, { ISearchResultsHeaderProps } from './SearchResultsHeader';

jest.mock('frontend/components/common/OffersPriceViewToggle', () => () => <div data-tid='offers-price-view-toggle' />);

jest.mock('frontend/components/renderings/SearchResults/components/OffersSort/OffersSort', () => () => (
    <div data-tid='offers-sort' />
));

const resetMocks = (): ISearchResultsHeaderProps => ({
    status: DataStatus.NotLoaded,
    totalOffers: 0,
    hasOffers: false,
});

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SearchResultsHeader />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('Should standard Render', () => {
        mocks.status = DataStatus.Loaded;
        mocks.hasOffers = true;
        mocks.totalOffers = 10;

        const { getByTestId } = render(<SearchResultsHeader {...mocks} />);

        expect(getByTestId('hotel-search-results-header')).toBeInTheDocument();
        expect(getByTestId('offers-price-view-toggle')).toBeInTheDocument();
        expect(getByTestId('offers-sort')).toBeInTheDocument();
    });

    it('should NOT be rendered when status is not_loaded', () => {
        const { container } = render(<SearchResultsHeader {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should have search result number = 1 when we have one offers and show SearchResultsLabelsResultHolidaySingular', () => {
        mocks.status = DataStatus.Loaded;
        mocks.hasOffers = true;
        mocks.totalOffers = 1;

        const { getByTestId } = render(<SearchResultsHeader {...mocks} />);

        expect(getByTestId('hotel-search-results-header')).toBeInTheDocument();

        expect(mockStores.layoutStore.getPhrase).toBeCalledWith(
            SitecoreDictionary.SearchResultsLabelsResultHolidaySingular,
        );
    });

    it('Should have search result number = 2 when we have one offers and show SearchResultsLabelsResultHolidaysPlural', () => {
        mocks.status = DataStatus.Loaded;
        mocks.hasOffers = true;
        mocks.totalOffers = 2;

        const { getByTestId } = render(<SearchResultsHeader {...mocks} />);

        expect(getByTestId('hotel-search-results-header')).toBeInTheDocument();
        expect(mockStores.layoutStore.getPhrase).toBeCalledWith(
            SitecoreDictionary.SearchResultsLabelsResultHolidaysPlural,
        );
    });

    it('Should Be hidden when no Offers', () => {
        mocks.status = DataStatus.Loading;
        mocks.hasOffers = false;
        mocks.totalOffers = 0;

        const { queryByTestId } = render(<SearchResultsHeader {...mocks} />);

        expect(queryByTestId('search-results-loading-skeleton-header')).toBeInTheDocument();
        expect(queryByTestId('hotel-search-results-header')).not.toBeInTheDocument();
    });
});
