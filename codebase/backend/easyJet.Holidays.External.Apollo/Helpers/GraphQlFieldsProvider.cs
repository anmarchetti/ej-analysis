namespace easyJet.Holidays.External.Apollo.Helpers;

/// <summary>
/// Provides Set of GraphQL fields for Apollo API
/// </summary>
public static class GraphQlFieldsProvider
{
    /// <summary>
    /// Get upcoming booking fields set
    /// </summary>
    /// <returns>list of fields for upcoming booking component</returns>
    public const string GetUpcomingBookingFieldsSet = """
                                                        reference
                                                        destinations {
                                                          location {
                                                            countryName
                                                            regionName
                                                            resortCode
                                                            resortName
                                                          }
                                                          hotel {
                                                            hotelCode
                                                            hotelName
                                                            hotelLocation
                                                          }
                                                        }
                                                        holiday {
                                                          holidayStartDateLocal
                                                          holidayEndDateLocal
                                                          holidayNightsCount
                                                        }
                                                        outbound {
                                                          flightDepartureDatetimeLocal
                                                          flightDepartureDatetimeUtc
                                                        }
                                                        """;
}