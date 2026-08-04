using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Services.TradeAgent
{
    public class TradeAgentRepository : ITradeAgentProvider
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AtcomSettings _atcomSettings;
        private readonly ILogger<TradeAgentRepository> _logger;

        public TradeAgentRepository(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            IOptions<AtcomSettings> atcomSettings,
            ILogger<TradeAgentRepository> logger)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<AgentDetails> GetDetails(AgentCredentials credentials)
        {
            try
            {
                var cltInfoSettings = _atcomSettings.CltInfo;
                var cltInfo = new CltInfo
                {
                    Locale = cltInfoSettings.Locale,
                    TermCode = credentials.Ref, // cltInfoSettings.TermCode, // TODO Is it right place?
                    User_Name = cltInfoSettings.TradePortalUserName,
                    Chan = cltInfoSettings.Channel,
                    Agt_No = credentials.Number,
                };

                var request = new Models.AgentValidation.AgentValidationRequest();
                request.Payload.Body = new AgentValidationRequest
                {
                    Adm = VrpRequestUtils.BuildAdm(),
                    CltInfo = cltInfo,
                    AgentPassword = credentials.Password
                };
                request.Endpoint = GetAgentValidationUri();

                var response = await _apiService.GetResponseContentAsyncWithErrorMapping<Models.AgentValidation.AgentValidationRequest, Models.AgentValidation.AgentValidationResponse>(
                    request, ApiExceptionCodes.AgentValidationInternalError);
                var responseBody = response?.Payload?.Body;

                if (responseBody == null || !responseBody.ValidationSuccessful)
                {
                    throw new ApiException(ApiExceptionCodes.AgentValidationError);
                }

                return new AgentDetails
                {
                    Number = credentials.Number,
                    Name = responseBody.Agent_Name
                };
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, $"Can not authenticate trade agent {credentials.Ref} in atcom.");
                throw;
            }
        }

        private Uri GetAgentValidationUri()
        {
            return _endpointsProvider.GetEndpoint(AtcomEndpoint.Booking, _httpContextAccessor.HttpContext?.Request?.Cookies);
        }
    }
}