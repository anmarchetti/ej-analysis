using System;
using easyJet.Foundation.DynamoDb.Models;
using Sitecore.Configuration;

namespace easyJet.Foundation.DynamoDb.Helpers
{
    public static class AwsDynamoDbTableHelper
    {
        public static string GetTableForModel<T>()
            where T : class
        {
            switch (true)
            {
                case var _ when typeof(T) == typeof(LiveChatMessageAwsDbModel):
                    return Settings.GetSetting(Constants.AwsDynamoDbSettings.Tables.LiveChatMessages);

                case var _ when typeof(T) == typeof(EmailMessageAwsDbModel):
                    return Settings.GetSetting(Constants.AwsDynamoDbSettings.Tables.EmailMessages);

                case var _ when typeof(T) == typeof(SingleUsePromocodeModel):
                    return Settings.GetSetting(Constants.AwsDynamoDbSettings.Tables.SingleUsePromocodes);

                default:
                    throw new ArgumentException($"Can not find table name for {nameof(T)}.");
            }
        }
    }
}
