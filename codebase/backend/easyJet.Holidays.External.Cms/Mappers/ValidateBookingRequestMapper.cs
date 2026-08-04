using easyJet.Holidays.External.Cms.Models.Common;
using easyJet.Holidays.External.Cms.Models.Promotion;

namespace easyJet.Holidays.External.Cms.Mappers
{
    public class ValidateBookingRequestMapper
    {
        public static IEnumerable<ValidateCmsBooking> MapFromValidateBookingRequest(List<ValidatePromotionBase> requests, Dictionary<string, List<DatasourceObject>> destinationsByHotel)
        {
            foreach (var request in requests)
            {
                yield return new ValidateCmsBooking()
                {
                    Airport = request.Airport,
                    BoardType = request.BoardType,
                    BookingDate = request.BookingDate,
                    DepartureDate = request.DepartureDate,
                    ReturnDate = request.ReturnDate,
                    Duration = request.Duration,
                    HolidayTheme = request.HolidayTheme,
                    HolidayType = request.HolidayType,
                    HotelType = request.HotelType,
                    PromoCollectionCode = request.PromoCollectionCode,
                    NAdults = request.NAdults,
                    NChildren = request.NChildren,
                    NInfants = request.NInfants,
                    TotalPrice = request.Price,
                    PerPersonPrice = request.PricePP,
                    VoucherCode = request.VoucherCode,
                    HotelCode = request.HotelCode,
                    Destinations = GetDestinations(request.HotelCode),
                    Id = request.Id,
                };
            }

            List<DatasourceObject> GetDestinations(string hotelCode)
            {
                if (string.IsNullOrEmpty(hotelCode))
                {
                    return new List<DatasourceObject>();
                }

                destinationsByHotel.TryGetValue(hotelCode, out var destinations);

                return destinations ?? new List<DatasourceObject>();
            }
        }
    }
}