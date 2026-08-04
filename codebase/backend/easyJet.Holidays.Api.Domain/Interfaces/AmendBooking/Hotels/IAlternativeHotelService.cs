using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Hotels;

/// <summary>
/// Alternative hotel service
/// </summary>
public interface IAlternativeHotelService
{
    /// <summary>
    /// Enrich offer with hotel information.
    /// </summary>
    /// <param name="searchOffersResponse" cref="SearchOffersResponse">Atcom cache response</param>
    Task EnrichHotelsInformation(SearchOffersResponse searchOffersResponse);

    /// <summary>
    /// Build amend hotel list from atcom cache response offers.
    /// </summary>
    /// <param name="booking" cref="BookingResponse">Current booking.</param>
    /// <param name="alternativeHotelList" cref="SearchOffersResponse">Alternative hotel options from Atcom cache.</param>
    /// <returns cref="GetAmendHotelListResponse">Hotel list with filter metadata.</returns>
    GetAmendHotelListResponse BuildAmendHotelListResponse(BookingResponse booking,
        SearchOffersResponse alternativeHotelList);

    /// <summary>
    /// Create alternative hotel search request to Atcom cache.
    /// </summary>
    /// <param name="bookingResponse" cref="BookingResponse">Current booking.</param>
    /// <returns cref="AlternativeHotelsSearchRequest">Alternative hotel list request object.</returns>
    AlternativeHotelsSearchRequest CreateAlternativeHotelsSearchRequest(BookingResponse bookingResponse);

    /// <summary>
    /// Create alternative hotel rooms search request to Atcom cache.
    /// </summary>
    /// <param name="bookingResponse" cref="BookingResponse">Current booking.</param>
    /// <param name="amendHotelOffer" cref="AmendHotelOffer">Selected hotel offer.</param>
    /// <returns cref="CreateAlternativeHotelRoomsSearchRequest">Alternative hotel rooms and board request object.</returns>
    AlternativeHotelRoomsSearchRequest CreateAlternativeHotelRoomsSearchRequest(BookingResponse bookingResponse, AmendHotelOffer amendHotelOffer);

    /// <summary>
    /// Response builder for hotel change
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <param name="validateAmendBookingResponse"></param>
    /// <param name="alternativePackage"></param>
    /// <param name="requestAmendHotelOffer"></param>
    /// <returns></returns>
    Task<AmendHotelResponse> BuildAmendHotel(BookingResponse bookingResponse,
        ValidateAmendBookingResponse validateAmendBookingResponse, AmendHotelOffer alternativePackage,
        AmendHotelOffer requestAmendHotelOffer);

    /// <summary>
    /// Map search request to package search request to apply filters
    /// </summary>
    /// <param name="parameters" cref="SearchParameters">Search parameters</param>
    /// <param name="booking">Booking</param>
    /// <returns cref="PackagesSearchRequest">Parameter to apply filters to offers.</returns>
    Task<PackagesSearchRequest> BuildPackageSearchRequest(SearchParameters parameters, BookingResponse booking);
}