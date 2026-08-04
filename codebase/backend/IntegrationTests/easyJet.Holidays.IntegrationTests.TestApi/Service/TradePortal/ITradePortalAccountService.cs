using easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals;
using AgentCredentials = easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals.AgentCredentials;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.TradePortal;

public interface ITradePortalAccountService
{
    public Task<Agent> Login(AgentCredentials credentials);
}