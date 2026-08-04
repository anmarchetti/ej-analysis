using Amazon.DynamoDBv2.DataModel;
using CsvHelper.Configuration.Attributes;
using easyJet.Holidays.Api.Domain.Data.Marketing;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.Marketing
{
    public class MarketingPreferencesScreened : MarketingPreferences
    {
        [DynamoDBProperty]
        [Name("PassedScreening")] //name of column in input csv file
        public string Status { get; set; }

        /// <summary>
        /// Property from airline
        /// </summary>
        [DynamoDBProperty]
        [Name("Marketable")] //name of column in input csv file
        public string MarketingOptions { get; set; }

        /// <summary>
        /// Time-to-Live property
        /// </summary>
        [DynamoDBProperty(StoreAsEpochLong = true)]
        [Ignore] //ignore in csv file
        public DateTime? TTL { get; set; }

        public override string ToString()
        {
            return $"{Email} : {Status}";
        }
    }
}