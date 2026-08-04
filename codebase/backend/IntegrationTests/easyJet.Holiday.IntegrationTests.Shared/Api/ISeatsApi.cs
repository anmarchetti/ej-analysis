using easyJet.Holidays.Api.Domain.Data.Seats;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api;

public interface ISeatsApi
{
    [Get("/seats")]
    Task<ApiResponse<GetSeatsMapResponse>> Seats(
        GetSeatsMapRequest getSeatsMapRequest,
        [Header("Cookie")] string cookie = null);
}