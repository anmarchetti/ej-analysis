namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;

/// <summary>
/// Amendment fees item
/// </summary>
public class FeeItem
{
    /// <summary>
    /// Gets or sets the amount of fees item.
    /// </summary>
    /// <value>
    /// The amount.
    /// </value>
    public decimal Amount { get; set; }

    /// <summary>
    /// Gets or sets the fees code.
    /// </summary>
    /// <value>
    /// The code.
    /// </value>
    public string Code { get; set; }

    /// <summary>
    /// Gets or sets the name.
    /// </summary>
    /// <value>
    /// The name.
    /// </value>
    public string Name { get; set; }

    /// <summary>
    /// Gets or sets the type.
    /// </summary>
    /// <value>
    /// The type.
    /// </value>
    public string Type { get; set; }

    /// <summary>
    /// Gets or sets the pax identifier.
    /// </summary>
    /// <value>
    /// The pax identifier.
    /// </value>
    public int PaxId { get; set; }

    /// <summary>
    /// Gets or sets the fees payment date.
    /// </summary>
    /// <value>
    /// The date.
    /// </value>
    public DateTime Date { get; set; }

    /// <summary>
    /// Gets or sets the fees count.
    /// </summary>
    /// <value>
    /// The count.
    /// </value>
    public int Count { get; set; }

    /// <summary>
    /// Gets or sets the currency.
    /// </summary>
    /// <value>
    /// The currency.
    /// </value>
    public string Currency { get; set; }
}