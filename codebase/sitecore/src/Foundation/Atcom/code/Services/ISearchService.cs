using System.Collections.Generic;
using easyJet.Foundation.Atcom.Models.Domain;

namespace easyJet.Foundation.Atcom.Services
{
    public interface ISearchService
    {
        /// <summary>
        /// Get data from atcom av cache search service.
        /// </summary>
        /// <returns>Collection groupped by accomodation code.</returns>
        Dictionary<string, AtcomAccommodation> GetDataCollection();
    }
}
