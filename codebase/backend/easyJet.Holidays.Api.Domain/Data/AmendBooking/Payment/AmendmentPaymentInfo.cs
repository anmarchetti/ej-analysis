namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;

/// <summary>
/// Description for amendment payment info.
/// </summary>
[Serializable]
public class AmendmentPaymentInfo
{
    /// <summary>
    /// Gets or sets the amendment charges.
    /// </summary>
    /// <value>
    /// The amendment charges.
    /// </value>
    public decimal AmendmentCharges { get; set; }

    /// <summary>
    /// Gets or sets the amendment charges without fees.
    /// </summary>
    /// <value>
    /// The amendment charges without fees.
    /// </value>
    public decimal AmendmentChargesWithoutFees { get; set; }

    /// <summary>
    /// Gets or sets the package price with fees.
    /// </summary>
    /// <value>
    /// The package price with fees.
    /// </value>
    public decimal PackagePriceWithFees { get; set; }

    /// <summary>
    /// Gets or sets the package price without fees.
    /// </summary>
    /// <value>
    /// The package price without fees.
    /// </value>
    public decimal PackagePriceWithoutFees { get; set; }

    /// <summary>
    /// Gets or sets the total fees amount.
    /// </summary>
    /// <value>
    /// The total fees amount.
    /// </value>
    public decimal TotalFeesAmount { get; set; }

    /// <summary>
    /// Gets or sets the fees per persons.
    /// </summary>
    /// <value>
    /// The fees per persons.
    /// </value>
    public IEnumerable<FeesPerPersonItem> FeesPerPersons { get; set; }
}

public class FeesPerPersonItem
{
    /// <summary>
    /// Gets or sets the fees per person amount.
    /// </summary>
    /// <value>
    /// The fees per person amount.
    /// </value>
    public decimal FeesPerPersonAmount { get; set; }

    /// <summary>
    /// Gets or sets the fees count.
    /// </summary>
    /// <value>
    /// The fees count.
    /// </value>
    public int FeesCount { get; set; }
}