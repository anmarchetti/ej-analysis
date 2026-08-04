namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    /// <summary>
    /// Promotion model.
    /// </summary>
    public class PromotionCmsModel
    {
        /// <summary>
        /// Gets or sets Sitecore Id of Promotion Item.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets title.
        /// </summary>
        public string Title { get; set; }

        public string CardDescription { get; set; }

        public string Icon { get; set; }

        public string BannerTitle { get; set; }

        /// <summary>
        /// Gets or sets Minimum spend.
        /// </summary>
        public string MinimumSpend { get; set; }

        public string PromoCode { get; set; }

        public string Date { get; set; }

        public string TandCs { get; set; }
        
        /// <summary>
        /// Gets or sets Display on Extras Page flag for auto apply promo code input
        /// </summary>
        public bool DisplayOnExtrasPage { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the taxes note is shown
        /// </summary>
        public bool ShowTaxesNote { get; set; }

        /// <summary>
        /// Gets or sets Promotion Code for Promotion.
        /// </summary>
        public IEnumerable<PromotionCodeCmsModel> PromotionCodes { get; set; }

        /// <summary>
        /// Gets or sets validation rules for booking.
        /// </summary>
        public ValidationRules ValidationRules { get; set; }
    }
}