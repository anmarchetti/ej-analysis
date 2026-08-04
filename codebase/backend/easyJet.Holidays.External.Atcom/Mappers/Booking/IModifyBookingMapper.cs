using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.Atcom.Models.Internal.InfoModifyBookingRequest;
using InfoModifyBookingResponse = easyJet.Holidays.External.Atcom.Models.ModifyBooking.InfoModifyBookingResponse;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking
{
    public interface IModifyBookingMapper
    {
        /// <summary>
        /// Builds an InfoModifyBookingRequest Object
        /// </summary>
        /// <param name="response"></param>
        /// <param name="sendExtraFlightInformationForInternalFlights"></param>
        /// <returns></returns>
        InfoModifyBookingRequest BuildInfoModifyBookingRequest(BookingResponse response, bool sendExtraFlightInformationForInternalFlights = false);
        Task<ValidateAmendBookingResponse> Map(InfoModifyBookingResponse bookingInfoResponse, PriceBreakdownResponse priceBreakdownResponse, List<Benefit> benefitsContentData, bool isLoggedInAsTradeAgent);
    }
}
