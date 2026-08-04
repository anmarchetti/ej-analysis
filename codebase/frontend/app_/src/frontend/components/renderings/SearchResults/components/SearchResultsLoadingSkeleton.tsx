import { FC } from 'react';
import classNames from 'classnames';

import styles from 'frontend/components/renderings/SearchResults/searchResults.module.scss';

interface ISearchResultsSkeletonProps {
    hideHeader?: boolean;
    hidePaginationShimmer?: boolean;
    isSortVisible?: boolean;
    showLHFShimmer?: boolean;
}

const SearchResultsLoadingSkeleton: FC<ISearchResultsSkeletonProps> = ({
    hideHeader,
    isSortVisible,
    showLHFShimmer,
    hidePaginationShimmer,
}) => (
    <>
        {!hideHeader && (
            <div className='hotel-search-results-header' data-tid='search-results-loading-skeleton-header'>
                <div
                    className='placeholder-search-header-item placeholder-shimmer'
                    data-tid='search-results-loading-skeleton-header-item'
                />
                {!!isSortVisible && (
                    <div
                        className='placeholder-search-header-item placeholder-shimmer'
                        data-tid='search-results-loading-skeleton-header-sort-item'
                    />
                )}
            </div>
        )}

        <div className={styles.searchPodFiltersLoadingLayout}>
            {showLHFShimmer && (
                <div
                    data-tid={'SearchPodFiltersSkeleton'}
                    className={classNames(styles.searchPodFiltersSkeleton, 'placeholder-shimmer')}
                />
            )}
            <div className='hotel-search-results'>
                <div className='hotel-card placeholder-shimmer' />
                <div className='hotel-card placeholder-shimmer' />
                <div className='hotel-card placeholder-shimmer' />
                <div className='hotel-card placeholder-shimmer' />
                <div className='hotel-card placeholder-shimmer' />
                <div className='hotel-card placeholder-shimmer' />
                <div className='hotel-card placeholder-shimmer' />
                <div className='hotel-card placeholder-shimmer' />
                <div className='hotel-card placeholder-shimmer' />
                <div className='hotel-card placeholder-shimmer' />
            </div>
        </div>
        {!hidePaginationShimmer && <div className='search-pagination placeholder-shimmer' />}
    </>
);

export default SearchResultsLoadingSkeleton;
