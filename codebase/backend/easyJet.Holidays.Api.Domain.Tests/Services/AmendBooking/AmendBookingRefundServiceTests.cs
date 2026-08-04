using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking
{
    public class AmendBookingRefundServiceTests
    {
        private IFixture _fixture { get; set; }

        private Mock<IBookingRepository> _bookingRepositoryMock = new Mock<IBookingRepository>();
        private Mock<IBookingRefundEligibleService> _bookingRefundEligibleServiceMock = new Mock<IBookingRefundEligibleService>();
        private Mock<IBookingCreditService> _bookingCreditServiceMock = new Mock<IBookingCreditService>();
        private ILogger<AmendBookingRefundService> _logger;

        private AmendBookingRefundService _sut;

        public AmendBookingRefundServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _logger = _fixture.Freeze<ILogger<AmendBookingRefundService>>();

            _sut = new AmendBookingRefundService(
                _bookingRefundEligibleServiceMock.Object,
                _bookingRepositoryMock.Object,
                _bookingCreditServiceMock.Object,
                _logger
                );
        }

        [Fact]
        public async Task EligibleForPartialRefund_ValidInput_ReguralFlow()
        {
            //Arrange
            _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<GetBookingRequest>())).ReturnsAsync(new BookingResponse()).Verifiable();
            _bookingRefundEligibleServiceMock.Setup(x => x.IsEligibleForPartialRefund(It.IsAny<BookingResponse>(), It.IsAny<decimal>(), null)).ReturnsAsync(new EligibleForRefund()).Verifiable();

            //Act
            var response = await _sut.EligibleForPartialRefund(new AmendBookingPartialRefundRequest());

            //Assert
            _bookingRepositoryMock.Verify(x => x.GetBooking(It.IsAny<GetBookingRequest>()), Times.Once);
            _bookingRefundEligibleServiceMock.Verify(x => x.IsEligibleForPartialRefund(It.IsAny<BookingResponse>(), It.IsAny<decimal>(), null), Times.Once);
        }

        [Theory]
        [MemberData(nameof(ProcessRefundData))]
        public async Task ProcessRefund_ValidInput_Returns(BookingRequest bookingRequest, ValidateAmendBookingResponse validateAmendBookingResponse, BookingResponse bookingResponse, ConvertType convertType, BookingResponse expectedResult, bool partialRefundExpected)
        {
            //Arrange
            _bookingCreditServiceMock.Setup(x => x.PartialRefund(It.IsAny<BookingResponse>(), It.IsAny<ConvertType>(), It.IsAny<decimal>())).ReturnsAsync(new Domain.Data.Vouchers.BookingRefundResponse()).Verifiable();
            _bookingRepositoryMock.Setup(x => x.CommitAmendBooking(It.IsAny<BookingRequest>())).ReturnsAsync(expectedResult);

            //Act
            BookingResponse response = await _sut.ProcessRefund(bookingRequest, validateAmendBookingResponse, bookingResponse, convertType);

            //Assert
            if (partialRefundExpected)
                _bookingCreditServiceMock.Verify(x => x.PartialRefund(It.IsAny<BookingResponse>(), It.IsAny<ConvertType>(), It.IsAny<decimal>()), Times.Once);

            response.Should().BeEquivalentTo(expectedResult);
        }

        public static IEnumerable<object[]> ProcessRefundData()
        {
            var expectedRes = new BookingResponse
            {
                PaymentInfo = new PriceInfo
                {
                    BalanceDueAmount = 1
                }
            };
            yield return new object[]
            {
                new BookingRequest
                {
                    PaymentInfo = new CardPaymentInfo
                    {
                        Amount = 1
                    }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new PriceInfo
                    {
                        BalanceDueAmount = 1
                    }
                },
                expectedRes,
                ConvertType.REFUND,
                expectedRes,
                false
            };

            yield return new object[]
            {
                new BookingRequest
                {
                    PaymentInfo = new CardPaymentInfo
                    {
                        Amount = -2
                    }
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new PriceInfo
                    {
                        BalanceDueAmount = 1
                    }
                },
                expectedRes,
                ConvertType.REFUND,
                expectedRes,
                true
            };
        }
    }
}