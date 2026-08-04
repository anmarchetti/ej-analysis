import { useEffect } from 'react';

import { BaseLayoutStore, BaseRouterStore } from 'frontend/store/base';
import BaseBookingStore from 'frontend/store/base/booking/BaseBookingStore';
import { BaseSearchStore } from 'frontend/store/base/search/BaseSearchStore';
import { SearchFromStore } from 'frontend/store/base/search/SearchFromStore';
import { SearchToStore } from 'frontend/store/base/search/SearchToStore';
import { SearchWhenStore } from 'frontend/store/base/search/SearchWhenStore';
import { BaseTrackingSearchPodStore } from 'frontend/store/base/tracking/BaseTrackingStore.searchPod';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import TradePortalSitecoreTemplateId from 'models/enum/tradePortal/TradePortalSitecoreTemplateId';
import { handlePrefillSearchPod } from 'frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchPod.utils';

export interface IUsePrefillHotelDetailsBookPage {
    currentPath: BaseLayoutStore['currentPath'];
    from: SearchWhenStore['from'];
    getValuesFromQueryParamsStore: BaseSearchStore['getValuesFromQueryParamsStore'];
    grabSearchValuesFromSearchStore: BaseBookingStore['grabSearchValuesFromSearchStore'];
    hasPromo: BaseRouterStore['hasPromo'];
    isHotelDetailsBookPage: BaseLayoutStore['isHotelDetailsBookPage'];
    isHotelDetailsBookPagePrev: BaseLayoutStore['isHotelDetailsBookPagePrev'];
    isPromoPagePrev: BaseLayoutStore['isPromoPagePrev'];
    loadAllDestinations: SearchToStore['loadAllDestinations'];
    monthsAvailability: SearchWhenStore['monthsAvailability'];
    origins: BaseBookingStore['origins'];
    prevPath: BaseLayoutStore['prevPath'];
    prevTemplateId: BaseLayoutStore['prevTemplateId'];
    setIsMonthSearch: SearchWhenStore['setIsMonthSearch'];
    shouldSkipEffect: boolean;
    syncDestinationItems: SearchToStore['syncDestinationItems'];
    to: SearchWhenStore['to'];
    trackSearchPodMounting: BaseTrackingSearchPodStore['trackSearchPodMounting'];
    updateAvailableDates: SearchWhenStore['updateAvailableDates'];
    updateAvailableDstCodes: SearchToStore['updateAvailableDstCodes'];
    updateAvailableOrigins: SearchFromStore['updateAvailableOrigins'];
    updateDestinationsDisplayValue: SearchToStore['updateDestinationsDisplayValue'];
    updateOriginsDisplayValue: SearchFromStore['updateOriginsDisplayValue'];
    updateSearchDates: BaseBookingStore['updateSearchDates'];
    updateSearchOrigins: BaseBookingStore['updateSearchOrigins'];
}

const PROMO_TEMPLATES = [
    SitecoreTemplateId.PromoPage,
    TradePortalSitecoreTemplateId.PromoPage,
    SitecoreTemplateId.DynamicPromoPage,
    TradePortalSitecoreTemplateId.DynamicPromoPage,
];

const usePrefillHotelDetailsBookPage = ({
    currentPath,
    shouldSkipEffect,
    isHotelDetailsBookPage,
    isHotelDetailsBookPagePrev,
    isPromoPagePrev,
    prevPath,
    syncDestinationItems,
    updateOriginsDisplayValue,
    prevTemplateId,
    getValuesFromQueryParamsStore,
    loadAllDestinations,
    origins,
    grabSearchValuesFromSearchStore,
    updateSearchDates,
    hasPromo,
    updateSearchOrigins,
    updateAvailableOrigins,
    updateAvailableDates,
    monthsAvailability,
    updateAvailableDstCodes,
    updateDestinationsDisplayValue,
    setIsMonthSearch,
    from,
    to,
    trackSearchPodMounting,
}: IUsePrefillHotelDetailsBookPage): void => {
    useEffect(() => {
        if (shouldSkipEffect || !isHotelDetailsBookPage) {
            return;
        }

        const init = async (): Promise<void> => {
            const cameFromPromoPage = prevTemplateId && PROMO_TEMPLATES.includes(prevTemplateId);

            // get values from query string, as all data is cleared when we come from Destination page
            if (cameFromPromoPage) {
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
                // If coming from promo page, refetch destination codes with the specific departure airport to ensure consistent behaviour - INS-1297
                shouldRefetchDestinationCodes: cameFromPromoPage,
            });

            // check for initial update after loading app
            // should be call only once if search results was opened by direct link
            if (!origins?.length && !prevTemplateId) {
                grabSearchValuesFromSearchStore();
            }

            // set search dates by default be taken query params from Hotel details page
            // fixing problems with flex dates and promo pages
            // call without args, will be used values from query
            updateSearchDates();

            // check for transition from Promo
            // because some Promos don't have a specific departure
            if (hasPromo) {
                updateSearchOrigins();
            }

            trackSearchPodMounting();
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    //Fix for INS-642 and INS-932
    useEffect(() => {
        if (shouldSkipEffect || !isHotelDetailsBookPage) {
            return;
        }

        const needToPrefillPage =
            (isHotelDetailsBookPagePrev && prevPath !== currentPath) || // navigate between HotelDetailsBook Pages
            isPromoPagePrev; // navigate from PromoPage to HotelDetailsBookPage

        const prefillSearchPod = async (): Promise<void> => {
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
            await syncDestinationItems();
        };

        if (needToPrefillPage) {
            prefillSearchPod();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHotelDetailsBookPage, isHotelDetailsBookPagePrev, shouldSkipEffect, prevPath, currentPath, isPromoPagePrev]);
};

export default usePrefillHotelDetailsBookPage;
