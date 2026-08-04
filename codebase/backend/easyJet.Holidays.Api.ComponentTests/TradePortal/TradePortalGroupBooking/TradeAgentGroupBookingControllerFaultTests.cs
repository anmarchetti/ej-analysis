using easyJet.Holidays.Api.ComponentTests.Shared;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalGroupBooking;

public class TradeAgentGroupBookingControllerFaultTests : BaseTradePortalComponentTest
{
    private const string ApiRoute = "/api/v1.0/trade-portal/group-booking";

    [Fact]
    public async Task GroupBookingValidRequestDynamoDbNotAvailable_ShouldFail()
    {
        // Arrange
        var server = SpawnServer("AwsDynamoDbMockServer");
        ApplyConfigurationField("Aws:ServiceURL", server.Url);
        SetupApiAuthorizationForClient();

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(TradeAgentGroupBookingTestUtils.GetGroupBookingRequest()));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-300400");
        responseContent["error"]?.GetValue<string>().Should().Be("Group booking persisting failed");
    }

    [Fact]
    public async Task GroupBookingValidRequestSnsNotAvailable_ShouldFail()
    {
        // Arrange
        var server = SpawnServer("SesMockServer");
        ApplyConfigurationField("Aws:SES:Client:ServiceUrl", server.Url);

        SetupApiAuthorizationForClient();

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(TradeAgentGroupBookingTestUtils.GetGroupBookingRequest()));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-300401");
        responseContent["error"]?.GetValue<string>().Should().Be("Group booking email sending failed");
    }
}