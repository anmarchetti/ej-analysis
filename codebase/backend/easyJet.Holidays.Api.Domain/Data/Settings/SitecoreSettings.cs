using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    public enum SitecoreSettings
    {
        [EnumMember(Value = "SmartSeer")]
        SmartSeer,

        [EnumMember(Value = "Discount")]
        Discount,

        [EnumMember(Value = "Filter")]
        Filter,
        
        /// <summary>
        /// Specifies a fee or charge applied as a tourist tax.
        /// </summary>
        [EnumMember(Value = "TouristTax")]
        TouristTaxSettings,

        [EnumMember(Value = "LockedAccount")]
        LockedAccount,

        [EnumMember(Value = "MapsInfo")]
        MapsInfo,

        [EnumMember(Value = "OtherRoutes")]
        OtherRoutes,

        [EnumMember(Value = "PriceJump")]
        PriceJump,

        [EnumMember(Value = "SpecialRequest")]
        SpecialRequest,

        [EnumMember(Value = "SponsoredHotels")]
        SponsoredHotels,

        [EnumMember(Value = "AmendBooking")]
        AmendBooking,

        [EnumMember(Value = "CreditBooking")]
        CreditBooking,

        [EnumMember(Value = "Benefits")]
        Benefits,

        [EnumMember(Value = "AircraftTypes")]
        AircraftTypes,

        [EnumMember(Value = "Offers")]
        Offers,

        [EnumMember(Value = "PriceLimit")]
        PriceLimit,

        [EnumMember(Value = nameof(CustomerDetailsForm))]
        CustomerDetailsForm,

        [EnumMember(Value = "PromoCode")]
        PromoCode,

        [EnumMember(Value = "Luggage")]
        Luggage,

        [EnumMember(Value = "LuggageSettings")]
        LuggageSettings,

        /// <summary>
        /// CMS Flight Extra Information Settings
        /// </summary>
        [EnumMember(Value = "FlightExtraInformationSettings")]
        FlightExtraInformationSettings,

        [EnumMember(Value = "ComplimentarySettings")]
        ComplimentarySettings,

        [EnumMember(Value = "ContactUsCaseTypes")]
        ContactUsCaseTypes,

        [EnumMember(Value = "WeatherTypes")]
        WeatherTypes,

        [EnumMember(Value = "ExtraPriceBreakdownSettings")]
        ExtraPriceBreakdownSettings,

        /// <summary>
        /// External Extras Settings
        /// </summary>
        [EnumMember(Value = "ExternalExtrasSettings")]
        ExternalExtrasSettings,

        /// <summary>
        /// Map PaymentMethodsSettings from Sitecore
        /// </summary>
        [EnumMember(Value = "PaymentMethodsSettings")]
        PaymentMethodsSettings,

        /// <summary>
        /// Represents the configuration type for promotional collections.
        /// </summary>
        [EnumMember(Value = "PromotionsCollectionsConfig")]
        PromotionsCollectionsConfig,
        
        /// <summary>
        /// Get TradeAgentFeedback attached file settings endpoint
        /// </summary>
        [EnumMember(Value = "TradeAgentFeedbackAttachedFileSettings")]
        TradeAgentFeedbackAttachedFileSettings,

        /// <summary>
        /// Gets the configuration settings for the My Bookings Settings.
        /// </summary>
        [EnumMember(Value = "MyBookingsSettings")]
        MyBookingsSettings,
    }
}
