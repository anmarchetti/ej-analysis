using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;

namespace easyJet.Holidays.Api.Domain.Monitoring.Analytics;

/// <summary>
/// Interface for the analytics service
/// </summary>
public interface IOtelAnalyticsService
{
    /// <summary>
    /// Tracks a new booking event
    /// </summary>
    /// <param name="request">The booking request</param>
    Task TrackNewBookingAsync(BookingRequest request);

    /// <summary>
    /// Tracks a booking amendment event (amend/commit)
    /// </summary>
    /// <param name="request">The amend booking request</param>
    /// <param name="response">The resulting booking</param>
    /// <param name="amendmentType">The resolved amendment type label</param>
    Task TrackAmendBookingAsync(AmendBookingRequest request, BookingResponse response, string amendmentType);

    /// <summary>
    /// Tracks search type discrepancy events when no offers are returned but search price was available
    /// </summary>
    /// <param name="request">Accommodation offer request</param>
    Task TrackSearchDiscrepancyAsync(AccommodationOfferRequest request);

    /// <summary>
    /// Tracks price jump events when the price changes between search results and hotel details
    /// </summary>
    /// <param name="request">Accommodation offer request</param>
    /// <param name="response">The accommodation offers response</param>
    Task TrackPriceJumpSearchResultsDetailsAsync(AccommodationOfferRequest request, AccommodationOffersResponse response);
    
    /// <summary>
    /// Tracks scenarios where NO_TRANSFER is more expensive than other transfer options
    /// </summary>
    /// <param name="offer">The offer containing accommodation and transport details</param>
    Task TrackExpensiveNoTransferAsync(Offer offer);
    
    /// <summary>
    /// Tracks hotels that are not found in the CMS
    /// </summary>
    /// <param name="hotelCode">Hotel code not found in the CMS</param>
    Task TrackHotelNotInCmsAsync(string hotelCode);

    /// <summary>
    /// Track Availability Metrics from Atcom response
    /// </summary>
    /// <param name="request"></param>
    /// <param name="errorReason"></param>
    /// <param name="status"></param>
    /// <returns></returns>
    Task TrackAvailabilityMetricsAsync(ValidateBookingRequest request, string errorReason, string status);

    /// <summary>
    /// Track Availability Metrics from Atcom response
    /// </summary>
    /// <param name="request"></param>
    /// <param name="errorReason"></param>
    /// <param name="status"></param>
    /// <param name="vrpPrice"></param>
    /// <param name="vrpPricePp"></param>
    /// <returns></returns>
    Task TrackPriceJumpAvailabilityMetricsAsync(ValidateBookingRequest request, string errorReason, string status, decimal vrpPrice, decimal vrpPricePp);
    
    /// <summary>
    /// Tracks promo code validation (success or failure)
    /// </summary>
    /// <param name="request">The validation request</param>
    /// <param name="isSuccess">Whether the validation was successful</param>
    /// <param name="errorSource">The source of the error (SITECORE, VOUCHERIFY, ATCOM) - only for failures</param>
    /// <returns></returns>
    Task TrackPromoCodeValidationAsync(ValidateBookingRequest request, bool isSuccess, string errorSource = null);
}