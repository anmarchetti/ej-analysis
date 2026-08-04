namespace easyJet.Holiday.IntegrationTests.Shared.Constants;

public static class OfferConstants
{
    public static Dictionary<string, IEnumerable<string>> DepartureAirportList => new()
    {
        { "UK", new[] { "LGW" } },
        { "CH", new[] { "ZRH" } },
        { "DE", new[] { "BER" } },
        { "FR", new[] { "CDG" } },
    };

    public static IEnumerable<string> RandomGeographyList => new[]
    {
        "ES", "PT"
    };

    public static IEnumerable<string> CityHolidayGeographyList => new[]
    {
        "NL","FR","CZ","NLAM","NLRO","FRBO","FRCO","FRFR","FRLY","FRMA","FRMO","FRNA","FRNI","FRPA","FRTO","CZPR"
    };

    public const string AllDestinations = "ALL";

    public static class RegionConstants
    {
        public static class DepartureAirports
        {
            public const string LondonGatwick = "LGW";
            public static IEnumerable<string> AllLondon = new[] { LondonGatwick, "LTN", "SEN", "STN" };
            public static string AllLondonAsString = string.Join(',', AllLondon);
        }
    }
}