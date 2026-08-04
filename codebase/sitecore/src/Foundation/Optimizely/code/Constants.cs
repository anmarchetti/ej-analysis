namespace easyJet.Foundation.Optimizely
{
    public static class Constants
    {
        public struct OptimizelySettings
        {
            public const string SdkKey = "Optimizely.SdkKey";
            public const string PollingMinutes = "Optimizely.PollingMinutes";
            public const string UserContextCookieName = "Optimizely.UserContextCookieName";
            public const string ExperimentationSettingsPath = "Optimizely.ExperimentationSettingsPath";
        }

        public struct SiteSettings
        {
            public const string IsOptimizelyExperimentationEnabled = "IsOptimizelyExperimentationEnabled";
            public const string SiteSettingsExperimentsKey = "SiteSettingsExperiments";
            public const string OptimizelyDecisionsKey = "optimizelyDecisions";
            public const string OptimizelyUserIdKey = "optimizelyUserId";
            public const string OptimizelyUserAttributesKey = "optimizelyUserAttributes";
        }
    }
}
