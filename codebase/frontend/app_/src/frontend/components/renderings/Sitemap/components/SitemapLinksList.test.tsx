import React from 'react';
import { render } from '@testing-library/react';

import SitemapLinksList from './SitemapLinksList';

const createProps = () => ({
    pages: [
        {
            Id: '1',
            Url: 'url1',
            Name: 'name1',
            PageTitle: 'page1',
        },
        {
            Id: '2',
            Url: 'url2',
            Name: 'name2',
            PageTitle: 'page2',
        },
    ],
    numberOfHiddenLinks: 0,
    onLinkClick: jest.fn(),
});

const createStores = () => ({
    layoutStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SitemapLinksList />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render list', () => {
        const { getByRole } = render(<SitemapLinksList {...mockProps} />);

        expect(getByRole('list')).toBeInTheDocument();
    });

    it('should render 2 listitem when 2 pages are provided', () => {
        const { getAllByRole } = render(<SitemapLinksList {...mockProps} />);

        expect(getAllByRole('listitem').length).toBe(2);
    });

    it('should render 2 pages name', () => {
        const { getAllByRole } = render(<SitemapLinksList {...mockProps} />);

        expect(getAllByRole('listitem')[0]).toHaveTextContent('name1');
        expect(getAllByRole('listitem')[1]).toHaveTextContent('name2');
    });

    it('should render 2 pages titles when names not provided', () => {
        mockProps.pages[0].Name = null;
        mockProps.pages[1].Name = null;
        const { getAllByRole } = render(<SitemapLinksList {...mockProps} />);

        expect(getAllByRole('listitem')[0]).toHaveTextContent('page1');
        expect(getAllByRole('listitem')[1]).toHaveTextContent('page2');
    });

    it('should render additional listitem when numberOfHiddenLinks provided', () => {
        mockProps.numberOfHiddenLinks = 2;
        const { getAllByRole } = render(<SitemapLinksList {...mockProps} />);

        expect(getAllByRole('listitem')[2]).toHaveTextContent('+2');
    });
});
