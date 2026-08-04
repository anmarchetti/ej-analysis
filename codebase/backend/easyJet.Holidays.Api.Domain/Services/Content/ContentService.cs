using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Utils;

namespace easyJet.Holidays.Api.Domain.Services.Content
{
    public class ContentService : IContentService
    {
        private readonly ICmsContentService _cmsContentService = null;

        public ContentService(ICmsContentService cmsContentService)
        {
            _cmsContentService = cmsContentService;
        }

        /// <inheritdoc/>
        public async Task UpdateHealsEntryRequirementsContent(BookingResponse booking)
        {
            var isFlightAndHotel = BookingUtils.IsFlightAndHotelBooking(booking);
            var requirements = await _cmsContentService.GetHealthEntryRequirementsForAirport(
                booking.Package.Transport.Routes.FirstOrDefault(x => x.Direction == Direction.Outbound).ArrPt,
                isFlightAndHotel);
            booking.HealthEntryRequirements = requirements;
        }

        /// <inheritdoc/>
        public async Task UpdateHealsEntryRequirementsContent(List<BookingResponse> bookings)
        {
            // Group bookings by (airportCode, isFlightAndHotel) to deduplicate requests
            var tasks = bookings
                .Select(b => (
                    ArrPt: b.Package.Transport.Routes.FirstOrDefault(x => x.Direction == Direction.Outbound).ArrPt,
                    IsFlightAndHotel: BookingUtils.IsFlightAndHotelBooking(b)
                ))
                .Where(x => !string.IsNullOrEmpty(x.ArrPt))
                .Distinct();

            var arrPts = (await Task.WhenAll(tasks.Select(async x =>
                    new KeyValuePair<(string, bool), List<HealthEntryRequirement>>(
                        x,
                        await _cmsContentService.GetHealthEntryRequirementsForAirport(x.ArrPt, x.IsFlightAndHotel)))))
                .ToDictionary(x => x.Key, x => x.Value);

            foreach (var booking in bookings)
            {
                var key = booking.Package.Transport.Routes.FirstOrDefault(x => x.Direction == Direction.Outbound).ArrPt;
                if (!string.IsNullOrEmpty(key) && arrPts.TryGetValue((key, BookingUtils.IsFlightAndHotelBooking(booking)), out var requirements))
                {
                    booking.HealthEntryRequirements = requirements;
                }
            }
        }
    }
}
