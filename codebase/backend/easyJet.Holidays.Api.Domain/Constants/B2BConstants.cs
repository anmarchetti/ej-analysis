namespace easyJet.Holidays.Api.Domain.Constants
{
    /// <summary>
    /// B2B constants
    /// </summary>
    public static class B2BConstants
    {
        /// <summary>
        /// B2B api property means Yes
        /// </summary>
        public static readonly string Yes = "Y";

        /// <summary>
        ///  B2B api property means No
        /// </summary>
        public static readonly string No = "N";

        /// <summary>
        ///  B2B api default currency code
        /// </summary>
        public static readonly string GBPCurrencyCode = "GBP";

        /// <summary>
        ///  B2B comment pattern to provide reason for travel
        /// </summary>
        public static readonly string ReasonForTravelCommentPattern = "TRIP PURPOSE: {CODE}";

        /// <summary>
        ///  B2B total seats available empty value
        /// </summary>
        public static readonly string TotalSeatsAvailable = "0";

    }
}
