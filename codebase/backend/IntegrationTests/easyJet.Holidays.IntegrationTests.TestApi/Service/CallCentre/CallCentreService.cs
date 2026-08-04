using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.CallCentre
{
    public class CallCentreService : ICallCentreService
    {
        private ICallCentreApi _callCentreApi;
        private CallCentreSettings _settings;
        public CallCentreService(ICallCentreApi callCentreApi, IOptions<CallCentreSettings> settings)
        {
            _settings = settings.Value;
            _callCentreApi = callCentreApi;
        }

        public async Task<MyCreditInfo> GetCredits(GetCreditsRequest request)
        {
            var credits = await _callCentreApi.GetCredit(request.UserEmail, request.Currency, _settings.CallCentreKey);

            if (credits == null)
            {
                throw new InvalidOperationException($"Couldn't get credits for user {request.UserEmail}");
            }

            return credits.Content;
        }

        public async Task<MyCreditInfo> AddCredits(AddCreditsRequest request)
        {
            request.AgentId = _settings.CallCentreAgentId;

            var credits = await _callCentreApi.AddCredits(request, _settings.CallCentreKey);

            if (credits == null)
            {
                throw new InvalidOperationException($"Couldn't get credits for user {request.EmailAddress}");
            }

            return credits.Content;
        }
    }
}
