using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Repositories
{
    /// <summary>
    /// Live Price Repository.
    /// </summary>
    public interface ILivePriceRepository
    {
        /// <summary>
        /// Gets market specific settings under 'Named Searches' folder.
        /// </summary>
        /// <param name="marketCode">Code of a market to get LivePrices for.</param>/>
        /// <returns>Collection of 'Named Search' settings.</returns>
        IEnumerable<NamedSearchItem> GetLivePriceSettings(string marketCode);
    }
}