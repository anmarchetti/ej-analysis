using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;

/// <summary>
/// Service to build amend transport information
/// </summary>
public interface IAmendTransportBuildService
{
    /// <summary>
    /// Build transport from atcom resposne
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <param name="validateAmendBookingResponse"></param>
    /// <param name="alternativePackage"></param>
    /// <returns>AmendTransport object</returns>
    Task<AmendTransport> BuildAmendTransport(
        BookingResponse bookingResponse,
        ValidateAmendBookingResponse validateAmendBookingResponse,
        AlternativePackage alternativePackage);
}