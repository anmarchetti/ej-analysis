using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Destinations;

/// <summary>
/// Component tests for <see cref="DestinationController"/>
/// </summary>
public class DestinationControllerLocationTests : BaseFixtureAwareComponentTest
{
    public DestinationControllerLocationTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/destinations/{code}/image")]
    [Theory]
    [InlineAutoData("Valid request", "ESMJ", HttpStatusCode.OK)]
    [InlineAutoData("Whiespace location code", " ", HttpStatusCode.BadRequest)] // Don't test empty value because .net core does it for us
    public async Task LocationImage_ValidateRequest(string because, string code, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/destinations/{code}/image";

        // Act
        var response = await Client.GetAsync(query);

        // Assert
        response.StatusCode.Should().Be(status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/destinations/{code}/image")]
    [Theory]
    [InlineAutoData("ESMJ", "/-/media/4780746cafc9424d888d5ebac5399991.ashx")]
    [InlineAutoData("EMPTY", "")]
    public async Task LocationImage_ReturnCmsResult(string code, string expected)
    {
        // Arrange 
        var query = $"/api/v1.0/destinations/{code}/image";

        // Act
        var response = await Client.GetAsync(query);
        var actualContent = await response.Content.ReadAsStringAsync();

        // Assert
        actualContent.Should().Be(expected);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/destinations/{code}/image")]
    [Fact]
    public async Task LocationImage_CMSError_500WithError()
    {
        // Arrange 
        var query = $"/api/v1.0/destinations/ERROR/image";

        // Act
        var response = await Client.GetAsync(query);

        // Assert
        await response.AssertErrorResponse(ApiExceptionCodes.DestinationsImageError, HttpStatusCode.InternalServerError);
    }
}