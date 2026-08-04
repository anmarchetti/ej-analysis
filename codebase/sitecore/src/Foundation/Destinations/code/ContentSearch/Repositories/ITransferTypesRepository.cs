using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface ITransferTypesRepository
    {
        /// <summary>
        /// Get all Transfer Types from Sitecore.
        /// </summary>
        /// <returns>Collection of <see cref="TransferType"/>.</returns>
        IEnumerable<TransferType> GetAll();
    }
}