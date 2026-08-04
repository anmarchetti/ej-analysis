namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    public abstract class BasePromoCodesRequest
    {
        /// <summary>
        /// Gets or sets MarketCode. Optional: If not passed marketCode will be calculated from current language.
        /// </summary>
        public string MarketCode { get; set; }
    }
}
