using easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.TestApi
{
    public interface ICallCentreTestApi
    {
        [Get("/CallCentre/get-credits")]
        Task<ApiResponse<MyCreditInfo>> GetCredits(GetCreditsRequest request);

        [Post("/CallCentre/add-credits")]
        Task<ApiResponse<MyCreditInfo>> AddCredits(AddCreditsRequest request);
    }
}
