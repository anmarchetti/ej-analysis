import { FC, useCallback, useEffect, useRef } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getSelectValueFromSortOrder } from 'frontend/utils/sort.utils';
import { ISearchResultsFields } from 'models/data/ISearchResultsFields';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { ExperimentTestIds } from 'models/enum/cro/Experiment';
import {
    DataStatus,
    isErrorStatus,
    isLoadedStatus,
    isLoadingMoreStatus,
    isLoadingPreviousStatus,
    isLoadingStatus,
} from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import LeftHandFilters from 'frontend/components/common/LeftHandFilter';
import Pagination from 'frontend/components/common/Pagination';
import useExperiment from 'frontend/components/cro/Experiment/hooks/useExperiment';
import GenericRecommendedHotels from 'frontend/components/renderings/GenericRecommendedHotels/GenericRecommendedHotels';
import NoResults from 'frontend/components/renderings/SearchResults/components/NoResults';
import Offers from 'frontend/components/renderings/SearchResults/components/Offers/Offers';
import RecommendedCarouselFor5ResultsPage from 'frontend/components/renderings/SearchResults/components/RecomendedCarouselFor5ResultsPage';
import SearchResultsHeader from 'frontend/components/renderings/SearchResults/components/SearchResultsHeader';
import SearchResultsLoadingSkeleton from 'frontend/components/renderings/SearchResults/components/SearchResultsLoadingSkeleton';
import ShortlistManaging from 'frontend/components/renderings/SearchResults/components/ShortlistManaging';

import styles from './SearchResultsContent.module.scss';

export interface ISearchResultsContentProps {
    boxRef: React.RefObject<HTMLDivElement>;
    fallbackImage: any;
    isLoadingMoreShown: boolean;
    isLoadingPreviousShown: boolean;
    isOffersListShown: boolean;
    maxLoadedPageNumber: number;
    minLoadedPageNumber: number;
    offerCardBySelectedIndex: any;
    onLoadMore: () => void;
    onLoadPrevious: () => void;
    onSetSelectedOfferIndex: (i: number, page?: number) => void;
    rendering: any;
    fields?: ISearchResultsFields;
}

const MAX_NUMBER_TO_DISPLAY_RECOMMENDER = 5;

export const SearchResultsContent: FC<ISearchResultsContentProps> = props => {
    const {
        status,
        getPhrase,
        hasOffers,
        totalOffers,
        itemsOnEachPage,
        fetchOffers,
        currentPage,
        setCurrentPage,
        updateDataLayer,
        redirectToSearchResultsPage,
        offers,
        areFiltersCollapsed,
        recommendedHotels,
        isMapModalDisplayed,
        onChangeSearchFilterStore,
        isStaticPromoPage,
        isPromoPage,
        setForcePrefillPage,
        isFiltersLoaded,
        filters,
        hydrateRecentlyUsedFilters,
        isSearchResultsPage,
        setRecommendedFilterExperimentTestVariant,
        setRecentlyUsedFilterExperimentTestVariant,
    } = useStore((stores: TStores) => ({
        status: stores.hotelsStore.status,
        offers: stores.hotelsStore.offers,
        hasOffers: stores.hotelsStore.hasOffers,
        totalOffers: stores.hotelsStore.numberOfHotels,
        currentPage: stores.searchStore.page,
        itemsOnEachPage: stores.searchStore.take,
        redirectToSearchResultsPage: stores.routerStore.redirectToSearchResultsPage,
        updateDataLayer: stores.trackingStore.searchPaginationChangeTrigger,
        getPhrase: stores.layoutStore.getPhrase,
        fetchOffers: stores.hotelsStore.fetchOffers,
        setCurrentPage: stores.searchStore.setPageNumber,
        areFiltersCollapsed: stores.searchFiltersStore.areFiltersCollapsed,
        recommendedHotels: stores.bookingStore.recommendedHotels,
        isMapModalDisplayed: stores.searchFiltersStore.isMapModalDisplayed,
        onChangeSearchFilterStore: stores.searchFiltersStore.onChangeSearchFilterStore,
        isStaticPromoPage: stores.layoutStore.isStaticPromoPage,
        isPromoPage: stores.layoutStore.isPromoPage,
        setForcePrefillPage: stores.promoPageStore.setForcePrefillPage,
        isFiltersLoaded: stores.searchFiltersStore.isFiltersLoaded,
        filters: stores.searchFiltersStore.filters,
        hydrateRecentlyUsedFilters: stores.searchFiltersStore.hydrateRecentlyUsedFilters,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        setRecommendedFilterExperimentTestVariant: stores.searchFiltersStore.setRecommendedFilterExperimentTestVariant,
        setRecentlyUsedFilterExperimentTestVariant:
            stores.searchFiltersStore.setRecentlyUsedFilterExperimentTestVariant,
    }));

    const {
        minLoadedPageNumber,
        onLoadPrevious,
        rendering,
        offerCardBySelectedIndex,
        onSetSelectedOfferIndex,
        fields,
        fallbackImage,
        onLoadMore,
        maxLoadedPageNumber,
        isLoadingPreviousShown,
        isLoadingMoreShown,
        isOffersListShown,
        boxRef,
    } = props;

    const isMobile = useMobileViewport();
    const previousUrlRef = useRef<string>(globalThis.location?.pathname || '');

    const handlePopState = useCallback(
        (event: PopStateEvent): void => {
            const state = event.state;
            const currentUrl = globalThis.location.pathname;
            const previousUrl = previousUrlRef.current;
            const restoredPageUrl = state?.options?.previousPage;
            const restoredPageNumber = state?.options?.promoPage;

            previousUrlRef.current = currentUrl;

            const hasPromoData = restoredPageUrl || restoredPageNumber;
            // Exit early if navigating away from promo page:
            // - previousUrl changed without promo data (leaving promo page to home/other page)
            const isUrlMismatch = previousUrl !== currentUrl && !hasPromoData;

            if (isUrlMismatch) {
                return;
            }

            const targetPage = restoredPageNumber || 1;

            // Only update page and fetch offers when navigating within the same promo page
            if (previousUrl === currentUrl) {
                setCurrentPage(targetPage);
                fetchOffers(true);
            }

            // Set force prefill page number if it exists in state
            if (restoredPageNumber) {
                setForcePrefillPage(restoredPageNumber);
            }
        },
        [setCurrentPage, setForcePrefillPage, fetchOffers],
    );

    const recommendedFilterExperiment = useExperiment(ExperimentTestIds.RecommendedFilter);
    const recentlyUsedFilterExperiment = useExperiment(ExperimentTestIds.RecentlyUsedFilter);

    const isFiltersLoading = isLoadingStatus(status) && (!isFiltersLoaded || !filters.length);

    // INS-1930: Hooks were moved here from LeftHandFilter because on mobile LeftHandFilter
    // only mounts when the user opens the filters modal. By that time filters are already
    // loaded (isFiltersLoading = false), so the effects inside LeftHandFilter would never fire.
    useEffect(() => {
        if (isSearchResultsPage && isFiltersLoading) {
            hydrateRecentlyUsedFilters();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSearchResultsPage, isFiltersLoading]);

    useEffect(() => {
        setRecommendedFilterExperimentTestVariant(recommendedFilterExperiment?.testVariant);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recommendedFilterExperiment]);

    useEffect(() => {
        setRecentlyUsedFilterExperimentTestVariant(recentlyUsedFilterExperiment?.testVariant);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recentlyUsedFilterExperiment]);

    useEffect(() => {
        const shouldSetupListener = isStaticPromoPage && !isMobile;

        if (!shouldSetupListener) {
            return;
        }

        const state = globalThis.history.state;
        const currentUrl = globalThis.location.pathname;

        previousUrlRef.current = currentUrl;

        // Restore page from history state on component mount
        // This handles browser refresh or direct navigation to promo page
        if (state?.options?.promoPage && state.options.promoPage !== currentPage) {
            setCurrentPage(state.options.promoPage);
            setForcePrefillPage(state.options.promoPage);
        }

        globalThis.addEventListener('popstate', handlePopState);

        return () => {
            globalThis.removeEventListener('popstate', handlePopState);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStaticPromoPage, isMobile, handlePopState, setCurrentPage, setForcePrefillPage]);

    if (isErrorStatus(status)) {
        return (
            <>
                <div className='hotel-search-results-box' ref={boxRef}>
                    <h2 className='text-center'>
                        {getPhrase(SitecoreDictionary.SearchResultsErrorsLoadingOffersError)}
                    </h2>
                </div>

                {isPromoPage && (
                    <GenericRecommendedHotels
                        withoutPadding
                        title={getPhrase(SitecoreDictionary.SearchResultsLabelsBd4CarouselTitleErrorStatus)}
                    />
                )}
            </>
        );
    }

    const isLoading = isLoadingStatus(status) && !isMapModalDisplayed;
    const isRenderHolidaysWithConfidence = (hasOffers && status !== DataStatus.NotLoaded) || isLoading;
    const fetchResultsOnPagination = (force: boolean): void => {
        fetchOffers(force);
        isPromoPage && !isMobile && onChangeSearchFilterStore({ key: 'pageNumberChanged', value: true });
    };

    return (
        <div className='hotel-search-results-box' ref={boxRef}>
            <SearchResultsHeader hasOffers={hasOffers} totalOffers={totalOffers} status={status} />

            {isRenderHolidaysWithConfidence && (
                <Placeholder name={PlaceholderNames.HolidayWithConfidence} rendering={rendering} />
            )}

            <div className={classNames(styles.columns, { [styles.noResult]: !hasOffers && isLoadedStatus(status) })}>
                {!isMobile && (
                    <div className={classNames(styles.leftColumn)}>
                        <LeftHandFilters
                            rendering={rendering}
                            isCollapsed={areFiltersCollapsed}
                            isPaginationShown={isOffersListShown && isLoadingMoreShown}
                            isShown={!isMapModalDisplayed}
                        />
                    </div>
                )}

                {isLoading && (
                    <div className={styles.rightColumn}>
                        <SearchResultsLoadingSkeleton hideHeader />
                    </div>
                )}

                {/*
                    Since we have a single data source (searchFilterStore) for all filters,
                    when working with Filter in Popup (SearchResultsMap component),
                    we hide the cards to improve performance issue
                    (otherwise, the cards get re-rendered on each filter change).
                */}

                {isOffersListShown && !isMapModalDisplayed && (
                    <div
                        data-tid='search-results-right-column'
                        className={classNames(styles.rightColumn, {
                            [styles.noMargin]: !isLoadingMoreShown && !recommendedHotels?.length,
                        })}
                    >
                        {isLoadingPreviousShown && (
                            <Pagination
                                isLoadPreviousBtn
                                fetchResults={fetchOffers}
                                numberOfResults={totalOffers}
                                itemsOnEachPage={itemsOnEachPage}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                                updateDataLayer={updateDataLayer}
                                redirectToSearchResultsPage={redirectToSearchResultsPage}
                                onLoadPrevious={onLoadPrevious}
                            />
                        )}

                        {isLoadingPreviousStatus(status) && (
                            <div className='spinner-container'>
                                <div className='spinner-container__icon' />
                            </div>
                        )}

                        <div className='hotel-search-results' data-tid='search-results-section'>
                            {hasOffers && (
                                <Offers
                                    offers={offers}
                                    currentPage={currentPage}
                                    itemsOnEachPage={itemsOnEachPage}
                                    minLoadedPageNumber={minLoadedPageNumber}
                                    rendering={rendering}
                                    fields={undefined}
                                    params={{}}
                                    offerCardBySelectedIndex={offerCardBySelectedIndex}
                                    onSetSelectedOfferIndex={onSetSelectedOfferIndex}
                                    alternativeFlightsSortOrders={
                                        fields?.AlternativeFlightsSortOrders?.map(getSelectValueFromSortOrder) || []
                                    }
                                    alternativeFlightsDefaultSort={
                                        fields?.AlternativeFlightsDefaultSort?.fields?.Code?.value ||
                                        AlternativeFlightsSortBy.PriceLowToHigh
                                    }
                                />
                            )}
                        </div>

                        {isLoadingMoreStatus(status) && (
                            <div className='spinner-container'>
                                <div className='spinner-container__icon' />
                            </div>
                        )}

                        {isLoadingMoreShown && (
                            <Pagination
                                fetchResults={fetchResultsOnPagination}
                                numberOfResults={totalOffers}
                                itemsOnEachPage={itemsOnEachPage}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                                updateDataLayer={updateDataLayer}
                                redirectToSearchResultsPage={redirectToSearchResultsPage}
                                onLoadMore={onLoadMore}
                                maxLoadedPageNumber={maxLoadedPageNumber}
                            />
                        )}

                        {totalOffers > 0 && totalOffers <= MAX_NUMBER_TO_DISPLAY_RECOMMENDER && (
                            <RecommendedCarouselFor5ResultsPage fallbackImage={fallbackImage} fields={fields} />
                        )}
                    </div>
                )}

                {isLoadedStatus(status) && !hasOffers && (
                    <div className={styles.carouselWrapper}>
                        <NoResults
                            onSetSelectedOfferIndex={onSetSelectedOfferIndex}
                            fallbackImage={fallbackImage}
                            fields={fields}
                        />
                    </div>
                )}
            </div>

            <ShortlistManaging />
        </div>
    );
};

export default observer(SearchResultsContent);
