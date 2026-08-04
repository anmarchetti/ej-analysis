import React from 'react';
import { render } from '@testing-library/react';

import SitemapAnchoredGroup from './SitemapAnchoredGroup';

const createProps = () => ({
    anchor: { id: '1', letter: 'L' },
    pages: [1, 1],
    sectionTitle: 'title',
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    appStore: { isScreenLessMedium: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/Sitemap/components/SitemapLinksList', () => () => (
    <div data-tid='sitemap-links-list' />
));

jest.mock('frontend/components/icons-new/ChevronRight', () => () => <div data-tid='chevron-right' />);

jest.mock('frontend/components/icons-new/ChevronLeft', () => () => <div data-tid='chevron-left' />);

jest.mock('frontend/components/common/Drawer', () => ({ children }) => <div data-tid='drawer'>{children}</div>);

describe('<SitemapAnchoredGroup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render anchor letter', () => {
        const { getByText } = render(<SitemapAnchoredGroup {...mockProps} />);

        expect(getByText('L')).toBeInTheDocument();
    });

    it('should render SitemapLinksList', () => {
        const { getByTestId } = render(<SitemapAnchoredGroup {...mockProps} />);

        expect(getByTestId('sitemap-links-list')).toBeInTheDocument();
    });

    describe('Screen less medium and more than 1 page provided', () => {
        beforeEach(() => {
            mockStores.appStore.isScreenLessMedium = true;
        });

        it('should render 2 buttons', () => {
            const { getAllByRole } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(getAllByRole('button').length).toBe(2);
        });

        it('should render ChevronRight icon', () => {
            const { getByTestId } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(getByTestId('chevron-right')).toBeInTheDocument();
        });

        it('should render ChevronLeft icon', () => {
            const { getByTestId } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(getByTestId('chevron-left')).toBeInTheDocument();
        });

        it('should render Drawer', () => {
            const { getByTestId } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(getByTestId('drawer')).toBeInTheDocument();
        });

        it('should render title with letter', () => {
            const { getByRole } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(getByRole('heading')).toHaveTextContent('title - L');
        });
    });

    describe('Screen is NOT less medium and more than 1 page provided', () => {
        it('should render 2 buttons', () => {
            const { queryAllByRole } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(queryAllByRole('button').length).toBe(0);
        });

        it('should render ChevronRight icon', () => {
            const { queryByTestId } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(queryByTestId('chevron-right')).not.toBeInTheDocument();
        });

        it('should render ChevronLeft icon', () => {
            const { queryByTestId } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(queryByTestId('chevron-left')).not.toBeInTheDocument();
        });

        it('should render Drawer', () => {
            const { queryByTestId } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(queryByTestId('drawer')).not.toBeInTheDocument();
        });

        it('should render title with letter', () => {
            const { queryByRole } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(queryByRole('heading')).not.toBeInTheDocument();
        });
    });

    describe('Screen is less medium and only 1 page provided', () => {
        beforeEach(() => {
            mockStores.appStore.isScreenLessMedium = true;
            mockProps.pages = [1];
        });

        it('should render 2 buttons', () => {
            const { queryAllByRole } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(queryAllByRole('button').length).toBe(0);
        });

        it('should render ChevronRight icon', () => {
            const { queryByTestId } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(queryByTestId('chevron-right')).not.toBeInTheDocument();
        });

        it('should render ChevronLeft icon', () => {
            const { queryByTestId } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(queryByTestId('chevron-left')).not.toBeInTheDocument();
        });

        it('should render Drawer', () => {
            const { queryByTestId } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(queryByTestId('drawer')).not.toBeInTheDocument();
        });

        it('should render title with letter', () => {
            const { queryByRole } = render(<SitemapAnchoredGroup {...mockProps} />);

            expect(queryByRole('heading')).not.toBeInTheDocument();
        });
    });
});
