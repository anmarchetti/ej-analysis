using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Offers
{
    public interface IOfferPriceService
    {
        /// <summary>
        /// Gets total offer price without any extras.
        /// </summary>
        decimal GetOfferPriceWithoutExtras(PriceInfo priceInfo, ValidateBookingResponse validateBookingResponse);

        /// <summary>
        /// Gets total offer price per person without any extras.
        /// </summary>
        Task<decimal> GetOfferPricePerPersonWithoutExtras(PriceInfo priceInfo, ValidateBookingResponse validateBooking);

        /// <summary>
        /// Gets offer price.
        /// </summary>
        Task<decimal> GetOfferPrice(ValidateBookingResponse validateBooking);

        /// <summary>
        /// Gets offer price per person.
        /// </summary>
        Task<decimal> GetOfferPricePerPerson(ValidateBookingResponse validateBooking);
    }
}
