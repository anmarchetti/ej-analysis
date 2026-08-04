using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.MemoService;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.MemoService;

public class MemoServiceTests
{
    private IMemoService _memoService = new Domain.Services.MemoService.MemoService(Options.Create(new ApiSettings
    {
        AmendBookingMemo = new AmendBookingMemoSettings
        {
            FlightTimeChange = new MemoSettings {Code = "AMD1"},
            TransferChange = new MemoSettings() {Code = "AMD2"},
            NameChange = new MemoSettings() {Code = "AMD3", Description = "Pax {0}"},
            BoardTypeChange = new MemoSettings() {Code = "AMD5"},
            RoomTypeChange = new MemoSettings() {Code = "AMD6"},
            HolidayDateChange = new MemoSettings() {Code = "AMD8"},
            RoomAndBoardTypeChange = new MemoSettings() {Code = "AMD10"},
            AccommodationChange = new MemoSettings() { Code = "AMD11" }
        }
    }));

    [Theory]
    [MemberData(nameof(AmendmentMemoData))]
    public void GetAmendmentMemo_CalculateRightMemoCode(AmendBookingRequest request, BookingResponse bookingResponse, string expectedMemoCode)
    {
        var result = _memoService.GetAmendmentMemo(request, bookingResponse);

        result.Code.Should().Be(expectedMemoCode);
    }

    public static IEnumerable<object[]> AmendmentMemoData => new[]
    {
        new object[] {new AmendBookingRequest {Transport = new Transport()}, new BookingResponse(), "AMD1"},
        new object[] {new AmendBookingRequest {Transfers = new List<TransferItem>()}, new BookingResponse(), "AMD2"},
        new object[] {new AmendBookingRequest {Offer = new Offer()}, new BookingResponse(), "AMD8"},
        new object[]
        {
            new AmendBookingRequest {Pax = new List<AmendPersonWithDetails> {new AmendPersonWithDetails {Index = "1", PaxNameChanged = true}}}, new BookingResponse(),
            "AMD3"
        },
        new object[]
        {
            new AmendBookingRequest {Units = new List<Unit> {new Unit {Code = "Code1", Board = "Board1"}}},
            new BookingResponse {Package = new BookingPackage {Accom = new BookingAccommodation {Rooms = new List<Unit> {new Unit {Code = "Code1", Board = "Board2"}}}}},
            "AMD5"
        },
        new object[]
        {
            new AmendBookingRequest {Units = new List<Unit> {new Unit {Code = "Code1", Board = "Board1"}}},
            new BookingResponse {Package = new BookingPackage {Accom = new BookingAccommodation {Rooms = new List<Unit> {new Unit {Code = "Code2", Board = "Board1"}}}}},
            "AMD6"
        },
        new object[]
        {
            new AmendBookingRequest {Units = new List<Unit> {new Unit {Code = "Code1", Board = "Board1"}}},
            new BookingResponse {Package = new BookingPackage {Accom = new BookingAccommodation {Rooms = new List<Unit> {new Unit {Code = "Code2", Board = "Board2"}}}}},
            "AMD10"
        },
        new object[]
        {
            new AmendBookingRequest { AmendHotelOffer = new ()},
            new BookingResponse(),
            "AMD11"
        }
    };
}