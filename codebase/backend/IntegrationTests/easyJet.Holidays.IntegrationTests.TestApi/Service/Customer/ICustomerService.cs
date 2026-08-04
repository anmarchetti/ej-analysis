using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Customers
{
    public interface ICustomerService
    {
        Task<Customer> CreateOrGetCustomer(CustomerCredentials? customerCredentials = null);
    }
}
