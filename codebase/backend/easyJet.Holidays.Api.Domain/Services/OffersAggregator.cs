using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;

namespace easyJet.Holidays.Api.Domain.Services
{
    /// <summary>
    /// Utiity class to aggregate offers and hotel details
    /// </summary>
    public class OffersAggregator : IOffersAggregator
    {
        private readonly IOfferHotelMapper _offerHotelMapper;

        public OffersAggregator(IOfferHotelMapper offerHotelMapper)
        {
            _offerHotelMapper = offerHotelMapper;
        }

        /// <summary>
        /// Combine Offers with hotels: fill hotel details and filters offers without hotels(removes them and updates total count)
        /// </summary>
        /// <param name="packages">Offers model</param>
        /// <param name="hotels">Hotels model</param>
        /// <returns>Updated offeres model</returns>
        public async Task<SearchOffersResponse> Combine(SearchOffersResponse packages, IEnumerable<Hotel> hotels, BaseSearchRequest request = null)
        {
            if (packages == null || packages.Offers == null)
            {
                return packages;
            }

            // Build map 
            var hotelsById = hotels?.GroupBy(x => x.Code)
                    .ToDictionary(x => x.Key, v => v.First())
                ?? new Dictionary<string, Hotel>();

            foreach (var offer in packages.Offers ?? new List<Offer>())
            {
                var accomCode = offer?.Accom?.Code;
                if (accomCode == null || !hotelsById.TryGetValue(accomCode, out var hotel) || hotel == null)
                {
                    continue;
                }

                offer.Hotel = await _offerHotelMapper.MapWithoutBoardsRooms(hotel, offer?.Accom?.Prom, request);

                // And add rooms and boards information
                foreach (var unit in offer?.Accom?.Unit ?? new List<Unit>())
                {
                    await _offerHotelMapper.EnrichBoardTypeAndRoomType(hotel, unit);
                }
            }

            // not showing offers without info in sitecore
            packages.Offers = packages.Offers.Where(o => o.Hotel != null).ToList();

            return packages;
        }


        /// <inheritdoc />
        public async Task<OfferHotel> EnrichAccomWithHotelInfo(Accom accom, IEnumerable<Hotel> hotels)
        {
            ArgumentNullException.ThrowIfNull(accom);

            var accomCode = accom.Code;
            var hotel = hotels.FirstOrDefault(x => x.Code.Equals(accomCode, StringComparison.Ordinal));
            var canEnrichHotel = accomCode is not null || hotel is not null;
            
            if (canEnrichHotel)
            {
                var result = await _offerHotelMapper.MapWithoutBoardsRooms(hotel, accom.Prom);
                // And add rooms and boards information
                foreach (var unit in accom.Unit ?? new List<Unit>())
                {
                    await _offerHotelMapper.EnrichBoardTypeAndRoomType(hotel, unit);
                }

                return result;
            }

            return null;
        }
    }
}
