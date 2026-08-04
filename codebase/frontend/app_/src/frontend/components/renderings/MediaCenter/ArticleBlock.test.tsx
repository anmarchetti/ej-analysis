import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { ArticleBlock, TArticleBlockProps } from './ArticleBlock';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/DestinationBreadcrumbs', () => ({
    __esModule: true,
    default: () => <div />,
}));

describe('<ArticleBlock />', () => {
    const resetMocks = () =>
        ({
            fields: { PublicationDate: mockSitecoreField('') },
            params: {},
            rendering: {},
            isEditMode: false,
            redirectToArticlesByTopic: jest.fn(),
        } as TArticleBlockProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('should NOT render press-release-banner if no fields received', () => {
        mocks.fields = undefined;
        render(<ArticleBlock {...mocks} />);

        expect(screen.queryByTestId('article-block-banner')).not.toBeInTheDocument();
    });

    it('should render Image if image src received', () => {
        mocks.fields = {
            Image: mockSitecoreField(mockSitecoreImageField('test')),
            PublicationDate: mockSitecoreField(''),
        };
        render(<ArticleBlock {...mocks} />);

        expect(screen.getByTestId('responsive-cover')).toBeInTheDocument();
    });

    it('should NOT render Image if image src not received', () => {
        mocks.fields = { Image: undefined, PublicationDate: mockSitecoreField('') };
        render(<ArticleBlock {...mocks} />);

        expect(screen.queryByTestId('responsive-cover')).not.toBeInTheDocument();
    });
});
