import { useEffect } from 'react';

import { BaseLayoutStore, BaseQueryParamsStore } from 'frontend/store/base';
import BaseBookingStore from 'frontend/store/base/booking/BaseBookingStore';
import BaseOffersStore from 'frontend/store/base/offers/BaseOffersStore';
import { BaseSearchStore } from 'frontend/store/base/search/BaseSearchStore';
import { SearchFromStore } from 'frontend/store/base/search/SearchFromStore';
import { SearchToStore } from 'frontend/store/base/search/SearchToStore';
import { SearchWhenStore } from 'frontend/store/base/search/SearchWhenStore';
import { BaseTrackingSearchPodStore } from 'frontend/store/base/tracking/BaseTrackingStore.searchPod';
import { LayoutStore } from 'frontend/store/holidays';
import { handlePrefillSearchPodWithRecentSearch } from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchPod.utils';

export interface IUsePrefillHomePageProps {
    clearSearchValues: BaseSearchStore['clearSearchValues'];
    from: SearchWhenStore['from'];
    getSearchParamsFromLocalStorage: BaseOffersStore['getSearchParamsFromLocalStorage'];
    grabSearchValuesFromSearchStore: BaseBookingStore['grabSearchValuesFromSearchStore'];
    isHomePage: LayoutStore['isHomePage'];
    isMonthSearchEnabled: boolean;
    isReferer: BaseQueryParamsStore['isReferer'];
    loadAllDestinations: SearchToStore['loadAllDestinations'];
    monthsAvailability: SearchWhenStore['monthsAvailability'];
    origins: BaseBookingStore['origins'];
    prefillSearchParams: BaseSearchStore['prefillSearchParams'];
    prevTemplateId: BaseLayoutStore['prevTemplateId'];
    setIsMonthSearch: SearchWhenStore['setIsMonthSearch'];
    shouldSkipEffect: boolean;
    to: SearchWhenStore['to'];
    trackSearchPodMounting: BaseTrackingSearchPodStore['trackSearchPodMounting'];
    updateAvailableDates: SearchWhenStore['updateAvailableDates'];
    updateAvailableDstCodes: SearchToStore['updateAvailableDstCodes'];
    updateAvailableOrigins: SearchFromStore['updateAvailableOrigins'];
    updateDestinationsDisplayValue: SearchToStore['updateDestinationsDisplayValue'];
    updateOriginsDisplayValue: SearchFromStore['updateOriginsDisplayValue'];
}

const usePrefillHomePage = ({
    isHomePage,
    shouldSkipEffect,
    loadAllDestinations,
    getSearchParamsFromLocalStorage,
    prefillSearchParams,
    updateAvailableOrigins,
    updateAvailableDates,
    monthsAvailability,
    updateAvailableDstCodes,
    updateOriginsDisplayValue,
    updateDestinationsDisplayValue,
    from,
    to,
    setIsMonthSearch,
    origins,
    prevTemplateId,
    grabSearchValuesFromSearchStore,
    clearSearchValues,
    trackSearchPodMounting,
    isReferer,
    isMonthSearchEnabled,
}: IUsePrefillHomePageProps): void => {
    useEffect(() => {
        if (shouldSkipEffect || !isHomePage) {
            return;
        }

        const init = async (): Promise<void> => {
            await loadAllDestinations();

            await handlePrefillSearchPodWithRecentSearch({
                updateAvailableOrigins,
                updateAvailableDates,
                monthsAvailability,
                updateAvailableDstCodes,
                updateOriginsDisplayValue,
                updateDestinationsDisplayValue,
                from,
                to,
                setIsMonthSearch,
                getSearchParamsFromLocalStorage,
                prefillSearchParams,
                clearSearchValues,
                isReferer,
            });

            // check for initial update after loading app
            // should be call only once if search results was opened by direct link
            if (!origins?.length && !prevTemplateId) {
                grabSearchValuesFromSearchStore();
            }

            trackSearchPodMounting();
        };

        init();
        // isMonthSearchEnabled can be removed after CRO test finished. INS-1705
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHomePage, isMonthSearchEnabled]);
};

export default usePrefillHomePage;
