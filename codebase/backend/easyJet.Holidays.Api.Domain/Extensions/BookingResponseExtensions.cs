using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Utils;
using Force.DeepCloner;

namespace easyJet.Holidays.Api.Domain.Extensions;

/// <summary>
/// Booking extensions methods.
/// </summary>
public static class BookingResponseExtensions
{
    /// <summary>
    /// Create new booking with updated information from offer.
    /// </summary>
    /// <param name="bookingResponse">Booking</param>
    /// <param name="offer">Offers</param>
    /// <returns>Updated booking.</returns>
    public static BookingResponse MergeWithOffer(this BookingResponse bookingResponse, Offer offer)
    {
        ArgumentNullException.ThrowIfNull(offer);

        var result = bookingResponse.DeepClone();
        result.Transfers = offer.Transfers;
        result.SeatSelection = offer.SeatSelection;
        result.Package.Transport = offer.Transport;
        result.ExtraLuggageInfo = offer.ExtraLuggageInfo;

        result.Package.Accom.StartDate = DateFormatUtils.DateOnly(offer.Accom.Date);
        result.Package.Accom.EndDate = DateFormatUtils.DateOnly(offer.Accom.Date.Date.AddDays(offer.Accom.Stay));
        result.Package.Accom.Rooms = offer.Accom.Unit;

        return result;
    }

    /// <summary>
    /// Update booking promo code.
    /// </summary>
    /// <param name="bookingResponse">Booking.</param>
    /// <param name="discountCode">Atcom promo code.</param>
    /// <returns>Booking</returns>
    public static BookingResponse UpdatePromoCode(this BookingResponse bookingResponse, string discountCode)
    {
        bookingResponse.AmendmentInfo.PromoCode = discountCode;

        return bookingResponse;
    }

    /// <summary>
    /// Check if booking has promocode
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <returns>true if it has promocode, false otherwise</returns>
    public static bool HasPromocode(this BookingResponse bookingResponse)
    {
        return !string.IsNullOrEmpty(bookingResponse.DiscountCode);
    }

    /// <summary>
    /// Create new booking with updated room composition.
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <param name="roomVariant"></param>
    /// <returns></returns>
    public static BookingResponse MergeWithRoomComposition(this BookingResponse bookingResponse, AmendRoomVariant roomVariant)
    {
        var result = bookingResponse.DeepClone();

        result.Package.Accom.Rooms = roomVariant.Units.ToList();

        return result;
    }

    /// <summary>
    /// Get first rooms Room and Board codes.
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <returns>Tuple: (room code, board code)</returns>
    public static (string, string) GetFirstRoomsCodes(this BookingResponse bookingResponse)
    {
        return (bookingResponse?.Package?.Accom?.Rooms?.FirstOrDefault()?.Code, bookingResponse?.Package?.Accom?.Rooms?.FirstOrDefault()?.Board);
    }

    /// <summary>
    /// Get bookings duration
    /// </summary>
    /// <param name="accom"></param>
    /// <returns></returns>
    public static int CalculateDuration(this BookingAccommodation accom)
    {
        var startDate = accom.StartDate;
        var endDate = accom.EndDate;
        var startDateTime = DateFormatUtils.Parse(startDate);
        var endDateTime = DateFormatUtils.Parse(endDate);

        return (endDateTime - startDateTime).Days;
    }

    /// <summary>
    /// Create new booking with updated transport.
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <param name="transport"></param>    
    /// <returns></returns>
    public static BookingResponse MergeWithTransport(this BookingResponse bookingResponse, Transport transport)
    {
        var result = bookingResponse.DeepClone();
        result.Package.Transport = transport;
        result.SeatSelection = null;
        return result;
    }

    /// <summary>
    /// Create new booking with updated hotel for hotel change. 
    /// In order to correctly change hotel we have to update hotel id, new room and board for that hotel, prom in case that holiday type changes and transfer code.
    /// All these parameters are individual for a hotel.
    /// </summary>
    /// <param name="bookingResponse">original booking response</param>
    /// <param name="hotelOffer">alternative offer from cache</param>
    /// <returns>Booking response with updated new hotel and its features</returns>
    public static BookingResponse MergeWithAccomodation(this BookingResponse bookingResponse, AmendHotelOffer hotelOffer)
    {
        ArgumentNullException.ThrowIfNull(hotelOffer);

        var result = bookingResponse.DeepClone();
        result.Package.Accom.Code = hotelOffer.Accom.Code;
        result.Package.Accom.Prom = hotelOffer.Accom.Prom;
        result.Package.Accom.Rooms = hotelOffer.Accom.Unit;
        return result;
    }

    /// <summary>
    /// Merge alternative hotel to the original booking.
    /// </summary>
    /// <param name="bookingResponse">Original booking response.</param>
    /// <param name="hotelOffer">Alternative hotel offer.</param>
    /// <returns>Updated booking.</returns>
    public static BookingResponse MergeWithAmendHotelOffer(this BookingResponse bookingResponse, AmendHotelOffer hotelOffer)
    {
        ArgumentNullException.ThrowIfNull(hotelOffer);

        var result = bookingResponse.DeepClone();
        result.Package.Accom.Code = hotelOffer.Accom.Code;
        result.Package.Accom.Prom = hotelOffer.Accom.Prom;
        result.Package.Accom.Rooms = hotelOffer.Accom.Unit;
        result.Transfers = hotelOffer.Transfers;
        return result;
    }

    /// <summary>
    /// Create new booking with updated transport.
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <param name="transfer"></param>    
    /// <returns></returns>
    public static BookingResponse MergeWithTransfer(this BookingResponse bookingResponse, TransferItem transfer)
    {
        var result = bookingResponse.DeepClone();
        result.Transfers = new List<TransferItem> { transfer };

        return result;
    }

    /// <summary>
    /// Get all external pnrs from route and paxes
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <returns></returns>
    public static List<string> GetAllExternalPnrs(this BookingResponse bookingResponse)
    {
        return bookingResponse.Package?.Transport.Routes.Select(route =>
        {
            var bookingExtRefs = route.ExtRefId;

            var paxpnrs = route.Paxs?.Where(pax => !string.IsNullOrEmpty(pax.ExternalPNR)).Select(x => x.ExternalPNR).ToList();
            var pnrs = new List<string>(paxpnrs ?? new List<string>());
            if (!string.IsNullOrEmpty(bookingExtRefs))
                pnrs.Add(bookingExtRefs);

            return pnrs;
        }).SelectMany(x => x)
          .Distinct()
          .ToList() ?? new List<string>();
    }
}