using Allure.Xunit.Attributes;
using Allure.Xunit;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;

using FluentAssertions;
using FluentAssertions.Execution;
using Refit;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.Account;

[AllureSuite("Account tests")]
public class AccountTests : BaseTest
{
    public AccountTests(IHttpClientFactory _httpClientFactory, TestApiHttpClient testApiHttpClient, ITestOutputHelper testOutputHelper)
        : base(_httpClientFactory, testApiHttpClient, testOutputHelper)
    {
    }

    [Fact(DisplayName = "Create account")]
    public async Task CreateUserTest()
    {
        var customerCreateRequest = new CreateCustomerRequest
        {
            Customer = customerFaker.Generate(),
            Password = "!Qwerty_123",
            RememberMe = true
        };

        var loggedCustomer =
            await RepeatDecorator<ApiResponse<CustomerInfo>>
            .Create()
            .RepeatTimes(3)
            .Execute(async () =>
            {
                var customer = await CreateAccountStep(customerCreateRequest);

                var creds = new CustomerCredentials
                {
                    Email = customerCreateRequest.Customer.Email!,
                    Password = customerCreateRequest.Password,
                    RememberMe = true
                };

                var loginCookie = await LoginAsAdminUserStep(creds);

                var loggedCustomer = await customerApi.CustomerDetails(loginCookie);

                Attachments.Text("Test-level attachment", "Attachment content");
                return loggedCustomer;
            });
        using (new AssertionScope())
        {
            loggedCustomer.Content.Address1.Should().Be(customerCreateRequest.Customer.Address1);
            loggedCustomer.Content.City.Should().Be(customerCreateRequest.Customer.City);
            loggedCustomer.Content.Email.Should().Be(customerCreateRequest.Customer.Email);
            loggedCustomer.Content.CountryCode.Should().Be(customerCreateRequest.Customer.CountryCode);
            loggedCustomer.Content.FirstName.Should().Be(customerCreateRequest.Customer.FirstName);
            loggedCustomer.Content.LastName.Should().Be(customerCreateRequest.Customer.LastName);
            loggedCustomer.Content.MobilePhone.Should().Be(customerCreateRequest.Customer.MobilePhone);
            loggedCustomer.Content.PostalCode.Should().Be(customerCreateRequest.Customer.PostalCode);
            loggedCustomer.Content.Title.Should().Be(customerCreateRequest.Customer.Title);
        }
    }
}