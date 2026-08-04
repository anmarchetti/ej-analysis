namespace easyJet.Holidays.Api.Domain.Constants
{
    public static class VoucherifyMetaKeys
    {
        public const string Currency = "currency";
        public const string Market = "market";
        public const string Reason = "reason";
        public const string BookingRef = "booking_ref";
        public const string Source = "source";
        public const string Action = "action";
        public const string Expiration = "expiration";
        public const string OriginalVoucherCode = "originalVoucherCode";
        public const string RedeemedBy = "redeemedBy";
        /// <summary>
        /// Previous credit types
        /// </summary>
        public const string PreviousCreditTypes = "previous_credit_types";

        public static class Hotel
        {
            public const string Name = "hotel_name";
            public const string Code = "hotel_code";
            public const string LocationCode = "hotel_location_code";
            public const string LocationName = "hotel_location_name";
            public const string ResortCode = "hotel_resort_code";
            public const string ResortName = "hotel_resort_name";
            public const string CountryCode = "hotel_country_code";
            public const string CountryName = "hotel_country_name";

        }
    }
}
