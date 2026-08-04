using easyJet.Holidays.Api.Domain.Data.Authentication;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking
{
    public interface ISharedServicesAccountService
    {
        Task<CustomerIdentifiers> CustomerIdentifiers(string loginCookie);
    }
}