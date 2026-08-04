import { FC, useEffect } from 'react';
import { observer } from 'mobx-react';

import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { ExperimentTestIds } from 'models/enum/cro/Experiment';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import StickyBox from 'frontend/components/common/StickyBox';
import useExperiment from 'frontend/components/cro/Experiment/hooks/useExperiment';
import StickyBoxDynamicHeight from 'frontend/components/renderings/SearchPod/components/StickyBoxDynamicHeight/StickyBoxDynamicHeight';
import useClearOnUnmount from 'frontend/components/renderings/SearchPod/hooks/useClearOnUnmount';
import usePrefillSearchPod from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchPod';

import SearchPodInner from './components/SearchPodInner/SearchPodInner';
import { withSearchPodStore } from './stores/createStore';
import { ISearchPodDataFields, ISearchPodFields, ISearchPodSitecoreParameters } from './models';

export interface ISearchPodProps
    extends ISitecoreComponent<ISearchPodFields<ISearchPodDataFields>, ISearchPodSitecoreParameters> {
    isFloating?: boolean;
    isParentWrapper?: boolean;
}

export const BIG_OFFSET = 200;

const SearchPod: FC<ISearchPodProps> = props => {
    const { fields, params, rendering, isFloating, isParentWrapper } = props;
    const source = useStore((stores: TStores) => ({
        clearOldSearchParam: stores.searchStore.clearOldSearchParam,
        isMonthSearchEnabled: stores.layoutStore.isMonthSearchEnabled,
        clearSearchValues: stores.searchStore.clearSearchValues,
        getValuesFromQueryParamsStore: stores.searchStore.getValuesFromQueryParamsStore,
        prefillSearchParams: stores.searchStore.prefillSearchParams,
        setCountries: stores.searchStore.searchFrom.setCountries,
        updateOriginsDisplayValue: stores.searchStore.searchFrom.updateOriginsDisplayValue,
        updateAvailableOrigins: stores.searchStore.searchFrom.updateAvailableOrigins,
        loadAllDestinations: stores.searchStore.searchTo.loadAllDestinations,
        syncDestinationItems: stores.searchStore.searchTo.syncDestinationItems,
        updateAvailableDstCodes: stores.searchStore.searchTo.updateAvailableDstCodes,
        from: stores.searchStore.searchWhen.from,
        to: stores.searchStore.searchWhen.to,
        setIsMonthSearch: stores.searchStore.searchWhen.setIsMonthSearch,
        setMonthSearchDuration: stores.searchStore.searchWhen.setMonthSearchDuration,
        monthSearchDuration: stores.searchStore.searchWhen.monthSearchDuration,
        updateAvailableDates: stores.searchStore.searchWhen.updateAvailableDates,
        monthsAvailability: stores.searchStore.searchWhen.monthsAvailability,
        isDestinationPage: stores.layoutStore.isDestinationPage,
        isAllDestinationsPage: stores.layoutStore.isAllDestinationsPage,
        isAllHolidayTypesPage: stores.layoutStore.isAllHolidayTypesPage,
        isEditMode: stores.layoutStore.isEditMode,
        isHomePage: stores.layoutStore.isHomePage,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        isGenericPage: stores.layoutStore.isGenericPage,
        isHotelDetailsBookPagePrev: stores.layoutStore.isHotelDetailsBookPagePrev,
        isPromoPagePrev: stores.layoutStore.isPromoPagePrev,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        giataHotelCode: stores.layoutStore.giataHotelCode,
        prevGiataHotelCode: stores.layoutStore.prevGiataHotelCode,
        prevPath: stores.layoutStore.prevPath,
        currentPath: stores.layoutStore.currentPath,
        pageName: stores.layoutStore.pageName,
        prevTemplateId: stores.layoutStore.prevTemplateId,
        clearFilterStoreValues: stores.searchFiltersStore.clearFilterStoreValues,
        parseBrowserQuery: stores.queryParamStore.parseBrowserQuery,
        monthSearchDurationFromUrl: stores.queryParamStore.monthSearchDurationFromUrl,
        grabSearchValuesFromSearchStore: stores.bookingStore.grabSearchValuesFromSearchStore,
        origins: stores.bookingStore.origins,
        updateSearchDates: stores.bookingStore.updateSearchDates,
        updateSearchOrigins: stores.bookingStore.updateSearchOrigins,
        syncUrlParamsWithStores: stores.rootStore.syncUrlParamsWithStores,
        fetchOffers: stores.hotelsStore.fetchOffers,
        getSearchParamsFromLocalStorage: stores.hotelsStore.getSearchParamsFromLocalStorage,
        updateOffersDataStatus: stores.hotelsStore.updateOffersDataStatus,
        hasPromo: stores.routerStore.hasPromo,
        quizResults: isTradeStore(stores) ? null : stores.inspireMeStore.quizResults,
        setAllAvailableOrigins: stores.searchStore.searchFrom.setAllAvailableOrigins,
        getTypeAheadDestinations: stores.searchStore.searchTo.getTypeAheadDestinations,
        changeDestinations: stores.searchStore.searchTo.changeDestinations,
        selectSingleDestination: stores.searchStore.searchTo.selectSingleDestination,
        destinationCode: stores.layoutStore.destinationCode,
        isDestinationPagePrev: stores.layoutStore.isDestinationPagePrev,
        isHotelDetailsBrowsePage: stores.layoutStore.isHotelDetailsBrowsePage,
        allAccommodationCodes: stores.layoutStore.allAccommodationCodes,
        isPromotingIframe: stores.queryParamStore.isPromotingIframe,
        prevDestinationCode: stores.layoutStore.prevDestinationCode,
        isHolidayTypePage: stores.layoutStore.isHolidayTypePage,
        updateDestinationsDisplayValue: stores.searchStore.searchTo.updateDestinationsDisplayValue,
        trackSearchPodMounting: stores.trackingStore.searchPod.trackSearchPodMounting,
        setWhenDropdownExperimentTestVariant: stores.layoutStore.setWhenDropdownExperimentTestVariant,
        isReferer: stores.queryParamStore.isReferer,
        isDestinationsLoaded: stores.searchStore.searchTo.isDestinationsLoaded,
        defaultSearchPodMonthSearchDuration: stores.searchStore.searchWhen.defaultSearchPodMonthSearchDuration,
    }));

    const experiment = useExperiment(ExperimentTestIds.WhenDropDown);

    useEffect(() => {
        source.setWhenDropdownExperimentTestVariant(experiment?.testVariant);
    }, [experiment]);

    // do not show search pod if not data source was returned (it means that maintenance mode was turned on)
    const isShown = !!(fields?.data && fields?.airportsGroups.length > 0);
    const paramIsSticky = !!params?.IsSticky;
    const isScreenMedium = useMoreThenMobileViewport();
    const isBigOffset = params.ShowTitle && isScreenMedium;
    const shouldSkipEffect = !isShown || source.isEditMode;

    useClearOnUnmount({ ...source, shouldSkipEffect });

    usePrefillSearchPod({ ...source, fields, rendering, shouldSkipEffect });

    if (!isShown) {
        return null;
    }

    if (isFloating) {
        let element: HTMLElement | null = null;

        if (typeof document !== 'undefined') {
            element = document.getElementById('hero-carousel');
        }

        const smallOffset = isParentWrapper ? 1 : 0;
        const offset = element?.offsetTop ?? (isBigOffset ? BIG_OFFSET : smallOffset);

        return <StickyBox offsetCompensation={offset} render={(): JSX.Element => <SearchPodInner {...props} />} />;
    }

    return (
        <>
            {paramIsSticky ? (
                // New component prevents empty space on scroll caused by the overlay simulating a sticky component (INS-1217). Behaves fully like a sticky element.
                <StickyBoxDynamicHeight
                    render={(resetHeight, freezeHeight): JSX.Element => (
                        <SearchPodInner {...props} resetHeight={resetHeight} freezeHeight={freezeHeight} />
                    )}
                />
            ) : (
                <SearchPodInner {...props} />
            )}
        </>
    );
};

export default withSearchPodStore(observer(SearchPod));
