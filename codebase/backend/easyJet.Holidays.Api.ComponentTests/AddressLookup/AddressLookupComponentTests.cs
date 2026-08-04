using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.External.Data8.Models;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.AddressLookup;


/// <summary>
/// Component tests for <see cref="AddressLookupController"/>
/// </summary>
public sealed class AddressLookupComponentTests : BaseFixtureAwareComponentTest
{
    public AddressLookupComponentTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/address-lookup")]
    [Fact]
    public async Task FindAddress_WithAValidRequest_ReturnsAddresses()
    {
        // Act
        var response = await Client.GetAsync(
            "/api/v1.0/address-lookup?addressToFind=marlborough street&countryCode=GB"
        );

        var responseContent = JsonConvert.DeserializeObject<SearchAddressResponse>(await response.Content.ReadAsStringAsync());

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        responseContent.Should().NotBeNull();
        responseContent!.Items.Should().NotBeEmpty();
        responseContent.Items.First().Id.Should().Be("PCdSziFEub4Jfypd0G1R4NbQ|CC=GB;PAF=2026.4.6.1510594");
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/address-lookup/retrieve")]
    [Fact]
    public async Task RetrieveAddress_WithAValidRequest_ReturnsAddress()
    {
        // Act
        var response = await Client.GetAsync(
            "/api/v1.0/address-lookup/retrieve?value=marlborough&countryCode=GB"
        );

        var responseContent = await response.Content.ReadFromJsonAsync<AddressResult>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        responseContent.Should().NotBeNull();
        responseContent!.AddressLine1.Should().Be("1 Marlborough Street");
        responseContent.AddressLine2.Should().Be("Ashton-Under-Lyne");
        responseContent.TownCity.Should().Be("Lancashire");
        responseContent.Postcode.Should().Be("OL7 0ET");
    }
}