import { IHolidaysStores } from 'frontend/store/holidays';
import { isLoadingStatus } from 'models/enum/DataStatus';

export const priceFilterStore = (stores: IHolidaysStores) => {
    const commonProps = {
        getPhrase: stores.layoutStore.getPhrase,
        minPrice: stores.hotelsStore.minPrice,
        maxPrice: stores.hotelsStore.maxPrice,
        minPricePp: stores.hotelsStore.minPricePp,
        maxPricePp: stores.hotelsStore.maxPricePp,
        guests: stores.searchStore.searchWho.totalPaidGuestPlaces,
        numberOfHotels: stores.hotelsStore.numberOfHotels,

        valueFrom: stores.searchFiltersStore.filterPriceFrom,
        valueTo: stores.searchFiltersStore.filterPriceTo,
        isPricePerPerson: stores.searchFiltersStore.isPriceFilterPerPerson,
        onChangeOffersPriceView: stores.layoutStore.onChangeOffersPriceView,
        setPriceFiltersValue: stores.searchFiltersStore.setPriceFiltersValue,

        isSearchResultsLoading: isLoadingStatus(stores.hotelsStore.status),
        formatMoney: stores.marketStore.formatMoney,
        currency: stores.hotelsStore.currency,
        getCurrencySymbol: stores.marketStore.getCurrencySymbol,
        getFormattedNumber: stores.marketStore.getFormattedNumber,
        onChange: stores.searchFiltersStore.onChange,
        isAmendHotelPage: stores.layoutStore.isAmendHotelPage,
    };

    if (stores.layoutStore.isAmendHotelPage) {
        const hotelFiltersStore = stores.amendHotelStore.filters;

        return {
            ...commonProps,
            minPrice: stores.amendHotelStore.offersStatus?.minPrice,
            maxPrice: stores.amendHotelStore.offersStatus?.maxPrice,
            setPriceFiltersValue: hotelFiltersStore.setPriceFiltersValue,
            valueFrom: hotelFiltersStore.filterPriceFrom,
            valueTo: hotelFiltersStore.filterPriceTo,
            isCountHidden: hotelFiltersStore.isCountHidden,
            currency: stores.marketStore.currency,
            isPricePerPerson: false,
            guests: 1,
            onChange: hotelFiltersStore.onChange,
        };
    }

    return commonProps;
};
