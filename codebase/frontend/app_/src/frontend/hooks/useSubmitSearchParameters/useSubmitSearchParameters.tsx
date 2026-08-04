import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
export interface ISubmitSearchParametersReturn {
    onSubmitSearchParameters: () => Promise<void>;
}

export const useSubmitSearchParameters = (): ISubmitSearchParametersReturn => {
    const {
        sendSearchEvent,
        searchEditTrigger,
        trackUserSearch,
        setPageNumber,
        onClearAllFilters,
        onCloseFilters,
        clearBookingFlow,
        redirectToSearchResultsPage,
        buildSearchQuery,
        clearPaymentStore,
        clearIsClickBackToSearch,
        fetchOffers,
        clearOldSearchParam,
        setSelectedOfferIndex,
        isSearchResultsPage,
        hasOffers,
        saveOffers,
    } = useStore((stores: TStores) => ({
        setPageNumber: stores.searchStore.setPageNumber,
        onClearAllFilters: stores.searchFiltersStore.onClearAllFilters,
        redirectToSearchResultsPage: stores.routerStore.redirectToSearchResultsPage,
        onCloseFilters: stores.searchFiltersStore.onCloseFilters,
        buildSearchQuery: stores.queryParamStore.buildSearchQuery,
        setSelectedOfferIndex: stores.searchStore.setSelectedOfferIndex,
        clearBookingFlow: stores.bookingStore.clearBookingFlow,
        clearPaymentStore: stores.paymentStore.clearPaymentStore,
        clearIsClickBackToSearch: stores.routerStore.clearIsClickBackToSearch,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        searchEditTrigger: stores.trackingStore.searchEditTrigger,
        sendSearchEvent: stores.engageStore.sendSearchEvent,
        fetchOffers: stores.hotelsStore.fetchOffers,
        clearOldSearchParam: stores.searchStore.clearOldSearchParam,
        hasOffers: stores.hotelsStore.hasOffers,
        saveOffers: stores.hotelsStore.saveOffers,
        trackUserSearch: stores.searchStore.trackUserSearch,
    }));

    const updateDataLayer = (): void => {
        sendSearchEvent();
        searchEditTrigger();
    };

    const onClear = (): void => {
        onClearAllFilters();
        onCloseFilters();
        setPageNumber(1);
        clearBookingFlow();
        clearPaymentStore();
        clearIsClickBackToSearch();

        // disable auto scroll to previously selected item
        setSelectedOfferIndex(-1);
    };

    const onSubmitSearchParameters = async (): Promise<void> => {
        // we track any search on "search" button click https://jira.build.easyjet.com/browse/EJH-12223
        trackUserSearch();

        onClear();

        if (isSearchResultsPage) {
            updateDataLayer();
            redirectToSearchResultsPage(buildSearchQuery());
            clearOldSearchParam();
            await fetchOffers(true);
        } else {
            // Clear old offers before searching
            if (hasOffers) saveOffers([]);

            redirectToSearchResultsPage();
        }

        window.scrollTo(0, 0);
    };

    return {
        onSubmitSearchParameters,
    };
};
