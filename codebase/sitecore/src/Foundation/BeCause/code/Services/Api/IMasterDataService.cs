using System.Threading.Tasks;
using easyJet.Foundation.BeCause.Models.Request;
using easyJet.Foundation.BeCause.Models.Response;

namespace easyJet.Foundation.BeCause.Services.Api
{
    public interface IMasterDataService
    {
        Task<StandardsSearchResponse> GetStandardsSearchResultAsync(StandardsSearchRequest request);

        Task<CompaniesSearchResponse> GetCompaniesSearchResultAsync(CompaniesSearchRequest request);

        Task GetHotelMappingResultAsync(HotelMappingRequest request);
    }
}