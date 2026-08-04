using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Models;

/// <summary>
/// Represents the response for Board Upgrade API.
/// </summary>
internal class BoardUpgradeResponse : JsonApiResponse<BoardUpgradeModel[]>
{
    /// <summary>
    /// Gets the API errors. This implementation does not handle response body errors.
    /// </summary>
    public override ApiError[] ApiErrors => [];
}

/// <summary>
/// Represents a board upgrade.
/// </summary>
public class BoardUpgradeModel
{
    /// <summary>
    /// Gets or sets the accommodation code.
    /// </summary>
    public string AccommodationCode { get; set; }

    /// <summary>
    /// Gets or sets the accommodation name.
    /// </summary>
    public string AccommodationName { get; set; }

    /// <summary>
    /// Gets or sets the start date for the board upgrade.
    /// </summary>
    public string BoardFrom { get; set; }

    /// <summary>
    /// Gets or sets the end date for the board upgrade.
    /// </summary>
    public string BoardTo { get; set; }

    /// <summary>
    /// Gets or sets the start date for the offer.
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Gets or sets the end date for the offer.
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Gets or sets the last date to book the offer.
    /// </summary>
    public DateTime? BookToDate { get; set; }

    /// <summary>
    /// Gets or sets the first date to book the offer.
    /// </summary>
    public DateTime? BookFromDate { get; set; }

    /// <summary>
    /// Gets or sets the discount percentage for the upgrade.
    /// </summary>
    public decimal? DiscountPercent { get; set; }
}