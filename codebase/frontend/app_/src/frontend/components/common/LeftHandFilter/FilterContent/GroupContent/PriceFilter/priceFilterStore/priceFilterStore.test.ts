import { createMockStores } from 'frontend/__mocks__';

import { priceFilterStore } from './priceFilterStore';

describe('priceFilterStore', () => {
    const mockStores = createMockStores({
        hotelsStore: {
            minPrice: 100,
            maxPrice: 500,
            minPricePp: 50,
            maxPricePp: 250,
            numberOfHotels: 10,
            status: 'LOADING',
            currency: 'USD',
        },
        searchStore: {
            searchWho: { totalPaidGuestPlaces: 2 },
        },
        searchFiltersStore: {
            filterPriceFrom: 100,
            filterPriceTo: 400,
            isPriceFilterPerPerson: true,
            setPriceFiltersValue: jest.fn(),
            isCountHidden: false,
        },
        amendHotelStore: {
            offersStatus: {
                minPrice: 150,
                maxPrice: 450,
            },
            filters: {
                setPriceFiltersValue: jest.fn(),
                filterPriceFrom: 150,
                filterPriceTo: 450,
                isCountHidden: true,
                onChange: jest.fn(),
            },
        },
    });

    it('returns commonProps when isAmendHotelPage is false', () => {
        const result = priceFilterStore(mockStores);
        expect(result).toEqual({
            getPhrase: mockStores.layoutStore.getPhrase,
            minPrice: mockStores.hotelsStore.minPrice,
            maxPrice: mockStores.hotelsStore.maxPrice,
            minPricePp: mockStores.hotelsStore.minPricePp,
            maxPricePp: mockStores.hotelsStore.maxPricePp,
            guests: mockStores.searchStore.searchWho.totalPaidGuestPlaces,
            numberOfHotels: mockStores.hotelsStore.numberOfHotels,
            valueFrom: mockStores.searchFiltersStore.filterPriceFrom,
            valueTo: mockStores.searchFiltersStore.filterPriceTo,
            isPricePerPerson: mockStores.searchFiltersStore.isPriceFilterPerPerson,
            onChangeOffersPriceView: mockStores.layoutStore.onChangeOffersPriceView,
            setPriceFiltersValue: mockStores.searchFiltersStore.setPriceFiltersValue,
            isSearchResultsLoading: false,
            formatMoney: mockStores.marketStore.formatMoney,
            currency: mockStores.hotelsStore.currency,
            getCurrencySymbol: mockStores.marketStore.getCurrencySymbol,
            getFormattedNumber: mockStores.marketStore.getFormattedNumber,
            onChange: mockStores.searchFiltersStore.onChange,
        });
    });

    it('returns amended props when isAmendHotelPage is true', () => {
        mockStores.layoutStore.isAmendHotelPage = true;
        const amendFiltersStore = mockStores.amendHotelStore.filters;
        const result = priceFilterStore(mockStores);
        expect(result).toEqual({
            getPhrase: mockStores.layoutStore.getPhrase,
            minPrice: mockStores.amendHotelStore.offersStatus.minPrice,
            maxPrice: mockStores.amendHotelStore.offersStatus.maxPrice,
            minPricePp: mockStores.hotelsStore.minPricePp,
            maxPricePp: mockStores.hotelsStore.maxPricePp,
            guests: 1,
            numberOfHotels: mockStores.hotelsStore.numberOfHotels,
            valueFrom: amendFiltersStore.filterPriceFrom,
            valueTo: amendFiltersStore.filterPriceTo,
            isCountHidden: amendFiltersStore.isCountHidden,
            isPricePerPerson: false,
            onChangeOffersPriceView: mockStores.layoutStore.onChangeOffersPriceView,
            setPriceFiltersValue: amendFiltersStore.setPriceFiltersValue,
            isSearchResultsLoading: false,
            formatMoney: mockStores.marketStore.formatMoney,
            currency: mockStores.marketStore.currency,
            getCurrencySymbol: mockStores.marketStore.getCurrencySymbol,
            getFormattedNumber: mockStores.marketStore.getFormattedNumber,
            isAmendHotelPage: true,
            onChange: amendFiltersStore.onChange,
        });
    });
});
