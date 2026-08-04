using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces.Offers
{
    public interface IMetaSearchService
    {
        /// <summary>
        /// Add hotel deeplink to packages response.
        /// </summary>
        /// <param name="packages">Offer packages to update</param>
        /// <param name="request">Initial request</param>
        /// <returns>Search package offers with updated hotel deeplink</returns>
        SearchOffersResponse UpdateHotelLink(SearchOffersResponse packages, PackagesSearchRequest request);

        /// <summary>
        /// Converts package response to meta package rsponse (including generating deep links for hotel and alternative boards)
        /// </summary>
        /// <param name="packages">Package offers to convert</param>
        /// <param name="request">Initial request</param>
        /// <returns>Meta search package offers</returns>
        Task<MetaSearchOffersResponse> ConvertOffers(SearchOffersResponse packages, PackagesSearchRequest request);
    }
}
