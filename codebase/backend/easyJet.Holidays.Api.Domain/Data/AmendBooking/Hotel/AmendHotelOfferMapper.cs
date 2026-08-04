using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel
{
    /// <summary>
    /// Map amend hotel offer to regular offer an vice versa
    /// </summary>
    public static class AmendHotelOfferMapper
    {
        /// <summary>
        /// Mapregular offer to amend hotel offer
        /// </summary>
        /// <param name="offer"></param>
        /// <returns></returns>
        public static AmendHotelOffer MapToAmendHotelOffer(this Offer offer) 
        {
            ArgumentNullException.ThrowIfNull(offer);

            return new AmendHotelOffer
            {
                Accom = offer.Accom,
                Transfers = offer.Transfers
            };
        }

        /// <summary>
        /// Map amend hotel offer to regular offer
        /// </summary>
        /// <param name="amendHotelOffer"></param>
        /// <param name="booking"></param>
        /// <returns></returns>
        public static Offer MapToOffer(this AmendHotelOffer amendHotelOffer, BookingResponse booking)
        {
            ArgumentNullException.ThrowIfNull(amendHotelOffer);
            ArgumentNullException.ThrowIfNull(booking);

            return new Offer
            {
                Accom = amendHotelOffer.Accom,
                
                Transfers = amendHotelOffer.Transfers,
                Transport = booking.Package.Transport
            };
        }
    }
}
