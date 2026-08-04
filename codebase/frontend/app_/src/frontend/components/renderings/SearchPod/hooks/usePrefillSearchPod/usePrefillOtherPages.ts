import { useEffect } from 'react';

import { BaseLayoutStore } from 'frontend/store/base';
import BaseOffersStore from 'frontend/store/base/offers/BaseOffersStore';
import { BaseSearchStore } from 'frontend/store/base/search/BaseSearchStore';
import { SearchFromStore } from 'frontend/store/base/search/SearchFromStore';
import { SearchToStore } from 'frontend/store/base/search/SearchToStore';
import { SearchWhenStore } from 'frontend/store/base/search/SearchWhenStore';
import { BaseTrackingSearchPodStore } from 'frontend/store/base/tracking/BaseTrackingStore.searchPod';
import { handlePrefillSearchPodWithRecentSearch } from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchPod.utils';

export interface IUsePrefillOtherPagesProps {
    clearSearchValues: BaseSearchStore['clearSearchValues'];
    from: SearchWhenStore['from'];
    getSearchParamsFromLocalStorage: BaseOffersStore['getSearchParamsFromLocalStorage'];
    isAllDestinationsPage: BaseLayoutStore['isAllDestinationsPage'];
    isAllHolidayTypesPage: BaseLayoutStore['isAllHolidayTypesPage'];
    isGenericPage: BaseLayoutStore['isGenericPage'];
    isHolidayTypePage: BaseLayoutStore['isHolidayTypePage'];
    isMonthSearchEnabled: boolean;
    loadAllDestinations: SearchToStore['loadAllDestinations'];
    monthsAvailability: SearchWhenStore['monthsAvailability'];
    prefillSearchParams: BaseSearchStore['prefillSearchParams'];
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

const usePrefillOtherPages = ({
    isAllDestinationsPage,
    isAllHolidayTypesPage,
    isGenericPage,
    isHolidayTypePage,
    loadAllDestinations,
    updateAvailableOrigins,
    updateAvailableDates,
    updateAvailableDstCodes,
    setIsMonthSearch,
    shouldSkipEffect,
    monthsAvailability,
    updateOriginsDisplayValue,
    updateDestinationsDisplayValue,
    from,
    to,
    getSearchParamsFromLocalStorage,
    prefillSearchParams,
    clearSearchValues,
    trackSearchPodMounting,
    isMonthSearchEnabled,
}: IUsePrefillOtherPagesProps): void => {
    useEffect(() => {
        if (
            shouldSkipEffect ||
            (!isAllDestinationsPage && !isHolidayTypePage && !isAllHolidayTypesPage && !isGenericPage)
        )
            return;

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
            });

            trackSearchPodMounting();
        };

        init();
        // isMonthSearchEnabled can be removed after CRO test finished. INS-1705
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAllDestinationsPage, isHolidayTypePage, isAllHolidayTypesPage, isGenericPage, isMonthSearchEnabled]);
};

export default usePrefillOtherPages;
