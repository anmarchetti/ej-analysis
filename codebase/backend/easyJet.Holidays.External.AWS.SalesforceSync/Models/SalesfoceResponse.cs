using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Models
{
    /// <summary>
    /// Represents the response returned from Salesforce after invoking a booking flow.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class SalesforceResponse
    {
        /// <summary>
        /// Gets or sets the name of the Salesforce action or flow that was executed.
        /// </summary>
        public string? ActionName { get; set; }

        /// <summary>
        /// Gets or sets any error messages returned as a single string (concatenated if multiple).
        /// </summary>
        public string? Errors { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the Salesforce request completed successfully.
        /// </summary>
        public bool IsSuccess { get; set; }

        /// <summary>
        /// Gets or sets the detailed output values including any success or error results.
        /// </summary>
        public OutputValues? OutputValues { get; set; }
    }

    /// <summary>
    /// Encapsulates output collections and status from the Salesforce flow.
    /// </summary>
    public class OutputValues
    {
        /// <summary>
        /// Gets or sets the list of error results returned by the flow.
        /// </summary>
#pragma warning disable CA1819
        public ErrorResult[]? ErrorResult { get; set; }
#pragma warning restore CA1819

        /// <summary>
        /// Gets or sets the list of successful results returned by the flow.
        /// </summary>
#pragma warning disable CA1819
        public SuccessResult[]? SuccessResult { get; set; }
#pragma warning restore CA1819

        /// <summary>
        /// Gets or sets the interview status of the flow execution (e.g., "Finished", "Paused").
        /// </summary>
        public string? FlowInterviewStatus { get; set; }
    }

    /// <summary>
    /// Represents an individual error entry from the Salesforce flow.
    /// </summary>
    public class ErrorResult
    {
        /// <summary>
        /// Gets or sets a value indicating whether this specific result is marked as success (typically false for errors).
        /// </summary>
        public bool IsSuccess { get; set; }

        /// <summary>
        /// Gets or sets a human-readable description of the error.
        /// </summary>
        public string? ErrorDescription { get; set; }

        /// <summary>
        /// Gets or sets the unique error code returned by Salesforce.
        /// </summary>
        public string? ErrorCode { get; set; }

        /// <summary>
        /// Gets or sets the category or type of the error (validation, flow, system, etc.).
        /// </summary>
        public string? ErrorCategory { get; set; }

        /// <summary>
        /// Gets or sets the name of the component within the flow where the error occurred.
        /// </summary>
        public string? ComponentName { get; set; }
    }

    /// <summary>
    /// Represents an individual successful entry from the Salesforce flow.
    /// </summary>
    public class SuccessResult
    {
        /// <summary>
        /// Gets or sets the reservation identifier returned by Salesforce.
        /// </summary>
        public string? ReservationId { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether this specific result is marked as success.
        /// </summary>
        public bool IsSuccess { get; set; }

        /// <summary>
        /// Gets or sets the Salesforce booking record identifier (Salesforce ID).
        /// </summary>
        public string? BookingSFId { get; set; }
    }
}
