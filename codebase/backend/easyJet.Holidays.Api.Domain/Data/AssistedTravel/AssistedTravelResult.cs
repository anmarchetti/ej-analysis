#nullable enable

namespace easyJet.Holidays.Api.Domain.Data.AssistedTravel
{
    /// <summary>
    /// Represents the outcome of retrieving Assisted Travel data from Salesforce.
    /// </summary>
    public record AssistedTravelResult
    {
        /// <summary>
        /// Indicates whether retrieval completed without any partial-data warnings.
        /// </summary>
        public bool IsSuccessful { get; init; }

        /// <summary>
        /// Contains a retrieval or mapping warning when the response is partial.
        /// </summary>
        public string? ErrorMessage { get; init; }

        /// <summary>
        /// Gets the date/time when the assisted travel request case was created.
        /// </summary>
        public DateTimeOffset? RequestedAt { get; init; }

        /// <summary>
        /// Gets the Salesforce case identifier when one exists.
        /// </summary>
        public string? CaseId { get; init; }

        /// <summary>
        /// Gets the booking reference returned by Salesforce.
        /// </summary>
        public string? BookingReference { get; init; }

        /// <summary>
        /// Gets passenger-level Assisted Travel data for the booking.
        /// </summary>
        public IReadOnlyList<AssistedTravelPassengerResult> Passengers { get; init; } = [];
    }

    /// <summary>
    /// Represents Assisted Travel data for a single passenger.
    /// </summary>
    public record AssistedTravelPassengerResult
    {
        /// <summary>
        /// Gets the passenger name returned by Salesforce.
        /// </summary>
        public string PassengerName { get; init; } = string.Empty;

        /// <summary>
        /// Gets question and answer rows returned for this passenger.
        /// </summary>
        public IReadOnlyList<AssistedTravelQuestionAnswerResult> QuestionsAndAnswers { get; init; } = [];

        /// <summary>
        /// Gets the distinct assistance types recorded for the passenger.
        /// </summary>
        public IReadOnlyList<string> AssistanceTypes { get; init; } = [];

        /// <summary>
        /// Gets the earliest date/time when a question/answer was recorded for this passenger.
        /// </summary>
        public DateTimeOffset? RequestedAt { get; init; }

        /// <summary>
        /// Indicates whether the passenger has at least one assisted travel request recorded.
        /// </summary>
        public bool HasRequest => QuestionsAndAnswers.Count > 0 || AssistanceTypes.Count > 0;
    }

    /// <summary>
    /// Represents one question/answer row for assisted travel.
    /// </summary>
    public record AssistedTravelQuestionAnswerResult
    {
        /// <summary>
        /// Gets the question text.
        /// </summary>
        public string Question { get; init; } = string.Empty;

        /// <summary>
        /// Gets the answer text.
        /// </summary>
        public string Answer { get; init; } = string.Empty;

        /// <summary>
        /// Gets the date/time when this question/answer was created.
        /// </summary>
        public DateTimeOffset? RequestedAt { get; init; }
    }
}
