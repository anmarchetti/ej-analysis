import { useEffect } from 'react';

import useConstructor from 'frontend/hooks/useConstructor';
import { BaseLayoutStore, BaseQueryParamsGetters } from 'frontend/store/base';
import BaseBookingStore from 'frontend/store/base/booking/BaseBookingStore';
import { BaseSearchStore } from 'frontend/store/base/search/BaseSearchStore';
import { SearchFromStore } from 'frontend/store/base/search/SearchFromStore';
import { SearchToStore } from 'frontend/store/base/search/SearchToStore';
import { SearchWhenStore } from 'frontend/store/base/search/SearchWhenStore';
import { BaseTrackingSearchPodStore } from 'frontend/store/base/tracking/BaseTrackingStore.searchPod';
import { LayoutStore, OffersStore } from 'frontend/store/holidays';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { TradePortalOffersStore } from 'frontend/store/tradePortal';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { isTemplateBelongsToDestinationPage } from 'frontend/utils/pageTemplate.utils';
import { DataStatus } from 'models/enum/DataStatus';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import TradePortalSitecoreTemplateId from 'models/enum/tradePortal/TradePortalSitecoreTemplateId';

import { handlePrefillSearchPod } from './usePrefillSearchPod.utils';

export interface IUsePrefillSearchResultsPageProps {
    fetchOffers: OffersStore['fetchOffers'] | TradePortalOffersStore['fetchOffers'];
    from: SearchWhenStore['from'];
    getValuesFromQueryParamsStore: BaseSearchStore['getValuesFromQueryParamsStore'];
    grabSearchValuesFromSearchStore: BaseBookingStore['grabSearchValuesFromSearchStore'];
    isSearchResultsPage: LayoutStore['isSearchResultsPage'];
    loadAllDestinations: SearchToStore['loadAllDestinations'];
    monthsAvailability: SearchWhenStore['monthsAvailability'];
    origins: BaseBookingStore['origins'];
    parseBrowserQuery: BaseQueryParamsGetters['parseBrowserQuery'];
    prevTemplateId: BaseLayoutStore['prevTemplateId'];
    setIsMonthSearch: SearchWhenStore['setIsMonthSearch'];
    shouldSkipEffect: boolean;
    syncDestinationItems: SearchToStore['syncDestinationItems'];
    syncUrlParamsWithStores:
        | HolidaysRootStore['syncUrlParamsWithStores']
        | TradePortalRootStore['syncUrlParamsWithStores'];
    to: SearchWhenStore['to'];
    trackSearchPodMounting: BaseTrackingSearchPodStore['trackSearchPodMounting'];
    updateAvailableDates: SearchWhenStore['updateAvailableDates'];
    updateAvailableDstCodes: SearchToStore['updateAvailableDstCodes'];
    updateAvailableOrigins: SearchFromStore['updateAvailableOrigins'];
    updateDestinationsDisplayValue: SearchToStore['updateDestinationsDisplayValue'];
    updateOffersDataStatus: OffersStore['updateOffersDataStatus'];
    updateOriginsDisplayValue: SearchFromStore['updateOriginsDisplayValue'];
    updateSearchDates: BaseBookingStore['updateSearchDates'];
}

const DESTINATION_TEMPLATES = [
    SitecoreTemplateId.RegionBrowsePage,
    TradePortalSitecoreTemplateId.RegionBrowsePage,
    SitecoreTemplateId.CountryBrowsePage,
    TradePortalSitecoreTemplateId.CountryBrowsePage,
    SitecoreTemplateId.ResortBrowsePage,
    TradePortalSitecoreTemplateId.ResortBrowsePage,
    SitecoreTemplateId.DestinationPage,
    TradePortalSitecoreTemplateId.DestinationPage,
];

const usePrefillSearchResultsPage = ({
    isSearchResultsPage,
    shouldSkipEffect,
    updateOffersDataStatus,
    loadAllDestinations,
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
    getValuesFromQueryParamsStore,
    parseBrowserQuery,
    syncUrlParamsWithStores,
    syncDestinationItems,
    updateSearchDates,
    fetchOffers,
    trackSearchPodMounting,
}: IUsePrefillSearchResultsPageProps): void => {
    useConstructor(() => {
        if (isSearchResultsPage) {
            updateOffersDataStatus(DataStatus.Loading);
        }
    });

    useEffect(() => {
        if (shouldSkipEffect || !isSearchResultsPage) {
            return;
        }

        const init = async (): Promise<void> => {
            // get values from query string, as all data is cleared when we come from Destination page
            if (prevTemplateId && DESTINATION_TEMPLATES.includes(prevTemplateId)) {
                getValuesFromQueryParamsStore();
            }

            await loadAllDestinations();

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

            // check for initial update after loading app
            // should be call only once if search results was opened by direct link
            if (!origins?.length && !prevTemplateId) {
                grabSearchValuesFromSearchStore();
            }

            prefillSearchResultsPage();
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const prefillSearchResultsPage = (): void => {
        parseBrowserQuery(location.search);
        syncUrlParamsWithStores();

        //Fix for EJH-11565
        if (prevTemplateId === SitecoreTemplateId.PromoPage) {
            syncDestinationItems();
        }

        // if we came from promo page or destination page, then update search values in booking store to clear values set in promo/destination page
        if (
            prevTemplateId &&
            (prevTemplateId === SitecoreTemplateId.PromoPage ||
                prevTemplateId === SitecoreTemplateId.DynamicPromoPage ||
                isTemplateBelongsToDestinationPage(prevTemplateId))
        ) {
            grabSearchValuesFromSearchStore();
        }

        if (prevTemplateId === SitecoreTemplateId.HotelDetailsBook) {
            updateSearchDates(from, to);
        }

        trackSearchPodMounting();

        fetchOffers(true);
    };
};

export default usePrefillSearchResultsPage;
