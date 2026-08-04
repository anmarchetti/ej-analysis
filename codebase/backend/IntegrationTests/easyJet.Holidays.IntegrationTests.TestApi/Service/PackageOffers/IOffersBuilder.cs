using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.PackageOffers
{
    public interface IOffersBuilder
    {
        IOffersBuilder ApplyCreationParameters(OfferSearchParams? creationParams);
        Task<IEnumerable<Offer>> Build();
    }
}
