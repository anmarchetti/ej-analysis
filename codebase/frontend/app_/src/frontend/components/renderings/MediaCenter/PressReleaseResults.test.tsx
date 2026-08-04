import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { DataStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PressReleaseResults from './PressReleaseResults';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

const mockArticleCard = jest.fn();
jest.mock('./components/ArticleCard/ArticleCard', () => {
    const MockArticleCard = (props: any) => {
        mockArticleCard(props);

        return <div data-tid='mock-article-card' data-item-url={props.item?.url} />;
    };

    return MockArticleCard;
});

const mockPagination = jest.fn();
jest.mock('frontend/components/common/Pagination', () => {
    const MockPagination = (props: any) => {
        mockPagination(props);

        return <div data-tid='mock-pagination' />;
    };

    return MockPagination;
});

const mockNoResultsErrorBlock = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/NoResultsErrorBlock/NoResultsErrorBlock', () => {
    const MockNoResultsErrorBlock = (props: any) => {
        mockNoResultsErrorBlock(props);

        return <div data-tid='mock-no-results-error-block' title={props.title} />;
    };

    return MockNoResultsErrorBlock;
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () =>
    createMockStores({
        mediaCenterStore: {
            status: DataStatus.NotLoaded,
            page: 1,
            articlesNumberToTake: 7,
            articles: [],
            numberOfArticles: 11,
            numberOfPages: 2,
            fetchArticles: jest.fn(),
            setPageNumber: jest.fn(),
        },
    });

let mockStores;

describe('<PressReleaseResults />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should fetchArticles when mounted', () => {
        render(<PressReleaseResults />);

        expect(mockStores.mediaCenterStore.fetchArticles).toHaveBeenCalledTimes(1);
    });

    it('should return null (not render content) when data not loaded', () => {
        mockStores.mediaCenterStore.status = DataStatus.NotLoaded;

        const { container } = render(<PressReleaseResults />);

        expect(container.querySelector('.hotel-search-results-box')).not.toBeInTheDocument();
        expect(screen.queryByText(/Results:/)).not.toBeInTheDocument();
    });

    it('should render hotel-search-results-box when data loaded', () => {
        mockStores.mediaCenterStore.status = DataStatus.Loaded;

        const { container } = render(<PressReleaseResults />);

        expect(container.querySelector('.hotel-search-results-box')).toBeInTheDocument();
    });

    it('should render NoResultsErrorBlock and not articles/pagination when articles are empty (and data loaded)', () => {
        mockStores.mediaCenterStore.status = DataStatus.Loaded;
        mockStores.mediaCenterStore.articles = [];

        render(<PressReleaseResults />);

        expect(screen.queryByTestId('mock-article-card')).not.toBeInTheDocument();
        expect(screen.queryByTestId('mock-pagination')).not.toBeInTheDocument();
        expect(screen.getByTestId('mock-no-results-error-block')).toBeInTheDocument();
        expect(mockNoResultsErrorBlock).toHaveBeenCalledWith(
            expect.objectContaining({
                title: SitecoreDictionary.MediaCenterErrorsLoadingPressReleasesTitle,
                description: SitecoreDictionary.MediaCenterErrorsLoadingPressReleasesDescription,
            }),
        );
    });

    it('should render articles-wrapper and ArticleCards when articles are NOT empty (and data loaded)', () => {
        mockStores.mediaCenterStore.status = DataStatus.Loaded;
        mockStores.mediaCenterStore.articles = [{ url: 'test1' }, { url: 'test2' }] as any;

        const { container } = render(<PressReleaseResults />);

        expect(container.querySelector('.articlesWrapper')).toBeInTheDocument();
        expect(screen.getAllByTestId('mock-article-card')).toHaveLength(2);
        expect(mockArticleCard).toHaveBeenCalledTimes(2);
        expect(mockArticleCard).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ item: mockStores.mediaCenterStore.articles[0] }),
        );
    });

    it('should NOT render pagination when articles count is less than or equal to itemsOnEachPage (and data loaded)', () => {
        mockStores.mediaCenterStore.status = DataStatus.Loaded;
        mockStores.mediaCenterStore.articles = [{ url: 'test1' }, { url: 'test2' }] as any;
        mockStores.mediaCenterStore.numberOfArticles = 2;
        mockStores.mediaCenterStore.articlesNumberToTake = 7;

        render(<PressReleaseResults />);

        expect(screen.queryByTestId('mock-pagination')).not.toBeInTheDocument();
    });

    it('should render pagination when articles count is greater than itemsOnEachPage (and data loaded)', () => {
        mockStores.mediaCenterStore.status = DataStatus.Loaded;
        mockStores.mediaCenterStore.articles = [{ url: 'test1' }, { url: 'test2' }] as any;
        mockStores.mediaCenterStore.numberOfArticles = 9;
        mockStores.mediaCenterStore.articlesNumberToTake = 7;

        render(<PressReleaseResults />);

        expect(screen.getByTestId('mock-pagination')).toBeInTheDocument();
        expect(mockPagination).toHaveBeenCalledWith(
            expect.objectContaining({
                numberOfResults: 9,
                itemsOnEachPage: 7,
            }),
        );
    });

    it('should render formatted count of articles when data loaded', () => {
        mockStores.mediaCenterStore.status = DataStatus.Loaded;
        mockStores.mediaCenterStore.numberOfArticles = 11;

        render(<PressReleaseResults />);

        expect(screen.getByText(`${SitecoreDictionary.MediaCenterLabelsResults} 11`)).toBeInTheDocument();
        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.MediaCenterLabelsResults);
        expect(mockStores.marketStore.getFormattedNumber).toHaveBeenCalledWith(11);
        expect(mockReplaceToken).toHaveBeenCalledWith(SitecoreDictionary.MediaCenterLabelsResults, Tokens.Number, '11');
    });
});
