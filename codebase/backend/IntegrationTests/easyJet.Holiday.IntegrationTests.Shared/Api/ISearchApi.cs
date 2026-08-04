using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api;

public interface ISearchApi
{
    [Get("/search/packages")]
    Task<ApiResponse<GetPackagesResponse>> GetPackages(GetPackagesRequest packagesSearchRequest, [Header("Cookie")] string cookie = null);

    [Headers("X-Ej-Sc-Site: TradePortal")]
    [Get("/search/packages")]
    Task<ApiResponse<GetPackagesResponse>> GetTradePortalPackages(GetPackagesRequest packagesSearchRequest,
        [Authorize] string? token);

    [Get("/search/offers-alterations")]
    Task<ApiResponse<RoomVariantsSearchResponse>> OffersAlterations(RoomVariantsSearchRequest roomVariantsSearchRequest);

    [Post("/search/flight-extras")]
    Task<ApiResponse<IEnumerable<FlightExtraCategoryList>>> FlightExtras(FlightExtraSearchRequest flightExtraSearchRequest, [Header("Cookie")] string cookie = null);

    [Get("/search/alternative-flights")]
    Task<ApiResponse<AlternativeFlightsResponse>> GetAlternativeFlights(AlternativeFlightsSearchRequest request);
}