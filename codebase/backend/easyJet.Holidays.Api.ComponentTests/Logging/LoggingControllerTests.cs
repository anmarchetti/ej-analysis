using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.ComponentTests.Shared;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Logging;

public class LoggingControllerTests : BaseFixtureAwareComponentTest
{
    private const string ApiUrl = "/api/v1.0/logging";

    private readonly Fixture _fixture = new();

    public LoggingControllerTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Fact]
    public async Task LoggingEmptyMessage_ShouldTriggerGuardClause()
    {
        // Arrange
        // Act
        var response = await Client.PostAsync(ApiUrl, RequestContentHelper.CreateEmptyRequestParameters());

        // Assert
        var errorContent = ResponseContentHelper.ReadContent<Dictionary<string, string>>(response);
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        errorContent["error"].Should().Be("Expected message in log event");
        errorContent["code"].Should().Be("API-ERR-000000");
    }

    [Theory]
    [InlineData("error")]
    [InlineData("warn")]
    [InlineData("info")]
    [InlineData("debug")]
    [InlineData("trace")]
    public async Task LoggingMessageWithType_ShouldSendRequestToLogger(string logLevel)
    {
        // Arrange
        var message = _fixture.Build<LogEvent>()
            .With(x => x.Level, logLevel)
            .Create();

        // Act
        var response = await Client.PostAsync(ApiUrl, RequestContentHelper.CreateRequestParameters(message));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task LoggingMessageWithNotAllowedType_ShouldThrowException()
    {
        // Arrange
        var logLevel = _fixture.Create<string>();
        var message = _fixture.Build<LogEvent>()
            .With(x => x.Level, logLevel)
            .Create();

        // Act
        var response = await Client.PostAsync(ApiUrl, RequestContentHelper.CreateRequestParameters(message));

        // Assert
        var errorContent = ResponseContentHelper.ReadContent<Dictionary<string, string>>(response);
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        errorContent["error"].Should().Be($"Unknown level: '{logLevel}'");
    }
}