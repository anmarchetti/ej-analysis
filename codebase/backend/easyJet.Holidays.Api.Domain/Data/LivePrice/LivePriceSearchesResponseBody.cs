namespace easyJet.Holidays.Api.Domain.Data.LivePrice;

/// <summary>
/// Response model for live price searches from sitecore's api/LivePrice/Get endpoint
/// </summary>
public class LivePriceSearchesResponseBody
{
    public List<LivePriceSearch> NamedSearches { get; set; }
}

public class LivePriceSearch
{
    public string Name { get; set; }

    public int NumberOfAdults { get; set; }

    public int NumberOfChildren { get; set; }

    public int NumberOfInfants { get; set; }

    public int DefaultDuration { get; set; }

    public IEnumerable<string> ChildAges { get; set; }

    public IEnumerable<string> ThemeTypesCodes { get; set; }

    public IEnumerable<DestinationSearch> Periods { get; set; }
}

public class DestinationSearch
{
    public IEnumerable<string> DestinationCodes { get; set; }

    public Period DateOfRun { get; set; }

    public Period SearchDateRange { get; set; }
}

public class Period
{
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
}
