namespace easyJet.Holidays.Api.Domain.Data.Promotion;

/// <summary>
/// Promotion Code tier POCO.
/// </summary>
public class PromotionCodeTier
{
    /// <summary>
    /// Gets or sets Minimum Spend.
    /// </summary>
    public decimal MinimumSpend { get; set; }
    
    /// <summary>
    /// Gets or sets Minimum Spend Per Person.
    /// </summary>
    public decimal MinimumSpendPerPerson { get; set; }
    
    /// <summary>
    /// Gets or sets Percentage discount if available.
    /// </summary>
    public decimal PercentageDiscountPerBooking { get; set; }
    
    /// <summary>
    /// Gets or sets flat discount if available.
    /// </summary>
    public decimal DiscountAmountPerBooking { get; set; }
    
    /// <summary>
    /// Gets or sets flat discount per person if available.
    /// </summary>
    public decimal DiscountAmountPerPerson { get; set; }
    
    /// <summary>
    /// Gets or sets percentage discount per person if available.
    /// </summary>
    public decimal DiscountPercentagePerPerson { get; set; }
    
    /// <summary>
    /// Gets or sets child flat discount per person if available.
    /// </summary>
    public decimal ChildDiscountAmountPerPerson { get; set; }
    
    /// <summary>
    /// Gets or sets child percentage discount per person if available.
    /// </summary>
    public decimal ChildDiscountPercentagePerPerson { get; set; }
}