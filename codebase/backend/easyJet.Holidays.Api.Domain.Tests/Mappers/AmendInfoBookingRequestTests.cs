using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers
{
    public class AmendInfoBookingRequestTests
    {
        [Theory]
        [MemberData(nameof(AmendInfoBookingRequestInvalidData))]
        public void Validate_InvalidAmendInfoBookingRequest_ThrowsException(AmendInfoBookingRequest input, string message)
        {
            // Arrange

            // Act
            var messages = input.Validate(null);

            // Assert
            messages.Should().NotBeNullOrEmpty();
            messages.Single().ErrorMessage.Should().Be(message);
        }

        [Theory]
        [MemberData(nameof(AmendInfoBookingRequestData))]
        public void Validate_ValidAmendInfoBookingRequest_RegularProcess(AmendInfoBookingRequest input)
        {
            // Arrange

            // Act
            var messages = input.Validate(null);

            // Assert
            messages.Should().BeNullOrEmpty();
        }

        public static IEnumerable<object[]> AmendInfoBookingRequestData()
        {
            yield return new object[]
            {
                new AmendInfoBookingRequest
                {
                    Transport = new Transport()
                }
            };

            yield return new object[]
            {
                new AmendInfoBookingRequest
                {
                    Transfers = new List<TransferItem> { new TransferItem() }
                }
            };

            yield return new object[]
            {
                new AmendInfoBookingRequest
                {
                    SeatSelection = new List<SeatMap> { new SeatMap() }
                }
            };

            yield return new object[]
            {
                new AmendInfoBookingRequest
                {
                    Pax = new List<AmendPersonWithDetails>{ new AmendPersonWithDetails() }
                }
            };

            yield return new object[]
            {
                new AmendInfoBookingRequest
                {
                    Offer = new Offer()
                }
            };
        }

        public static IEnumerable<object[]> AmendInfoBookingRequestInvalidData()
        {
            yield return new object[]
            {
                new AmendInfoBookingRequest
                {
                    Transport = new Transport(),
                    Transfers = new List<TransferItem> { new TransferItem() }
                },
                "Can modify only one option (route, transfer, so on) at a time"
            };

            yield return new object[]
            {
                new AmendInfoBookingRequest
                {
                    Transport = new Transport(),
                    Transfers = new List<TransferItem> { new TransferItem() },
                    Offer = new Offer(),
                    Pax = new List<AmendPersonWithDetails>{ new AmendPersonWithDetails() },
                    SeatSelection = new List<SeatMap> { new SeatMap() }
                },
                "Can modify only one option (route, transfer, so on) at a time"
            };

            yield return new object[]
            {
                new AmendInfoBookingRequest
                {
                    Offer = new Offer(),
                    Pax = new List<AmendPersonWithDetails>{ new AmendPersonWithDetails() },
                    SeatSelection = new List<SeatMap> { new SeatMap() }
                },
                "Can modify only one option (route, transfer, so on) at a time"
            };

            yield return new object[]
            {
                new AmendInfoBookingRequest
                {
                    Transport = new Transport(),
                    Offer = new Offer(),
                    SeatSelection = new List<SeatMap> { new SeatMap() }
                },
                "Can modify only one option (route, transfer, so on) at a time"
            };
        }
    }
}
