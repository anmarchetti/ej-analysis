using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IDestinationsSearchFiltersService
    {
        IEnumerable<HotelFilters> GetFilters(string[] ids);
    }
}
