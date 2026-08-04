import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IArticle } from 'models/data/IArticle';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import LatestNews from './LatestNews';

const createStore = () =>
    createMockStores({
        mediaCenterStore: {
            getLatestNews: jest.fn(),
            latestNews: [],
            isLoadingLatestNews: false,
        },
    });

let mockStores = createStore();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockArticleCard = jest.fn();
jest.mock('./components/ArticleCard/ArticleCard', () => ({
    __esModule: true,
    default: props => {
        mockArticleCard(props);

        return <div data-tid='article-card' />;
    },
}));

const mockArticlesLoadingSkeleton = jest.fn();
jest.mock('./components/ArticlesLoadingSkeleton/ArticlesLoadingSkeleton', () => ({
    __esModule: true,
    default: () => {
        mockArticlesLoadingSkeleton();

        return <div data-tid='articles-loading-skeleton' />;
    },
}));

const mockArticle = (id: string): IArticle => ({
    title: `Test Article ${id}`,
    publicationDate: new Date().toISOString(),
    shortDescription: `This is a short description for article ${id}`,
    topics: ['Topic1', 'Topic2'],
    url: `/article-${id}`,
    id: `latest-news-article-${id}`,
});

describe('<LatestNews />', () => {
    beforeEach(() => {
        mockStores = createStore();
    });

    it('should call getLatestNews when mounted', () => {
        render(<LatestNews />);
        expect(mockStores.mediaCenterStore.getLatestNews).toHaveBeenCalledTimes(1);
    });

    it('should render ArticlesLoadingSkeleton if news are loading', () => {
        mockStores.mediaCenterStore.isLoadingLatestNews = true;
        render(<LatestNews />);

        expect(screen.getByTestId('articles-loading-skeleton')).toBeInTheDocument();
        expect(mockArticlesLoadingSkeleton).toHaveBeenCalled();
        expect(screen.queryByTestId('article-card')).not.toBeInTheDocument();
    });

    it('should NOT render component if there are no news and not loading', () => {
        mockStores.mediaCenterStore.latestNews = [];
        mockStores.mediaCenterStore.isLoadingLatestNews = false;

        const { container } = render(<LatestNews />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render the correct number of articles', () => {
        mockStores.layoutStore.getSetting = jest.fn().mockReturnValue(false);
        mockStores.mediaCenterStore.latestNews = [
            mockArticle('1'),
            mockArticle('2'),
            mockArticle('3'),
            mockArticle('4'),
        ];

        render(<LatestNews />);

        expect(screen.getAllByTestId('article-card')).toHaveLength(mockStores.mediaCenterStore.latestNews.length);
        expect(mockArticleCard).toHaveBeenNthCalledWith(1, {
            item: mockStores.mediaCenterStore.latestNews[0],
            label: SitecoreDictionary.MediaCenterLabelsLatestNews,
            isFullWidth: true,
        });

        expect(mockArticleCard).toHaveBeenNthCalledWith(2, {
            item: mockStores.mediaCenterStore.latestNews[1],
            label: null,
            isFullWidth: false,
        });

        expect(mockArticleCard).toHaveBeenNthCalledWith(3, {
            item: mockStores.mediaCenterStore.latestNews[2],
            label: null,
            isFullWidth: false,
        });

        expect(mockArticleCard).toHaveBeenNthCalledWith(4, {
            item: mockStores.mediaCenterStore.latestNews[3],
            label: null,
            isFullWidth: false,
        });
    });

    it('should render only the first article in dark mode', () => {
        mockStores.mediaCenterStore.latestNews = [mockArticle('1'), mockArticle('2'), mockArticle('3')];
        mockStores.mediaCenterStore.getSetting = jest.fn().mockReturnValue(true);

        render(<LatestNews />);

        expect(screen.getAllByTestId('article-card')).toHaveLength(1);
    });
});
