import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export const FilterTypes = {
    recommended: SitecoreDictionary.FilterTypesLabelsRecommended,
    recentlyUsed: SitecoreDictionary.FilterTypesLabelsRecentlyUsed,
    boardType: SitecoreDictionary.FilterTypesLabelsBoard,
    facilities: SitecoreDictionary.FilterTypesLabelsHotelFacilities,
    departureAirport: SitecoreDictionary.GlobalsDestinationTypesAirport,
    starRating: SitecoreDictionary.FilterTypesLabelsStarRating,
    tripAdvisorRating: SitecoreDictionary.FilterTypesLabelsStarRating,
    priceRange: SitecoreDictionary.FilterTypesLabelsPriceRange,
    packageTheme: SitecoreDictionary.FilterTypesLabelsPackageTheme,
    destination: SitecoreDictionary.FilterTypesLabelsDestinations,
    duration: SitecoreDictionary.FilterTypesLabelsDuration,
    region: SitecoreDictionary.FilterTypesLabelsRegions,
    topics: SitecoreDictionary.FilterTypesLabelsTopics,
    date: SitecoreDictionary.FilterTypesLabelsDate,
    timeSlots: SitecoreDictionary.FilterTypesLabelsFlightTimes,
    outboundDepartureTime: SitecoreDictionary.FilterTypesLabelsOutboundDepartureTime,
    inboundDepartureTime: SitecoreDictionary.FilterTypesLabelsInboundDepartureTime,
    offers: SitecoreDictionary.FilterTypesLabelsOffers,
    hotelTypes: SitecoreDictionary.FilterTypesLabelsHotelTypes,
    flightDuration: SitecoreDictionary.FilterTypesLabelsFlightDuration,
    weather: SitecoreDictionary.FilterTypesLabelsWeather,

    /* Alternative Flights Filters */
    altFlightsDepartureAirport: SitecoreDictionary.AlternativeFlightsFiltersTypesDepartureAirport,
    altFlightsOutboundDepartureTime: SitecoreDictionary.AlternativeFlightsFiltersTypesOutboundDepartureTime,
    altFlightsInboundDepartureTime: SitecoreDictionary.AlternativeFlightsFiltersTypesInboundDepartureTime,
};
