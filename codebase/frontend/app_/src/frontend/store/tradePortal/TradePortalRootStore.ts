import jsonStringifySafe from 'json-stringify-safe';
import { action, makeObservable } from 'mobx';

import {
    AlternativeFlightsStore,
    BaseAmendSeatsStore,
    BaseAppCatalogStore,
    BaseHotelReviewsStore,
    BaseMetadataStore,
    ComparePricesCalendarStore,
    EngageStore,
    MarketStore,
    PriceGraphStore,
    PromoPageStore,
} from 'frontend/store/base';
import { FlightsPassengersStore } from 'frontend/store/base/flightsPassengers/FlightsPassengersStore';
import { TradePortalSearchStore } from 'frontend/store/tradePortal/search/TradePortalSearchStore';

import { TradePortalAmendPaymentStore } from './amend/TradePortalAmendPaymentStore';
import TradePortalAppStore from './app/TradePortalAppStore';
import { TradePortalBookingStore } from './booking/TradePortalBookingStore';
import { TradePortalEditorStore } from './experienceEditor/TradePortalEditorStore';
import TradePortalGuestDetailsStore from './guestDetails/TradePortalGuestDetailsStore';
import { TradePortalCreditStore } from './holidayCredit/TradePortalCreditStore';
import { TradePortalLayoutStore } from './layout/TradePortalLayoutStore';
import TradePortalNotificationsStore from './notifications/TradePortalNotificationsStore';
import { TradePortalOffersStore } from './offers/TradePortalOffersStore';
import TradePortalPaymentStore from './payment/TradePortalPaymentStore';
import TradePortalPayStore from './payment/TradePortalPayStore';
import { TradePortalQueryParamsStore } from './queryParams/TradePortalQueryParamsStore';
import TradePortalRouterStore from './router/TradePortalRouterStore';
import TradePortalSearchFilterStore from './search/TradePortalSearchFiltersStore';
import { TradePortalSeatMapStore } from './seatMap/TradePortalSeatMapStore';
import TradePortalTrackingStore from './tracking/TradePortalTrackingStore';
import { TradePortalUserStore } from './user/TradePortalUserStore';
import { TradePortalViewBookingStore } from './viewBooking/TradePortalViewBookingStore';
import { ITradePortalInitialState } from './create-stores';

export class TradePortalRootStore {
    public layoutStore: TradePortalLayoutStore;
    public searchStore: TradePortalSearchStore;
    public searchFiltersStore: TradePortalSearchFilterStore;
    public hotelsStore: TradePortalOffersStore;
    public bookingStore: TradePortalBookingStore;
    public paymentStore: TradePortalPaymentStore;
    public queryParamsStore: TradePortalQueryParamsStore;
    public appStore: TradePortalAppStore;
    public appCatalogStore: BaseAppCatalogStore;
    public routerStore: TradePortalRouterStore;
    public userStore: TradePortalUserStore;
    public guestDetailsStore: TradePortalGuestDetailsStore;
    public trackingStore: TradePortalTrackingStore;
    public viewBookingStore: TradePortalViewBookingStore;
    public metadataStore: BaseMetadataStore;
    public promoPageStore: PromoPageStore;
    public hotelReviewsStore: BaseHotelReviewsStore;
    public priceGraphStore: PriceGraphStore;
    public alternativeFlightsStore: AlternativeFlightsStore;
    public payStore: TradePortalPayStore;
    public editorStore: TradePortalEditorStore;
    public comparePricesCalendarStore: ComparePricesCalendarStore;
    public notificationsStore: TradePortalNotificationsStore;
    public seatMapStore: TradePortalSeatMapStore;
    public marketStore: MarketStore;
    public holidayCreditStore: TradePortalCreditStore;

    public amendSeatsStore: BaseAmendSeatsStore;
    public amendPaymentStore: TradePortalAmendPaymentStore;
    public engageStore: EngageStore;
    public flightsPassengersStore: FlightsPassengersStore;

    constructor(initialState: ITradePortalInitialState = {}) {
        makeObservable(this);

        this.userStore = new TradePortalUserStore(this);
        this.userStore.deserialize(initialState.userStore);

        this.appStore = new TradePortalAppStore();
        this.appCatalogStore = new BaseAppCatalogStore(this);

        this.layoutStore = new TradePortalLayoutStore(this);
        this.layoutStore.deserialize(initialState.layoutStore);

        this.queryParamsStore = new TradePortalQueryParamsStore(this);
        this.queryParamsStore.deserialize(initialState.queryParamsStore);

        this.searchStore = new TradePortalSearchStore(this);
        this.searchStore.deserialize(initialState.searchStore);

        this.searchFiltersStore = new TradePortalSearchFilterStore(this);

        this.hotelsStore = new TradePortalOffersStore(this);
        this.hotelsStore.deserialize(initialState.hotelsStore);

        this.bookingStore = new TradePortalBookingStore(this);
        this.bookingStore.deserialize(initialState?.bookingStore);

        this.guestDetailsStore = new TradePortalGuestDetailsStore(this);

        this.routerStore = new TradePortalRouterStore(this);

        this.trackingStore = new TradePortalTrackingStore(this);
        this.metadataStore = new BaseMetadataStore(this);

        this.promoPageStore = new PromoPageStore(this);
        this.promoPageStore.deserialize(initialState.promoPageStore);

        this.hotelReviewsStore = new BaseHotelReviewsStore(this);

        this.priceGraphStore = new PriceGraphStore(this);
        this.alternativeFlightsStore = new AlternativeFlightsStore(this);

        // Payment
        this.payStore = new TradePortalPayStore();
        this.payStore.deserialize(initialState.payStore);

        this.paymentStore = new TradePortalPaymentStore(this);

        // View Booking
        this.viewBookingStore = new TradePortalViewBookingStore(this);
        this.viewBookingStore.deserialize(initialState.viewBookingStore);
        this.holidayCreditStore = new TradePortalCreditStore(this);

        this.editorStore = new TradePortalEditorStore(this);

        this.comparePricesCalendarStore = new ComparePricesCalendarStore(this);

        this.notificationsStore = new TradePortalNotificationsStore(this);
        this.seatMapStore = new TradePortalSeatMapStore(this);

        this.marketStore = new MarketStore(this);

        this.flightsPassengersStore = new FlightsPassengersStore(this);

        // Amend
        this.amendSeatsStore = new BaseAmendSeatsStore(this);
        this.amendPaymentStore = new TradePortalAmendPaymentStore(this);
        this.amendPaymentStore.deserialize(initialState.amendPaymentStore);

        this.marketStore = new MarketStore(this);
        this.marketStore.deserialize(initialState.marketStore);

        this.engageStore = new EngageStore(this);
    }

    /**
     * Serialize store for SSR.
     */
    public serialize(): string {
        const stores: ITradePortalInitialState = {
            layoutStore: this.layoutStore.serialize(),
        };

        // No need serialize other stores in EditMode
        if (!this.layoutStore.isEditMode) {
            stores.hotelsStore = this.hotelsStore.serialize();
            stores.bookingStore = this.bookingStore.serialize();
            stores.searchStore = this.searchStore.serialize();
            stores.userStore = this.userStore.serialize();
            stores.payStore = this.payStore.serialize();
            stores.viewBookingStore = this.viewBookingStore.serialize();
            stores.promoPageStore = this.promoPageStore.serialize();
            stores.queryParamsStore = this.queryParamsStore.serialize();
            stores.marketStore = this.marketStore.serialize();
        }

        return jsonStringifySafe(stores);
    }

    @action public syncUrlParamsWithStores = (forceQuery = false) => {
        this.searchStore.getValuesFromQueryParamsStore(forceQuery);
        this.searchFiltersStore.getFiltersParamsFromQueryParamsStore();
        this.bookingStore.getOfferParamsFromQueryParamsStore();
        this.userStore.getUserStoreParamsFromQueryParamsStore();
    };
}
