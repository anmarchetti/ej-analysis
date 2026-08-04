using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api;

public interface ICustomerApi
{
    HttpClient Client { get; }

    [Post("/account")]
    Task<ApiResponse<CustomerInfo>> CreateCustomer(CreateCustomerRequest createCustomerRequest);

    [Get("/account/customer-details")]
    Task<ApiResponse<CustomerInfo>> CustomerDetails();
    
    [Get("/account/customer-details")]
    Task<ApiResponse<CustomerInfo>> CustomerDetails([Header("Cookie")] string cookie);

    [Post("/account/login")]
    Task<ApiResponse<CustomerInfo>> Login(CustomerCredentials customerCredentials);
}