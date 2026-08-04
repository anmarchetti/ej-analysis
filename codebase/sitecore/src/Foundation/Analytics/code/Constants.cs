using Sitecore.Data;

namespace easyJet.Foundation.Analytics
{
    public class Constants
    {
        public struct Common
        {
            public const string NumericTrueValue = "1";
            public const string NumericFalseValue = "0";
        }

        public struct Pipelines
        {
            public const string StartAnalyticsForce = "StartAnalytics_ForceStart";
        }

        public struct Tracking
        {
            public const string DefaultIdentifierSource = "digital";
            public const string PreferredPhoneNumberKey = "default";
            public const string PreferredEmailKey = "default";
            public const string PushNotificationsSource = "pushnotifications";
        }

        public struct Profile
        {
            public const string PatternCards = "Pattern Cards";
            public const string ProfileCards = "Profile Cards";

            public struct Attributes
            {
                public const string Name = "name";
                public const string Id = "id";
                public const string Key = "key";
                public const string Value = "value";
            }
        }

        public struct Templates
        {
            public struct AnalyticSettings
            {
                public static readonly ID ID = new ID("{86F2AC20-FDB7-4279-847B-93D097F9AD2C}");

                public struct Fields
                {
                    public const string EnablePersonalization = "EnablePersonalization";
                }
            }
        }
    }
}