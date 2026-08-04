import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import { ArticleCard, IArticleCardProps } from './ArticleCard';

const resetMocks = (): IArticleCardProps => ({
    isFullWidth: false,
    item: {
        url: 'test',
        publicationDate: 'test',
        topics: [],
    },
    label: null as Nullable<string>,
});

let mockStores = createMockStores();
let mockProps = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockArticleMetaData = jest.fn();
jest.mock('frontend/components/renderings/MediaCenter/components/ArticleMetaData/ArticleMetaData', () => ({
    __esModule: true,
    default: props => {
        mockArticleMetaData(props);

        return <div data-tid='article-meta-data' />;
    },
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkProps(props);

        return (
            <div className={props.className} onClick={props.onClick} data-tid='article-card'>
                {props.children}
            </div>
        );
    },
}));

describe('<ArticleCard />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createMockStores();
    });

    it('should NOT render full-width class if prop `isFullWidth` is falsy', () => {
        mockProps.isFullWidth = false;
        render(<ArticleCard {...mockProps} />);

        expect(screen.getByTestId('article-card')).not.toHaveClass('fullWidth');
        expect(screen.getByTestId('article-card')).toHaveClass('article');
    });

    it('should render full-width class if prop `isFullWidth` is truthy', () => {
        mockProps.isFullWidth = true;
        render(<ArticleCard {...mockProps} />);

        expect(screen.getByTestId('article-card')).toHaveClass('article fullWidth');
    });

    it('should NOT render image if it is NOT provided', () => {
        mockProps.item.image = undefined;
        render(<ArticleCard {...mockProps} />);

        expect(screen.queryByTestId('article-card-media')).not.toBeInTheDocument();
    });

    it('should render image when it is provided', () => {
        mockProps.item.image = 'test';
        render(<ArticleCard {...mockProps} />);

        expect(screen.getByTestId('article-card-media')).toBeInTheDocument();
    });

    it('should NOT render article header if title is NOT provided', () => {
        mockProps.item.title = undefined;
        render(<ArticleCard {...mockProps} />);

        expect(screen.queryByTestId('article-card-title')).not.toBeInTheDocument();
    });

    it('should render article header if  title is provided', () => {
        mockProps.item.title = 'test';
        render(<ArticleCard {...mockProps} />);

        expect(screen.getByTestId('article-card-title')).toBeInTheDocument();
    });

    it('should render ArticleMetaData with correct props', () => {
        render(<ArticleCard {...mockProps} />);

        expect(mockArticleMetaData).toHaveBeenCalledWith({
            topics: mockProps.item.topics,
            date: mockProps.item.publicationDate,
            className: 'additionalData',
        });
    });

    it('should NOT render shortDescription when it is NOT provided', () => {
        render(<ArticleCard {...mockProps} />);

        expect(screen.queryByTestId('article-card-text')).not.toBeInTheDocument();
    });

    it('should render shortDescription when it is provided', () => {
        mockProps.item.shortDescription = 'test';
        render(<ArticleCard {...mockProps} />);

        expect(screen.getByTestId('article-card-text')).toBeInTheDocument();
    });
});
