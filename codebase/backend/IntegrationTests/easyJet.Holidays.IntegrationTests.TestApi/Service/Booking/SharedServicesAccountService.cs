using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Models.SharedServices;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking
{
    public class SharedServicesAccountService(
        ISharedServicesAccountApi sharedServicesAccountApi,
        IOptions<SharedServicesSettings> sharedServicesSettings)
        : ISharedServicesAccountService
    {
        private readonly SharedServicesSettings _sharedServicesSettings = sharedServicesSettings?.Value ??
                                                                          throw new ArgumentNullException(
                                                                              nameof(sharedServicesSettings));

        public async Task<CustomerIdentifiers> CustomerIdentifiers(string loginCookie)
        {
            var response = await sharedServicesAccountApi.CustomerIdentifiers(loginCookie, _sharedServicesSettings.Key);
            return response.Content!;
        }
    }
}