import React, { FC, useEffect, useRef, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isSingleHotelSearch } from 'frontend/utils/search/search.utils';
import { buildAltIdsFromAltAccommodationsParams } from 'frontend/utils/url.utils';
import { IOffer } from 'models/data/IOffer';
import { ISearchResultsFields } from 'models/data/ISearchResultsFields';
import { isLoadedStatus, isLoadingMoreStatus, isLoadingPreviousStatus } from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { QueryParamName } from 'models/enum/QueryParamName';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import {
    useCompareStore,
    withCompareStore,
} from 'frontend/components/renderings/CompareDeals/stores/createCompareLocalStore';

import NoResultsErrorBlock from './components/NoResultsErrorBlock/NoResultsErrorBlock';
import SearchResultsContent from './SearchResultsContent/SearchResultsContent';
import { scrollHandler, scrollToPrevLoadPage } from './SearchResults.utils';

import styles from './searchResults.module.scss';

export type TSearchResultsProps = ISitecoreComponent<ISearchResultsFields, null>;

const SearchResults: FC<TSearchResultsProps> = ({ fields, rendering }) => {
    const {
        status,
        offers,
        hasOffers,
        totalOffers,
        selectedOfferIndex,
        currentPage,
        itemsOnEachPage,
        redirectToSearchResultsPage,
        updateDataLayer,
        forceOptimizeSRPEvent,
        isPromoPage,
        selectedAccommodationCodes,
        fetchOffers,
        resetBookingStore,
        setSelectedOfferIndex,
        redirectToHotelDetailsPage,
        isClickBackToSearch,
        clearPackageValidation,
        clearIsClickBackToSearch,
        saveSearchParamsAndFilterToLocalStorage,
        layoutId,
        isScreenLessMedium,
        getSetting,
        setCurrentPage,
        setIsLoadMoreOffers,
        setIsLoadPreviousOffers,
        grabSearchValuesFromSearchStore,
        pageFromStorage,
        isSearchResultPage,
        wasPromoPageClearedInStorage,
        setPromoPageClearedInStorage,
        utmParams,
        retrieveSearchParameters,
        isSearchPerformWithNewParams,
        setSearchPerformWithNewParams,
        isMaintenance,
        resetOffersDataStatus,
        filtersChanged,
        pageNumberChanged,
        isModalDisplayed,
        isFilterActive,
        onChangeSearchFilterStore,
        isSearchResultsPagePrev,
        isPromoPagePrev,
    } = useStore((stores: TStores) => ({
        status: stores.hotelsStore.status,
        offers: stores.hotelsStore.offers,
        hasOffers: stores.hotelsStore.hasOffers,
        totalOffers: stores.hotelsStore.numberOfHotels,
        selectedOfferIndex: stores.searchStore.selectedOfferIndex,
        currentPage: stores.searchStore.page,
        itemsOnEachPage: stores.searchStore.take,
        redirectToSearchResultsPage: stores.routerStore.redirectToSearchResultsPage,
        updateDataLayer: stores.trackingStore.searchPaginationChangeTrigger,
        forceOptimizeSRPEvent: stores.trackingStore.forceOptimizeSRPEvent,
        isPromoPage: stores.layoutStore.isPromoPage,
        selectedAccommodationCodes: stores.searchStore.searchTo.selectedAccommodationCodes,
        fetchOffers: stores.hotelsStore.fetchOffers,
        resetBookingStore: stores.bookingStore.resetBookingStore,
        setSelectedOfferIndex: stores.searchStore.setSelectedOfferIndex,
        redirectToHotelDetailsPage: stores.routerStore.redirectToHotelDetailsPage,
        isClickBackToSearch: stores.routerStore.isClickBackToSearch,
        clearPackageValidation: stores.bookingStore.clearPackageValidation,
        clearIsClickBackToSearch: stores.routerStore.clearIsClickBackToSearch,
        saveSearchParamsAndFilterToLocalStorage: stores.promoPageStore.saveSearchParamsAndFilterToLocalStorage,
        layoutId: stores.layoutStore.layoutId,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        getSetting: stores.layoutStore.getSetting,
        setCurrentPage: stores.searchStore.setPageNumber,
        setIsLoadMoreOffers: stores.hotelsStore.setIsLoadMoreOffers,
        setIsLoadPreviousOffers: stores.hotelsStore.setIsLoadPreviousOffers,
        grabSearchValuesFromSearchStore: stores.bookingStore.grabSearchValuesFromSearchStore,
        pageFromStorage: stores.promoPageStore.pageFromStorage,
        isSearchResultPage: stores.layoutStore.isSearchResultsPage,
        wasPromoPageClearedInStorage: stores.promoPageStore.wasPromoPageClearedInStorage,
        setPromoPageClearedInStorage: stores.promoPageStore.setPromoPageClearedInStorage,
        utmParams: stores.queryParamStore.utmParams,
        retrieveSearchParameters: stores.searchStore.retreiveSearchParameters,
        isSearchPerformWithNewParams: stores.searchStore.isSeachPerformWithNewParams,
        setSearchPerformWithNewParams: stores.searchStore.setSeachPerformWithNewParams,
        isMaintenance: stores.layoutStore.isMaintenance,
        resetOffersDataStatus: stores.hotelsStore.resetOffersDataStatus,
        filtersChanged: stores.searchFiltersStore.filtersChanged,
        pageNumberChanged: stores.searchFiltersStore.pageNumberChanged,
        isModalDisplayed: stores.searchFiltersStore.isModalDisplayed,
        isFilterActive: stores.searchFiltersStore.isFilterActive,
        onChangeSearchFilterStore: stores.searchFiltersStore.onChangeSearchFilterStore,
        isSearchResultsPagePrev: stores.layoutStore.isSearchResultsPagePrev,
        isPromoPagePrev: stores.layoutStore.isPromoPagePrev,
    }));

    const [isSelectOffer, setIsSelectOffer] = useState<boolean>(false);

    const numberOfPageFromStorage = pageFromStorage();
    const pageNumber = isPromoPage && numberOfPageFromStorage ? numberOfPageFromStorage : currentPage;
    const [minLoadedPageNumber, setMinLoadedPageNumber] = useState<number>(pageNumber);
    const [maxLoadedPageNumber, setMaxLoadedPageNumber] = useState<number>(pageNumber);

    const offerCardBySelectedIndex = useRef<HTMLDivElement | null>(null);
    const searchResultBoxRef = useRef<HTMLDivElement | null>(null);

    const isExtraSmallMobile = useXSMobileViewport();
    const { isCompareModeEnabled, isCompareOverlayOpened } = useCompareStore();

    const prevWasPromoPageClearedInStorage = usePrevious(wasPromoPageClearedInStorage);
    const prevLayoutId = usePrevious(layoutId);
    const prevIsPromoPage = usePrevious(isPromoPage);
    const prevIsClickBackToSearch = usePrevious(isClickBackToSearch);
    const prevIsModalDisplayed = usePrevious(isModalDisplayed);
    const prevSelectedOfferIndex = usePrevious(selectedOfferIndex);
    const prevStatus = usePrevious(status);
    const prevIsExtraSmallMobile = usePrevious(isExtraSmallMobile);

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);
    const isLoadingPreviousShown =
        isLoadedStatus(status) &&
        hasOffers &&
        isExtraSmallMobile &&
        totalOffers > itemsOnEachPage &&
        minLoadedPageNumber !== 1;
    const isOffersListShown =
        (isLoadingMoreStatus(status) || isLoadingPreviousStatus(status) || isLoadedStatus(status)) && hasOffers;
    const isLoadingMoreShown = isLoadedStatus(status) && hasOffers && totalOffers > itemsOnEachPage;

    useEffect(() => {
        const resetFilter = (isPromoPage && isSearchResultsPagePrev) || (isSearchResultPage && isPromoPagePrev);

        if (resetFilter) {
            onChangeSearchFilterStore({
                cb: ctx => {
                    ctx.filters = [];
                    ctx.isFiltersLoaded = false;
                    ctx.isPresetDestinationFilter = false;
                    ctx.isModalDisplayed = false;
                },
            });
        }

        return () => {
            resetOffersDataStatus();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isSearchPerformWithNewParams) {
            if (!isPromoPage && !isSearchResultPage) {
                redirectToSearchResultsPage();
            }

            updateLoadedPageNumbers(1);
            setSearchPerformWithNewParams(false);

            return;
        }

        /*
         * If promo page storage was cleaned, minLoadedPageNumber, maxLoadedPageNumber, setSelectedOfferIndex
         * should be reset to 1 for correct showing Load more and Load previous btn.
         */
        if (wasPromoPageClearedInStorage && !prevWasPromoPageClearedInStorage) {
            updateLoadedPageNumbers(1);
            setPromoPageClearedInStorage(false);
            setSelectedOfferIndex(-1);

            return;
        }

        /*
         * If user go to holiday from 2nd page and then go to new promo page type loaded page number should be reset
         */
        if (layoutId !== prevLayoutId && isPromoPage === prevIsPromoPage && isPromoPage) {
            updateLoadedPageNumbers(1);
            setSelectedOfferIndex(-1);

            return;
        }

        /** Fire optimize event on resize */
        if (isExtraSmallMobile !== prevIsExtraSmallMobile) {
            forceOptimizeSRPEvent();
        }

        /**
         * If in desktop user go to any page number,
         * change desktop to mobile view,
         * then minLoadedPageNumber and maxLoadedPageNumber need to reset
         * for correct showing Load more and Load previous btn
         */
        if (isExtraSmallMobile && !prevIsExtraSmallMobile && prevIsExtraSmallMobile !== undefined) {
            updateLoadedPageNumbers(currentPage);

            return;
        }

        scrollHandler(
            offerCardBySelectedIndex,
            {
                setSelectedOfferIndex,
                isScreenLessMedium,
                isPromoPage,
                onChangeSearchFilterStore,
                isFilterActive,
                selectedOfferIndex,
                status,
                filtersChanged,
                totalOffers,
                isModalDisplayed,
                pageNumberChanged,
                searchResultBoxRef,
            },
            {
                prevIsModalDisplayed,
                prevSelectedOfferIndex,
                prevStatus,
            },
        );

        const accCodes = selectedAccommodationCodes?.split(',') || [];

        /**
         * Redirect to the holiday details page only if
         * selected ONE accommodation AND returned ONE offer in the results OR user performs search by hotel name
         * AND it's not Promo Page
         */
        if (
            !isPromoPage &&
            !isSelectOffer &&
            isLoadedStatus(status) &&
            !isClickBackToSearch &&
            prevIsClickBackToSearch !== true &&
            selectedAccommodationCodes &&
            (accCodes.length === 1 || isSingleHotelSearch(accCodes)) &&
            offers.length == 1
        ) {
            onSelectOffer(offers[0], 0);
        }

        if (isClickBackToSearch) {
            clearIsClickBackToSearch();
        }
    });

    const updateLoadedPageNumbers = (value: number): void => {
        setMinLoadedPageNumber(value);
        setMaxLoadedPageNumber(value);
    };

    const onSelectOffer = (offer: IOffer, index: number): void => {
        setIsSelectOffer(true);
        resetBookingStore();
        const transfer = offer.transfers?.length ? offer.transfers[0].code : '';
        grabSearchValuesFromSearchStore();
        const additionalParams = {
            [QueryParamName.Transfer]: transfer,
            [QueryParamName.DefaultTransfer]: transfer,
            ...utmParams,
        };

        if (offer.altAcc?.length) {
            const [altAccommodationIds, altPackageIds] = buildAltIdsFromAltAccommodationsParams(offer.altAcc);

            additionalParams[QueryParamName.AltAccommodationIds] = altAccommodationIds;
            additionalParams[QueryParamName.AltPackageIds] = altPackageIds;
        }

        redirectToHotelDetailsPage(offer, additionalParams, true);
        setSelectedOfferIndex(index);
    };

    const onSetSelectedOfferIndex = (i: number, page?: number): void => {
        if (isExtraSmallMobile && offers.length > itemsOnEachPage && page) {
            setCurrentPage(page);
            !isPromoPage && redirectToSearchResultsPage();
        }

        if (isPromoPage) {
            saveSearchParamsAndFilterToLocalStorage(layoutId);
        }

        resetBookingStore();
        clearPackageValidation();
        setSelectedOfferIndex(i);
        retrieveSearchParameters();
    };

    const onLoadPrevious = async (): Promise<void> => {
        const page = minLoadedPageNumber - 1;
        setCurrentPage(page);
        setIsLoadPreviousOffers(true);

        await fetchOffers(true);

        // Set minLoadedPageNumber after results are loaded,
        // else it causes unnecessary re-render
        setMinLoadedPageNumber(page);

        if (!isPromoPage) {
            redirectToSearchResultsPage();
        }

        updateDataLayer?.();
        setIsLoadPreviousOffers(false);
        scrollToPrevLoadPage(itemsOnEachPage);
    };

    const onLoadMore = async (): Promise<void> => {
        const nextPageNumber = maxLoadedPageNumber + 1;
        setMaxLoadedPageNumber(nextPageNumber);
        setCurrentPage(nextPageNumber);
        setIsLoadMoreOffers(true);

        await fetchOffers(true);

        if (!isPromoPage) {
            redirectToSearchResultsPage();
        }

        updateDataLayer?.();
        setIsLoadMoreOffers(false);
    };

    if (isMaintenance) {
        return (
            <div className='hotel-search-results-box' ref={searchResultBoxRef}>
                <NoResultsErrorBlock
                    title={getSetting(SiteSettings.NoResultsErrorBlockTitle)}
                    description={getSetting(SiteSettings.NoResultsErrorBlockDescription)}
                    icon={getSetting(SiteSettings.NoResultsErrorBlockIcon)}
                />
            </div>
        );
    }

    return (
        <>
            <SearchResultsContent
                boxRef={searchResultBoxRef}
                fallbackImage={fallbackImage}
                isLoadingMoreShown={isLoadingMoreShown}
                isLoadingPreviousShown={isLoadingPreviousShown}
                isOffersListShown={isOffersListShown}
                maxLoadedPageNumber={maxLoadedPageNumber}
                minLoadedPageNumber={minLoadedPageNumber}
                offerCardBySelectedIndex={offerCardBySelectedIndex}
                onLoadMore={onLoadMore}
                onLoadPrevious={onLoadPrevious}
                onSetSelectedOfferIndex={onSetSelectedOfferIndex}
                fields={fields}
                rendering={rendering}
            />

            <div
                className={classNames(styles.compareWrapper, {
                    [styles.compareWrapperActive]: isCompareModeEnabled,
                    [styles.compareOverlayOpened]: isCompareOverlayOpened,
                })}
                data-tid='compare-deals-wrapper'
            >
                <Placeholder name={PlaceholderNames.CompareDeals} rendering={rendering} />
            </div>
        </>
    );
};

export default withCompareStore(observer(SearchResults));
