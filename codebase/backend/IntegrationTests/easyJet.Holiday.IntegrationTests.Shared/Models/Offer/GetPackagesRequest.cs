using Refit;
using System.Collections.ObjectModel;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Offer;

public class GetPackagesRequest
{
    [AliasAs("startDate")]
    public string StartDate { get; set; }

    [AliasAs("duration")]
    public int Duration { get; set; }

    [AliasAs("flexibleDays")]
    public int FlexibleDays { get; set; }

    [AliasAs("departure")]
    public string Departure { get; set; }

    [AliasAs("geography")]
    public string Geography { get; set; }

    [AliasAs("originalGeography")] 
    public string? OriginalGeography { get; set; }

    [AliasAs("Destinations")]
    [Query(CollectionFormat.Multi)]
    public Collection<string> Destinations { get; set; } = [];
    
    [AliasAs("searchType")]
    public string SearchType { get; set; }

    [AliasAs("room[0].adults")]
    public int Adults { get; set; }

    [AliasAs("room[0].children")]
    public int Children { get; set; }

    [AliasAs("room[0].infants")]
    public int Infants { get; set; }

    [AliasAs("placementId")]
    public string PlacementId { get; set; }

    [AliasAs("take")]
    public int Take { get; set; }

    [AliasAs("page")]
    public int Page { get; set; }

    [AliasAs("orderBy")]
    public string OrderBy { get; set; }

    [AliasAs("initialThemes")]
    public string InitialThemes { get; set; }

    [AliasAs("themes")]
    public string Themes { get; set; }

    [AliasAs("isPromo")]
    public bool IsPromo { get; set; }

    [AliasAs("promoPageId")]
    public string PromoPageId { get; set; }

    [AliasAs("priceFrom")]
    public int PriceFrom { get; set; }

    [AliasAs("priceTo")]
    public int PriceTo { get; set; }

    [AliasAs("automaticAllocation")]
    public bool AutomaticAllocation { get; set; }
    
    [AliasAs("promc")]
    public string? PromCollection { get; set; }
}