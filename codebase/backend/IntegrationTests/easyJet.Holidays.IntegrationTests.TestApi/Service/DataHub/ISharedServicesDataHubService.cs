using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.DataHub
{
    public interface ISharedServicesDataHubService
    {
        Task<DatahubSyncResponse> SynchronizeSeats(DatahubSyncRequest request);
        Task<DatahubSyncResponse> SynchronizeFlights(DatahubSyncRequest request);
    }
}
