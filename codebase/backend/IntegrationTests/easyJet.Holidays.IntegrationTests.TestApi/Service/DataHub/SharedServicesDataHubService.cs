using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.DataHub
{
    public class SharedServicesDataHubService : ISharedServicesDataHubService
    {
        private readonly ISharedServicesDataHubApi _sharedServicesDataHubTestApi;
        private readonly SharedServicesSettings _sharedServicesSettings;

        public SharedServicesDataHubService(
            ISharedServicesDataHubApi sharedServicesDataHubTestApi,
            IOptions<SharedServicesSettings> sharedServicesSettings)
        {
            _sharedServicesDataHubTestApi = sharedServicesDataHubTestApi;
            _sharedServicesSettings = sharedServicesSettings?.Value ?? throw new ArgumentNullException(nameof(sharedServicesSettings));
        }

        public async Task<DatahubSyncResponse> SynchronizeSeats(DatahubSyncRequest request)
        {
            var response = await _sharedServicesDataHubTestApi.SynchronizeSeats(request, _sharedServicesSettings.Key);
            return response?.Content ?? new();
        }

        public async Task<DatahubSyncResponse> SynchronizeFlights(DatahubSyncRequest request)
        {
            var response = await _sharedServicesDataHubTestApi.SynchronizeFlights(request, _sharedServicesSettings.Key);
            return response?.Content ?? new();
        }
    }
}
