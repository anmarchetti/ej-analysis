using easyJet.Holidays.Api.Domain.Data.Guests;

namespace easyJet.Holidays.Api.Domain.Services.Luggage;

/// <summary>
/// Calculator to get passenger indexes
/// </summary>
public interface IPassengerIndexCalculator
{
    /// <summary>
    /// Calculate passenger index in round robin manner, adults, then children, then infants
    /// </summary>
    int CalculatePassengerIndex(PersonType personType, int adultsNumber, int childrenNumber, int infantsNumber);
}