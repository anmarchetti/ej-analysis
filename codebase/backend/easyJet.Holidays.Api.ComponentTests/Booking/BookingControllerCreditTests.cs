using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Booking;

public class BookingControllerCreditTests : BaseFixtureAwareComponentTest
{
    public BookingControllerCreditTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task ConvertToCreditWithBlockedAccount_ShouldFail()
    {
        // lockedBySitecore@easyjet.com cookie is b103e41789315a1bdef67d7589880f671023c6f0f9f41738f7f5747c972b9cfc9757488fe8e189d1de82406165ba411bfa8074fb68308d6f3f674c2afb79dcc0&CookieTypeKey=1
        // lockedBySitecore1@easyjet.com cookie is 7d32251ce2f5a0411a74491f1a0d3a2ad6eca6a2d19f1b33127dc216f9df283cc4ad1b986572e72fbff3a09afe417ee003d812e94ca2f247170462aa4c329645&CookieTypeKey=1
        // Arrange
        var requestString = @"{""type"":""credit"",""bookingReference"":""70099168"",""lastName"":""K"",""date"":""2023-02-04""}";

        var message = new HttpRequestMessage(HttpMethod.Post, "/api/v1/booking/credit");
        message.Headers.Add("Cookie", "eJ2Session=7d32251ce2f5a0411a74491f1a0d3a2ad6eca6a2d19f1b33127dc216f9df283cc4ad1b986572e72fbff3a09afe417ee003d812e94ca2f247170462aa4c329645&CookieTypeKey=1");
        message.Content = new StringContent(requestString, Encoding.UTF8, "application/json");

        // Act
        var response = await Client.SendAsync(message);

        // Assert
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<JObject>(content);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        responseData?["error"]?.Value<string>().Should().Be("Customer email is locked");
    }
}