using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.Hotel;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;

namespace easyJet.Holidays.Api.Domain.Interfaces.Offers
{
    /// <summary>
    /// Accommodation offers service
    /// </summary>
    public interface IAccommodationOfferService
    {
        /// <summary>
        /// Do Atcom search type 6 request to build accommodation offer.
        /// It ignores all offers except first one because otherwise it can't merge results properly.
        /// The reason or merging is that s_tp=6 doesn't support multiple rooms, only single room.
        /// </summary>
        /// <param name="request">Request model</param>
        /// <returns>Collection of accommodation offers</returns>
        Task<SearchOffersResponse> SearchAccommodationOffer(AccommodationOfferRequest request);

        /// <summary>
        /// Get offer and enrich with transfer information, cms data.
        /// Uses <see cref="SearchAccommodationOffer"/> to get offer.
        /// Throws <see cref="ArgumentNullException"/> if there is no hotel in CMS.
        /// </summary>
        /// <param name="request">Search request</param>
        /// <returns></returns>
        Task<AccommodationOffersResponse> BuildOffer(AccommodationOfferRequest request);

        /// <summary>
        /// Search room variants for specified accommodation
        /// </summary>
        /// <param name="request">Request parameters</param>
        /// <returns>List of offers with room types</returns>
        Task<RoomVariantsResponse> RoomVariants(RoomVariantsSearchRequest request);

        /// <summary>
        /// Search alternative flights for specified accommodation
        /// </summary>
        /// <param name="request">Request parameters</param>
        /// <returns>List of offers with room types</returns>
        Task<SearchOffersResponse> AlternativeFlights(AlternativeFlightsSearchRequest request);

        /// <summary>
        /// Search alternative flights for specified accommodation
        /// </summary>
        /// <param name="request">Request parameters</param>
        /// <param name="packageThemeType"></param>
        /// <returns>List of offers with room types</returns>
        Task<SearchOffersResponse> AlternativeFlights(AmendFlightSearchRequest request,
            PackageThemeType packageThemeType);

        /// <summary>
        /// Search offers prices for specified accommodation
        /// </summary>
        /// <param name="request">Request parameters</param>
        /// <returns>List of alternative offers</returns>
        Task<PriceGraphResponse> PriceGraph(PriceGraphRequest request);

        /// <summary>
        /// Search offers prices for specified accommodation for mointh range
        /// </summary>
        /// <param name="request">Request parameters</param>
        /// <returns>List of alternative offers</returns>
        Task<PriceGraphResponse> PriceGraph(PriceGraphMonthRequest request);

        /// <summary>
        /// Search alternative hotels.
        /// </summary>
        /// <param name="alternativeHotelsSearchRequest" cref="AlternativeHotelsSearchRequest">The alternative hotels search request.</param>
        /// <param name="packagesSearchRequest" cref="PackagesSearchRequest">Parameter to apply filters to offers.</param>
        /// <returns>List of alternative hotel offers.</returns>
        Task<SearchOffersResponse> AlternativeHotels(AlternativeHotelsSearchRequest alternativeHotelsSearchRequest, PackagesSearchRequest packagesSearchRequest);

        /// <summary>
        /// Search alternative rooms for hotel.
        /// </summary>
        /// <param name="alternativeHotelRoomsSearchRequest">Search type 26 request.</param>
        /// <returns>Alternative offers.</returns>
        Task<SearchOffersResponse> AlternativeHotelRooms(AlternativeHotelRoomsSearchRequest alternativeHotelRoomsSearchRequest);
    }
}