using Amazon.DynamoDBv2.DataModel;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.BoardUpgrades;

/// <summary>
/// Represents accommodation details with available board upgrades.
/// </summary>
public class AccommodationBoardUpgrade
{
    /// <summary>
    /// Unique code identifying the accommodation.
    /// </summary>
    [DynamoDBHashKey]
    public string AccommodationCode { get; set; }

    /// <summary>
    /// Name of the accommodation.
    /// </summary>
    [DynamoDBProperty]
    public string AccommodationName { get; set; }

    /// <summary>
    /// List of available board upgrades for the accommodation.
    /// </summary>
    [DynamoDBProperty]
    public List<BoardUpgrade> AvailableBoardUpgrades { get; init; }
}

/// <summary>
/// Information about board upgrades.
/// </summary>
[Serializable]
[DataContract]
public class BoardUpgrade
{
    /// <summary>
    /// Starting board type for the upgrade.
    /// </summary>
    [DynamoDBProperty]
    [DataMember]
    public string BoardFrom { get; set; }

    /// <summary>
    /// Ending board type for the upgrade.
    /// </summary>
    [DynamoDBProperty]
    [DataMember]
    public string BoardTo { get; set; }

    /// <summary>
    /// The date when travel starts.
    /// </summary>
    [DynamoDBProperty]
    [DataMember]
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// The date when travel ends.
    /// </summary>
    [DynamoDBProperty]
    [DataMember]
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// The date from which booking is allowed.
    /// </summary>
    [DynamoDBProperty]
    [DataMember]
    public DateTime? BookFromDate { get; set; }

    /// <summary>
    /// The date until which booking is allowed.
    /// </summary>
    [DynamoDBProperty]
    [DataMember]
    public DateTime? BookToDate { get; set; }

    /// <summary>
    /// Discount percentage for the upgrade.
    /// </summary>
    [DynamoDBProperty]
    [DataMember]
    public decimal? DiscountPercent { get; set; }
}
