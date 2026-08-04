using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.External.Atcom.Models.Extensions
{
    public class SearchOffersResponseExtended
    {
        /// <summary>
        /// Web recognizable response
        /// </summary>
        public SearchOffersResponse SearchOffersResponse { get; set; }

        /// <summary>
        /// Original atcom result set extended
        /// </summary>
        public List<AvCacheResultOffersOfferExtended> AvCacheResultOffers { get; set; }
    }
}
