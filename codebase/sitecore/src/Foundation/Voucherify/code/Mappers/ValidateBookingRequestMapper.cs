using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Requests;
using Newtonsoft.Json;

namespace easyJet.Foundation.Voucherify.Mappers
{
    [Service(typeof(IValidateBookingRequestMapper), Lifetime = Lifetime.Singleton)]
    public class ValidateBookingRequestMapper : IValidateBookingRequestMapper
    {
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IVoucherifyLogger logger;

        public ValidateBookingRequestMapper(IDestinationsRepository destinationsRepository, IVoucherifyLogger logger)
        {
            this.destinationsRepository = destinationsRepository;
            this.logger = logger;
        }

        public IEnumerable<ValidateBooking> MapFromValidateBookingRequest(ValidateBookingRequest[] requests)
        {
            var hotelCodes = requests.Select(x => x.HotelCode).ToArray();
            var destinationsByHotel = GetDestinationsByHotel(hotelCodes);

            foreach (var request in requests)
            {
                yield return new ValidateBooking()
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

        private Dictionary<string, List<DatasourceObject>> GetDestinationsByHotel(string[] hotelCodes)
        {
            var destinations = new Dictionary<string, List<DatasourceObject>>();

            if (hotelCodes.Length < 1)
            {
                return destinations;
            }

            var data = destinationsRepository.SearchHotelsByCodes(hotelCodes);

            if (data == null)
            {
                return destinations;
            }

            foreach (var hit in data.Hits)
            {
                var document = hit?.Document;
                if (document != null)
                {
                    foreach (var code in document.SourceCodes)
                    {
                        if (destinations.ContainsKey(code))
                        {
                            logger.Error($"[{nameof(ValidateBookingRequestMapper)}-{nameof(GetDestinationsByHotel)}] Duplicate Hotel code={code}, itemId={hit.Document.ItemId}", this);
                            continue;
                        }

                        // Add destination data: country, region, resort, hotel.
                        destinations.Add(code, new List<DatasourceObject>()
                            {
                                JsonConvert.DeserializeObject<DatasourceObject>(document.HotelCountry),
                                JsonConvert.DeserializeObject<DatasourceObject>(document.HotelLocation),
                                JsonConvert.DeserializeObject<DatasourceObject>(document.HotelResort),
                                new DatasourceObject()
                                {
                                    Code = code,
                                    Name = document.Name,
                                    ItemName = document.ItemName,
                                    Type = document.TemplateName
                                }
                            });
                    }
                }
            }

            return destinations;
        }
    }
}