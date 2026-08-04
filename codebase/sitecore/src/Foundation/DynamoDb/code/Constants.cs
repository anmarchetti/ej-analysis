namespace easyJet.Foundation.DynamoDb
{
    public static class Constants
    {
        public static class AwsDynamoDbSettings
        {
            public struct Tables
            {
                public const string EmailMessages = "AwsDynamoDb.Tables.EmailMessages";
                public const string LiveChatMessages = "AwsDynamoDb.Tables.LiveChatMessages";
                public const string SingleUsePromocodes = "AwsDynamoDb.Tables.SingleUsePromocodes";
            }

            public struct Batching
            {
                public const int DefaultBatchSize = 100;
            }

            public struct Settings
            {
                public const string RegionSettingsName = "AwsDynamoDb.Region";
            }
        }
    }
}
