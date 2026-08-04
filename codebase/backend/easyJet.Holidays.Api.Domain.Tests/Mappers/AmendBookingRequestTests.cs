using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Payment;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers
{
    public class AmendBookingRequestTests
    {
        [Theory]
        [MemberData(nameof(AmendInfoBookingRequestInvalidData))]
        public void Validate_AmendInfoBookingRequestHasBothTransportAndTransfer_ThrowsException(AmendBookingRequest input, string message)
        {
            // Arrange
            // Act
            var messages = input.Validate(null);

            // Assert
            messages.Should().NotBeNullOrEmpty();
            messages.First().ErrorMessage.Should().Be(message);
        }

        [Theory]
        [MemberData(nameof(AmendBookingRequestData))]
        public void Validate_ValidAmendInfoBookingRequest_RegularProcess(AmendBookingRequest input)
        {
            // Act
            var messages = input.Validate(null);

            // Assert
            messages.Should().BeNullOrEmpty();
        }

        public static IEnumerable<object[]> AmendBookingRequestData()
        {
            yield return new object[]
            {
                new AmendBookingRequest
                {
                    Transport = new Transport(),
                    PaymentInfo = new CardPaymentInfo()
                }
            };

            yield return new object[]
            {
                new AmendBookingRequest
                {
                    Transfers = new List<TransferItem> { new TransferItem() },
                    PaymentInfo = new CardPaymentInfo()
                }
            };
        }

        public static IEnumerable<object[]> AmendInfoBookingRequestInvalidData()
        {
            yield return new object[]
            {
                new AmendBookingRequest
                {
                    Transport = new Transport(),
                    Transfers = new List<TransferItem> { new TransferItem() },
                    PaymentInfo = new CardPaymentInfo()
                },
                "Can modify only one option (route, transfer, so on) at a time"
            };

            yield return new object[]
            {
                new AmendBookingRequest
                {
                    Transport = new Transport(),
                },
                "PaymentInfo can't be null"
            };
        }
    }
}
