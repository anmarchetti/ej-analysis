using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Utils;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using System.Net;
using Xunit;
using easyJet.Holidays.External.Atcom.Models.Booking;
using easyJet.Holidays.Tests.Domain.ComponentTests;

namespace easyJet.Holidays.Api.ComponentTests.Booking
{
    /// <summary>
    /// Component tests for <see cref="BookingController"/>
    /// </summary>
    public class BookingControllerDisplayTests : BaseComponentTest
    {
        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("Valid data", "VALID_REF", "Johnson", "2020-01-01", HttpStatusCode.OK)]
        [InlineAutoData("Invalid booking reference", "", "LastName", "2020-01-01", HttpStatusCode.BadRequest)]
        [InlineAutoData("Invalid last name", "VALID_REF", "", "2020-01-01", HttpStatusCode.BadRequest)]
        [InlineAutoData("No date", "VALID_REF", "LastName", "", HttpStatusCode.BadRequest)]
        [InlineAutoData("Invalid date", "VALID_REF", "LastName", "date2020-01-01", HttpStatusCode.BadRequest)]
        public async Task Display_Validate_RequestArguments(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
        {
            // Arrange
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            // Act
            var response = await Client.GetAsync(query);

            // Assert
            response.StatusCode.Should().Be(status, because);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("Invalid reference", "INVALID_REF", "Johnson", "2020-01-01", HttpStatusCode.BadRequest)]
        [InlineAutoData("Invalid last name", "VALID_REF", "JJohnson", "2020-01-01", HttpStatusCode.BadRequest)]
        [InlineAutoData("Invalid date", "VALID_REF", "Johnson", "3020-01-01", HttpStatusCode.BadRequest)]
        public async Task Display_InvalidData_ThrowError(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
        {
            // Arrange
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            // Act
            var response = await Client.GetAsync(query);

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.BookingViewError, status, because);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("VALID_REF", "Johnson", "2020-01-01")]
        public async Task Display_ValidData_ReturnBooking(string bookingReference, string lastName, string date)
        {
            // Arrange
            var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "booking_VALID_REF_not_logged_in.json")));
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("VALID_REF_WITH_CANCELLED_ROOM_AND_ROUTE", "Johnson", "2020-01-01")]
        public async Task Display_ValidDataWithCancelledRoomAndROute_ReturnBooking(string bookingReference, string lastName, string date)
        {
            // Arrange
            var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "booking_VALID_REF_WITH_CANCELLED_ROOM_AND_ROUTE_not_logged_in.json")));
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("VALID_REF_WITH_CANCELLED_ACCOM_REVERSE_ORDER", "Tester", "2020-10-02")]
        public async Task Display_ValidDataWithCancelledAccomAndReeverseOrder_ReturnBooking(string bookingReference, string lastName, string date)
        {
            // Arrange
            var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "booking_VALID_REF_WITH_CANCELLED_ACCOM_REVERSE_ORDER_not_logged_in.json")));
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            ApplyManyConfigurationFields(
                new KeyValuePair<string, string>[]
                {
                    new("Cache:BackgroundRefreshDisabled", "false"),
                    new("EnvironmentBehaviour:PreloadReferenceDataOnStart", "true"),
                });

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("VALID_REF", "Johnson", "2020-01-01")]
        public async Task Display_ValidData_ReturnBooking_LoggedIn(string bookingReference, string lastName, string date)
        {
            // Arrange
            var expectedSessionId = "afa0f978-d664-48e7-9944-ecdfcede7d68";
            var expectedUserId = "123456";
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e3a6aca8c7b03b9615e9c9ba0410e9c9085e321e4cb2f7a489795c200eb5760cf&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"ejHolidaysUserId={expectedUserId}; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax;");
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"ejHolidaysSessionId={expectedSessionId}; expires=Mon, 26 Aug 2019 12:41:26 GMT; domain=localhost; path=/; secure; samesite=lax; httponly");

            // Arrange
            var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "booking_VALID_REF_response.json")));

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("Fraud detected", "FRAUD", "Johnson", "2020-01-01", HttpStatusCode.BadRequest)]
        public async Task Display_FraudCancelled_ReturnBooking(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
        {
            // Arrange
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            // Act
            var response = await Client.GetAsync(query);

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.BookingFraudError, status, because);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("Option status", "OPTION", "Johnson", "2020-01-01", HttpStatusCode.BadRequest)]
        public async Task Display_OptionStatus_ThrowError(string because, string bookingReference, string lastName, string date, HttpStatusCode status)
        {
            // Arrange
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            // Act
            var response = await Client.GetAsync(query);

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.BookingViewError, status, because);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("VALID_REF", "Johnson", "2020-01-01", "S123")]
        public async Task Display_WithSupplierId_HasCommissionInResponse(string bookingReference, string lastName, string date, string supplierId)
        {
            // Arrange
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}&supplierId={supplierId}";
            // Arrange
            var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "booking_VALID_REF_SupplierId_response.json")));

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("VALID_REF_WITH_ROUTES_WITH_EXTERNAL_PNR", "Johnson", "2020-01-01")]
        public async Task Display_RoutesWithExternalPNR_ResponseWithExternalPNR(string bookingReference, string lastName, string date)
        {
            // Arrange
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";
            // Arrange
            var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "booking_VALID_REF_WITH_ROUTES_WITH_EXTERNAL_PNR.json")));

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("VALID_REF_ATCOM_RESPONSE_WITH_ERRORS", "Johnson", "2020-01-01", HttpStatusCode.BadRequest)]
        public async Task Display_ValidDataAndErrorsInAtcomResponse_ThrowError(string bookingReference, string lastName, string date, HttpStatusCode status)
        {
            // Arrange
            var expectedSessionId = "afa0f978-d664-48e7-9944-ecdfcede7d68";
            var expectedUserId = "123456";
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e3a6aca8c7b03b9615e9c9ba0410e9c9085e321e4cb2f7a489795c200eb5760cf&CookieTypeKey=1; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax; httponly");
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"ejHolidaysUserId={expectedUserId}; expires=Thu, 23 Aug 3029 12:21:26 GMT; domain=; path=/; secure; samesite=lax;");
            Client.DefaultRequestHeaders.Add(HeaderNames.Cookie, $"ejHolidaysSessionId={expectedSessionId}; expires=Mon, 26 Aug 2019 12:41:26 GMT; domain=localhost; path=/; secure; samesite=lax; httponly");

            // Act
            var response = await Client.GetAsync(query);

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.BookingViewError, status);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("VALID_REF_WITH_SWISS_CURRENCY", "Johnson", "2020-01-01")]
        public async Task Display_ValidData_Return_Swiss_Currency(string bookingReference, string lastName, string date)
        {
            // Arrange
            var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "booking_VALID_REF_WITH_SWISS_CURRENCY_response.json")));
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Fact]
        public async Task Display_BookingWithExtraLuggage()
        {
            var query = "/api/v1.0/booking?bookingReference=VALID-BOOKING-WITH-EXTRA-LUGGAGE&lastName=Testman&date=2024-02-11";
            var expected = ComponentTestUtils.GetJsonString(@"WebApi\valid_booking_with_extra_luggage_response.json", minify: true);

            var response = await Client.GetAsync(query);

            var content = await response.Content.ReadAsStringAsync();

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("VALID_REF_DISRUPTED", "Johnson", "2040-01-01")]
        public async Task Display_DisruptedBooking_Return_Disabled_Amendments(string bookingReference, string lastName, string date)
        {
            ApplyConfigurationField("B2B:EresUsername", "disrupted@email.com");

            // Arrange
            var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "booking_VALID_REF_DISRUPTED.json")));

            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/booking")]
        [Fact]
        public async Task Display_BookingWithSeats()
        {
            var query = "/api/v1.0/booking?bookingReference=VALID-BOOKING-WITH-SEATS&lastName=Testman&date=2024-02-11";
            var expected = ComponentTestUtils.GetJsonString(@"WebApi\valid_booking_with_seats_response.json", minify: true);

            var response = await Client.GetAsync(query);

            var content = await response.Content.ReadAsStringAsync();

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }

        [Trait("Category", "Integration")]
        [Trait("Api", "/api/v1.0/booking")]
        [Theory]
        [InlineAutoData("VALID_REF_RB", "Johnson", "2020-01-01")]
        public async Task Display_ValidData_MultipleRooms_ReturnBooking(string bookingReference, string lastName, string date)
        {
            // Arrange
            var expected = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "WebApi", "booking_VALID_REF_RB_response.json")));
            var query = $"/api/v1.0/booking?bookingReference={bookingReference}&lastName={lastName}&date={date}";

            // Act
            var response = await Client.GetAsync(query);
            var content = await response.Content.ReadAsStringAsync();

            // Assert

            content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
        }
    }
}