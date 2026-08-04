using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Extensions;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Customer;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Customers;

public class CustomerService : ICustomerService
{
    private readonly ICustomerApi _customerApi;
    private readonly CustomerFaker _customerFaker;

    public CustomerService(
        ICustomerApi customerApi,
        CustomerFaker customerFaker)
    {
        _customerApi = customerApi;
        _customerFaker = customerFaker;
    }

    public async Task<Customer> CreateOrGetCustomer(CustomerCredentials? customerCredentials = null)
    {
        // Create user if we don`t pass creds
        if (customerCredentials is null)
        {
            var customer = _customerFaker.Generate();

            var customerCreateRequest = new CreateCustomerRequest
            {
                Customer = customer,
                Password = "!Qwerty_123",
                RememberMe = true
            };

            var createCustomerResponse = await _customerApi.CreateCustomer(customerCreateRequest);
            var customerInfo = BookingApiService.MapApiResponseToPayloadOrThrowException(createCustomerResponse, $"can not create customer");

            customerCredentials = new CustomerCredentials
            {
                Email = customerInfo.Email!,
                Password = customerCreateRequest.Password,
                RememberMe = customerCreateRequest.RememberMe
            };
        }

        var loggedCustomer = await _customerApi.Login(customerCredentials);
        BookingApiService.MapApiResponseToPayloadOrThrowException(loggedCustomer, $"login failed");

        var loginCookie = loggedCustomer.Headers.GetAuthCookies();
        customerCredentials.LoginCookie = loginCookie;

        var detailsResponse = await _customerApi.CustomerDetails();
        var customerDetails = BookingApiService.MapApiResponseToPayloadOrThrowException(detailsResponse, $"can not get customer details");

        return new Customer
        {
            Credentials = customerCredentials,
            Info = customerDetails
        };
    }
}
