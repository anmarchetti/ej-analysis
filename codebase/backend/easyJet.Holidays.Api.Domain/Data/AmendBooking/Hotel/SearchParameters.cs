using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;

/// <summary>
/// Parameter for filtering, sorting and pagination.
/// </summary>
[Serializable]
[DataContract]
public class SearchParameters
{
    /// <summary>
    /// Page number
    /// </summary>
    [DataMember(Name = "page")]
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    /// <summary>
    /// Page size
    /// </summary>
    [DataMember(Name = "pageSize")]
    [Range(10, 100)]
    public int PageSize { get; set; } = 10;

    /// <summary>
    /// Facilities ids list. e.g. "51-10,52-15"
    /// </summary>
    [DataMember(Name = "facilities")]
    public string Facilities { get; set; }

    /// <summary>
    /// Hotel star rating
    /// </summary>
    [DataMember(Name = "starRating")]
    public string StarRating { get; set; }

    /// <summary>
    /// Trip advisor rating
    /// </summary>
    [DataMember(Name = "TripAdvisorRating")]
    public int TripAdvisorRating { get; set; }

    /// <summary>
    /// Board type list. e.g. "HB,BB,HB+"
    /// </summary>
    [DataMember(Name = "boardType")]
    public string BoardType { get; set; }

    /// <summary>
    /// Package themes list. e.g. "BO,CL"
    /// </summary>
    [DataMember(Name = "packageTheme")]
    public string PackageTheme { get; set; }

    /// <summary>
    /// Minimum price value.
    /// </summary>
    [DataMember(Name = "priceFrom")]
    public decimal? PriceFrom { get; set; }

    /// <summary>
    /// Maximum price value.
    /// </summary>
    [DataMember(Name = "priceTo")]
    public decimal? PriceTo { get; set; }

    /// <summary>
    /// Sort parameter.
    /// </summary>
    [DataMember(Name = "sortingBy")]
    public SortParameter SortingBy { get; set; }
}