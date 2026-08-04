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
    IEngageStoreInitialState,
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
import AmendDatesStore from 'frontend/store/holidays/amend/amendDates/AmendDatesStore';
import { AmendFlightsStore } from 'frontend/store/holidays/amend/amendFlight/AmendFlightsStore';
import { AmendPassengerStore } from 'frontend/store/holidays/amend/amendPassenger/AmendPassengerStore';
import { AmendPaymentStore } from 'frontend/store/holidays/amend/AmendPaymentStore';
import { AmendTransferStore } from 'frontend/store/holidays/amend/amendTransfers/AmendTransfersStore';
import { InspireMeStore } from 'frontend/store/holidays/inspireMe/InspireMeStore';
import { PayBalanceStore } from 'frontend/store/holidays/payment/PayBalanceStore';
import { TStores } from 'frontend/store/IStores';

import { AmendHotelStore } from './amend/amendHotel/AmendHotelStore';
import { AmendRoomAndBoardStore } from './amend/amendRoomAndBoard/AmendRoomAndBoardStore';
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
import { IOffersInitialState, OffersStore } from './offers/OffersStore';
import { PaymentStore } from './payment/PaymentStore';
import { PaymentTypeStore } from './payment/PaymentTypeStore';
import { IPayStoreInitialState, PayStore } from './payment/PayStore';
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
import { HolidaysRootStore } from './HolidaysRootStore';

export interface IHolidaysStores {
    addBookingStore: AddBookingStore;
    airportParkingStore: AirportParkingStore;
    alternativeFlightsStore: AlternativeFlightsStore;
    amendDatesStore: AmendDatesStore;
    amendFlightsStore: AmendFlightsStore;
    amendHotelStore: AmendHotelStore;
    amendPassengerStore: AmendPassengerStore;
    amendPaymentStore: AmendPaymentStore;
    amendRoomAndBoardStore: AmendRoomAndBoardStore;
    amendSeatsStore: BaseAmendSeatsStore;
    amendTransfersStore: AmendTransferStore;
    appCatalogStore: BaseAppCatalogStore;
    appStore: AppStore;
    bookingStore: BookingStore;
    comparePricesCalendarStore: ComparePricesCalendarStore;
    createAccountStore: CreateAccountStore;
    editorStore: EditorStore;
    engageStore: EngageStore;
    flightsPassengersStore: FlightsPassengersStore;
    guestDetailsStore: GuestDetailsStore;
    holidayCreditStore: HolidayCreditStore;
    hotelReviewsStore: BaseHotelReviewsStore;
    hotelsStore: OffersStore;
    inspireMeStore: InspireMeStore;
    layoutStore: LayoutStore;
    marketStore: MarketStore;
    mediaCenterStore: MediaCenterStore;
    metadataStore: BaseMetadataStore;
    notificationsStore: NotificationsStore;
    payBalanceStore: PayBalanceStore;
    payStore: PayStore;
    paymentStore: PaymentStore;
    paymentTypeStore: PaymentTypeStore;
    priceGraphStore: PriceGraphStore;
    promoPageStore: PromoPageStore;
    queryParamStore: QueryParamsStore;
    reCaptchaStore: ReCaptchaStore;
    redeemVoucherStore: RedeemVoucherStore;
    rootStore: HolidaysRootStore;
    routerStore: RouterStore;
    searchFiltersStore: SearchFilterStore;
    searchStore: SearchStore;
    seatMapStore: SeatMapStore;
    shortlistStore: ShortlistStore;
    trackingStore: TrackingStore;
    userStore: UserStore;
    viewBookingStore: ViewBookingStore;
    viewBookingsStore: ViewBookingsStore;
}

export interface IHolidaysInitialState {
    amendDatesStore?: AmendDatesStore;
    amendPassengerStore?: AmendPassengerStore;
    amendPaymentStore?: any;
    amendRoomAndBoardStore?: AmendRoomAndBoardStore;
    bookingStore?: IBaseBookingStoreInitialState;
    engageStore?: IEngageStoreInitialState;
    hotelsStore?: IOffersInitialState;
    layoutStore?: ILayoutInitialState;
    marketStore?: IMarketStoreInitialState;
    payBalanceStore?: any;
    payStore?: IPayStoreInitialState;
    paymentTypesStore?: any;
    promoPageStore?: IPromoPageInitialState;
    queryParamsStore?: IQueryParamsStoreInitialState;
    searchStore?: ISearchStoreInitialState;
    userStore?: IUserStoreInitialState;
    viewBookingStore?: IBaseViewBookingStoreInitialState;
}

// Create stores
export const createHolidaysAppStores = (initialState: IHolidaysInitialState = {}): IHolidaysStores => {
    const rootStore = new HolidaysRootStore(initialState);

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
        payBalanceStore: rootStore.payBalanceStore,
        payStore: rootStore.payStore,
        paymentTypeStore: rootStore.paymentTypeStore,
        viewBookingsStore: rootStore.viewBookingsStore,
        addBookingStore: rootStore.addBookingStore,
        mediaCenterStore: rootStore.mediaCenterStore,
        holidayCreditStore: rootStore.holidayCreditStore,
        editorStore: rootStore.editorStore,
        shortlistStore: rootStore.shortlistStore,
        comparePricesCalendarStore: rootStore.comparePricesCalendarStore,
        createAccountStore: rootStore.createAccountStore,
        reCaptchaStore: rootStore.reCaptchaStore,
        notificationsStore: rootStore.notificationsStore,
        redeemVoucherStore: rootStore.redeemVoucherStore,
        amendFlightsStore: rootStore.amendFlightsStore,
        amendTransfersStore: rootStore.amendTransfersStore,
        amendHotelStore: rootStore.amendHotelStore,
        amendPaymentStore: rootStore.amendPaymentStore,
        seatMapStore: rootStore.seatMapStore,
        amendPassengerStore: rootStore.amendPassengerStore,
        amendDatesStore: rootStore.amendDatesStore,
        amendSeatsStore: rootStore.amendSeatsStore,
        marketStore: rootStore.marketStore,
        engageStore: rootStore.engageStore,
        amendRoomAndBoardStore: rootStore.amendRoomAndBoardStore,
        flightsPassengersStore: rootStore.flightsPassengersStore,
        inspireMeStore: rootStore.inspireMeStore,
        airportParkingStore: rootStore.airportParkingStore,
    };
};

export const isHolidayStore = (stores: TStores): stores is IHolidaysStores => !stores.layoutStore.isTradePortal;
