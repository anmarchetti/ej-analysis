using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Microsoft.AspNetCore.Http.Extensions;
using Newtonsoft.Json;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.RequestedPrice;

/// <summary>
/// Component tests for <see cref="RequestedPriceController"/>.
/// </summary>
public class RequestedPriceComponentTests : BaseFixtureAwareComponentTest
{
    public RequestedPriceComponentTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    // uses values from \easyJet.Holidays.Api.ComponentTests\Terraform\dynamodb_requested_price.tf
    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/requested-price")]
    [Fact]
    public async Task GetRequestedPrice_WithKnownKeysAndLanguage_ReturnsPriceModels()
    {
        // Arrange
        var builder = new QueryBuilder
        {
            { "key", "ESMJ.All inclusive last minute,ESMJ.All inclusive summer deals" },
            { "round", bool.TrueString }
        };

        // Act
        var response = await Client.GetAsync("/api/v1.0/requested-price" + builder);
        var responseContent = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<List<RequestedPriceSummaryModel>>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNullOrEmpty();
        result!.Count.Should().Be(2, "we don't want to see anything but the two we requested, e.g. EUX/CH-de should not be in here.");
        result.Should().AllSatisfy(item => item.Currency.Should().Be("GBP"));
    }
}