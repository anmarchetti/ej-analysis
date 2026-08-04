using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api;

public interface IOffersApi
{
    [Get("/hotel/offers")]
    Task<ApiResponse<GetOffersResponse>> GetOffers(GetOffersRequest offersRequest);

    [Get("/search/offers-alterations")]
    Task<ApiResponse<GetRoomVariantsResponse>> GetOffersAlterations(GetOffersRequest offersRequest);
}