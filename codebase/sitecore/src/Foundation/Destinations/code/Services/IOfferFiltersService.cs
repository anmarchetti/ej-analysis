using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IOfferFiltersService
    {
        OfferFilters GetOfferFilters();

        /// <summary>
        /// Gets Offer Filters Reordering Configuration.
        /// </summary>
        /// <returns>Configuration for reordering.</returns>
        OfferFiltersReorderingConfiguration GetOfferFiltersReorderingConfiguration();
    }
}