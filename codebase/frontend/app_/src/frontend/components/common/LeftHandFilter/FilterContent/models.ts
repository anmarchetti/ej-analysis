import { AmendHotelStoreFilters } from 'frontend/store/holidays/amend/amendHotel/AmendHotelStore.filters';
import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import TradePortalSearchFilterStore from 'frontend/store/tradePortal/search/TradePortalSearchFiltersStore';

export type TLeftHandFilterStoreInstance = SearchFilterStore | TradePortalSearchFilterStore | AmendHotelStoreFilters;
