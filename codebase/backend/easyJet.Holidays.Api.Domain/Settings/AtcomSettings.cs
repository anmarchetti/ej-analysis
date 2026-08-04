using System.Collections.ObjectModel;
using Microsoft.Extensions.Configuration;

namespace easyJet.Holidays.Api.Domain.Settings
{
    public class AtcomSettings
    {
        /// <summary>
        /// Search settings per market
        /// </summary>
        public AtcomSearchSettings Search { get; set; }
        public AtcomApiSettings DataHub { get; set; }

        /// <summary>
        /// Market brands settings
        /// </summary>
        [ConfigurationKeyName("MarketBrands")]
        public Dictionary<string, MarketBrands> MarketBrands { get; init; }

        public AtcomApiSettings Booking { get; set; }
        public AtcomCltInfoSettings CltInfo { get; set; }
        public AtcomEndpointTemplateSettings EndpointTemplate { get; set; }

        /// <summary>
        /// List of promo codes to ignore in Atcom API responses.
        /// </summary>
        public IList<string> AtcomPromoCodesToIgnore { get; init; }

        /// <summary>
        /// Complimentary Luggage Settings to align with Atcom
        /// </summary>
        public ComplimentaryLuggageSettings ComplimentaryLuggage { get; set; }

        /// <summary>
        /// Special code to get packages for all departure/destinations
        /// </summary>
        public string AnywhereCode { get; set; }

        /// <summary>
        /// Duplicate Board Suffix 
        /// </summary>
        public string DuplicationBoardSuffix { get; init; }

        /// <summary>
        /// Disable pay remaining balance if left less then specified days to departure
        /// </summary>
        public int AllowPayOutstandingBalanceIsGreaterThanDays { get; set; }

        /// <summary>
        /// Identify booking as customer booking
        /// </summary>
        public List<string> CustomerAgencyNo { get; set; }

        /// <summary>
        /// All possible durations. Used to get all offers for specific date range
        /// </summary>
        public string AllDurations { get; set; }

        /// <summary>
        /// Api requests timeout seconds
        /// </summary>
        public int TimeoutMilliSeconds { get; set; }

        /// <summary>
        /// Whether use offline payment process
        /// </summary>
        public bool OfflinePaymentProcess { get; set; }

        /// <summary>
        /// Internal flights promotion code
        /// </summary>
        public string InternalFlightPromotionCode { get; set; }

        /// <summary>
        /// location for typeahed file
        /// </summary>
        public string TypeAheadFileLocation { get; set; }

        /// <summary>
        /// location for legacy-holidays mapping file
        /// </summary>
        public string DestinationMappingFileLocation { get; set; }

        /// <summary>
        /// Atcom Payment settigns
        /// </summary>
        public Payment Payment { get; set; }

        /// <summary>
        /// Holiday Themes settings
        /// </summary>
        public ThemeSettings Themes { get; set; }

        /// <summary>
        /// Transfer settings
        /// </summary>
        public TransfersSettings Transfers { get; set; }

        /// <summary>
        /// Extras settings
        /// </summary>
        public ExtrasSettings Extras { get; set; }

        /// <summary>
        /// Fraud code from booking memos
        /// </summary>
        public string FraudCode { get; set; }

        /// <summary>
        /// Disterssed flight class code
        /// </summary>
        public string DistressedFlightsClass { get; set; }

        /// <summary>
        /// Collection of booking statuses we ignore on API (like they don't exist)
        /// </summary>
        public IEnumerable<string> BookingIgnoreWithStatuses { get; set; } = [];

        public ChangeBookingSettings ChangeBooking { get; set; }

        /// <summary>
        /// Mapping between voucherify reasons and atcom payment methods (Maintenance -> Codes -> Terms -> Payment Method in atcom UI)
        /// </summary>
        public Dictionary<string, PaymentCodesSettings> PaymentCodes { get; set; }

        public SpecialRequestsTypeSettings SpecialRequestsType { get; set; }

        public string SsrNormalStatusCode { get; set; }

        /// <summary>
        /// Discount code name for prices summary
        /// </summary>
        public string PromotionsCodeName { get; set; }

        /// <summary>
        /// Whether to ignore all errors in the DisplayResponse from Atcom
        /// </summary>
        public bool IgnoreAllErrors { get; set; }

        /// <summary>
        /// Array of Atcom errors to ignore in the DisplayResponse from Atcom
        /// </summary>
        public IEnumerable<string> ErrorCodesToIgnore { get; set; } = [];

        /// <summary>
        /// Map of atcom error codes and messages to catch regarding promo codes
        /// </summary>
        public Dictionary<string, string> PromoCodeErrorCodesToIgnore { get; set; }

        /// <summary>
        /// Array of Atcom error codes related to seat selection
        /// </summary>
        public IEnumerable<string> SeatsRelatedErrorCodes { get; set; } = [];

        /// <summary>
        /// Array of Atcom error codes related to Accommodation Availability
        /// </summary>
        public IEnumerable<string> AccommodationAvailabilityRelatedErrorCodes { get; set; } = [];

        /// <summary>
        /// Array of Atcom error codes related to Flight Availability
        /// </summary>
        public IEnumerable<string> FlightAvailabilityRelatedErrorCodes { get; set; } = [];

        /// <summary>
        /// Array of Atcom error codes related to airport parking
        /// </summary>
        public IEnumerable<string> AirportParkingRelatedErrorCodes { get; set; } = [];
        
        /// <summary>
        /// Known Atcom error codes, which need to be processed at some places inside the WebApp
        /// </summary>
        public AtcomErrorCodes ErrorCodes { get; set; }

        /// <summary>
        /// Known Atcom warning codes, which need to be processed at some places inside the WebApp
        /// </summary>
        public AtcomWarningCodes AtcomWarningCodes { get; set; }

        /// <summary>
        /// Array of Atcom warning codes that must be handled as errors
        /// </summary>
        public IEnumerable<AtcomError> WarningCodesTreatedAsErrors { get; set; } = [];

        /// <summary>
        /// Array of Atcom warning codes that must be handled for amendments
        /// </summary>
        public AtcomWarningsHandledForAmendments WarningCodesDisruptingAmendments { get; set; }

        public List<AtcomError> ErrorsToIgnoreInModifyCustPaymentResponse { get; set; }

        /// <summary>
        /// Specify here systems like HB3, TGX
        /// </summary>
        public RoomSystemsSettings RoomSystemsSettings { get; set; }

        public PricesTypeCode PricesTypeCode { get; set; }

        /// <summary>
        /// Datahub api requests timeout seconds
        /// </summary>
        public int DataHubTimeoutMilliSeconds { get; set; }

        /// <summary>
        /// Represents the user code used for authentication or identification within Atcom-related operations.
        /// </summary>
        public string UserCode { get; set; }

        /// <summary>
        /// All valid atcom booking status
        /// </summary>
        public BookingStatus BookingStatus { get; set; }
    }

    /// <summary>
    /// All valid atcom booking status
    /// </summary>
    public class BookingStatus
    {
        /// <summary>
        /// Represents the cancelled status in Atcom system
        /// </summary>
        public string Canceled { get; set; }

        /// <summary>
        /// Represents the booking status in Atcom system
        /// </summary>
        public string Booking { get; set; }
    }

    public class AtcomErrorCodes
    {
        /// <summary>
        /// Comes with message "User does not have permission to view booking"
        /// </summary>
        public string UserDoesNotHavePermissionToViewBooking { get; set; }

        /// <summary>
        /// Comes with message "Session 'Sessionid' is invalid or expired"
        /// </summary>
        public string BookingSearchSessionExpired { get; set; }
    }

    public class AtcomWarningCodes
    {
        /// <summary>
        /// Booking out of sync warning code.
        /// </summary>
        public string BookingOutOfSync { get; set; }
    }

    public class SpecialRequestsTypeSettings
    {
        public string Accommodation { get; set; }
        public string Transfer { get; set; }
    }

    public class PaymentCodesSettings
    {
        public bool IsDefault { get; set; }
        public string Reason { get; set; }
        public PaymentTypeSettings Issued { get; set; }
        public PaymentTypeSettings Redeemed { get; set; }
        public int PriorityNumber { get; set; }

        /// <summary>
        /// This expiration date is used only to determine if credit of specific type has constant expiration date 
        /// and if credit is lost when booking cancelled. Everything else relies on voucher expiration date.
        /// </summary>
        public DateTimeOffset? ExpirationDate { get; set; }
    }

    public class PaymentTypeSettings
    {
        public string Group { get; set; }
        public string Code { get; set; }
    }

    public class ExtrasSettings
    {
        /// <summary>
        /// Item type code for transfer items
        /// </summary>
        public string TransferTypeCode { get; set; }

        /// <summary>
        /// Item type code for late room checkout items
        /// </summary>
        public string LateCheckoutType { get; set; }
    }

    public class TransfersSettings
    {
        /// <summary>
        /// Time left to book a transfer for booking
        /// </summary>
        public int DisableTransfersInHours { get; set; }

        /// <summary>
        /// Default server timezone
        /// </summary>
        public string DefaultTimezoneId { get; set; }

        /// <summary>
        /// Dictionary to understand which one of "no transfer" to hide
        /// </summary>
        public Dictionary<string, string> NoTransferCodesToIgnore { get; set; }

        /// <summary>
        /// Types mapping
        /// </summary>
        public TransferTypesSettings Types { get; set; }

        /// <summary>
        /// Mapping default transfer to hotel type
        /// </summary>
        public Dictionary<string, IEnumerable<string>> DefaultTransferHotels { get; set; }

        /// <summary>
        /// Transfer Surcharge Codes
        /// </summary>
        public TransferSurchargeSettings SurchargeSettings { get; set; }
    }

    /// <summary>
    /// Transfer Surcharge Codes
    /// </summary>
    public class TransferSurchargeSettings
    {
        public string LargeSeCode { get; set; }
        public string LargeSeType { get; set; }
        public string SmallSeCode { get; set; }
        public string SmallSeType { get; set; }
    }

    /// <summary>
    /// TYpes model
    /// </summary>
    public class TransferTypesSettings
    {
        /// <summary>
        /// COde for synthetic "no transfer" item
        /// </summary>
        public string SyntheticNoTransfer { get; set; }

        /// <summary>
        /// Default code to be used as "no transfer"
        /// </summary>
        public string DefaultNoTransferCode { get; set; }

        /// <summary>
        /// Shared transfer codes
        /// </summary>
        public List<string> Shared { get; set; }
        /// <summary>
        /// Private transfers codes
        /// </summary>
        public List<string> Private { get; set; }
        /// <summary>
        /// No transfer item codes
        /// </summary>
        public List<string> NoTransfer { get; set; }
    }

    /// <summary>
    /// Combination of Type and Theme
    /// </summary>
    public class ThemeSettings
    {
        /// <summary>
        /// Collection of type codes to hide on filter
        /// </summary>
        public ICollection<string> HideOnFilters { get; set; } = [];
    }

    /// <summary>
    /// Grouping for market based search settings
    /// </summary>
    public class AtcomSearchSettings
    {
        /// <summary>
        /// UK market
        /// </summary>
        public AtcomApiSettings Uk { get; set; }
        /// <summary>
        /// CH market
        /// </summary>
        public AtcomApiSettings Ch { get; set; }
        /// <summary>
        /// DE market
        /// </summary>
        public AtcomApiSettings De { get; set; }
        /// <summary>
        /// FR market
        /// </summary>
        public AtcomApiSettings Fr { get; set; }
    }

    public class AtcomApiSettings
    {
        public string Host { get; set; }
        public string BaseUrl { get; set; }
        /// <summary>
        /// SSL setting
        /// </summary>
        public bool SSL { get; set; } = true;
    }

    public class AtcomEndpointTemplateSettings
    {
        public string Search { get; set; }
        public string SearchRoomVariants { get; set; }
        public string SearchAlternativeFlights { get; set; }
        public string PriceGraph { get; set; }
        public string TradeAgentParam { get; set; }
        public string BrandParam { get; set; }
        public string SearchDates { get; set; }
        public string SearchAccomOffers { get; set; }
        public string SearchCheapestOffers { get; set; }
        /// <summary>
        /// Base parameters for searching for alternative rooms
        /// </summary>
        public string SearchAlternativeHotelRooms { get; set; }
        /// <summary>
        /// Base parameters for searching for alternative hotel
        /// </summary>
        public string SearchAlternativeHotels { get; set; }
        /// <summary>
        /// Gets or sets the reference parameter associated with the current instance.
        /// </summary>
        public string NRefParam { get; init; }
    }

    public class AtcomCltInfoSettings
    {
        public string Locale { get; set; }
        
        /// <summary>
        /// Gets or sets the collection of agent group settings, indexed by group name.
        /// </summary>
        [ConfigurationKeyName("Agents")]
        public Dictionary<string, AtcomCltInfoAgentsSettings> AgentGroups { get; init; }

        public string TermCode { get; set; }
        public string TradePortalUserName { get; set; }
        public string Channel { get; set; }
    }

    /// <summary>
    /// Represents configuration settings for mapping agent and user identifiers to their display names in the Atcom
    /// client information system.  
    /// </summary>
    /// <remarks>Use this class to provide custom display names for agents and users, typically for UI
    /// presentation or reporting purposes. Both dictionaries should contain unique keys corresponding to agent or user
    /// identifiers.</remarks>
    public class AtcomCltInfoAgentsSettings
    {
        /// <summary>
        /// Gets or sets a collection that maps country to agent identifiers.
        /// </summary>
        public Dictionary<string, string> AgentsNames { get; init; }

        /// <summary>
        /// Gets or sets a collection that maps country to user identifiers.
        /// </summary>
        public Dictionary<string, string> UserNames { get; init; }
    }
    
    /// <summary>
    /// Market brands mappings
    /// </summary>
    public class MarketBrands
    {
        /// <summary>
        /// Gets or sets a collection that maps market to brands.
        /// </summary>
        public Dictionary<string, string> Brands { get; init; }
    }

    public class Payment
    {
        public string AuthSys { get; set; }
    }

    public class ChangeBookingSettings
    {
        public bool IsActive { get; set; }
        public List<string> AllowedStatuses { get; set; }
        public DateTimeOffset ChangeAllowedExpirationDate { get; set; }
        public bool UseChangeExpirationDate { get; set; }
        public bool AllowMultipleChanges { get; set; }
        public AtcomMemoSettings Memo { get; set; }
        public ChangeDiscountSettings ChangeDiscount { get; set; }
    }

    public class ChangeDiscountSettings
    {
        public string Code { get; set; }
        public DateTimeOffset ValidFrom { get; set; }
        public DateTimeOffset ValidTo { get; set; }
    }

    public class AtcomMemoSettings
    {
        public string NewBookingCode { get; set; }
        public string CancelledBookingCode { get; set; }
        public string BookingPrivacyCode { get; set; }
        public string BookingIsPrivateText { get; set; }
        public string BookingIsNotPrivateText { get; set; }
    }

    public class AtcomError
    {
        public string Code { get; set; }

        public string Message { get; set; }
    }

    public class RoomSystemsSettings
    {
        /// <summary>
        /// Names of systems for prioritizing. the lower number - the higher priority,
        /// </summary>
        public Dictionary<string, int> Priorities { get; set; } = new Dictionary<string, int>();
        public string SystemToDiscard { get; set; }
    }

    public class AtcomWarningsHandledForAmendments
    {
        public List<string> Name { get; set; }
        public List<string> Flight { get; set; }
        public List<string> Transfer { get; set; }
        public List<string> SpecialRequest { get; set; }
    }

    public class PricesTypeCode
    {
        public string Discount { get; set; }

        public string Fees { get; set; }
    }

    /// <summary>
    /// Complimentary luggage settings to align with Atcom configuration
    /// </summary>
    public class ComplimentaryLuggageSettings
    {
        /// <summary>
        /// Default value for market part of promotion code
        /// </summary>
        public string DefaultMarketPart { get; set; }

        /// <summary>
        /// Default value for promo part of promotion code
        /// </summary>
        public string DefaultPromoPart { get; set; }

        /// <summary>
        /// Mapping Market code to MarketPart of promotion code
        /// </summary>
        public Dictionary<string, string> MarketPromoCodeMapping { get; set; }

        /// <summary>
        /// Mapping Theme code to Prom part of promotion code
        /// </summary>
        public Dictionary<string, string> ThemePromoCodeMapping { get; set; }
    }
}