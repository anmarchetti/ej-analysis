using PackageOffer = easyJet.Holidays.Api.Domain.Data.PackageOffers.Offer;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Offer
{
    public class CreateOfferResponse
    {
        public PackageOffer? Offer { get; set; }
    }
}
