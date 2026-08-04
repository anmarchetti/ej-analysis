using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.ComponentTests.Shared;
using easyJet.Holidays.Api.Domain.Data.Marketing;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Marketing;

public class MarketingControllerGetCustomerPreferencesTests : BaseFixtureAwareComponentTest
{
    public MarketingControllerGetCustomerPreferencesTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Fact]
    public async Task UnauthorizedPreferencesRequest_ShouldReturnUnauthorizedResponse()
    {
        // Arrange
        const string requestString = "/api/v1.0/marketing/customer-preferences";

        using var unauthorizedClient = CreateClient();

        // Act
        var response = await unauthorizedClient.GetAsync(requestString);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.ReasonPhrase.Should().Be("Unauthorized");
    }

    [Theory]
    [InlineData("")]
    [InlineData("user@@company.com")]
    public async Task AuthorizedCustomerPreferencesWithInvalidEmailRequest_ShouldTriggerGuardClause(string email)
    {
        // Arrange
        var requestString = $"/api/v1.0/marketing/customer-preferences?Email={email}";

        // Act
        var response = await Client.GetAsync(requestString);

        // Assert
        var preferencesResponse = ResponseContentHelper.ReadContent<CustomerPreferencesResponse>(response);
        preferencesResponse.Urls.Should().BeNull();
        preferencesResponse.CanBeSent.Should().BeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData("12345")]
    public async Task AuthorizedCustomerPreferencesWithInvalidBookingReferenceRequest_ShouldTriggerGuardClause(string bookingReference)
    {
        // Arrange
        var requestString = $"/api/v1.0/marketing/customer-preferences?Email=a@sd.com&BookingReference={bookingReference}";

        // Act
        var response = await Client.GetAsync(requestString);

        // Assert
        var preferencesResponse = ResponseContentHelper.ReadContent<CustomerPreferencesResponse>(response);
        preferencesResponse.Urls.Should().BeNull();
        preferencesResponse.CanBeSent.Should().BeFalse();
    }
}