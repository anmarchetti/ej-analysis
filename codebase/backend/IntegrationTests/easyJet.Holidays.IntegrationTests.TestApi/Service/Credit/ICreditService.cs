using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.IntegrationTests.TestApi.Models;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Credit;

public interface ICreditService
{
    Task<IEnumerable<MyCreditInfo>> GetCustomerCreditInfo(CustomerCredentials customerCredentials);

    Task<Dictionary<string, IEnumerable<CreditHistoryItem>>> GetCustomerCreditHistory(CustomerCredentials customerCredentials);
    Task<IEnumerable<CreditItem>> GetCustomerCreditHierarchy(CustomerCredentials customerCredentials, string currency);
    Task<VoucherResponse> AddCredit(CustomerCredentials? customerCredentials, CreateAndPublishVoucherRequest voucherRequest);
}