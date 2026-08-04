using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{
    public class PostBookingServicePaymentReceiptTests
    {
        private readonly PostBookingService _sut;
        private readonly Mock<IBookingRepository> _bookingRepositoryMock = new();
        private readonly Mock<IBookingFetchService> _bookingFetchServiceMock = new();
        private readonly Mock<IVatInvoiceService> _vatInvoiceServiceMock = new();
        private readonly Mock<IBookingConfirmationService> _confirmationServiceMock = new();

        public PostBookingServicePaymentReceiptTests()
        {
            _sut = new PostBookingService(
                new Mock<IAuthenticationService>().Object,
                _confirmationServiceMock.Object,
                _vatInvoiceServiceMock.Object,
                new Mock<ILogger<PostBookingService>>().Object,
                _bookingRepositoryMock.Object,
                _bookingFetchServiceMock.Object,
                new Mock<IContentService>().Object,
                new Mock<IErrataInfoService>().Object,
                new Mock<ILanguageService>().Object,
                new Mock<IReferenceDataService>().Object
            );
        }

        [Fact]
        public async Task PaymentReceipt_ValidRequest_ReturnsStreamFromVatInvoiceService()
        {
            // Arrange
            var request = new GetBookingRequest
            {
                BookingReference = "TEST123",
                LastName = "Smith",
                Date = DateTime.Today
            };
            var booking = new BookingResponse { BookingReference = request.BookingReference };
            var expectedStream = new MemoryStream(new byte[] { 1, 2, 3 });

            _bookingRepositoryMock
                .Setup(r => r.GetBooking(request))
                .ReturnsAsync(booking);
            _bookingRepositoryMock
                .Setup(r => r.GetBookingMemo(booking.BookingReference))
                .ReturnsAsync(new List<Memo>());
            _bookingFetchServiceMock
                .Setup(s => s.BookingIsPrivate(It.IsAny<List<Memo>>()))
                .Returns(false);
            _bookingFetchServiceMock
                .Setup(s => s.ValidateByBookingPrivacy(booking))
                .Returns(Task.CompletedTask);
            _vatInvoiceServiceMock
                .Setup(v => v.GetVatInvoicePdf(booking.BookingReference))
                .ReturnsAsync(expectedStream);

            // Act
            var result = await _sut.PaymentReceipt(request);

            // Assert
            result.Should().BeSameAs(expectedStream);
            _vatInvoiceServiceMock.Verify(v => v.GetVatInvoicePdf(booking.BookingReference), Times.Once);
        }

        [Fact]
        public async Task PaymentReceipt_WhenGetBookingThrows_PropagatesApiException()
        {
            // Arrange
            var request = new GetBookingRequest
            {
                BookingReference = "INVALID",
                LastName = "Smith",
                Date = DateTime.Today
            };
            var expectedException = new ApiException(ApiExceptionCodes.BookingViewError, "Not found", null, null);

            _bookingRepositoryMock
                .Setup(r => r.GetBooking(request))
                .ThrowsAsync(expectedException);

            // Act
            var act = async () => await _sut.PaymentReceipt(request);

            // Assert
            var exception = await act.Should().ThrowAsync<ApiException>();
            exception.Which.Code.Should().Be(ApiExceptionCodes.BookingViewError);
        }

        [Fact]
        public async Task PaymentReceipt_WhenVatInvoiceServiceThrows_PropagatesApiException()
        {
            // Arrange
            var request = new GetBookingRequest
            {
                BookingReference = "TEST123",
                LastName = "Smith",
                Date = DateTime.Today
            };
            var booking = new BookingResponse { BookingReference = request.BookingReference };
            var expectedException = new ApiException(ApiExceptionCodes.DfloGetDocumentsError, "Can not get payment receipt", null, null);

            _bookingRepositoryMock
                .Setup(r => r.GetBooking(request))
                .ReturnsAsync(booking);
            _bookingRepositoryMock
                .Setup(r => r.GetBookingMemo(booking.BookingReference))
                .ReturnsAsync(new List<Memo>());
            _bookingFetchServiceMock
                .Setup(s => s.BookingIsPrivate(It.IsAny<List<Memo>>()))
                .Returns(false);
            _bookingFetchServiceMock
                .Setup(s => s.ValidateByBookingPrivacy(booking))
                .Returns(Task.CompletedTask);
            _vatInvoiceServiceMock
                .Setup(v => v.GetVatInvoicePdf(booking.BookingReference))
                .ThrowsAsync(expectedException);

            // Act
            var act = async () => await _sut.PaymentReceipt(request);

            // Assert
            var exception = await act.Should().ThrowAsync<ApiException>();
            exception.Which.Code.Should().Be(ApiExceptionCodes.DfloGetDocumentsError);
        }

        [Fact]
        public async Task PaymentReceipt_CallsValidationBeforeRetrievingDocument()
        {
            // Arrange
            var request = new GetBookingRequest
            {
                BookingReference = "TEST123",
                LastName = "Smith",
                Date = DateTime.Today
            };
            var booking = new BookingResponse { BookingReference = request.BookingReference };
            var callOrder = new List<string>();

            _bookingRepositoryMock
                .Setup(r => r.GetBooking(request))
                .ReturnsAsync(booking)
                .Callback(() => callOrder.Add("GetBooking"));
            _bookingRepositoryMock
                .Setup(r => r.GetBookingMemo(booking.BookingReference))
                .ReturnsAsync(new List<Memo>())
                .Callback(() => callOrder.Add("GetBookingMemo"));
            _bookingFetchServiceMock
                .Setup(s => s.BookingIsPrivate(It.IsAny<List<Memo>>()))
                .Returns(false);
            _bookingFetchServiceMock
                .Setup(s => s.ValidateByBookingPrivacy(booking))
                .Returns(Task.CompletedTask)
                .Callback(() => callOrder.Add("ValidateByBookingPrivacy"));
            _vatInvoiceServiceMock
                .Setup(v => v.GetVatInvoicePdf(booking.BookingReference))
                .ReturnsAsync(new MemoryStream())
                .Callback(() => callOrder.Add("GetVatInvoicePdf"));

            // Act
            await _sut.PaymentReceipt(request);

            // Assert
            callOrder.Should().ContainInOrder("GetBooking", "GetBookingMemo", "ValidateByBookingPrivacy", "GetVatInvoicePdf");
        }
    }
}
