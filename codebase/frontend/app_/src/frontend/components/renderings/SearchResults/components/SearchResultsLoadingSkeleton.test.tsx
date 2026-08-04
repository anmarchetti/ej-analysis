import React from 'react';
import { render, screen } from '@testing-library/react';

import SearchResultsLoadingSkeleton from './SearchResultsLoadingSkeleton';

describe('<SearchResultsLoadingSkeleton />', () => {
    const createMockProps = () => ({
        hideHeader: false,
        hidePaginationShimmer: false,
        isSortVisible: false,
        showLHFShimmer: false,
    });

    let mocksProps;

    beforeEach(() => {
        mocksProps = createMockProps();
    });

    it('Standard render', () => {
        const { container } = render(<SearchResultsLoadingSkeleton {...mocksProps} />);

        expect(screen.getByTestId('search-results-loading-skeleton-header')).toBeInTheDocument();
        expect(screen.getByTestId('search-results-loading-skeleton-header-item')).toBeInTheDocument();
        expect(container.querySelector('.search-pagination.placeholder-shimmer')).toBeInTheDocument();
    });

    it('Should show two header items', () => {
        mocksProps.isSortVisible = true;
        render(<SearchResultsLoadingSkeleton {...mocksProps} />);

        expect(screen.getByTestId('search-results-loading-skeleton-header-item')).toBeInTheDocument();
        expect(screen.getByTestId('search-results-loading-skeleton-header-sort-item')).toBeInTheDocument();
    });

    it('Should hide header', () => {
        mocksProps.hideHeader = true;
        render(<SearchResultsLoadingSkeleton {...mocksProps} />);

        expect(screen.queryByTestId('search-results-loading-skeleton-header')).not.toBeInTheDocument();
    });

    it('Should show LHF shimmer', () => {
        mocksProps.showLHFShimmer = true;
        render(<SearchResultsLoadingSkeleton {...mocksProps} />);

        expect(screen.getByTestId('SearchPodFiltersSkeleton')).toBeInTheDocument();
    });

    it('Should hide pagination shimmer', () => {
        mocksProps.hidePaginationShimmer = true;
        const { container } = render(<SearchResultsLoadingSkeleton {...mocksProps} />);

        expect(container.querySelector('.search-pagination.placeholder-shimmer')).not.toBeInTheDocument();
    });
});
