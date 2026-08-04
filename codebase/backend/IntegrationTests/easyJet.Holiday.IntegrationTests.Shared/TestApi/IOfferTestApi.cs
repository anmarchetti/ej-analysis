using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.TestApi
{
    public interface IOfferTestApi
    {
        [Post("/offer/random-offer")]
        Task<ApiResponse<IEnumerable<Offer>>> ProvideRandomOffers(SearchOffersRequest request);

    }
}
