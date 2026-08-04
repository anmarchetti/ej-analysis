import {
    AlternativeFlightsStore,
    BaseAmendSeatsStore,
    BaseAppCatalogStore,
    BaseHotelReviewsStore,
    BaseMetadataStore,
    ComparePricesCalendarStore,
    EngageStore,
    IBaseBookingStoreInitialState,
    IBaseViewBookingStoreInitialState,
    ILayoutInitialState,
    IMarketStoreInitialState,
    IPromoPageInitialState,
    IQueryParamsStoreInitialState,
    IUserStoreInitialState,
    MarketStore,
    PriceGraphStore,
    PromoPageStore,
} from 'frontend/store/base';
import { FlightsPassengersStore } from 'frontend/store/base/flightsPassengers/FlightsPassengersStore';
import { ISearchStoreInitialState } from 'frontend/store/base/search/BaseSearchStore';
import { TStores } from 'frontend/store/IStores';
import { TradePortalSearchStore } from 'frontend/store/tradePortal/search/TradePortalSearchStore';

import { TradePortalAmendPaymentStore } from './amend/TradePortalAmendPaymentStore';
import TradePortalAppStore from './app/TradePortalAppStore';
import { TradePortalBookingStore } from './booking/TradePortalBookingStore';
import { TradePortalEditorStore } from './experienceEditor/TradePortalEditorStore';
import TradePortalGuestDetailsStore from './guestDetails/TradePortalGuestDetailsStore';
import { TradePortalCreditStore } from './holidayCredit/TradePortalCreditStore';
import { TradePortalLayoutStore } from './layout/TradePortalLayoutStore';
import TradePortalNotificationsStore from './notifications/TradePortalNotificationsStore';
import { ITradePortalOffersInitialState, TradePortalOffersStore } from './offers/TradePortalOffersStore';
import TradePortalPaymentStore from './payment/TradePortalPaymentStore';
import TradePortalPayStore, { ITradePortalPayStoreInitialState } from './payment/TradePortalPayStore';
import { TradePortalQueryParamsStore } from './queryParams/TradePortalQueryParamsStore';
import TradePortalRouterStore from './router/TradePortalRouterStore';
import TradePortalSearchFilterStore from './search/TradePortalSearchFiltersStore';
import { TradePortalSeatMapStore } from './seatMap/TradePortalSeatMapStore';
import TradePortalTrackingStore from './tracking/TradePortalTrackingStore';
import { TradePortalUserStore } from './user/TradePortalUserStore';
import { TradePortalViewBookingStore } from './viewBooking/TradePortalViewBookingStore';
import { TradePortalRootStore } from './TradePortalRootStore';

export interface ITradePortalStores {
    alternativeFlightsStore: AlternativeFlightsStore;
    amendPaymentStore: TradePortalAmendPaymentStore;
    amendSeatsStore: BaseAmendSeatsStore;
    appCatalogStore: BaseAppCatalogStore;
    appStore: TradePortalAppStore;
    bookingStore: TradePortalBookingStore;
    comparePricesCalendarStore: ComparePricesCalendarStore;
    editorStore: TradePortalEditorStore;
    engageStore: EngageStore;
    flightsPassengersStore: FlightsPassengersStore;
    guestDetailsStore: TradePortalGuestDetailsStore;
    holidayCreditStore: TradePortalCreditStore;
    hotelReviewsStore: BaseHotelReviewsStore;
    hotelsStore: TradePortalOffersStore;
    layoutStore: TradePortalLayoutStore;
    marketStore: MarketStore;
    metadataStore: BaseMetadataStore;
    notificationsStore: TradePortalNotificationsStore;
    payStore: TradePortalPayStore;
    paymentStore: TradePortalPaymentStore;
    priceGraphStore: PriceGraphStore;
    promoPageStore: PromoPageStore;
    queryParamStore: TradePortalQueryParamsStore;
    rootStore: TradePortalRootStore;
    routerStore: TradePortalRouterStore;
    searchFiltersStore: TradePortalSearchFilterStore;
    searchStore: TradePortalSearchStore;
    seatMapStore: TradePortalSeatMapStore;
    trackingStore: TradePortalTrackingStore;
    userStore: TradePortalUserStore;
    viewBookingStore: TradePortalViewBookingStore;
}

export interface ITradePortalInitialState {
    amendPaymentStore?: any;
    bookingStore?: IBaseBookingStoreInitialState;
    hotelsStore?: ITradePortalOffersInitialState;
    layoutStore?: ILayoutInitialState;
    marketStore?: IMarketStoreInitialState;
    payBalanceStore?: any;
    payStore?: ITradePortalPayStoreInitialState;
    promoPageStore?: IPromoPageInitialState;
    queryParamsStore?: IQueryParamsStoreInitialState;
    searchStore?: ISearchStoreInitialState;
    userStore?: IUserStoreInitialState;
    viewBookingStore?: IBaseViewBookingStoreInitialState;
}

// Create stores
export const createTradePortalAppStores = (initialState: ITradePortalInitialState = {}): ITradePortalStores => {
    const rootStore = new TradePortalRootStore(initialState);

    return {
        rootStore,
        layoutStore: rootStore.layoutStore,
        searchStore: rootStore.searchStore,
        searchFiltersStore: rootStore.searchFiltersStore,
        hotelsStore: rootStore.hotelsStore,
        bookingStore: rootStore.bookingStore,
        queryParamStore: rootStore.queryParamsStore,
        paymentStore: rootStore.paymentStore,
        userStore: rootStore.userStore,
        appStore: rootStore.appStore,
        appCatalogStore: rootStore.appCatalogStore,
        routerStore: rootStore.routerStore,
        guestDetailsStore: rootStore.guestDetailsStore,
        trackingStore: rootStore.trackingStore,
        viewBookingStore: rootStore.viewBookingStore,
        metadataStore: rootStore.metadataStore,
        promoPageStore: rootStore.promoPageStore,
        hotelReviewsStore: rootStore.hotelReviewsStore,
        priceGraphStore: rootStore.priceGraphStore,
        alternativeFlightsStore: rootStore.alternativeFlightsStore,
        payStore: rootStore.payStore,
        editorStore: rootStore.editorStore,
        comparePricesCalendarStore: rootStore.comparePricesCalendarStore,
        notificationsStore: rootStore.notificationsStore,
        seatMapStore: rootStore.seatMapStore,
        amendPaymentStore: rootStore.amendPaymentStore,
        amendSeatsStore: rootStore.amendSeatsStore,
        marketStore: rootStore.marketStore,
        engageStore: rootStore.engageStore,
        flightsPassengersStore: rootStore.flightsPassengersStore,
        holidayCreditStore: rootStore.holidayCreditStore,
    };
};

export const isTradeStore = (stores: TStores): stores is ITradePortalStores => stores.layoutStore.isTradePortal;
