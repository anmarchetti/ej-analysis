using System.Collections.Generic;
using easyJet.Foundation.Atcom.Models.Domain;
using easyJet.Foundation.Atcom.Models.External;

namespace easyJet.Foundation.Atcom.Services
{
    public interface IVrpWebService
    {
        /// <summary>
        /// Get data collection from atcom response.
        /// </summary>
        /// <returns>Collection of accommodation header data entries.</returns>
        Dictionary<string, AccommodationHeaderDataEntry> GetDataCollection();

        /// <summary>
        /// Get special requests from atcom response.
        /// </summary>
        /// <returns>Collection of special request type.</returns>
        List<SpecialRequestType> GetSpecialRequests();
    }
}