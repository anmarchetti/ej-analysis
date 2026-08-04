using easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre;
using easyJet.Holidays.Api.Domain.Data.Attributes;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api
{
    public interface ICallCentreApi
    {
        [Get("/callcentre/credit")]
        Task<ApiResponse<MyCreditInfo>> GetCredit(
            string userEmail,
            [CurrencyCode] string currency,
            [Header("Authorization")] string cookie);

        [Post("/callcentre/credit")]
        Task<ApiResponse<MyCreditInfo>> AddCredits(
            AddCreditsRequest request,
            [Header("Authorization")] string cookie);

        [Post("/callcentre/credit-booking")]
        Task<ApiResponse<MyCreditInfo>> CreditBooking(
            CreditBookingRequest request,
            [Header("Authorization")] string cookie);
    }
}
