using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Extensions;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Customer;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.IntegrationTests.TestApi.Models;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Customers;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Credit;

public class CreditService : ICreditService
{
    private readonly ICreditApi _creditApi;
    private readonly ICustomerApi _customerApi;
    private readonly ISharedServicesVouchersService _sharedServicesVouchersService;
    private readonly ISharedServicesAccountService _sharedServicesAccountService;
    private readonly ICustomerService _customerService;

    public CreditService(ICreditApi creditApi, ICustomerApi customerApi, ISharedServicesVouchersService sharedServicesVouchersService, ISharedServicesAccountService sharedServicesAccountService, ICustomerService customerService)
    {
        _creditApi = creditApi;
        _customerApi = customerApi;
        _sharedServicesVouchersService = sharedServicesVouchersService;
        _sharedServicesAccountService = sharedServicesAccountService;
        _customerService = customerService;
    }

    public async Task<IEnumerable<MyCreditInfo>> GetCustomerCreditInfo(CustomerCredentials customerCredentials)
    {
        var cookies = await GetCustomerLoginCookie(customerCredentials);

        var creditResponse = await _creditApi.GetCreditInfoForUser(cookies);
        await creditResponse.EnsureSuccessStatusCodeAsync();

        return creditResponse.Content;
    }

    public async Task<Dictionary<string, IEnumerable<CreditHistoryItem>>> GetCustomerCreditHistory(CustomerCredentials customerCredentials)
    {
        var cookies = await GetCustomerLoginCookie(customerCredentials);

        var creditHistoryResponse = await _creditApi.GetCreditHistoryForUser(cookies);
        await creditHistoryResponse.EnsureSuccessStatusCodeAsync();

        return creditHistoryResponse.Content;
    }

    public async Task<IEnumerable<CreditItem>> GetCustomerCreditHierarchy(CustomerCredentials customerCredentials, string currency)
    {
        var cookies = await GetCustomerLoginCookie(customerCredentials);

        var creditHierarchy = await _creditApi.GetCreditHierarchyForUser(cookies, currency);
        await creditHierarchy.EnsureSuccessStatusCodeAsync();

        return creditHierarchy?.Content??new List<CreditItem>();
    }

    public async Task<VoucherResponse> AddCredit(CustomerCredentials? customerCredentials, CreateAndPublishVoucherRequest voucherRequest)
    {   
        ArgumentNullException.ThrowIfNull(voucherRequest, nameof(voucherRequest));
        
        var customer = await _customerService.CreateOrGetCustomer(customerCredentials);
        var cookies = await GetCustomerLoginCookie(customer.Credentials);
        var customerIdentifiers = await _sharedServicesAccountService.CustomerIdentifiers(cookies);
        var voucherCustomer = await _sharedServicesVouchersService.GetOrCreate(new GetOrCreateRequest()
        {
            CustomerId = customerIdentifiers.MappedId,
            CustomerDetails = new easyJet.Holidays.Api.Domain.Data.Authentication.CustomerDetails()
            {
                Email = customer.Info.Email,
                Id = customerIdentifiers.Id,
                Address1 = customer.Info.Address1,
                Address2 = customer.Info.Address2,
                City = customer.Info.City,
                Title = customer.Info.Title,
                CountryCode = customer.Info.CountryCode,
                DialingCode = customer.Info.DialingCode,
                FirstName = customer.Info.FirstName,
                LastName = customer.Info.LastName,
                MailingsFlag = customer.Info.MailingsFlag,
                MobilePhone = customer.Info.MobilePhone,
                PostalCode = customer.Info.PostalCode,
                easyJetMailingsFlag = customer.Info.EasyJetMailingsFlag,
            }
        });
        voucherRequest.CustomerId = voucherCustomer.Id;
        voucherRequest.VoucherId ??= Guid.NewGuid().ToString();
        var voucherId = await _sharedServicesVouchersService.CreateAndPublishVoucher(voucherRequest);
        return new VoucherResponse()
        {
            VoucherId = voucherId,
            Password = customer.Credentials.Password,
            Email = customer.Credentials.Email
        };
    }

    private async Task<string> GetCustomerLoginCookie(CustomerCredentials customerCredentials)
    {
        var loginResponse = await _customerApi.Login(customerCredentials);
        await loginResponse.EnsureSuccessStatusCodeAsync();

        var cookies = loginResponse.Headers.GetAuthCookies();
        return cookies;
    }
}