#nullable enable

namespace easyJet.Holidays.Api.Domain.Data.AssistedTravel
{
    /// <summary>
    /// Assisted Travel submission payload.
    /// </summary>
    public record AssistedTravelSubmissionRequest
    {

        /// <summary>
        /// Lead passenger free-text description.
        /// </summary>
        public string? Description { get; init; }

        /// <summary>
        /// Passenger questionnaire answers.
        /// </summary>
        public IReadOnlyList<AssistedTravelPassengerSubmission> Passengers { get; init; } = [];
    }

    /// <summary>
    /// Submission payload for a single passenger.
    /// </summary>
    public record AssistedTravelPassengerSubmission
    {
        /// <summary>
        /// Passenger display name.
        /// </summary>
        public string PassengerName { get; init; } = string.Empty;

        /// <summary>
        /// Question and answer entries for this passenger.
        /// </summary>
        public IReadOnlyList<AssistedTravelQuestionAnswer> QuestionsAndAnswers { get; init; } = [];
    }

    /// <summary>
    /// Question and answer pair.
    /// </summary>
    public record AssistedTravelQuestionAnswer
    {
        /// <summary>
        /// Question text.
        /// </summary>
        public string Question { get; init; } = string.Empty;
        
        /// <summary>
        /// Question code to identify the question in Salesforce.
        /// </summary>
        public string QuestionCode { get; init; } = string.Empty;

        /// <summary>
        /// Answer text.
        /// </summary>
        public string Answer { get; init; } = string.Empty;
    }

    /// <summary>
    /// Assisted Travel submission result.
    /// </summary>
    public record AssistedTravelSubmissionResult
    {
        /// <summary>
        /// Indicates whether Salesforce accepted the submission.
        /// </summary>
        public bool IsSuccessful { get; init; }

        /// <summary>
        /// Salesforce case id used for submission.
        /// </summary>
        public string? CaseId { get; init; }

        /// <summary>
        /// Total number of questionnaire records submitted.
        /// </summary>
        public int SubmittedQuestionsCount { get; init; }

        /// <summary>
        /// Error details when submission fails.
        /// </summary>
        public string? ErrorMessage { get; init; }
    }
}

