using AutoFixture.Xunit3;
using easyJet.Holidays.Api.ComponentTests.Utils;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.AmendBooking
{
    public class AmendBookingControllerTests : BaseComponentTest
    {
        /// <summary>
        /// Serialize object as camelCase JSON payload and post it to the given url.
        /// </summary>
        private async Task<HttpResponseMessage> PostAsCamelCaseJsonAsync(string url, object payload)
        {
            return await Client.PostAsync(url,
                ComponentTestUtils.GetJsonContent(System.Text.Json.JsonSerializer.Serialize(payload,
                    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })));
        }

        [Theory]
        [InlineAutoData(1000000, "Price is not valid", true, HttpStatusCode.InternalServerError)]
        [InlineAutoData(-1, "Price is not valid", true, HttpStatusCode.InternalServerError)]
        [InlineAutoData(1, "Credit is disabled", false, HttpStatusCode.BadRequest)]
        public async Task Commit_Payment_Fail(decimal creditAmount, string exception, bool isActive, HttpStatusCode statusCode)
        {
            ApplyConfigurationField("Api:Vouchers:IsActive", isActive.ToString());

            var request = new AmendBookingRequest()
            {
                PaymentInfo = new Domain.Data.Payment.CardPaymentInfo()
                {
                    CreditAmount = creditAmount
                },
                LastName = "test@easyjet.com",
                BrowserInfo = new Domain.Data.Booking.BrowserInfo(),
                BookingReference = "AMEND_BOOKING"
            };

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");

            var query = "/api/v1.0/amend/commit";
            var response = await PostAsCamelCaseJsonAsync(query, request);

            var content = await response.Content.ReadAsStringAsync();

            response.StatusCode.Should().Be(statusCode);
            content.Should().Contain(exception);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/commit")]
        [Fact]
        public async Task Commit_Success_Pipline()
        {
            var transportsJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "alternative_flights", "alternative_flight_api_request_body.json"));
            var request = new AmendBookingRequest()
            {
                PaymentInfo = new Domain.Data.Payment.CardPaymentInfo(),
                LastName = "test@easyjet.com",
                BrowserInfo = new BrowserInfo(),
                BookingReference = "AMEND_BOOKING",
                Transport = JsonConvert.DeserializeObject<List<Transport>>(transportsJson).First(),
                DiscountCode = "AMD2000"
            };

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");

            var query = "/api/v1.0/amend/commit";
            var response = await PostAsCamelCaseJsonAsync(query, request);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/commit")]
        [Fact]
        public async Task Commit_ChangeDate_Success_Pipline()
        {
            var offerJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "AmendController", "DatesEndpoints", "ChangeDateOffer.json"));
            var request = new AmendBookingRequest()
            {
                PaymentInfo = new Domain.Data.Payment.CardPaymentInfo(),
                LastName = "test@easyjet.com",
                BrowserInfo = new BrowserInfo(),
                BookingReference = "AMEND_BOOKING",
                Offer = JsonConvert.DeserializeObject<Offer>(offerJson),
                DiscountCode = "AMD2000"
            };

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");
            
            var query = "/api/v1.0/amend/commit";
            var response = await PostAsCamelCaseJsonAsync(query, request);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/commit")]
        [Fact]
        public async Task CommitWithPromoCode_Success_Pipline()
        {
            var transportsJson = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "alternative_flights", "alternative_flight_api_request_body.json"));
            var request = new AmendBookingRequest()
            {
                PaymentInfo = new Domain.Data.Payment.CardPaymentInfo(),
                LastName = "test@easyjet.com",
                BrowserInfo = new BrowserInfo(),
                BookingReference = "AMEND_BOOKING",
                Transport = JsonConvert.DeserializeObject<List<Transport>>(transportsJson).First(),
                DiscountCode = "AMD2000"
            };

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");
            
            var query = "/api/v1.0/amend/commit";
            var response = await PostAsCamelCaseJsonAsync(query, request);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/commit")]
        [Fact]
        public async Task Commit_VouchersDisabled_ShouldFail()
        {
            // Arrange
            ApplyConfigurationField("Api:Vouchers:IsActive", "false");
            var request = new AmendBookingRequest()
            {
                PaymentInfo = new Domain.Data.Payment.CardPaymentInfo
                {
                    CreditAmount = 362
                },
                LastName = "test@easyjet.com",
                BrowserInfo = new BrowserInfo(),
                BookingReference = "AMEND_BOOKING",
            };

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");

            // Act
            var response = await PostAsCamelCaseJsonAsync($"/api/v1.0/amend/commit", request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            (await response.Content.ReadAsStringAsync()).Should().Be("Credit is disabled");
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/alternative-transfers/validate-price")]
        [Fact]
        public async Task ValidateTransferPrice_Success_Pipline()
        {
            var body = new AmendBookingTransfersRequest()
            {
                BookingReference = "AMEND_BOOKING",
                Transfers = new List<TransferItem>()
            };

            string query = $"/api/v1.0/amend/alternative-transfers/validate-price";

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");

            var response = await Client.PostAsJsonAsync(query, body);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/alternative-transfers/price")]
        [Fact]
        public async Task AlternativeTransfersWithPrice_Success_Pipline()
        {
            var body = new AlternativeTransfersSearchRequest()
            {
                BookingReference = "AMEND_BOOKING"
            };

            string query = $"/api/v1.0/amend/alternative-transfers/price";

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");

            var response = await Client.PostAsJsonAsync(query, body);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/alternative-transfers/price")]
        [Fact]
        public async Task AlternativeTransfers_AtcomErrorOnValidate_Pipline()
        {
            var body = new AlternativeTransfersSearchRequest()
            {
                BookingReference = "AMEND_BOOKING_ATCOM_VRP_ERROR"
            };

            string query = $"/api/v1.0/amend/alternative-transfers/price";

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");

            var response = await Client.PostAsJsonAsync(query, body);
            var responseString = await response.Content.ReadAsStringAsync();

            var result = JsonConvert.DeserializeObject<AmendDateInfoResponse>(responseString);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            result.Should().BeEquivalentTo(new AmendDateInfoResponse { });
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/alternative-transfers/price")]
        public async Task GetAlterativeTransfers_Success_Pipline()
        {
            var body = new AlternativeTransfersSearchRequest()
            {
                BookingReference = "AMEND_BOOKING"
            };

            string query = $"/api/v1.0/amend/alternative-transfers/price";

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");

            var response = await Client.PostAsJsonAsync(query, body);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/alternative-transfers/price")]
        public async Task GetAlterativeTransfersWithPromoCode_Success_Pipline()
        {
            var body = new AlternativeTransfersSearchRequest()
            {
                BookingReference = "AMEND_BOOKING_PROMOCODE"
            };

            string query = $"/api/v1.0/amend/alternative-transfers/price";

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");

            var response = await Client.PostAsJsonAsync(query, body);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/amend-date/info")]
        [Fact]
        public async Task GetAmendDatesCalendarData_Success_Pipeline()
        {
            var startDate = "2023-06-19";
            var endDate = "3023-07-19";

            var offersCount = 31;

            var query = $"/api/v1.0/amend/amend-date/info?startDate={startDate}&endDate={endDate}&duration=7&departure=LGW&room[0].adults=2&room[0].roomCode=DBL.SU!NOR.CG-OPAC RO&accommodationId=X9559362";
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e3a6aca8c7b03b9615e9c9ba0410e9c9085e321e4cb2f7a489795c200eb5760cf&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"ejHolidaysUserId=someid; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax;");
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"ejHolidaysSessionId=sessionid; expires=Mon, 26 Aug 2019 12:41:26 GMT; domain=localhost; path=/; secure; samesite=lax; httponly");

            var response = await Client.GetStringAsync(query);

            var result = JsonConvert.DeserializeObject<AmendDateInfoResponse>(response);

            result.AmendDates.First().Date.Should().Be(startDate);
            result.AmendDates.First().IsAvailable.Should().BeFalse();

            result.AmendDates.Last().Date.Should().Be(endDate);
            result.AmendDates.Last().IsAvailable.Should().BeTrue();
            result.AvailableHoliday.Should().BeTrue();
            result.AmendDates.Count().Should().Be(offersCount);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/seats")]
        [Fact]
        public async Task AmendSeats_Success()
        {
            var request = ComponentTestUtils.GetJsonString(@"\WebApi\AmendController\Seats\amend_seats_request.json");
            var expected = ComponentTestUtils.GetJsonString(@"\WebApi\AmendController\Seats\amend_seats_response.json", minify: true);

            // Session cookie for test@easyjet.com
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");
            var response = await Client.PostAsync("/api/v1.0/amend/seats", ComponentTestUtils.GetJsonContent(request));

            var content = await response.Content.ReadAsStringAsync();

            content.Should().BeEqualAfterNormalization<AmendSeatsResponse>(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/amend/commit")]
        [Fact]
        public async Task AmendBooking_CommitWithChangedSeats_ShouldReturnSuccessResponse()
        {
            // Arrange
            var request = ComponentTestUtils.GetJsonString(@"\WebApi\AmendController\Commit\amend_commit_with_seats_request.json");
            var expected = ComponentTestUtils.GetJsonString(@"\WebApi\AmendController\Commit\amend_commit_with_seats_response.json", minify: true);

            // Session cookie for test@easyjet.com
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");

            // Act
            var response = await Client.PostAsync("/api/v1.0/amend/commit", ComponentTestUtils.GetJsonContent(request));

            // Assert
            var content = await response.Content.ReadAsStringAsync();

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }
    }
}
