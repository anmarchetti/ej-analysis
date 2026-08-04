using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.TestApi
{
    public interface ICustomerTestApi
    {
        [Post("/customer/create-random-customer")]
        Task<ApiResponse<Customer>> CreateRandomCustomer();
    }
}
