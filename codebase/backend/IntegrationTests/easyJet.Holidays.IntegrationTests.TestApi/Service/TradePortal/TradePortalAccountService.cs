using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Extensions;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Customer;
using easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using Microsoft.IdentityModel.Tokens;
using Refit;
using AgentCredentials = easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals.AgentCredentials;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.TradePortal;

internal sealed class TradePortalAccountService(ITradePortalAccountApi tradePortalAccountApi, CustomerFaker customerFaker)
    : ITradePortalAccountService
{
    public async Task<Agent> Login(AgentCredentials credentials)
    {
        AgentDetails agentDetails;

        if (string.IsNullOrEmpty(credentials.SsoBearerAccessToken))
        {
            var loggedAgent = await tradePortalAccountApi.Login(new Api.Domain.Data.Authentication.Agent.AgentCredentials()
            {
                Number = credentials.Number,
                Password = credentials.Password,
                Ref = credentials.Ref
            });

            credentials.LoginCookie = loggedAgent.Headers.GetAuthCookies();
            agentDetails = loggedAgent.Content!;
        }
        else
        {
            agentDetails = new AgentDetails
            {
                Number = credentials.Number,
                Name = string.Empty
            };
        }

        return new Agent()
        {
            AgentCredentials = credentials,
            AgentDetails = agentDetails,
            CustomerInfo = customerFaker.Generate()
        };
    }
}