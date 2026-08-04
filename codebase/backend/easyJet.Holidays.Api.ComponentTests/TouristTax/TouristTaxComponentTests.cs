using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.TouristTax;


/// <summary>
/// Component tests for <see cref="TouristTaxController"/>
/// </summary>
public sealed class TouristTaxComponentTests : BaseFixtureAwareComponentTest
{
    public TouristTaxComponentTests(WebApplicationFixture webApp):base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/tourist-tax")]
    [Fact]
    public async Task CalculateTaxes_WithAValidRequest_CalculatesTaxes()
    {
        // Arrange
        var id = Guid.NewGuid().ToString("N");
        var request = new TouristTaxRequest(new ReadOnlyCollection<TouristTaxOffer>([
            new(
                id,
                "DEBECH",
                5,
                1000m,
                DateOnly.Parse("03.01.2026", CultureInfo.InvariantCulture),
                DateOnly.Parse("08.01.2026", CultureInfo.InvariantCulture),
                4,
                1,
                new ReadOnlyCollection<AdultPax>([
                    new AdultPax(),
                    new AdultPax()
                ]),
                new ReadOnlyCollection<ChildPax>([new ChildPax()])
            )
        ]));

        // Act
        var response = await Client.PutAsync(
            "/api/v1.0/tourist-tax",
            new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json")
        );

        var responseContent = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<TouristTaxResponse>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();
        result!.OfferTaxes.Should().NotBeNullOrEmpty();

        var tax = result.OfferTaxes.First();
        tax.OfferId.Should().Be(id);
        tax.Currency.Should().Be("EUR");
    }
}