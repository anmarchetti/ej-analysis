import SitecoreDictionary from './SitecoreDictionary';

export enum SitePath {
    // Micro app
    ManageHub = '/manage/{bookingRef}',
    MicroAppChangeTransfer = '/manage/{bookingRef}/change-transfer',
    MicroAppChangeFlight = '/manage/{bookingRef}/change-flight',
    MicroAppChangeHotel = '/manage/{bookingRef}/change-hotel',
    MicroAppChangeDate = '/manage/{bookingRef}/change-date',
    MicroAppChangeRoomAndBoard = '/manage/{bookingRef}/change-room-and-board',
    MicroAppChangeName = '/manage/{bookingRef}/change-name',
    MicroAppChangeSeats = '/manage/{bookingRef}/change-seats',
    //
    Home = '/',
    Search = '/mixedresultlist',
    GuestsDetails = '/booking/guest-details',
    Extras = '/booking',
    Payment = '/booking/payment',
    PayBalance = '/booking/pay-balance',
    BookingConfirmation = '/booking/confirmation',
    ViewBookings = '/booking/my_bookings',
    ViewBooking = '/booking/my_booking',
    ConfirmHolidayCredit = '/booking/confirm-holiday-credit',
    HolidayCredit = '/booking/holiday-credit',
    Bundles = '/bundles',
    Login = '/login',
    CreateAccount = '/create-account',
    NotAvailable = '/not-available',
    IFramePromotingHolidaysPage = '/iframe-promoting-holidays',
    Sitemap = '/sitemap',
    MediaCenter = '/media-centre',
    PressReleases = '/media-centre/press-releases',
    Help = '/help',
    Shortlists = '/shortlists',
    ShortlistsNoResults = '/shortlists-no-results',
    Compare = '/compare', // used only for tracking
    PricePromise = '/price-promise',
    Destinations = '/destinations-hub',
    Deals = '/deals',
    RedeemVoucher = '/booking/redeem-voucher',
    MarketingResearchUnsubscribe = '/marketing-research-unsubscribe',
    ChatWithUs = '/chat-with-us',
    AmendPayment = '/booking/amend-payment',
    AmendFlights = '/booking/change-flight',
    AmendTransfer = '/booking/change-transfer',
    Confirm = '/booking/confirm',
    TradePortalViewBooking = '/booking/view-booking',
    TradePortalViewCancelledBooking = '/booking/cancelled-booking',
    TradePortalFindBooking = '/find-booking',
    PassengerDetails = '/booking/passenger-details',
    AmendDates = '/booking/change-dates',
    AmendDatesSummary = '/booking/change-dates/summary',
    AmendDatesSeatsAndBags = '/booking/change-dates/seats-and-bags',
    AmendRoomAndBoard = '/booking/change-room-and-board',
    AmendHotel = '/booking/change-hotel',
    BoardAndRoom = '/board-and-room', // used only for tracking
    HolidayInspiration = '/holiday-inspiration',
    AmendHotelSummary = '/booking/change-hotel/summary',
    ExternalExtras = '/booking/external-extras',
    InDestination = '/booking/my_bookings/in-destination',
    PreTravel = '/booking/my_bookings/pre-travel',
    PostTravel = '/booking/my_bookings/post-travel',
    CancelBooking = '/booking/cancel-booking',
    AssistedTravel = '/booking/assisted-travel',
}

export enum FlightPlusHotelSitePath {
    Flights = '/flight-plus-hotel/flights',
    Hotels = '/flight-plus-hotel/hotels',
    ManageHub = '/flight-plus-hotel/manage/{bookingRef}',
}

// FIXME: Why do we add some paths here, but others (e.g TradePortalViewBooking) to SitePath?
export enum TradePortalSitePath {
    Home = '/',
    Login = '/log-in',
}

export const SitePathDictionaryBreadcrumb: { [key: string]: SitecoreDictionary } = Object.freeze({
    [SitePath.ManageHub]: SitecoreDictionary.PathBreadcrumbsLabelsManageHub,
    [SitePath.ViewBookings]: SitecoreDictionary.PathBreadcrumbsLabelsMyBookings,
    [SitePath.ViewBooking]: SitecoreDictionary.PathBreadcrumbsLabelsViewBooking,
    [SitePath.ConfirmHolidayCredit]: SitecoreDictionary.PathBreadcrumbsLabelsCreditMyHoliday,
    [SitePath.HolidayCredit]: SitecoreDictionary.PathBreadcrumbsLabelsHolidayCredit,
    [SitePath.Shortlists]: SitecoreDictionary.PathBreadcrumbsLabelsShortlist,
    [SitePath.ShortlistsNoResults]: SitecoreDictionary.PathBreadcrumbsLabelsShortlist,
    [SitePath.RedeemVoucher]: SitecoreDictionary.PathBreadcrumbsLabelsRedeemVoucher,
    [SitePath.AmendFlights]: SitecoreDictionary.PathBreadcrumbsLabelsChangeYourFlights,
    [SitePath.AmendTransfer]: SitecoreDictionary.PathBreadcrumbsLabelsChangeYourTransfer,
    [SitePath.PassengerDetails]: SitecoreDictionary.PathBreadcrumbsLabelsChangePassenger,
    [SitePath.AmendDates]: SitecoreDictionary.PathBreadcrumbsLabelsChangeYourDates,
    [SitePath.AmendDatesSummary]: SitecoreDictionary.PathBreadcrumbsLabelsChangeYourDatesSummary,
    [SitePath.AmendDatesSeatsAndBags]: SitecoreDictionary.PathBreadcrumbsLabelsChangeYourDatesSeatsAndBags,
    [SitePath.AmendRoomAndBoard]: SitecoreDictionary.PathBreadcrumbsLabelsChangeYourRoomAndBoard,
    [SitePath.AmendHotel]: SitecoreDictionary.PathBreadcrumbsLabelsChangeYourHotel,
    [SitePath.AmendHotelSummary]: SitecoreDictionary.PathBreadcrumbsLabelsReviewYourChanges,
    [SitePath.CancelBooking]: SitecoreDictionary.PathBreadcrumbsLabelsCancelBooking,
    [SitePath.InDestination]: SitecoreDictionary.PathBreadcrumbsLabelsInDestination,
    [SitePath.PreTravel]: SitecoreDictionary.PathBreadcrumbsLabelsPreTravel,
    [SitePath.TradePortalViewBooking]: SitecoreDictionary.PathBreadcrumbsLabelsViewBooking,
});

export enum SitePathOverload {
    ChangeYourSeats = 'ChangeYourSeats',
    ReviewYourChanges = 'ReviewYourChanges',
}

/**
 * Is used when the same SitePath is used for different cases
 * For example: "change seats" should also open seat map widget
 */
export const SitePathDictionaryBreadcrumbOverload: { [key: string]: SitecoreDictionary } = Object.freeze({
    [SitePathOverload.ChangeYourSeats]: SitecoreDictionary.PathBreadcrumbsLabelsChangeYourSeats,
    [SitePathOverload.ReviewYourChanges]: SitecoreDictionary.PathBreadcrumbsLabelsReviewYourChanges,
});

export default SitePath;
