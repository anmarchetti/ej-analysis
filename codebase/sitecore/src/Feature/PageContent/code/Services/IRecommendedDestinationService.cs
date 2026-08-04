using System.Collections.Generic;
using easyJet.Feature.PageContent.Models;

namespace easyJet.Feature.PageContent.Services
{
    public interface IRecommendedDestinationService
    {
        /// <summary>
        /// Get all recommended destinations.
        /// </summary>
        /// <returns>
        /// Collection of recommended destinations.
        /// Where key - destination code, Value - destination object.
        /// </returns>
        Dictionary<string, RecommendedDestination> GetAll();
    }
}