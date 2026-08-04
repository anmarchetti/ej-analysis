using easyJet.Holidays.Api.Domain.Data.Vouchers;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api;

public interface ICreditApi
{
    [Get("/credit/me")]
    Task<ApiResponse<IEnumerable<MyCreditInfo>>> GetCreditInfoForUser([Header("Cookie")] string cookie);

    [Get("/credit/history")]
    Task<ApiResponse<Dictionary<string, IEnumerable<CreditHistoryItem>>>> GetCreditHistoryForUser([Header("Cookie")] string cookie);
    
    [Get("/credit/hierarchy")]
    Task<ApiResponse<IEnumerable<CreditItem>>> GetCreditHierarchyForUser([Header("Cookie")] string cookie, string currency);
}