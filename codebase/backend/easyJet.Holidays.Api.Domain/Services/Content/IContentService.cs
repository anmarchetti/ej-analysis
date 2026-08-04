using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Content
{
    public interface IContentService
    {
        /// <summary>
        /// Update single booking response with heals entry requirements.
        /// </summary>
        /// <param name="booking">Booking to update</param>
        /// <returns></returns>
        Task UpdateHealsEntryRequirementsContent(BookingResponse booking);

        /// <summary>
        /// Update multiple bookings response with heals entry requirements.
        /// </summary>
        /// <param name="bookings">Bookings to update</param>
        /// <returns></returns>
        Task UpdateHealsEntryRequirementsContent(List<BookingResponse> bookings);

    }
}
