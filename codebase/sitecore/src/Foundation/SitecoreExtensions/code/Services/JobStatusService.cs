using Sitecore;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// Default implementation of <see cref="IJobStatusService"/> that uses Sitecore's Context.Job.
    /// </summary>
    public class JobStatusService : IJobStatusService
    {
        /// <inheritdoc/>
        public bool HasActiveJob => Context.Job != null;

        /// <inheritdoc/>
        public void AddStatusMessage(string message)
        {
            Context.Job?.Status.Messages.Add(message);
        }
    }
}
