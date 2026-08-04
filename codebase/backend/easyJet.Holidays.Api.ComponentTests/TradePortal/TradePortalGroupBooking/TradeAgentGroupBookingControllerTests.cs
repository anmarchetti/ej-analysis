using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.ComponentTests.Shared;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalGroupBooking;

public class TradeAgentGroupBookingControllerTests : BaseTradeFixtureAwareComponentTest
{
    private const string ApiRoute = "/api/v1.0/trade-portal/group-booking";

    public TradeAgentGroupBookingControllerTests(TradePortalWebApplicationFixture tradeWebApp) : base(tradeWebApp)
    {
    }

    [Theory]
    [InlineData("AgentName", "User #424")]
    [InlineData("AgentName", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")]
    [InlineData("Email", "not an email")]
    [InlineData("ABTANumber", "not a number")]
    [InlineData("DurationOfHoliday", "0")]
    [InlineData("DestinationHotelOrRegion", "Malta%")]
    [InlineData("AdditionalDetails", "^&*")]
    public async Task GroupBookingsInvalidRequest_ShouldFail(string fieldName, string value)
    {
        // Arrange
        var request = TradeAgentGroupBookingTestUtils.GetGroupBookingRequest();
        request[fieldName] = value;

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["innerErrors"]?.AsArray().Should().Contain(error =>
            error!["message"]!.GetValue<string>().Contains(fieldName, StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData("Infants", 0)]
    [InlineData("Adults", 1)]
    [InlineData("Children", 0)]
    public async Task GroupBookingsInvalidTotalPassengers_ShouldFail(string fieldName, int value)
    {
        // Arrange
        var request = TradeAgentGroupBookingTestUtils.GetGroupBookingRequest();
        request!["TotalPassengers"]![fieldName] = value;
        request["Rooms"]![0]![fieldName] = value;

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["innerErrors"]?.AsArray().Should().Contain(error =>
            error!["message"]!.GetValue<string>() == "the total passengers amount should be at least 9.");
    }

    [Theory]
    [InlineData("Infants", 0)]
    [InlineData("Adults", 1)]
    [InlineData("Children", 0)]
    public async Task GroupBookingsInvalidPassengersOfTypeCount_ShouldFail(string fieldName, int value)
    {
        // Arrange
        var request = TradeAgentGroupBookingTestUtils.GetGroupBookingRequest();
        request!["TotalPassengers"]![fieldName] = value;

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["innerErrors"]?.AsArray().Should().Contain(error =>
            error!["message"]!.GetValue<string>() == $"Total {fieldName} count in field {fieldName} should correspond to total number, specified across Rooms field.");
    }

    [Theory]
    [InlineData("Rooms", "Field Rooms is required.")]
    [InlineData("TotalPassengers", "Field TotalPassengers is required.")]
    public async Task GroupBookingsFieldIsNotSpecified_ShouldFail(string fieldName, string expectedMessage)
    {
        // Arrange
        var request = TradeAgentGroupBookingTestUtils.GetGroupBookingRequest();
        request.Remove(fieldName);

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["innerErrors"]?.AsArray().Should().Contain(error =>
            error!["message"]!.GetValue<string>() == expectedMessage);
    }

    [Fact]
    public async Task GroupBookingsRoomsAreEmpty_ShouldFail()
    {
        // Arrange
        var request = TradeAgentGroupBookingTestUtils.GetGroupBookingRequest();
        request["Rooms"] = new JsonArray();

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["innerErrors"]!.AsArray().Should().Contain(error =>
            error!["message"]!.GetValue<string>() == "Field Rooms should contain at least 1 room.");
    }

    [Fact]
    public async Task GroupBookingsMoreInfantsThanAdults_ShouldFail()
    {
        // Arrange
        var request = TradeAgentGroupBookingTestUtils.GetGroupBookingRequest();
        request!["TotalPassengers"]!["Infants"] = 4;
        request["Rooms"]![0]!["Infants"] = 4;

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["innerErrors"]?.AsArray().Should().Contain(error =>
            error!["message"]!.GetValue<string>() == "Each room should contain at least as many Adults, as Infants number specified for it.");
    }

    [Theory]
    [InlineData(1)]
    [InlineData(40)]
    public async Task GroupBookingsIncorrectAge_ShouldFail(int incorrectAge)
    {
        // Arrange
        var request = TradeAgentGroupBookingTestUtils.GetGroupBookingRequest();
        request!["Rooms"]![0]!["ChildAges"] = new JsonArray { 2, 15, incorrectAge };

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["innerErrors"]?.AsArray().Should().Contain(error =>
            error!["message"]!.GetValue<string>() == "Children could have ages only between 2 and 15.");
    }

    [Fact]
    public async Task GroupBookingsIncorrectChildAgesAmount_ShouldFail()
    {
        // Arrange
        var request = TradeAgentGroupBookingTestUtils.GetGroupBookingRequest();
        request!["Rooms"]![0]!["ChildAges"] = new JsonArray { 2, 15 };

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["innerErrors"]?.AsArray().Should().Contain(error =>
            error!["message"]!.GetValue<string>() == "Specified number of ages should be equal to number of children.");
    }

    [Fact]
    public async Task GroupBookingsInconsistentNumberOfRooms_ShouldFail()
    {
        // Arrange
        var request = TradeAgentGroupBookingTestUtils.GetGroupBookingRequest();
        request["NumberOfRooms"] = 2;

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["innerErrors"]?.AsArray().Should().Contain(error =>
            error!["message"]!.GetValue<string>() == "Field Rooms should contain rooms count, equal to one, specified for NumberOfRooms, when exact number of rooms is specified.");
    }

    [Fact]
    public async Task GroupBookingsInvalidDepartureDate_ShouldFail()
    {
        // Arrange
        var request = TradeAgentGroupBookingTestUtils.GetGroupBookingRequest();
        request.Remove("DepartureDate");

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = ResponseContentHelper.ReadContent<JsonObject>(response);
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["innerErrors"]?.AsArray().Should().Contain(error =>
            error!["message"]!.GetValue<string>() == "The date, specified in DepartureDate field, should be in future.");
    }

    [Fact]
    public async Task GroupBookingValidRequest_ShouldSend()
    {
        // Arrange

        // Act
        var response = await Client.PostAsync(ApiRoute, JsonContent.Create(TradeAgentGroupBookingTestUtils.GetGroupBookingRequest()));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}