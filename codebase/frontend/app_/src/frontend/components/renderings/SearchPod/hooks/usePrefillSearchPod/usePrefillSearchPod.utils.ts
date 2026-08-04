import { BaseQueryParamsStore } from 'frontend/store/base';
import BaseOffersStore from 'frontend/store/base/offers/BaseOffersStore';
import { BaseSearchStore } from 'frontend/store/base/search/BaseSearchStore';
import { SearchFromStore } from 'frontend/store/base/search/SearchFromStore';
import { SearchToStore } from 'frontend/store/base/search/SearchToStore';
import { SearchWhenStore } from 'frontend/store/base/search/SearchWhenStore';

export interface IHandlePrefillSearchPodProps {
    from: SearchWhenStore['from'];
    monthsAvailability: SearchWhenStore['monthsAvailability'];
    setIsMonthSearch: SearchWhenStore['setIsMonthSearch'];
    to: SearchWhenStore['to'];
    updateAvailableDates: SearchWhenStore['updateAvailableDates'];
    updateAvailableDstCodes: SearchToStore['updateAvailableDstCodes'];
    updateAvailableOrigins: SearchFromStore['updateAvailableOrigins'];
    updateDestinationsDisplayValue: SearchToStore['updateDestinationsDisplayValue'];
    updateOriginsDisplayValue: SearchFromStore['updateOriginsDisplayValue'];
    shouldRefetchDestinationCodes?: boolean;
}

export interface IHandlePrefillSearchPodWithRecentSearchProps extends IHandlePrefillSearchPodProps {
    clearSearchValues: BaseSearchStore['clearSearchValues'];
    getSearchParamsFromLocalStorage: BaseOffersStore['getSearchParamsFromLocalStorage'];
    prefillSearchParams: BaseSearchStore['prefillSearchParams'];
    isReferer?: BaseQueryParamsStore['isReferer'];
}

export const handlePrefillSearchPod = async ({
    updateAvailableOrigins,
    updateAvailableDates,
    monthsAvailability,
    updateAvailableDstCodes,
    updateOriginsDisplayValue,
    updateDestinationsDisplayValue,
    from,
    to,
    setIsMonthSearch,
    shouldRefetchDestinationCodes,
}: IHandlePrefillSearchPodProps): Promise<void> => {
    // when user click search button on home page, availability are not empty (onlyIfEmpty flag)
    // so there is no extra API calls
    // if search results page opened by link, then we need to update available origins, dates and dst codes
    // avoid double `availability/from` request
    await updateAvailableOrigins(true);
    // avoid double `availability/dates` request
    await updateAvailableDates(!monthsAvailability.length);
    // In some cases, like when user comes from promo page, want to refetch destination codes with the specific departure airport - INS-1297
    await updateAvailableDstCodes(!shouldRefetchDestinationCodes);
    // need to update display values because on destination/hotel browse page user select dates and make a search
    // but when dates are selected, available origins and destinations are recalculated without changing display values
    updateOriginsDisplayValue();
    await updateDestinationsDisplayValue();

    const shouldResetMonthSearch = !from && !to;

    if (shouldResetMonthSearch) {
        setIsMonthSearch(false);
    }
};

export const handlePrefillSearchPodWithRecentSearch = async ({
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
}: IHandlePrefillSearchPodWithRecentSearchProps): Promise<void> => {
    const prefillParams = getSearchParamsFromLocalStorage();

    if (prefillParams) {
        await prefillSearchParams(prefillParams);
    } else {
        if (!isReferer) {
            clearSearchValues();
        }

        await handlePrefillSearchPod({
            updateAvailableOrigins,
            updateAvailableDates,
            monthsAvailability,
            updateAvailableDstCodes,
            updateOriginsDisplayValue,
            updateDestinationsDisplayValue,
            from,
            to,
            setIsMonthSearch,
        });
    }
};
