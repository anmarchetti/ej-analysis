using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Offer;

public class GetOffersResponse
{
    public OfferHotel Hotel { get; set; }
    public List<Holidays.Api.Domain.Data.PackageOffers.Offer> Offers { get; set; }
}