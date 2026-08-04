namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// Service for reporting job status messages.
    /// Abstracts Sitecore's Context.Job to make code testable.
    /// </summary>
    public interface IJobStatusService
    {
        /// <summary>
        /// Adds a status message to the current job.
        /// </summary>
        /// <param name="message">The message to add.</param>
        void AddStatusMessage(string message);

        /// <summary>
        /// Gets a value indicating whether there is an active job context.
        /// </summary>
        bool HasActiveJob { get; }
    }
}
