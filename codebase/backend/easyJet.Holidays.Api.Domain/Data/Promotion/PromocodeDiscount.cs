namespace easyJet.Holidays.Api.Domain.Data.Promotion
{
    public class PromocodeDiscount
    {
        /// <summary>
        /// Gets or sets promocode discounts, key is a offer id.
        /// </summary>
        public Dictionary<string, PromocodeDiscounts> PromocodeDiscounts { get; set; }
    }
}
