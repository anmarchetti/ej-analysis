using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IFiltredFacilitiesService
    {
        List<FacilityExtended> GetFiltredFacilities();
    }
}
