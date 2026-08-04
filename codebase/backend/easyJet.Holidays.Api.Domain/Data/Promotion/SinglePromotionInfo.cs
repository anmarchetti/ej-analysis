using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Promotion
{
    /// <summary>
    /// Single promotion information
    /// </summary>
    [Serializable]
    [DataContract]
    public class SinglePromotionInfo
    {
        [DataMember]
        public string Title { get; set; }

        [DataMember]
        public string CardDescription { get; set; }

        [DataMember]
        public string Icon { get; set; }

        [DataMember]
        public string BannerTitle { get; set; }

        /// <summary>
        /// Get or sets minimum spend text format with tokens.
        /// </summary>
        [DataMember]
        public string MinimumSpendText { get; set; }
        
        /// <summary>
        /// Get or sets minimum spend value for first tier of promotion.
        /// </summary>
        [DataMember]
        public decimal MinimumSpendValue { get; set; }

        [DataMember]
        public string PromoCode { get; set; }

        [DataMember]
        public string Date { get; set; }

        [DataMember]
        public string TandCs { get; set; }
        
        /// <summary>
        /// Gets or sets Display on Extras Page flag for auto apply promo code input
        /// </summary>
        [DataMember]
        public bool DisplayOnExtrasPage { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the taxes note is shown
        /// </summary>
        [DataMember]
        public bool ShowTaxesNote { get; set; }

        /// <summary>
        /// Gets or sets Discount Amount Per Booking.
        /// </summary>
        [DataMember]
        public decimal DiscountAmountPerBooking { get; set; }

        /// <summary>
        /// Gets or sets PercentageDiscountPerBooking.
        /// </summary>
        [DataMember]
        public decimal PercentageDiscountPerBooking { get; set; }
        
        /// <summary>
        /// Gets or sets flat discount per person if available.
        /// </summary>
        [DataMember]
        public decimal DiscountAmountPerPerson { get; set; }
    
        /// <summary>
        /// Gets or sets percentage discount per person if available.
        /// </summary>
        [DataMember]
        public decimal DiscountPercentagePerPerson { get; set; }
    
        /// <summary>
        /// Gets or sets flat discount per person if available.
        /// </summary>
        [DataMember]
        public decimal ChildDiscountAmountPerPerson { get; set; }
    
        /// <summary>
        /// Gets or sets percentage discount per person if available.
        /// </summary>
        [DataMember]
        public decimal ChildDiscountPercentagePerPerson { get; set; }
        
        /// <summary>
        /// Gets or sets Promo Code tiers.
        /// </summary>
        [DataMember]
        public IEnumerable<PromotionCodeTier> PromotionCodeTiers { get; set; }
    }
}
