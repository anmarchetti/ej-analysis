using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IFacilityMatrixService
    {
        List<FacilityMatrixConfiguration> GetFacilityMatrix();

        void EnrichHotelFacilityMatrix(List<Hotel> hotels);

        void EnrichHotelFiltersFacilityMatrix(List<HotelFilters> filters);
    }
}
