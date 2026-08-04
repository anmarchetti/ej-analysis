using easyJet.Holidays.Api.Domain.Data.Settings;

namespace easyJet.Holidays.Api.Domain.Data
{
    /// <summary>
    /// Model with Price and PricePP fields
    /// </summary>
    public interface IPriceModel
    {
        /// <summary>
        /// Total price
        /// </summary>
        decimal Price { get; set; }

        /// <summary>
        /// Price per person
        /// </summary>
        decimal PricePP { get; set; }

        /// <summary>
        /// Currency
        /// </summary>
        Currency Currency { get; set; }
    }

    /// <summary>
    /// Model with TotalPrice and PricePP
    /// </summary>
    public interface IPriceTotalModel
    {
        /// <summary>
        /// Total price
        /// </summary>
        decimal TotalPrice { get; set; }

        /// <summary>
        /// Price per person
        /// </summary>
        decimal PricePP { get; set; }
    }
}
