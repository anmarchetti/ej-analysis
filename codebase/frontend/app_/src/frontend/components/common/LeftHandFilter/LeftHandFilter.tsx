import { useLayoutEffect, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import {
    useMoreThenDesktopViewport,
    useMoreThenMobileViewport,
    useMoreThenTabletViewport,
} from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays/create-stores';
import { getSlidesToShow, responsiveCarouselSlim } from 'frontend/utils/getSlidersToShow';
import { isErrorStatus, isLoadingStatus } from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import FilterContent from './FilterContent/FilterContentWrapper';
import FilterSkeleton from './FilterContent/FilterSkeleton/FilterSkeleton';
import ClearAllPanel from './ClearAllPanel';

import styles from './LeftHandFilter.module.scss';

export interface ILeftHandFilterProps {
    isCollapsed?: boolean;
    isOnMapPopup?: boolean;
    isPaginationShown?: boolean;
    isShown?: boolean;
    rendering?: any;
}

export const RECOMMENDER_OFFSET = 5;
export const PAGINATION_OFFSET = 60;
export const DEFAULT_OFFSET = 30;

export const LeftHandFilter = ({
    rendering,
    isPaginationShown,
    isOnMapPopup,
    isShown = true,
    ...props
}: ILeftHandFilterProps): JSX.Element | null => {
    const { status, isMaintenance, isPromoPage, isFiltersLoaded, availableFilters, recommendedHotels, store } =
        useStore((stores: IHolidaysStores) => ({
            status: stores.hotelsStore.status,
            isMaintenance: stores.layoutStore.isMaintenance,
            isPromoPage: stores.layoutStore.isPromoPage,
            isFiltersLoaded: stores.searchFiltersStore.isFiltersLoaded,
            availableFilters: stores.searchFiltersStore.filters,
            recommendedHotels: stores.bookingStore.recommendedHotels,
            store: stores.searchFiltersStore,
        }));

    const [offset, setOffset] = useState(0);
    const isScreenExtraLarge = useMoreThenDesktopViewport();
    const isScreenLarge = useMoreThenTabletViewport();
    const isScreenMedium = useMoreThenMobileViewport();

    const isFiltersLoading = isLoadingStatus(status) && (!isFiltersLoaded || !availableFilters.length);

    useLayoutEffect(() => {
        if (isLoadingStatus(status) && (!isFiltersLoaded || !availableFilters.length)) {
            return;
        }

        const getFilterHeightOffset = (): number => {
            const recommendedHotelsNumber = recommendedHotels?.length ?? 0;
            const isCarouselDotList =
                recommendedHotelsNumber >
                getSlidesToShow(responsiveCarouselSlim, isScreenExtraLarge, isScreenLarge, isScreenMedium);

            if (isCarouselDotList) {
                return DEFAULT_OFFSET + RECOMMENDER_OFFSET;
            }

            if (recommendedHotelsNumber) {
                return RECOMMENDER_OFFSET;
            }

            if (isPaginationShown) {
                return PAGINATION_OFFSET;
            }

            return 0;
        };

        const heightOffset = getFilterHeightOffset();
        setOffset(heightOffset);
    }, [
        status,
        isFiltersLoaded,
        availableFilters,
        isScreenExtraLarge,
        isScreenLarge,
        isScreenMedium,
        recommendedHotels,
        isPaginationShown,
    ]);

    if ((isErrorStatus(status) && isPromoPage) || isMaintenance) {
        // isMaintenance
        return null;
    }

    if (isFiltersLoading) {
        const mapFields = rendering?.placeholders?.[PlaceholderNames.SearchResultsMap]?.[0]?.fields;
        const withMap = !!mapFields && !mapFields.IsSearchResultsMapButtonDisabled?.value;

        return <FilterSkeleton withMap={withMap} />;
    }

    if (isFiltersLoaded) {
        return (
            <div
                data-tid='filters-wrapper'
                className={classNames(styles.filtersWrapper, { [styles.filtersMapWrapper]: isOnMapPopup })}
                style={{ minHeight: `calc(100% - ${offset}px)` }}
            >
                {!isOnMapPopup && <Placeholder name={PlaceholderNames.SearchResultsMap} rendering={rendering} />}

                {/*
                    Since we have a single data source (searchFilterStore) for all filters,
                    when working with Filter in Popup (SearchResultsMap component),
                    we hide the main one (on Search Results page) to improve performance issue
                    (otherwise, it gets rendered and updated twice – on the page and in the popup).
                */}

                {isShown && (
                    <div id='left-hand-filters-wrapper' className={styles.searchPodFilters}>
                        <FilterContent {...props} />

                        <ClearAllPanel storeInstance={store} />
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default observer(LeftHandFilter);
