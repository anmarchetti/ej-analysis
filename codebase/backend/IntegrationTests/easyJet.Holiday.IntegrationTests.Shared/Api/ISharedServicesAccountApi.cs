using easyJet.Holidays.Api.Domain.Data.Authentication;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api
{
    public interface ISharedServicesAccountApi
    {
        [Get("/shared-services/account/customer-identifiers")]
        Task<ApiResponse<CustomerIdentifiers>> CustomerIdentifiers(
            [Header("Cookie")] string cookie, [Header("Authorization")] string authorization);
    }
}