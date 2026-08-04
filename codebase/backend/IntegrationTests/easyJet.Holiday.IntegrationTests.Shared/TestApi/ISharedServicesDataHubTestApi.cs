using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.TestApi
{
    public interface ISharedServicesDataHubTestApi
    {
        [Post("/DataHubSharedServices/synchronize-seats")]
        Task<ApiResponse<DatahubSyncResponse>> SynchronizeSeats(DatahubSyncRequest request);

        [Post("/DataHubSharedServices/synchronize-flights")]
        Task<ApiResponse<DatahubSyncResponse>> SynchronizeFlights(DatahubSyncRequest request);
    }
}
