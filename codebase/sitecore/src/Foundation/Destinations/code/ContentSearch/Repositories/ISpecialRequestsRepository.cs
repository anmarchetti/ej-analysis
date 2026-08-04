using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface ISpecialRequestsRepository
    {
        /// <summary>
        /// Get all Special Requests Types from Sitecore.
        /// </summary>
        /// <returns>Collection of <see cref="SpecialRequestType"/>.</returns>
        SpecialRequests GetAll();
    }
}