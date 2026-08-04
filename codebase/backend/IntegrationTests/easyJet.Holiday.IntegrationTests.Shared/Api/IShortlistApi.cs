using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList;
using easyJet.Holidays.Api.Domain.Data.ShortList;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api
{
    public interface IShortlistApi
    {
        [Post("/shortlist")]
        Task<ApiResponse<ShortListStatus>> Create(ShortListOfferRequest request, [Header("Cookie")] string cookie);

        [Get("/shortlist/summary")]
        Task<ApiResponse<ShortListOffersResponse>> Summary(ShortListType? shortListType, bool omitUnavailable, [Header("Cookie")] string cookie);
    }
}
