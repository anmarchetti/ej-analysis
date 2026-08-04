using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.MemoService;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.MemoService;

/// <summary>
/// Memo service
/// </summary>
public class MemoService : IMemoService
{
    private readonly ApiSettings _apiSettings;

    /// <summary>
    /// ctor
    /// </summary>
    /// <param name="apiSettings"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public MemoService(IOptions<ApiSettings> apiSettings)
    {
        _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
    }

    /// <summary>
    /// Gets the memo for request.
    /// </summary>
    /// <param name="request">The request.</param>
    /// <param name="bookingResponse">Initial booking</param>
    /// <returns>Booking memo by amend request information.</returns>
    public BookingMemo GetAmendmentMemo(AmendBookingRequest request, BookingResponse bookingResponse) => request switch
    {
        { Transport: not null } => _apiSettings.AmendBookingMemo.FlightTimeChange,
        { Transfers: not null } => _apiSettings.AmendBookingMemo.TransferChange,
        { Pax: not null } => CreatePaxMemo(request),
        { Offer: not null } => _apiSettings.AmendBookingMemo.HolidayDateChange,
        { Units: not null } => GetRoomAndBoardChange(request.Units, bookingResponse),
        { AmendHotelOffer: not null } => _apiSettings.AmendBookingMemo.AccommodationChange,
        _ => null
    };

    private MemoSettings GetRoomAndBoardChange(List<Unit> requestUnits, BookingResponse bookingResponse)
    {
        var requestUnit = requestUnits.FirstOrDefault();
        var bookingRoom = bookingResponse?.Package?.Accom?.Rooms?.FirstOrDefault();
        var (bookingCode, bookingBoard) = (bookingRoom?.Code, bookingRoom?.Board);

        return requestUnit switch
        {
            Unit u when Equals(u.Code, bookingCode) && !Equals(u.Board, bookingBoard) => _apiSettings.AmendBookingMemo.BoardTypeChange,
            Unit u when !Equals(u.Code, bookingCode) && Equals(u.Board, bookingBoard) => _apiSettings.AmendBookingMemo.RoomTypeChange,
            Unit u when !Equals(u.Code, bookingCode) && !Equals(u.Board, bookingBoard) => _apiSettings.AmendBookingMemo.RoomAndBoardTypeChange,
            _ => null
        };
    }

    private static bool Equals(string requestCode, string bookingCode)
    {
        return string.Equals(requestCode, bookingCode, StringComparison.InvariantCultureIgnoreCase);
    }

    private BookingMemo CreatePaxMemo(AmendBookingRequest request)
    {
        return new BookingMemo
        {
            Code = _apiSettings.AmendBookingMemo.NameChange.Code,
            Description = string.Format(
                                _apiSettings.AmendBookingMemo.NameChange.Description,
                                string.Join(", ",
                                    request.Pax.Select(x => new AmendPaxHistoryItem
                                    { Index = x.Index, PaxNameChanged = x.PaxNameChanged ? AmendPaxCondition.Yes : AmendPaxCondition.No })))
        };
    }
}