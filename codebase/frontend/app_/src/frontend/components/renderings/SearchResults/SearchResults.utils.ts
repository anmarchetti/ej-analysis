import { RefObject } from 'react';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import { LayoutStore, OffersStore, SearchStore } from 'frontend/store/holidays';
import AppStore from 'frontend/store/holidays/app/AppStore';
import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import { isLoadedStatus, isLoadingStatus } from 'models/enum/DataStatus';
import { SP_FILTERS_WRAPPER_DATA_TID } from 'frontend/components/renderings/SearchPodFilters/SearchPodFilters';

export const MIN_NUMBER_OF_OFFERS_TO_SCROLL = 3;

export const SEARCH_RESULTS_FILTERS_Y_OFFSET = 50;

const SCROLL_DELAY = 100;

export const getPromoPageMobileOffset = (): number => {
    const filtersWrapper = document.querySelector(`[data-tid="${SP_FILTERS_WRAPPER_DATA_TID}"]`) as HTMLDivElement;

    return filtersWrapper?.offsetHeight ?? 0;
};

export const getOffsetTop = (
    searchResultBoxRef: RefObject<HTMLDivElement>,
    { isScreenLessMedium, isFilterActive, isScrollableToResults, isPromoPage }: Record<string, boolean>,
): number => {
    let top = 0;

    const box = searchResultBoxRef;

    if (!box?.current) return top;

    const boxOffsetTop = box.current?.getBoundingClientRect().top + window.scrollY;

    if (isScreenLessMedium) {
        if (isFilterActive) {
            const offsetTop = isPromoPage ? getPromoPageMobileOffset() : 0;

            top = boxOffsetTop - offsetTop;
        }
    } else if (isScrollableToResults) {
        const offsetTop = isPromoPage ? 0 : SEARCH_RESULTS_FILTERS_Y_OFFSET;

        top = boxOffsetTop - offsetTop;
    }

    return top;
};

export const getIsScrollableToHotel = (
    offerCardBySelectedIndex: RefObject<HTMLDivElement>,
    selectedOfferIndex: SearchStore['selectedOfferIndex'],
    status: OffersStore['status'],
    prevSelectedOfferIndex: SearchStore['selectedOfferIndex'] | undefined,
    prevStatus: OffersStore['status'] | undefined,
): boolean =>
    prevSelectedOfferIndex === selectedOfferIndex &&
    selectedOfferIndex > -1 &&
    !!offerCardBySelectedIndex.current &&
    !!prevStatus &&
    isLoadingStatus(prevStatus) &&
    isLoadedStatus(status);

export const getIsScrollableUpOrToResults = (
    props: {
        filtersChanged: SearchFilterStore['filtersChanged'];
        isFilterActive: SearchFilterStore['isFilterActive'];
        isModalDisplayed: SearchFilterStore['isModalDisplayed'];
        isScreenLessMedium: AppStore['isScreenLessMedium'];
        pageNumberChanged: SearchFilterStore['pageNumberChanged'];
        status: OffersStore['status'];
        totalOffers: OffersStore['numberOfHotels'];
    },
    prevProps: {
        prevIsModalDisplayed: SearchFilterStore['isModalDisplayed'] | undefined;
        prevStatus: OffersStore['status'] | undefined;
    },
): { isScrollableToResults: boolean; isScrollableUpOrToResults: boolean } => {
    const {
        isFilterActive,
        filtersChanged,
        totalOffers,
        isScreenLessMedium,
        isModalDisplayed,
        status,
        pageNumberChanged,
    } = props;
    const { prevStatus, prevIsModalDisplayed } = prevProps;

    let isScrollableUpOrToResults;

    const isLoaded = !isLoadingStatus(status) && prevStatus && isLoadingStatus(prevStatus);

    const preSelectedFilters = isFilterActive && !filtersChanged;
    const isScrollableToResults =
        totalOffers <= MIN_NUMBER_OF_OFFERS_TO_SCROLL ||
        preSelectedFilters ||
        (pageNumberChanged && !isScreenLessMedium);

    if (isScreenLessMedium) {
        const isFilterChanged = filtersChanged && prevIsModalDisplayed;

        isScrollableUpOrToResults = !isModalDisplayed && (isLoaded || isFilterChanged);
    } else {
        const isScrollableUp = !filtersChanged;

        isScrollableUpOrToResults = isLoaded && (isScrollableUp || isScrollableToResults);
    }

    return { isScrollableToResults, isScrollableUpOrToResults };
};

export const scrollHandler = (
    offerCardBySelectedIndex: RefObject<HTMLDivElement>,
    props: {
        filtersChanged: SearchFilterStore['filtersChanged'];
        isFilterActive: SearchFilterStore['isFilterActive'];
        isModalDisplayed: SearchFilterStore['isModalDisplayed'];
        isPromoPage: LayoutStore['isPromoPage'];
        isScreenLessMedium: AppStore['isScreenLessMedium'];
        onChangeSearchFilterStore: SearchFilterStore['onChangeSearchFilterStore'];
        pageNumberChanged: SearchFilterStore['pageNumberChanged'];
        searchResultBoxRef: RefObject<HTMLDivElement>;
        selectedOfferIndex: SearchStore['selectedOfferIndex'];
        setSelectedOfferIndex: SearchStore['setSelectedOfferIndex'];
        status: OffersStore['status'];
        totalOffers: OffersStore['numberOfHotels'];
    },
    prevProps: {
        prevIsModalDisplayed: SearchFilterStore['isModalDisplayed'] | undefined;
        prevSelectedOfferIndex: SearchStore['selectedOfferIndex'] | undefined;
        prevStatus: OffersStore['status'] | undefined;
    },
): void => {
    const {
        isScreenLessMedium,
        isPromoPage,
        onChangeSearchFilterStore,
        isFilterActive,
        selectedOfferIndex,
        status,
        setSelectedOfferIndex,
        searchResultBoxRef,
    } = props;
    const { prevSelectedOfferIndex, prevStatus } = prevProps;

    const isScrollableToHotel = getIsScrollableToHotel(
        offerCardBySelectedIndex,
        selectedOfferIndex,
        status,
        prevSelectedOfferIndex,
        prevStatus,
    );

    if (isScrollableToHotel) {
        setTimeout(() => {
            scrollIntoViewIfNeeded(offerCardBySelectedIndex.current as HTMLDivElement, {
                behavior: 'smooth',
                block: 'center',
            });

            setSelectedOfferIndex(-1);
        });
    } else {
        const { isScrollableUpOrToResults, isScrollableToResults } = getIsScrollableUpOrToResults(props, prevProps);

        if (isScrollableUpOrToResults) {
            setTimeout(() => {
                window.scrollTo({
                    top: getOffsetTop(searchResultBoxRef, {
                        isScreenLessMedium,
                        isFilterActive,
                        isScrollableToResults,
                        isPromoPage,
                    }),
                    behavior: 'smooth',
                });

                onChangeSearchFilterStore({
                    cb: ctx => {
                        ctx.filtersChanged = false;
                        ctx.pageNumberChanged = false;
                    },
                });
            }, SCROLL_DELAY);
        }
    }
};

export const scrollToPrevLoadPage = (itemsOnEachPage: number): void => {
    const nextPageStart = document.getElementsByClassName('hotel-card')[itemsOnEachPage - 1];
    nextPageStart?.scrollIntoView(true);
};
