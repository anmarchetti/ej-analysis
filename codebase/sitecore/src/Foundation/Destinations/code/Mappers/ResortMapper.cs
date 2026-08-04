using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Responses;

namespace easyJet.Foundation.Destinations.Mappers
{
    public static class ResortMapper
    {
        public static IEnumerable<ResortResponse> MapFromHotels(IEnumerable<Hotel> hotels, bool includeHotelCoordinates = false)
        {
            var resortItems = new Dictionary<string, ResortResponse>();
            foreach (var hotel in hotels)
            {
                resortItems.TryGetValue(hotel.Resort.Code, out var resort);
                if (resort == null)
                {
                    resort = new ResortResponse
                    {
                        CountryCode = hotel.Country?.Code,
                        Hotels = new List<HotelResponse>(),
                        ResortCode = hotel.Resort.Code,
                        ResortName = hotel.Resort.Name,
                        Theme = hotel.HotelTheme?.Name
                    };
                    resortItems.Add(hotel.Resort.Code, resort);
                }

                var hotelResponse = new HotelResponse
                {
                    HotelName = hotel.ItemName,
                    HotelCode = hotel.GiataCode,
                    IATA = hotel.AirportCodes
                };

                if (includeHotelCoordinates)
                {
                    hotelResponse.Longitude = hotel.Longitude;
                    hotelResponse.Latitude = hotel.Latitude;
                }

                resort.Hotels.Add(hotelResponse);
            }

            return resortItems.Values;
        }
    }
}
