namespace easyJet.Holidays.External.Cms.Models.Promotion;

/// <summary>
/// Promotion Code Cms Model.
/// </summary>
public class PromotionCodeCmsModel
{
    /// <summary>
    /// Gets or sets Item Id.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Gets or sets Promotion Atcom Code.
    /// </summary>
    public string AtcomPromoCode { get; set; }

    /// <summary>
    /// Gets or sets Minimum Spend.
    /// </summary>
    public decimal MinimumSpend { get; set; }

    /// <summary>
    /// Gets or sets Minimum Spend Per Person
    /// </summary>
    public decimal MinimumSpendPerPerson { get; set; }
    
    /// <summary>
    /// Gets or sets Discount Amount Per Booking.
    /// </summary>
    public decimal DiscountAmountPerBooking { get; set; }

    /// <summary>
    /// Gets or sets PercentageDiscountPerBooking.
    /// </summary>
    public decimal PercentageDiscountPerBooking { get; set; }

    /// <summary>
    /// Gets or sets AdultDiscountAmountPerPerson.
    /// </summary>
    public decimal AdultDiscountAmountPerPerson { get; set; }

    /// <summary>
    /// Gets or sets AdultPercentageAmountPerPerson.
    /// </summary>
    public decimal AdultPercentageAmountPerPerson { get; set; }

    /// <summary>
    /// Gets or sets ChildDiscountAmountPerPerson.
    /// </summary>
    public decimal ChildDiscountAmountPerPerson { get; set; }

    /// <summary>
    /// Gets or sets ChildPercentageAmountPerPerson.
    /// </summary>
    public decimal ChildPercentageAmountPerPerson { get; set; }
    
    /// <summary>
    /// Gets or sets a value indicating whether this promo tier should be hidden on promotion banner.
    /// </summary>
    public bool HideOnPromoBanner { get; set; }
    
    /// <summary>
    /// Gets or sets validation rules for booking pricing and discount.
    /// </summary>
    public PromotionCodeValidationRules ValidationRules { get; set; }
}