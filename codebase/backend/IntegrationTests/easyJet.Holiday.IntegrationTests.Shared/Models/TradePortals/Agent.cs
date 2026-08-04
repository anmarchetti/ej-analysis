using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals;

public class Agent
{
    public required AgentCredentials AgentCredentials { get; init; }
    public required AgentDetails AgentDetails { get; set; }  
    public required CustomerInfo CustomerInfo { get; set; }  
}