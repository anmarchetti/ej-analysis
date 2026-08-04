using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using easyJet.Holidays.Api.Controllers.Booking;

namespace easyJet.Holidays.Api.Tests.Controllers
{
    public class BookingControllerPaymentReceiptTests
    {
        private readonly Mock<IPostBookingService> _postBookingServiceMock;
        private readonly BookingController _sut;

        public BookingControllerPaymentReceiptTests()
        {
            var fixture = FixtureUtils.AutoMoqFixture();

            fixture.Inject(Options.Create(new HeadersSettings()));
            fixture.Inject(Options.Create(new AtcomSettings()));
            fixture.Inject(Options.Create(new ApiSettings()));

            _postBookingServiceMock = new Mock<IPostBookingService>();

            var marketServiceMock = new Mock<IMarketService>();
            marketServiceMock.Setup(m => m.GetCurrentMarket())
                .Returns(new MarketSettings { Code = "UK" });

            _sut = new BookingController(
                fixture.Create<IBookingFetchService>(),
                _postBookingServiceMock.Object,
                fixture.Create<IBookingCreditService>(),
                fixture.Create<IBookingChangeService>(),
                fixture.Create<IBookingTokenService>(),
                fixture.Create<IBookingCreateService>(),
                fixture.Create<IHotelsService>(),
                fixture.Create<IIdempotentBookingService>(),
                fixture.Create<IOptions<HeadersSettings>>(),
                fixture.Create<IOptions<ApiSettings>>(),
                fixture.Create<IPricesService>(),
                fixture.Create<IAuthenticationService>(),
                fixture.Create<ITradeAgentAuthenticationService>(),
                fixture.Create<ISettingsService>(),
                fixture.Create<IReferenceDataService>(),
                fixture.Create<IOtelAnalyticsService>(),
                fixture.Create<IMetricsService>(),
                marketServiceMock.Object
            );
        }

        [Fact]
        public async Task PaymentReceipt_ValidRequest_ReturnsPdfFile()
        {
            // Arrange
            var request = new GetBookingRequest
            {
                BookingReference = "TEST123",
                LastName = "Smith",
                Date = DateTime.Today
            };
            var pdfStream = new MemoryStream(new byte[] { 1, 2, 3 });

            _postBookingServiceMock
                .Setup(s => s.PaymentReceipt(request))
                .ReturnsAsync(pdfStream);

            // Act
            var result = await _sut.PaymentReceipt(request);

            // Assert
            var fileResult = result.Should().BeOfType<FileStreamResult>().Subject;
            fileResult.ContentType.Should().Be("application/pdf");
            fileResult.FileStream.Should().BeSameAs(pdfStream);
        }

        [Fact]
        public async Task PaymentReceipt_NullStream_ThrowsApiExceptionWithDfloGetDocumentsErrorAndBadRequest()
        {
            // Arrange
            var request = new GetBookingRequest
            {
                BookingReference = "TEST123",
                LastName = "Smith",
                Date = DateTime.Today
            };

            _postBookingServiceMock
                .Setup(s => s.PaymentReceipt(request))
                .ReturnsAsync((Stream?)null!);

            // Act
            var act = async () => await _sut.PaymentReceipt(request);

            // Assert
            var exception = await act.Should().ThrowAsync<ApiException>();
            exception.Which.Code.Should().Be(ApiExceptionCodes.DfloGetDocumentsError);
            exception.Which.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task PaymentReceipt_ServiceThrowsApiException_RethrowsWithDfloGetDocumentsErrorAndBadRequest()
        {
            // Arrange
            var request = new GetBookingRequest
            {
                BookingReference = "TEST123",
                LastName = "Smith",
                Date = DateTime.Today
            };
            var serviceException = new ApiException(
                ApiExceptionCodes.BookingViewError, "Some internal error", null, null);

            _postBookingServiceMock
                .Setup(s => s.PaymentReceipt(request))
                .ThrowsAsync(serviceException);

            // Act
            var act = async () => await _sut.PaymentReceipt(request);

            // Assert
            var exception = await act.Should().ThrowAsync<ApiException>();
            exception.Which.Code.Should().Be(ApiExceptionCodes.DfloGetDocumentsError);
            exception.Which.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            // Internal details must NOT be exposed via the public message
            exception.Which.Message.Should().Be("Can not get payment receipt");
        }

        [Fact]
        public async Task PaymentReceipt_DoesNotAlterConfirmationEndpointBehavior()
        {
            // Arrange – confirm that Confirmation still works correctly after our changes
            var request = new GetBookingRequest
            {
                BookingReference = "CONF123",
                LastName = "Jones",
                Date = DateTime.Today
            };
            var pdfStream = new MemoryStream(new byte[] { 5, 6, 7 });

            _postBookingServiceMock
                .Setup(s => s.Confirmation(request))
                .ReturnsAsync(pdfStream);

            // Act
            var result = await _sut.Confirmation(request);

            // Assert
            var fileResult = result.Should().BeOfType<FileStreamResult>().Subject;
            fileResult.ContentType.Should().Be("application/pdf");
            fileResult.FileStream.Should().BeSameAs(pdfStream);
        }
    }
}

