export enum FilterGroupCodes {
    NoFilter = 'noFilter',
    BoardType = 'boardType',
    Facilities = 'facilities',
    Flights = 'departureAirport',
    StarRating = 'starRating',
    PriceRange = 'priceRange',
    TripAdvisorRating = 'tripAdvisorRating',
    PackageTheme = 'packageTheme',
    Destination = 'destination',
    Regions = 'region',
    Duration = 'duration',
    FlightTimes = 'timeSlots',
    InboundDepartureTime = 'inboundDepartureTime',
    OutboundDepartureTime = 'outboundDepartureTime',
    Offers = 'offers',
    FreeForKidsOnly = 'ffk', // freeForKidsOnly - Updated to be an acronym so offers parameter is smaller
    HotelTypes = 'hotelTypes',
    FlightDuration = 'flightDuration',
    Weather = 'weather',
    PromoCollection = 'promoCollection',

    /* Quick filters */
    Recommended = 'recommended',
    RecentlyUsed = 'recentlyUsed',

    /* Media-center codes */
    Topics = 'topics',
    Date = 'date',

    /* Alternative Flights Filters */
    AltFlightsDepartureAirports = 'altFlightsDepartureAirport',
    AltFlightsOutboundDepartureTime = 'altFlightsOutboundDepartureTime',
    AltFlightsInboundDepartureTime = 'altFlightsInboundDepartureTime',
}

export type TQuickFilterType = FilterGroupCodes.Recommended | FilterGroupCodes.RecentlyUsed;

export const PRICE_RANGE_FILTER_CODE = `${FilterGroupCodes.PriceRange}_Filter`;
export const FLIGHT_DURATION_FILTER_CODE = `${FilterGroupCodes.FlightDuration}_Filter`;
export const WEATHER_FILTER_CODE = `${FilterGroupCodes.Weather}_Filter`;

export const RANGE_FILTER_CODES = [
    FilterGroupCodes.PriceRange,
    FilterGroupCodes.FlightDuration,
    FilterGroupCodes.Weather,
];

export const RADIO_FILTER_CODES = [FilterGroupCodes.TripAdvisorRating, FilterGroupCodes.Duration];
export const QUICK_FILTER_CODES = [FilterGroupCodes.RecentlyUsed, FilterGroupCodes.Recommended];

export const DEFAULT_FILTER_ORDER = [
    FilterGroupCodes.BoardType,
    FilterGroupCodes.Destination,
    FilterGroupCodes.StarRating,
    FilterGroupCodes.HotelTypes,
    FilterGroupCodes.TripAdvisorRating,
    FilterGroupCodes.PackageTheme,
    FilterGroupCodes.Flights,
    FilterGroupCodes.Facilities,
    FilterGroupCodes.Duration,
    FilterGroupCodes.PriceRange,
    FilterGroupCodes.FlightTimes,
    FilterGroupCodes.Offers,
    FilterGroupCodes.Weather,
    FilterGroupCodes.PromoCollection,
];

export const NO_CHECKBOX_GROUPS = new Set([
    FilterGroupCodes.StarRating,
    FilterGroupCodes.PriceRange,
    FilterGroupCodes.PackageTheme,
    FilterGroupCodes.Destination,
    FilterGroupCodes.Facilities,
    FilterGroupCodes.Date,
    FilterGroupCodes.FlightTimes,
    FilterGroupCodes.FlightDuration,
]);

export const FILTER_GROUP_CODES = new Set(Object.values(FilterGroupCodes));
