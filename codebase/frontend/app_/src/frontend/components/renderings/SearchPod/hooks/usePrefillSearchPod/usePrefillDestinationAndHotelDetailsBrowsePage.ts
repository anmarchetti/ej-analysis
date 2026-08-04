import { useCallback, useEffect } from 'react';

import { BaseLayoutStore } from 'frontend/store/base';
import BaseBookingStore from 'frontend/store/base/booking/BaseBookingStore';
import { SearchFromStore } from 'frontend/store/base/search/SearchFromStore';
import { SearchToStore } from 'frontend/store/base/search/SearchToStore';
import { SearchWhenStore } from 'frontend/store/base/search/SearchWhenStore';
import { BaseTrackingSearchPodStore } from 'frontend/store/base/tracking/BaseTrackingStore.searchPod';
import { LayoutStore, SearchStore } from 'frontend/store/holidays';
import InspireMeStore from 'frontend/store/holidays/inspireMe/InspireMeStore';
import { QueryParamsStore } from 'frontend/store/holidays/queryParams/QueryParamsStore';
import { SINGLE_SELECTABLE_DESTINATION_TYPES } from 'frontend/utils/search/search.utils';
import { IDestination } from 'models/data/IDestination';
import { DestinationType } from 'models/enum/DestinationType';

export interface IUsePrefillDestinationAndHotelDetailsBrowsePageProps {
    allAccommodationCodes: LayoutStore['allAccommodationCodes'];
    changeDestinations: SearchToStore['changeDestinations'];
    clearSearchValues: SearchStore['clearSearchValues'];
    destinationCode: LayoutStore['destinationCode'];
    getTypeAheadDestinations: SearchToStore['getTypeAheadDestinations'];
    getValuesFromQueryParamsStore: SearchStore['getValuesFromQueryParamsStore'];
    giataHotelCode: LayoutStore['giataHotelCode'];
    grabSearchValuesFromSearchStore: BaseBookingStore['grabSearchValuesFromSearchStore'];
    isDestinationPage: LayoutStore['isDestinationPage'];
    isDestinationPagePrev: LayoutStore['isDestinationPagePrev'];
    isDestinationsLoaded: SearchToStore['isDestinationsLoaded'];
    isEditMode: LayoutStore['isEditMode'];
    isHotelDetailsBrowsePage: LayoutStore['isHotelDetailsBrowsePage'];
    isPromotingIframe: QueryParamsStore['isPromotingIframe'];
    loadAllDestinations: SearchToStore['loadAllDestinations'];
    origins: BaseBookingStore['origins'];
    pageName: LayoutStore['pageName'];
    prevDestinationCode: LayoutStore['prevDestinationCode'];
    prevGiataHotelCode: LayoutStore['prevGiataHotelCode'];
    prevTemplateId: BaseLayoutStore['prevTemplateId'];
    quizResults: InspireMeStore['quizResults'] | null;
    selectSingleDestination: SearchToStore['selectSingleDestination'];
    setAllAvailableOrigins: SearchFromStore['setAllAvailableOrigins'];
    shouldSkipEffect: boolean;
    trackSearchPodMounting: BaseTrackingSearchPodStore['trackSearchPodMounting'];
    updateAvailableDates: SearchWhenStore['updateAvailableDates'];
    updateAvailableDstCodes: SearchToStore['updateAvailableDstCodes'];
    updateAvailableOrigins: SearchFromStore['updateAvailableOrigins'];
}

const usePrefillDestinationAndHotelDetailsBrowsePage = ({
    shouldSkipEffect,
    updateAvailableOrigins,
    isEditMode,
    isDestinationPage,
    isDestinationPagePrev,
    destinationCode,
    clearSearchValues,
    getTypeAheadDestinations,
    changeDestinations,
    selectSingleDestination,
    isHotelDetailsBrowsePage,
    isPromotingIframe,
    allAccommodationCodes,
    getValuesFromQueryParamsStore,
    setAllAvailableOrigins,
    quizResults,
    pageName,
    prevDestinationCode,
    updateAvailableDstCodes,
    updateAvailableDates,
    loadAllDestinations,
    origins,
    prevTemplateId,
    grabSearchValuesFromSearchStore,
    trackSearchPodMounting,
    isDestinationsLoaded,
    giataHotelCode,
    prevGiataHotelCode,
}: IUsePrefillDestinationAndHotelDetailsBrowsePageProps): void => {
    useEffect(() => {
        if (shouldSkipEffect || !isDestinationPage) return;

        const init = async (): Promise<void> => {
            // get values from query string, as all data is cleared when we come from Destination page
            if (quizResults?.length) {
                getValuesFromQueryParamsStore();
            }

            await loadAllDestinations();

            // check for initial update after loading app
            // should be call only once if search results was opened by direct link
            if (!origins?.length && !prevTemplateId) {
                grabSearchValuesFromSearchStore();
            }
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (shouldSkipEffect || !isDestinationPage || !isDestinationsLoaded) {
            return;
        }

        const allowedByDestinationCodes =
            prevDestinationCode && destinationCode && prevDestinationCode !== destinationCode;
        const allowedByGiataCodes = giataHotelCode && prevGiataHotelCode !== giataHotelCode;

        const allowedByCodes = isHotelDetailsBrowsePage ? allowedByGiataCodes : allowedByDestinationCodes;

        const needToPrefillDestinationPageSearchPod =
            (!isDestinationPagePrev && isDestinationPage) || // navigate to destination page
            allowedByCodes; // navigate between destination pages

        if (needToPrefillDestinationPageSearchPod) {
            prefillDestinationPage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        destinationCode,
        prevDestinationCode,
        isDestinationPagePrev,
        isDestinationPage,
        shouldSkipEffect,
        isDestinationsLoaded,
    ]);

    /**
     * Prefilling for destination pages.
     * Works for any page which has code and names fields in its context, including HotelBrowsePage and HotelBookPage
     */
    const prefillDestinationPage = useCallback(async () => {
        const isIframe = isPromotingIframe();
        // accommodationCode is used for hotel browse page and destination code for destination pages,
        // but in case when we have accommodation codes in context we should use them instead of destination code
        const resolvedAccommodationCode = allAccommodationCodes[0] || destinationCode;

        if (!isEditMode && isDestinationPage && !isIframe) {
            // only clear search values without API calls as prefillDestinationPage bellow
            clearSearchValues(true);

            if (!pageName || !resolvedAccommodationCode) {
                return;
            }

            try {
                const result = await getTypeAheadDestinations(pageName);

                await applyDestinations(result.destinations, resolvedAccommodationCode, allAccommodationCodes);
            } catch {}

            // Hotel Browse Page can have query params when it's opened from Shortlists
            // Destination Page can have query params after redirecting from Holiday Inspiration page
            syncQueryParamsAfterPrefill();
            await syncAvailableOptionsAfterPrefill();
        }

        // Hotel Browse Page can have query params when it's opened from IFrame
        if (isIframe && isHotelDetailsBrowsePage) {
            getValuesFromQueryParamsStore();
        }

        trackSearchPodMounting();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destinationCode, allAccommodationCodes, pageName]);

    const applyDestinations = async (
        destinations: IDestination[],
        resolvedAccommodationCode: string,
        accommodationCodes: string[],
    ): Promise<void> => {
        const isSingleDestinationValid = (destination?: IDestination): destination is IDestination =>
            !!destination && !!destination.showOnSearchPod;

        const hasMultipleAccommodationCodes = accommodationCodes.length > 1;

        if (hasMultipleAccommodationCodes) {
            const filteredDestinations = destinations.filter(
                destination => accommodationCodes.includes(destination.code) && isSingleDestinationValid(destination),
            );

            changeDestinations(filteredDestinations, false, false);

            return;
        }

        const destination = destinations.find(item => item.code === resolvedAccommodationCode);

        if (!isSingleDestinationValid(destination)) {
            return;
        }

        if (SINGLE_SELECTABLE_DESTINATION_TYPES.includes(destination.type as DestinationType)) {
            await selectSingleDestination(destination, false, false);
        } else {
            await changeDestinations([destination], false, false);
        }
    };

    const syncQueryParamsAfterPrefill = (): void => {
        if (isHotelDetailsBrowsePage || quizResults?.length) {
            getValuesFromQueryParamsStore();
        }
    };

    const syncAvailableOptionsAfterPrefill = async (): Promise<void> => {
        await updateAvailableOrigins();

        if (quizResults?.length) {
            await updateAvailableDstCodes();
            await updateAvailableDates(true);

            return;
        }

        await setAllAvailableOrigins();
    };
};

export default usePrefillDestinationAndHotelDetailsBrowsePage;
