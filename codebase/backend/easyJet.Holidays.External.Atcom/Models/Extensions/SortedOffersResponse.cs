using easyJet.Holidays.Api.Domain.Data.SmartSeer;

namespace easyJet.Holidays.External.Atcom.Models.Extensions
{
    public class SortedOffersResponse
    {
        public IEnumerable<AvCacheResultOffersOfferExtended> Offers { get; set; }
        public SmartSeerTrackingInfo Tracking { get; set; }
        public string[] SponsoredHotels { get; set; }
    }
}
