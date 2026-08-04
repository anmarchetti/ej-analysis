using Amazon.DynamoDBv2.DataModel;
using CsvHelper.Configuration.Attributes;

namespace easyJet.Holidays.Api.Domain.Data.FlightPriceStore
{
    public class FlightPriceStoreModel
    {
        private readonly string _dateTimeFormat = "s";

        [DynamoDBHashKey]
        [Ignore] //ignore in csv file
        public string ID { get; set; }
        [DynamoDBGlobalSecondaryIndexHashKey("FlightKey-index")]
        [Name("Flight key")] // csv property name
        public string FlightKey { get; set; }
        [DynamoDBProperty]
        [Name("Departure point")]
        public string Departure { get; set; }
        [DynamoDBProperty]
        [Name("Arrival point")]
        public string Arrival { get; set; }
        [DynamoDBProperty]
        [Name("Flight number")]
        public string FlightNumber { get; set; }
        [DynamoDBProperty]
        [Name("Carrier code")]
        public string CarrierCode { get; set; }
        [DynamoDBProperty]
        [Ignore]
        public DateTime? LocalDepartureDateTime { get; set; }

        [Name("Local departure date/time")]
        [DynamoDBIgnore]
        public string LocalDepartureDateTimeFormatted => LocalDepartureDateTime?.ToString(_dateTimeFormat);
        [DynamoDBProperty]
        [Ignore]
        public DateTime? LocalArrivalDateTime { get; set; }
        [Name("Local arrival date/time")]
        [DynamoDBIgnore]
        public string LocalArrivalDateTimeFormatted => LocalArrivalDateTime?.ToString(_dateTimeFormat);
        [DynamoDBProperty]
        [Name("Currency")]
        public string Currency { get; set; }
        [DynamoDBProperty]
        [Name("Outbound adult flight price")]
        public double OutboundAdultFlightPrice { get; set; }
        [DynamoDBProperty]
        [Name("Outbound child flight price")]
        public double OutboundChildFlightPrice { get; set; }
        [DynamoDBProperty]
        [Name("Inbound adult flight price")]
        public double InboundAdultFlightPrice { get; set; }
        [DynamoDBProperty]
        [Name("Inbound child flight price")]
        public double InboundChildFlightPrice { get; set; }
        [DynamoDBProperty]
        [Name("Fare type")]
        public string FareType { get; set; }
        [DynamoDBProperty]
        [Name("Booking admin fee")]
        public double BookingAdminFee { get; set; }
        [DynamoDBProperty]
        [Name("Available inventory")]
        public int AvailableInventory { get; set; }
        [DynamoDBProperty]
        [Ignore]
        public string LastUpdateType { get; set; }
        [DynamoDBProperty]
        [Ignore]
        public DateTime QueuedDateTime { get; set; }
        [DynamoDBRangeKey]
        [Ignore]
        public DateTime UpdateDateTime { get; set; }
    }

    /// <summary>
    /// Utilities for FareType handling
    /// </summary>
    public static class FlightPriceStoreModelExtensions
    {
        private const string StandardName = "STANDARD";
        private const string PromotionName = "PROMOTION";
        private const string DiscountName = "HOLIDAYS_DISCOUNTED";

        /// <summary>
        /// Converts from <see cref="FlightPriceStoreModel.FareType"/> as <see cref="string"/> to constant
        /// <see cref="FareType"/>
        /// </summary>
        /// <param name="instance"></param>
        /// <returns></returns>
        public static FareType GetKnownFareType(this FlightPriceStoreModel instance)
        {
            return instance?.FareType switch
            {
                StandardName => FareType.Standard,
                PromotionName => FareType.Promotion,
                DiscountName => FareType.HolidaysDiscounted,
                _ => FareType.Unknown
            };
        }

        /// <summary>
        /// Converts from <see cref="FareType"/> to <see cref="string"/>, to use as values for
        /// <see cref="FlightPriceStoreModel.FareType"/>
        /// </summary>
        /// <param name="instance"></param>
        /// <returns></returns>
        public static string GetKnownFareType(this FareType instance)
        {
            return instance switch
            {
                FareType.Standard => StandardName,
                FareType.Promotion => PromotionName,
                FareType.HolidaysDiscounted => DiscountName,
                _ => null
            };
        }
    }
}
