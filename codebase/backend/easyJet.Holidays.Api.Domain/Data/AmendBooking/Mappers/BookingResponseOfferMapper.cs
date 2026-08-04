using System.Globalization;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers
{
    public class BookingResponseOfferMapper : IBookingResponseOfferMapper
    {
        private readonly ILogger<BookingResponseOfferMapper> _logger;

        public BookingResponseOfferMapper(ILogger<BookingResponseOfferMapper> logger)
        {
            _logger = logger;
        }

        public Offer Map(BookingResponse bookingResponse)
        {
            if (bookingResponse == null)
            {
                _logger.LogError($"{nameof(bookingResponse)} is null");
                return null;
            }

            if (!DateTime.TryParse(bookingResponse.Package?.Accom?.StartDate, CultureInfo.InvariantCulture, out var startDateTime))
            {
                _logger.LogError($"Can't parse {nameof(bookingResponse.Package.Accom.StartDate)}");
                return null;
            }

            if (!DateTime.TryParse(bookingResponse.Package?.Accom?.EndDate, CultureInfo.InvariantCulture, out var endDateTime))
            {
                _logger.LogError($"Can't parse {nameof(bookingResponse.Package.Accom.EndDate)}");
                return null;
            }

            var offer = new Offer
            {
                Accom = new Accom
                {
                    Code = bookingResponse.Package?.Accom?.Code,
                    Id = bookingResponse.Package?.Accom?.Code,
                    Unit = bookingResponse.Package?.Accom?.Rooms,
                    IsExternal = bookingResponse.Package?.Accom?.IsExt ?? false,
                    Date = startDateTime,
                    Stay = (byte)(endDateTime - startDateTime).Days,
                    Prom = bookingResponse.Package?.Accom?.Prom,
                    PackageId = bookingResponse.BookingReference
                },
                Transport = bookingResponse.Package?.Transport,
                Transfers = bookingResponse.Transfers,
                Currency = bookingResponse.Currency,
                SeatSelection = bookingResponse.SeatSelection,
                ExtraLuggageInfo = bookingResponse.ExtraLuggageInfo
            };

            return offer;
        }
    }
}
