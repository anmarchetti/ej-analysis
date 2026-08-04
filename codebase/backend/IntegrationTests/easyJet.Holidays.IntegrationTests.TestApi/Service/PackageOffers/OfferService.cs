using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.PackageOffers
{
    public class OfferService(IOffersBuilder offerBuilder) : IOfferService
    {
        public async Task<IEnumerable<Offer>> ProvideOffer(SearchOffersRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);

            return await offerBuilder
                .ApplyCreationParameters(request.OfferParameters)
                .Build();
        }
    }
}
