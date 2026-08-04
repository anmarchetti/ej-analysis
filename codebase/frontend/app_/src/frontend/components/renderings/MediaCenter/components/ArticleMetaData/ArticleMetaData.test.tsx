import React from 'react';
import { render, screen } from '@testing-library/react';

import { ArticleMetaData, IArticleMetaDataProps } from './ArticleMetaData';

jest.mock('frontend/components/renderings/MediaCenter/components/TopicLink', () => ({
    __esModule: true,
    default: () => <div data-tid='topic-link' />,
}));

const resetMocks = (): IArticleMetaDataProps => ({
    topics: [],
    date: 'test',
    className: '',
});

let mockProps = resetMocks();

describe('<ArticleMetaData />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
    });

    it('should render delimiter and topics if topics found', () => {
        mockProps.topics = ['test', 'test-2'];
        render(<ArticleMetaData {...mockProps} />);
        expect(screen.getByTestId('delimiter')).toBeInTheDocument();
        expect(screen.getByTestId('topics')).toBeInTheDocument();
        expect(screen.queryAllByTestId('topic-link')).toHaveLength(2);
    });

    it('should NOT render delimiter and topics if no topics found', () => {
        mockProps.topics = [];
        render(<ArticleMetaData {...mockProps} />);
        expect(screen.queryByTestId('delimiter')).not.toBeInTheDocument();
        expect(screen.queryByTestId('topics')).not.toBeInTheDocument();
    });
});
