using System.Diagnostics.CodeAnalysis;
using Sitecore.Configuration;

namespace easyJet.Feature.Tracker.Services
{
    [ExcludeFromCodeCoverage]
    public class SyncEmailBodyConfigurationProvider : ISyncEmailBodyConfigurationProvider
    {
        public int InitialMillisecondsDelay { get; set; } = 500;

        public int MaxConcurrentTasks { get; set; } = Settings.GetIntSetting(Constants.Performance.MaxConcurrentTasks, 7);

        public int BatchFailureLimit { get; set; } = Settings.GetIntSetting(Constants.Performance.BatchFailureLimit, 20);

        public int ResubmissionLimit { get; set; } = Settings.GetIntSetting(Constants.Performance.ResubmissionLimit, 10);

        public int BatchPortion { get; set; } = Settings.GetIntSetting(Constants.Performance.BatchPortion, 10);
    }
}