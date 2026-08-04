using easyJet.Holidays.Api.Domain.Data.AmendBooking;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;

/// <summary>
/// Amend luggage, post-booking flow
/// </summary>
public interface IAmendLuggageService
{
    /// <summary>
    /// Change extra luggage in booking
    /// </summary>
    /// <param name="amendLuggageRequest">Request with extra luggage</param>
    Task<AmendLuggageResponse> ChangeExtraLuggage(AmendLuggageRequest amendLuggageRequest);
}