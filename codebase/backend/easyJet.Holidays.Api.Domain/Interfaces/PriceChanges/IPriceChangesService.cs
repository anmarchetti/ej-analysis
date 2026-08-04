using easyJet.Holidays.Api.Domain.Data.Settings;

namespace easyJet.Holidays.Api.Domain.Interfaces.PriceChanges
{
    public interface IPriceChangesService
    {
        /// <summary>
        /// Loog price changes into aws dynamoDB table
        /// </summary>
        /// <param name="requestBody">Serrialized request body</param>
        /// <param name="prevPrice">Previous price</param>
        /// <param name="newPrice">New price</param>
        /// <param name="prevPricePP">Previous price per person</param>
        /// <param name="newPricePP">New price per person</param>
        /// <returns></returns>
        Task CreatePriceChangeRecord(string requestBody, MarketSettings market, decimal prevPrice, decimal newPrice, decimal prevPricePP, decimal newPricePP);
    }
}
