using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api
{
    public interface ISharedServicesDataHubApi
    {

        [Post("/shared-services/datahub/synchronize-seats")]
        Task<ApiResponse<DatahubSyncResponse>> SynchronizeSeats(
            DatahubSyncRequest request,
            [Header("Authorization")] string cookie);

        [Post("/shared-services/datahub/synchronize-flights")]
        Task<ApiResponse<DatahubSyncResponse>> SynchronizeFlights(
            DatahubSyncRequest request,
            [Header("Authorization")] string cookie);
    }
}
