using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.PackageOffers
{
    public interface IOfferService
    {
        Task<IEnumerable<Offer>> ProvideOffer(SearchOffersRequest request);
    }
}
