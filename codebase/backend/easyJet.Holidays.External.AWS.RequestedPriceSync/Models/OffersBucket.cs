using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Models
{
    public class OffersBucket
    {
        public DateRange Range { get; set; }
        public List<AvCacheResultOffersOfferExtended> Offers { get; set; }
        public IEnumerable<DestinationItem> Destinations { get; set; }
        public IEnumerable<DestinationItem> VirtualDestinations { get; set; }
    }
}
