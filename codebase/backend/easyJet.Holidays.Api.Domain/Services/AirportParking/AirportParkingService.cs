using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.AirportParking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.HolidaysExtras;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace easyJet.Holidays.Api.Domain.Services.AirportParking
{
    /// <inheritdoc />
    public class AirportParkingService : IAirportParkingService
    {
        private readonly IItemSearchService _itemSearchService;
        private readonly IHolidayExtrasService _holidayExtrasService;
        private readonly ILogger<AirportParkingService> _logger;

        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="itemSearchService">Service used to communicate with Atcom.</param>
        /// <param name="holidayExtrasService">Service used to communicate with HolidayExtras.</param>
        /// <param name="logger">Logger.</param>
        public AirportParkingService(IItemSearchService itemSearchService, IHolidayExtrasService holidayExtrasService,
            ILogger<AirportParkingService> logger)
        {
            _itemSearchService = itemSearchService;
            _holidayExtrasService = holidayExtrasService;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<AirportParkingResponse> Search(Offer offer)
        {
            var response = new AirportParkingResponse();
            IEnumerable<AirportParkingItem> airportParkingItems =
                (await _itemSearchService.GetAirportParkings(offer))?.Where(x =>
                    !string.IsNullOrWhiteSpace(x?.BookingDetails.ProductCode)).ToList();

            if (airportParkingItems == null)
                return response;

            var mergedData = new ConcurrentBag<AirportParkingItem>();
            await Parallel.ForEachAsync(airportParkingItems, async (item, index) =>
              {
                  if (await MergeInfoFromAtComAndHolidayExtras(item))
                      mergedData.Add(item);
              });
            var index = airportParkingItems
                .Select((item, i) => new { item.Title, i })
                .ToDictionary(x => x.Title, x => x.i);

            foreach (var item in mergedData.OrderBy(i => index[i.Title]))
            {
                response.AirportParkingItems.Add(item);
            }


            return response;
        }

        /// <inheritdoc />
        public async Task EnrichOffersWithParking(IList<Offer> offers, string productCode)
        {
            ArgumentNullException.ThrowIfNull(offers);

            if (string.IsNullOrEmpty(productCode))
                return;

            AirportParkingItem item =
                (await _itemSearchService.GetAirportParkings(offers[0]))?.FirstOrDefault(x =>
                    x.BookingDetails.ProductCode == productCode);

            if (!await MergeInfoFromAtComAndHolidayExtras(item))
            {
                // if no matching element found, we clean up the airport parking item in the offers
                item = null;
            }

            foreach (Offer offer in offers)
            {
                offer.AirportParkingItem = item;
            }
        }

        private async Task<bool> MergeInfoFromAtComAndHolidayExtras(AirportParkingItem item)
        {
            if (item == null)
                return false;

            HolidayExtrasProducts holidayExtrasResults =
                await _holidayExtrasService.GetHolidayExtrasProduct(item.BookingDetails.ProductCode);

            HolidayExtrasProduct product = holidayExtrasResults?.Products?.FirstOrDefault();

            if (product == null)
                return false;

            if (holidayExtrasResults!.Products!.Skip(1).Any())
                _logger.LogWarning("Received more than one products for airport parking item for {ProductCode}.",
                    item.BookingDetails.ProductCode);

            item.Title = !string.IsNullOrEmpty(item.Title) ? item.Title : product.Name;
            item.Description = product.Description ?? string.Empty;
            item.TransferTip = product.TransferTip ?? string.Empty;
            item.IsMeetAndGreet = product.MeetAndGreet == "1";
            item.IsParkAndRide = product.ParkAndRide == "1";
            item.IsParkAndStroll = product.ParkAndStroll == "1";
            item.BrandImage = product.BrandImage != null
                ? new Uri(_holidayExtrasService.GetImagesBaseUrl(), product.BrandImage)
                : null;
            return true;
        }

        /// <inheritdoc />
        public async Task EnrichBookingWithAirportParking(AirportParkingItem airportParkingItem)
        {
            if (airportParkingItem == null) return;

            if (string.IsNullOrEmpty(airportParkingItem.BookingDetails.ProductCode))
                return;

            HolidayExtrasProducts holidayExtrasProducts =
                await _holidayExtrasService.GetHolidayExtrasProduct(airportParkingItem.BookingDetails.ProductCode);

            List<HolidayExtrasProduct> products = holidayExtrasProducts?.Products?.Take(2).ToList();
            if (products == null || products.Count == 0)
                return;

            HolidayExtrasProduct product = products[0];

            if (products.Count > 1)
            {
                _logger.LogWarning("Received more than one products for airport parking item for {ProductCode}.",
                    airportParkingItem.BookingDetails.ProductCode);
            }


            airportParkingItem.Title ??= product.Name;
            airportParkingItem.Address = product.Address;
        }
    }
}