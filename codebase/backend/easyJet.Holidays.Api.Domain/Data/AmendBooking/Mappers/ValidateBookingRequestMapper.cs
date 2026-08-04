using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers
{
    public class ValidateBookingRequestMapper : IValidateBookingRequestMapper
    {
        public ValidateBookingRequest BuildValidateBookingRequest(BookingResponse bookingResponse, ValidateAmendBookingResponse alternativePackage)
        {
            return new ValidateBookingRequest
            {
                DiscountCode = bookingResponse.DiscountCode,
                Offer = new Offer
                {
                    Price = alternativePackage.PaymentInfo.BookingPriceEx,
                    PricePP = alternativePackage.PaymentInfo.PricePP,
                    Stay = (byte)alternativePackage.Duration,
                    Date = bookingResponse.BookingDate.DateTime,
                    Accom = MapAccom(bookingResponse),
                    Transport = alternativePackage.Transport,
                    SeatSelection = bookingResponse.SeatSelection,
                    ExtraLuggageInfo = bookingResponse.ExtraLuggageInfo
                },
                ExtraLuggageInfo = bookingResponse.ExtraLuggageInfo,
                AirportParking = bookingResponse.AirportParking
            };
        }

        private static Accom MapAccom(BookingResponse bookingResponse)
        {
            return new Accom
            {
                Date = bookingResponse.BookingDate.DateTime,
                Code = bookingResponse.Package.Accom.Code,
                Theme = bookingResponse.Package.Accom.Hotel.Theme,
                Unit = bookingResponse.Package.Accom.Rooms,
                Type = bookingResponse.Package.Accom.Hotel.Type,
                Id = bookingResponse.Package.Accom.Id,
                Prom = bookingResponse.Package.Accom.Prom
            };
        }
    }
}