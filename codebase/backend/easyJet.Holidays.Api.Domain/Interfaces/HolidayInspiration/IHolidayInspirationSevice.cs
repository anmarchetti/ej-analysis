using easyJet.Holidays.Api.Domain.Data.RecommendedDestination;
namespace easyJet.Holidays.Api.Domain.Interfaces.HolidayInspiration;
public interface IHolidayInspirationSevice
{
    /// <summary>
    /// Get recommended destinations for holiday inspiration.
    /// </summary>
    /// <param name="request">Wider search request criteria.</param>
    /// <returns>Collection of recommended destinations.</returns>
    Task<RecommendedDestinationResponse> GetRecommendedDestinations(RecommendedDestinationsRequest request);

    /// <summary>
    /// Validate users answers in holiday inspiration quiz.
    /// </summary>
    /// <param name="request">Request criteria.</param>
    /// <returns>Recommended questions.</returns>
    Task<RecommendedQuestions> ValidateAnswers(ValidateRecommendedRequest request);
}