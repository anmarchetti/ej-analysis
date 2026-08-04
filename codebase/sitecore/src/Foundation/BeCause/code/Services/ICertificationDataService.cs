using System.Collections.Generic;

namespace easyJet.Foundation.BeCause.Services
{
    public interface ICertificationDataService
    {
        (bool isFaulted, string errorMessage, HashSet<string> codes) GetCertifiedHotelIds();
    }
}