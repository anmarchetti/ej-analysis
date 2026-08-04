using System.Net;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Newtonsoft.Json;
using WireMock.Matchers;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using Xunit;

namespace easyJet.Holidays.Api.IntegrationTests.Errata;

[Collection("Api.Integration")]
public class ErrataController : BaseIntegrationTest
{
    [Fact]
    public async Task GetAccomErrata_BadRequest_ExceptCodes()
    {
        var requestEndpoint =
            $"/api/v1.0/errata/accom-errata?offerDate=2023-05-28T00:00:00";

        var result = await Client.GetAsync(requestEndpoint);

        result.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAccomErrata_BadRequest_ExceptOfferDates()
    {
        var requestEndpoint =
            $"/api/v1.0/errata/accom-errata?codes[0]=X9111416";

        var result = await Client.GetAsync(requestEndpoint);

        result.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAccomErrata_Success()
    {
        var requestEndpoint =
            $"/api/v1.0/errata/accom-errata?codes[0]=X9111416&offerDate=2023-05-28T00:00:00";

        var response = await Client.GetStringAsync(requestEndpoint);

        var result = JsonConvert.DeserializeObject<string[]>(response);

        result.Length.Should().Be(1);
        result.First().Should().Be("Just so you know, the aquapark is open from mid-May to mid-September, weather permitting.");
    }
}