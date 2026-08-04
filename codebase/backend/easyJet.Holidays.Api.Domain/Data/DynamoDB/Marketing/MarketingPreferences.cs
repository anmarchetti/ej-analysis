using Amazon.DynamoDBv2.DataModel;
using CsvHelper.Configuration.Attributes;

namespace easyJet.Holidays.Api.Domain.Data.Marketing
{
    public class MarketingPreferences
    {
        private string _email;

        [DynamoDBHashKey]
        [Name("EmailAddress")] //name of column in input csv file
        public string Email
        {
            get => _email.ToLowerInvariant();
            set => _email = value.ToLowerInvariant(); //store in dynamo db emails in lower case only
        }
    }
}