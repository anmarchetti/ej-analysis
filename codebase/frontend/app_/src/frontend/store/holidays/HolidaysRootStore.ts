/* eslint-disable import/prefer-default-export */
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
import { InspireMeStore } from 'frontend/store/holidays/inspireMe/InspireMeStore';

import AmendDatesStore from './amend/amendDates/AmendDatesStore';
import { AmendFlightsStore } from './amend/amendFlight/AmendFlightsStore';
import { AmendHotelStore } from './amend/amendHotel/AmendHotelStore';
import { AmendPassengerStore } from './amend/amendPassenger/AmendPassengerStore';
import { AmendPaymentStore } from './amend/AmendPaymentStore';
import { AmendRoomAndBoardStore } from './amend/amendRoomAndBoard/AmendRoomAndBoardStore';
import { AmendTransferStore } from './amend/amendTransfers/AmendTransfersStore';
import AppStore from './app/AppStore';
import { BookingStore } from './booking/BookingStore';
import { CreateAccountStore } from './createAccount/CreateAccountStore';
import { EditorStore } from './experienceEditor/EditorStore';
import { AirportParkingStore } from './externalExtras/airportParking/AirportParkingStore';
import { GuestDetailsStore } from './guestDetails/GuestDetailsStore';
import { HolidayCreditStore } from './holidayCredit/HolidayCreditStore';
import { LayoutStore } from './layout/LayoutStore';
import MediaCenterStore from './mediaCenter/MediaCenterStore';
import NotificationsStore from './notifications/NotificationsStore';
import { OffersStore } from './offers/OffersStore';
import { PayBalanceStore } from './payment/PayBalanceStore';
import { PaymentStore } from './payment/PaymentStore';
import { PaymentTypeStore } from './payment/PaymentTypeStore';
import { PayStore } from './payment/PayStore';
import { QueryParamsStore } from './queryParams/QueryParamsStore';
import ReCaptchaStore from './reCaptcha/ReCaptchaStore';
import { RedeemVoucherStore } from './redeemVoucher/RedeemVoucherStore';
import RouterStore from './router/RouterStore';
import SearchFilterStore from './search/SearchFiltersStore';
import { SearchStore } from './search/SearchStore';
import { SeatMapStore } from './seatMap/SeatMapStore';
import { ShortlistStore } from './shortlist/ShortlistStore';
import { TrackingStore } from './tracking/TrackingStore';
import { UserStore } from './user/UserStore';
import { AddBookingStore } from './viewBooking/AddBookingStore';
import { ViewBookingsStore } from './viewBooking/ViewBookingsStore';
import { ViewBookingStore } from './viewBooking/viewBookingStore';
import { IHolidaysInitialState } from '.';

export class HolidaysRootStore {
    public layoutStore: LayoutStore;
    public searchStore: SearchStore;
    public searchFiltersStore: SearchFilterStore;
    public hotelsStore: OffersStore;
    public bookingStore: BookingStore;
    public paymentStore: PaymentStore;
    public queryParamsStore: QueryParamsStore;
    public appStore: AppStore;
    public appCatalogStore: BaseAppCatalogStore;
    public routerStore: RouterStore;
    public userStore: UserStore;
    public guestDetailsStore: GuestDetailsStore;
    public trackingStore: TrackingStore;
    public viewBookingStore: ViewBookingStore;
    public metadataStore: BaseMetadataStore;
    public promoPageStore: PromoPageStore;
    public hotelReviewsStore: BaseHotelReviewsStore;
    public priceGraphStore: PriceGraphStore;
    public alternativeFlightsStore: AlternativeFlightsStore;
    public payBalanceStore: PayBalanceStore;
    public payStore: PayStore;
    public paymentTypeStore: PaymentTypeStore;
    public viewBookingsStore: ViewBookingsStore;
    public addBookingStore: AddBookingStore;
    public mediaCenterStore: MediaCenterStore;
    public holidayCreditStore: HolidayCreditStore;
    public seatMapStore: SeatMapStore;
    public editorStore: EditorStore;
    public shortlistStore: ShortlistStore;
    public comparePricesCalendarStore: ComparePricesCalendarStore;
    public createAccountStore: CreateAccountStore;
    public reCaptchaStore: ReCaptchaStore;
    public notificationsStore: NotificationsStore;
    public redeemVoucherStore: RedeemVoucherStore;
    public marketStore: MarketStore;
    public inspireMeStore: InspireMeStore;

    public amendSeatsStore: BaseAmendSeatsStore;
    public amendFlightsStore: AmendFlightsStore;
    public amendTransfersStore: AmendTransferStore;
    public amendPaymentStore: AmendPaymentStore;
    public amendPassengerStore: AmendPassengerStore;
    public amendDatesStore: AmendDatesStore;
    public amendRoomAndBoardStore: AmendRoomAndBoardStore;
    public amendHotelStore: AmendHotelStore;

    public engageStore: EngageStore;
    public flightsPassengersStore: FlightsPassengersStore;

    public airportParkingStore: AirportParkingStore;

    constructor(initialState: IHolidaysInitialState = {}) {
        makeObservable(this);

        this.userStore = new UserStore(this);
        this.userStore.deserialize(initialState.userStore);

        this.appCatalogStore = new BaseAppCatalogStore(this);

        this.layoutStore = new LayoutStore(this);
        this.layoutStore.deserialize(initialState.layoutStore);

        this.appStore = new AppStore(this);

        this.queryParamsStore = new QueryParamsStore(this);
        this.queryParamsStore.deserialize(initialState.queryParamsStore);

        this.searchStore = new SearchStore(this);
        this.searchStore.deserialize(initialState.searchStore);

        this.searchFiltersStore = new SearchFilterStore(this);

        this.hotelsStore = new OffersStore(this);
        this.hotelsStore.deserialize(initialState.hotelsStore);

        this.bookingStore = new BookingStore(this);
        this.bookingStore.deserialize(initialState.bookingStore);

        this.guestDetailsStore = new GuestDetailsStore(this);

        this.routerStore = new RouterStore(this);

        this.trackingStore = new TrackingStore(this);
        this.metadataStore = new BaseMetadataStore(this);

        this.promoPageStore = new PromoPageStore(this);
        this.promoPageStore.deserialize(initialState.promoPageStore);

        this.hotelReviewsStore = new BaseHotelReviewsStore(this);

        this.priceGraphStore = new PriceGraphStore(this);
        this.alternativeFlightsStore = new AlternativeFlightsStore(this);

        this.mediaCenterStore = new MediaCenterStore(this);

        // Payment
        this.payStore = new PayStore(this);
        this.payStore.deserialize(initialState.payStore);

        this.paymentStore = new PaymentStore(this);

        this.payBalanceStore = new PayBalanceStore(this);
        this.payBalanceStore.deserialize(initialState.payBalanceStore);

        this.paymentTypeStore = new PaymentTypeStore();

        // View Booking
        this.viewBookingStore = new ViewBookingStore(this);
        this.viewBookingStore.deserialize(initialState.viewBookingStore);

        this.viewBookingsStore = new ViewBookingsStore(this);

        this.addBookingStore = new AddBookingStore(this);

        this.holidayCreditStore = new HolidayCreditStore(this);

        this.editorStore = new EditorStore(this);

        this.shortlistStore = new ShortlistStore(this);

        this.comparePricesCalendarStore = new ComparePricesCalendarStore(this);

        this.createAccountStore = new CreateAccountStore(this);

        this.reCaptchaStore = new ReCaptchaStore(this);

        this.notificationsStore = new NotificationsStore(this);

        this.redeemVoucherStore = new RedeemVoucherStore(this);

        // Amend Stores
        this.amendFlightsStore = new AmendFlightsStore(this);
        this.amendTransfersStore = new AmendTransferStore(this);
        this.amendSeatsStore = new BaseAmendSeatsStore(this);
        this.amendPassengerStore = new AmendPassengerStore(this);
        this.amendDatesStore = new AmendDatesStore(this);
        this.amendRoomAndBoardStore = new AmendRoomAndBoardStore(this);
        this.amendHotelStore = new AmendHotelStore(this);

        this.amendPaymentStore = new AmendPaymentStore(this);
        this.amendPaymentStore.deserialize(initialState.amendPaymentStore);
        this.seatMapStore = new SeatMapStore(this);

        this.marketStore = new MarketStore(this);
        this.marketStore.deserialize(initialState.marketStore);

        this.inspireMeStore = new InspireMeStore(this);

        this.engageStore = new EngageStore(this);
        this.engageStore.deserialize(initialState.engageStore);

        this.flightsPassengersStore = new FlightsPassengersStore(this);

        //external extras
        this.airportParkingStore = new AirportParkingStore(this);
    }

    /**
     * Serialize store for SSR.
     */
    public serialize(): string {
        const stores: IHolidaysInitialState = {
            layoutStore: this.layoutStore.serialize(),
        };

        // No need serialize other stores in EditMode
        if (!this.layoutStore.isEditMode) {
            stores.hotelsStore = this.hotelsStore.serialize();
            stores.bookingStore = this.bookingStore.serialize();
            stores.searchStore = this.searchStore.serialize();
            stores.userStore = this.userStore.serialize();
            stores.payStore = this.payStore.serialize();
            stores.payBalanceStore = this.payBalanceStore.serialize();
            stores.viewBookingStore = this.viewBookingStore.serialize();
            stores.promoPageStore = this.promoPageStore.serialize();
            stores.queryParamsStore = this.queryParamsStore.serialize();
            stores.amendPaymentStore = this.amendPaymentStore.serialize();
            stores.marketStore = this.marketStore.serialize();
            stores.engageStore = this.engageStore.serialize();
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
