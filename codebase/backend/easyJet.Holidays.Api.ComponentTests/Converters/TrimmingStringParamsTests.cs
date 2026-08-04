using AutoFixture.Xunit3;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Converters;

/// <summary>
/// Trimming parameters component tests
/// </summary>
public class TrimmingStringParamsTests : BaseFixtureAwareComponentTest
{
    public TrimmingStringParamsTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account/exists")]
    [Theory]
    [InlineAutoData("Valid email", "   test@easyjet.com  ", HttpStatusCode.OK)]
    public async Task QueryParam_Trimmed(string because, string email, HttpStatusCode status)
    {
        // Arrange 
        var apiUrl = $"/api/v1.0/account/exists?email={email}"; // email is used to return valid response

        // Act
        var response = await Client.GetAsync(apiUrl);

        // Assert            
        response.StatusCode.Should().Be(status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account")]
    [Fact]
    public async Task BodyParams_Trimmed()
    {
        // Arrange 
        var customerDetails = new
        {
            title = "  MR",
            email = "  new@easyjet.com  ", // used email to map valid response
            firstName = "Test",
            lastName = " Test ",
            dialingCode = " 079",
            mobilePhone = "99999999",
            birthDate = "1950-01-01T00:00:00+00:00",
            address1 = "The Hay Barn",
            address2 = "Londonderry Farm",
            city = "Bristol",
            postalCode = "BS306EL",
            countryCode = "GBR",
            mailingsFlag = true,
            easyJetMailingsFlag = false
        };

        var requestBody = new
        {
            password = "Qwerty_0000",
            rememberMe = false,
            customer = customerDetails
        };

        var query = $"/api/v1.0/account";
        var body = JsonConvert.SerializeObject(requestBody);

        // Act
        var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}