using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using System.Net;
using Xunit;


namespace easyJet.Holidays.Api.ComponentTests.ContactUs;

/// <summary>
/// Component tests for <see cref="ContactUsController"/>
/// </summary>
public class ContactUsComponentTests : BaseFixtureAwareComponentTest
{
    public ContactUsComponentTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/contact-us")]
    [Fact]
    public async Task CreateCase_WithValidFormData_ReturnsSuccessfulResult()
    {
        // Arrange
        var formContent = new MultipartFormDataContent
        {
            { new StringContent("John"), "LeadPassengerFirstName" },
            { new StringContent("Doe"), "LeadPassengerLastName" },
            { new StringContent("john.doe@test.com"), "EmailAddress" },
            { new StringContent("Amend booking"), "About" },
            { new StringContent("2025-08-01 - 2025-08-15"), "DepartureAndReturnDate" },
            { new StringContent("I would like to amend my booking dates"), "Question" },
            { new StringContent("false"), "IsPastHoliday" }
        };

        // Act
        var response = await Client.PostAsync("/api/v1.0/contact-us", formContent);
        var responseContent = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<ContactUsResult>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();
        result!.IsSuccessful.Should().BeTrue();
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/contact-us")]
    [Fact]
    public async Task CreateCase_WithMissingRequiredFields_ReturnsBadRequest()
    {
        // Arrange
        var formContent = new MultipartFormDataContent
        {
            { new StringContent("John"), "LeadPassengerFirstName" },
            { new StringContent("Doe"), "LeadPassengerLastName" },
            { new StringContent("john.doe@test.com"), "EmailAddress" },
            { new StringContent(""), "About" },
            { new StringContent(""), "DepartureAndReturnDate" },
            { new StringContent("I have a question"), "Question" },
            { new StringContent("false"), "IsPastHoliday" }
        };

        // Act
        var response = await Client.PostAsync("/api/v1.0/contact-us", formContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
