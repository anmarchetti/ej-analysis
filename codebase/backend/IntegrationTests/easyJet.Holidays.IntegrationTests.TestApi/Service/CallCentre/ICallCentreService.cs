using easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre;
using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.CallCentre
{
    public interface ICallCentreService
    {
        Task<MyCreditInfo> GetCredits(GetCreditsRequest request);
        Task<MyCreditInfo> AddCredits(AddCreditsRequest request);
    }
}
