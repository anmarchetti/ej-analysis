using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Extensions;

public class AmendmentTypeExtensionsTests
{
    public static IEnumerable<object[]> ResolveCases()
    {
        // One case per amendment type
        yield return new object[] { new AmendBookingRequest { AmendHotelOffer = new AmendHotelOffer() }, AmendmentType.Hotel };
        yield return new object[] { new AmendBookingRequest { Offer = new Offer { Date = DateTime.Today } }, AmendmentType.Dates };
        yield return new object[] { new AmendBookingRequest { Transfers = new List<TransferItem> { new() } }, AmendmentType.Transfer };
        yield return new object[] { new AmendBookingRequest { SeatSelection = new List<SeatMap> { new() } }, AmendmentType.Seats };
        yield return new object[] { new AmendBookingRequest { Units = new List<Unit> { new() } }, AmendmentType.Room };
        yield return new object[] { new AmendBookingRequest { Transport = new Transport() }, AmendmentType.Flight };
        yield return new object[] { new AmendBookingRequest { Pax = new List<AmendPersonWithDetails> { new() } }, AmendmentType.Name };

        // Empty request cannot be classified
        yield return new object[] { new AmendBookingRequest(), AmendmentType.Unknown };

        // Precedence: hotel and dates win over the payload they also carry
        yield return new object[]
        {
            new AmendBookingRequest { AmendHotelOffer = new AmendHotelOffer(), Units = new List<Unit> { new() }, Transport = new Transport() },
            AmendmentType.Hotel
        };
        yield return new object[]
        {
            new AmendBookingRequest { Offer = new Offer { Date = DateTime.Today }, Transport = new Transport(), Transfers = new List<TransferItem> { new() } },
            AmendmentType.Dates
        };
        // Hotel is checked before dates
        yield return new object[]
        {
            new AmendBookingRequest { AmendHotelOffer = new AmendHotelOffer(), Offer = new Offer { Date = DateTime.Today } },
            AmendmentType.Hotel
        };
        // An offer without a date is not a date change; falls through to the concrete field
        yield return new object[]
        {
            new AmendBookingRequest { Offer = new Offer(), Transport = new Transport() },
            AmendmentType.Flight
        };
        // Transfer takes precedence over seats/room/flight/name
        yield return new object[]
        {
            new AmendBookingRequest { Transfers = new List<TransferItem> { new() }, SeatSelection = new List<SeatMap> { new() } },
            AmendmentType.Transfer
        };
    }

    [Theory]
    [MemberData(nameof(ResolveCases))]
    public void ResolveAmendmentType_ReturnsExpectedType(AmendBookingRequest request, AmendmentType expected)
    {
        request.ResolveAmendmentType().Should().Be(expected);
    }

    [Fact]
    public void ResolveAmendmentType_WhenRequestIsNull_ReturnsUnknown()
    {
        AmendBookingRequest request = null;

        request.ResolveAmendmentType().Should().Be(AmendmentType.Unknown);
    }

    [Theory]
    [InlineData(AmendmentType.Hotel, "hotel")]
    [InlineData(AmendmentType.Dates, "dates")]
    [InlineData(AmendmentType.Transfer, "transfer")]
    [InlineData(AmendmentType.Seats, "seats")]
    [InlineData(AmendmentType.Room, "room")]
    [InlineData(AmendmentType.Flight, "flight")]
    [InlineData(AmendmentType.Name, "name")]
    [InlineData(AmendmentType.Unknown, "unknown")]
    public void ToMetricLabel_ReturnsExpectedLabel(AmendmentType type, string expected)
    {
        type.ToMetricLabel().Should().Be(expected);
    }
}
