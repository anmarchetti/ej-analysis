using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api;

public interface ITradePortalAccountApi
{
    [Headers("X-Ej-Sc-Site: TradePortal")]
    [Post("/trade-portal/account/login")]
    public Task<ApiResponse<AgentDetails>> Login(AgentCredentials request);
}