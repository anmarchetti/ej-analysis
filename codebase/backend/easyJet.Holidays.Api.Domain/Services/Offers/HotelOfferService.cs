using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Offers
{
    public class HotelOfferService : IHotelOfferService
    {
        private readonly IBookingCreateService _bookingService;
        private readonly AtcomSettings _atcomSettings;
        private readonly IHotelsService _hotelsService;
        private readonly IOfferHotelMapper _offerHotelMapper;
        private readonly IAirportsMapper _airportsMapper;
        private readonly ILogger<HotelOfferService> _logger;

        public HotelOfferService(
            IBookingCreateService bookingService,
            IOptions<AtcomSettings> atcomSettings,
            IHotelsService hotelsService,
            IOfferHotelMapper offerHotelMapper,
            IAirportsMapper airportsMapper,
            ILogger<HotelOfferService> logger)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _bookingService = bookingService;
            _hotelsService = hotelsService;
            _offerHotelMapper = offerHotelMapper;
            _airportsMapper = airportsMapper;
            _logger = logger;
        }

        /// <summary>
        /// If transfer code is not synthetic and not default we should replace offer transfer with specified code
        /// </summary>
        /// <param name="offer"></param>
        /// <param name="transferCode"></param>
        /// <returns>Whether offer transfer was updated or not</returns>
        public bool SetOfferTransfer(Offer offer, string transferCode)
        {
            if (string.IsNullOrEmpty(transferCode))
            {
                return false;
            }

            // if Offer has no transfers and transferCode is synthetic then we don't need to recalculate price
            if (offer.Transfers?.Count == 0 && transferCode == _atcomSettings.Transfers.Types.SyntheticNoTransfer)
            {
                return false;
            }

            // If request has transfer code we have to download and validate it
            // Offers should have default transfers.
            // So we need to fetch transfers only if code is different
            var recalculatePrice = offer.Transfers?.Select(t => t.Code)?.Contains(transferCode) == false;
            if (!recalculatePrice)
            {
                return false;
            }

            // Also change offer transfers. Assumet we have one trasnfer for all
            // We have to do it because this offer object is used further for other requests
            offer.Transfers = new List<TransferItem> {
                new TransferItem {
                    Code = transferCode
                }
            };

            return true;
        }

        /// <summary>
        /// Atcom can't give us price for selected transfer, only for default.
        /// If we need offer with non-default transfer we should validate package
        /// </summary>
        /// <param name="offer"></param>
        /// <returns></returns>
        public async Task RecalculateOfferPriceWithTransfer(Offer offer)
        {
            // Finally we are here and should do super slow request to get price
            var validateResponse = await _bookingService.Validate(new ValidateBookingRequest
            {
                ExtraLuggageInfo = offer.ExtraLuggageInfo,
                Offer = offer,
                Guests = BuildGuests(offer.Accom.Unit)
            }, false, null, true);

            offer.Price = (decimal)validateResponse.PaymentInfo.TotalPrice;
            offer.PricePP = (decimal)validateResponse.PaymentInfo.PricePP;
        }

        /// <inheritdoc />
        public async Task<Offer> EnrichOfferWithCmsHotelData(Offer offer)
        {

            var hotels = await _hotelsService.Search(new[] { offer.Accom.Code });
            var hotel = hotels.FirstOrDefault();

            if (hotel == null)
            {
                _logger.LogError("No hotel data for accommodation: {AccomId}", offer.Accom.Code);
                throw new ArgumentNullException($"No hotel data for accommodation: {offer.Accom.Code}");
            }

            var enrichedOffers = await _offerHotelMapper.BuildAccommodationOffers(hotel, new List<Offer> { offer });

            var result = enrichedOffers.Offers;

            await _airportsMapper.EnrichAirportDetails(result);

            return result.First();
        }

        public async Task EnrichHotelData(Offer offer)
        {
            var hotels = await _hotelsService.Search(new[] { offer.Accom.Code });
            var hotel = hotels.FirstOrDefault();

            if (hotel is null)
            {
                _logger.LogError("No hotel data for accommodation: {AccomId}", offer.Accom.Code);
                throw new ArgumentNullException($"No hotel data for accommodation: {offer.Accom.Code}");
            }

            var hotelData = await _offerHotelMapper.MapWithoutBoardsRooms(hotel, offer?.Accom?.Prom);
            offer.Accom.Theme = hotelData.Theme;
            offer.Accom.Type = hotelData.Type;
            offer.Hotel = new OfferHotel { HotelType = hotelData.HotelType };
        }

        /// <summary>
        /// Build guests stubs for validate request based on room allocations
        /// </summary>
        /// <param name="units"></param>
        /// <returns></returns>
        private List<Person> BuildGuests(List<Unit> units)
        {
            var guests = new List<Person>();
            foreach (var unit in units)
            {
                for (var i = 0; i < unit.Occupation.Adults; i++)
                {
                    guests.Add(new Person
                    {
                        Type = PersonType.Adult,
                        Age = 30, // 30 is default age
                    });
                }

                for (var i = 0; i < unit.Occupation.Children; i++)
                {
                    guests.Add(new Person
                    {
                        Type = PersonType.Child,
                        Age = unit.Occupation.ChildAges.Count >= i + 1 ? (int)unit.Occupation.ChildAges[i] : 2,// 2 is default age for child if not specified
                    });
                }

                for (var i = 0; i < unit.Occupation.Infants; i++)
                {
                    guests.Add(new Person
                    {
                        Type = PersonType.Infant,
                    });
                }
            }

            return guests;
        }
    }
}
