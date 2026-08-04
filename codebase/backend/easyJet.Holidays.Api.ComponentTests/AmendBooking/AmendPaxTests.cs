using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.AmendBooking
{
    public class AmendPaxTests : BaseFixtureAwareComponentTest
    {
        public AmendPaxTests(WebApplicationFixture webApp) : base(webApp)
        {
        }

        [Trait("Category", "Integration")]
        [Trait("Api", "/api/v1.0/amend/pax-limit-validation")]
        [Theory]
        [MemberData(nameof(AmendPaxValidationRequestData))]
        public async Task PaxLimitValidation_RequestIsNull_ReturnError(AmendPaxValidationRequest request)
        {
            var query = "/api/v1.0/amend/amend-room-and-board/validate";

            var message = new HttpRequestMessage(HttpMethod.Post, query);
            message.Headers.Add(HeaderNames.Cookie, $"eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e3a6aca8c7b03b9615e9c9ba0410e9c9085e321e4cb2f7a489795c200eb5760cf&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");
            message.Content = JsonContent.Create(request);

            var response = await Client.SendAsync(message);

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        public static IEnumerable<object[]> AmendPaxValidationRequestData()
        {
            yield return [new AmendPaxValidationRequest { BookingReference = String.Empty, Guests = [new AmendPersonWithDetails()] }];
            yield return [new AmendPaxValidationRequest { BookingReference = String.Empty, Guests = [] }];
            yield return [new AmendPaxValidationRequest { BookingReference = "TestBooking", Guests = [] }];
        }
    }
}
