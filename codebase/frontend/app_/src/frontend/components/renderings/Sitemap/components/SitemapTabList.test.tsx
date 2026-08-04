import React from 'react';
import { render } from '@testing-library/react';

import SitemapTabList from './SitemapTabList';

const createProps = () => ({
    items: [
        { SectionId: '1', Title: 'title1', Pages: [] },
        { SectionId: '2', Title: 'title2', Pages: [] },
    ],
    activeTabIndex: 1,
    setActiveTabIndex: jest.fn(),
});

let mockProps;

describe('<SitemapTabList />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render tablist', () => {
        const { getByRole } = render(<SitemapTabList {...mockProps} />);

        expect(getByRole('tablist')).toBeInTheDocument();
    });

    it('should render 2 presentations', () => {
        const { getAllByRole } = render(<SitemapTabList {...mockProps} />);

        expect(getAllByRole('presentation').length).toBe(2);
    });

    it('should render 2 tabs', () => {
        const { getAllByRole } = render(<SitemapTabList {...mockProps} />);

        expect(getAllByRole('tab').length).toBe(2);
    });

    it('should render items titles', () => {
        const { getByText } = render(<SitemapTabList {...mockProps} />);

        expect(getByText('title1')).toBeInTheDocument();
        expect(getByText('title2')).toBeInTheDocument();
    });
});
