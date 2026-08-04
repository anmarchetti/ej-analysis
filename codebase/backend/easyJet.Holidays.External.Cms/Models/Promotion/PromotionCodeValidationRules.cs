using easyJet.Holidays.Api.Domain.Data.Common;

namespace easyJet.Holidays.External.Cms.Models.Promotion;

/// <summary>
/// Promo Code Validation Rules.
/// </summary>
public class PromotionCodeValidationRules
{
    /// <summary>
    /// Gets or sets validation rule for promotion date range of validity.
    /// </summary>
    public ValidationRule<DateTimeRange> DateRangeOfValidity { get; set; }
    
    /// <summary>
    /// Gets or sets validation rule for booking's total price.
    /// </summary>
    public ValidationRule<decimal?> TotalPrice { get; set; }

    /// <summary>
    /// Gets or sets validation rule for booking's per person price.
    /// </summary>
    public ValidationRule<decimal?> PerPersonPrice { get; set; }
}