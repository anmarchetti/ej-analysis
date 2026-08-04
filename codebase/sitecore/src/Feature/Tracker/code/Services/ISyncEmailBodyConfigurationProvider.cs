namespace easyJet.Feature.Tracker.Services
{
    public interface ISyncEmailBodyConfigurationProvider
    {
        int InitialMillisecondsDelay { get; set; }

        int MaxConcurrentTasks { get; set; }

        int BatchFailureLimit { get; set; }

        int ResubmissionLimit { get; set; }

        int BatchPortion { get; set; }
    }
}