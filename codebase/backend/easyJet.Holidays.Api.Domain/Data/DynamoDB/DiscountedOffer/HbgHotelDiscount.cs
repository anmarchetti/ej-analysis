using Amazon.DynamoDBv2.DataModel;
using System.Collections.ObjectModel;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.DiscountedOffer;
/// <summary>
/// Represents a discounted offer returned by the external Eskel discounts API
/// and persisted in the DynamoDB table (partition key: accommodationCode, sort key: discount).
/// </summary>
public class HbgHotelDiscount
{
    /// <summary>
    /// Gets or sets the accommodation code. This is the DynamoDB partition (hash) key.
    /// </summary>
    [DynamoDBHashKey]
    public string AccommodationCode { get; set; } = string.Empty;


    /// <summary>
    /// List of discounts
    /// </summary>
    public List<Discount> Discounts { get; init; } = [];
}

/// <summary>
/// A discount
/// </summary>
public class Discount
{
    /// <summary>
    /// Gets or sets the discount percentage value.
    /// </summary>
    [DynamoDBProperty]
    public int DiscountPercentage { get; set; }

    /// <summary>
    /// Gets or sets the GIATA (hotel) code.
    /// </summary>
    [DynamoDBProperty]
    public long GiataCode { get; set; }

    /// <summary>
    /// Gets or sets the human readable accommodation name.
    /// </summary>
    [DynamoDBProperty]
    public string AccommodationName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the start of the travel window for which the discount applies (UTC).
    /// </summary>
    [DynamoDBProperty]
    public string TravelWindowFrom { get; set; }

    /// <summary>
    /// Gets or sets the end of the travel window for which the discount applies (UTC).
    /// </summary>
    [DynamoDBProperty]
    public string TravelWindowTo { get; set; }

    /// <summary>
    /// Return <see cref="TravelWindowFrom"/> as a <see cref="DateOnly"/> instance.
    /// </summary>
    [DynamoDBIgnore]
    public DateOnly TravelWindowFromDate => DateOnly.Parse(TravelWindowFrom, CultureInfo.InvariantCulture);

    /// <summary>
    /// Return <see cref="TravelWindowTo"/> as a <see cref="DateOnly"/> instance.
    /// </summary>
    [DynamoDBIgnore]
    public DateOnly TravelWindowToDate => DateOnly.Parse(TravelWindowTo, CultureInfo.InvariantCulture);
}