using easyJet.Holidays.Api.Domain.Data.Booking;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Api settings
    /// </summary>
    public class ApiSettings
    {
        /// <summary>
        /// Api authentication key.
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        /// Routes prefix settings
        /// </summary>
        public RoutePrefixSettings RoutePrefix { get; set; }

        /// <summary>
        /// Whether enable swagger or not
        /// </summary>
        public bool EnableSwagger { get; set; }

        /// <summary>
        /// Idempotent operations settings
        /// </summary>
        public ApiIdempotentBookingSettings IdempotentBooking { get; set; }

        /// <summary>
        /// enable "X-Api-Host" response header
        /// </summary>
        public bool EnableHostResponseHeader { get; set; }

        /// <summary>
        /// Options for incoming booking feedback
        /// </summary>
        public BookingFeedbackSettings BookingFeedback { get; set; }
        
        /// <summary>
        /// Value of the X-Api-Host response header
        /// </summary>
        public string ApiHost { get; set; }

        /// <summary>
        /// Release number in format 1.2.4
        /// </summary>
        public string Release { get; set; }

        /// <summary>
        /// Whether round prices or not
        /// </summary>
        public bool RoundPrices { get; set; }

        /// <summary>
        /// Whether disable offers for today and next day
        /// </summary>
        public bool DisabledOffersForNextDay { get; set; }

        /// <summary>
        /// Credit vouchers settings
        /// </summary>
        public VoucherSettings Vouchers { get; set; }
        /// <summary>
        /// Booking memos settings, used for adding memos to bookings in different scenarios, for example when converting to credit or doing cash refunds
        /// </summary>
        public BookingsMemosSettings BookingsMemos { get; set; }

        public PricePromiseSettings PricePromise { get; set; }

        /// <summary>
        /// Change Dates settings
        /// </summary>
        public AmendBookingChangeDatesSettings AmendBookingChangeDates { get; set; }

        /// <summary>
        /// Memo codes used in amend flights
        /// </summary>
        public AmendBookingMemoSettings AmendBookingMemo { get; set; }

        /// <summary>
        /// Memo code for charges
        /// </summary>
        public ChargesMemoSettings ChargesMemo { get; set; }

        /// <summary>
        /// Api logging settings
        /// </summary>
        public LoggingSettings Logging { get; set; }

        /// <summary>
        /// Identification for dynamic inventory hotels
        /// Map of external hotel providers
        /// </summary>
        public Dictionary<ExternalHotelProviders, List<string>> ExternalHotelsProviders { get; set; }

        /// <summary>
        /// Allowed origins
        /// </summary>
        public string[] AllowedOrigins { get; set; }

        /// <summary>
        /// Verbose Logging
        /// </summary>
        public bool UseVerboseHttpLogging { get; set; }
    }

    /// <summary>
    /// Change Dates settings
    /// </summary>
    public class AmendBookingChangeDatesSettings
    {
        /// <summary>
        /// Max number of calls for validating an offer. It is used to limit load of VRP requests in Atcom.
        /// </summary>
        public int MaxNumberOfAttemptsForValidatingOffer { get; set; } = 3;
    }

    /// <summary>
    /// Booking feedback settings
    /// </summary>
    public class BookingFeedbackSettings
    {
        public BusinessTagsSettings BusinessTags { get; set; }
    }

    /// <summary>
    /// Business tags for filtering between WebAPI deployment variants
    /// </summary>
    public class BusinessTagsSettings
    {
        /// <summary>
        /// Tag for Trade Portal B2B deployment
        /// </summary>
        public string TradePortal { get; set; }

        /// <summary>
        /// Tag for default B2C deployment
        /// </summary>
        public string DefaultWebsite { get; set; }
    }

    /// <summary>
    /// Memo codes for amend booking under a name AmendBookingMemo in appsettings
    /// </summary>
    public class AmendBookingMemoSettings
    {
        public MemoSettings FlightTimeChange { get; set; }

        public MemoSettings TransferChange { get; set; }

        public MemoSettings NameChange { get; set; }

        public MemoSettings AccommodationChange { get; set; }

        public MemoSettings BoardTypeChange { get; set; }

        public MemoSettings RoomTypeChange { get; set; }

        public MemoSettings HolidayDestinationChange { get; set; }

        public MemoSettings HolidayDateChange { get; set; }

        public MemoSettings SpecialRequestChange { get; set; }

        public MemoSettings RoomAndBoardTypeChange { get; set; }
    }

    public class RoutePrefixSettings
    {
        /// <summary>
        /// Api global routes prefix
        /// </summary>
        public string Api { get; set; }

        /// <summary>
        /// Swagger routes prefix
        /// </summary>
        public string Swagger { get; set; }

        /// <summary>
        /// Health check routes prefix
        /// </summary>
        public string HealthCheck { get; set; }
    }

    public class ApiIdempotentBookingSettings
    {
        /// <summary>
        /// Waiting timeout seconds
        /// </summary>
        public int TimeoutMilliSeconds { get; set; }

        /// <summary>
        /// State update delay
        /// </summary>
        public int DelayMilliSeconds { get; set; }
    }

    public class VoucherSettings
    {
        /// <summary>
        /// Whether credit/vouchers are enabled or not
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// Voucher compaign name
        /// </summary>
        public string Campaign { get; set; }

        /// <summary>
        /// Expiration in months from now
        /// </summary>
        public int ExpirationMonths { get; set; }

        /// <summary>
        /// Number of days before the expiration date when credit should be treated as expiring soon.
        /// </summary>
        public int ExpiringCreditsThresholdDays { get; set; } = 14;

        /// <summary>
        /// Voucher category
        /// </summary>
        public string Category { get; set; }

        /// <summary>
        /// Specific metadata field name for custom campaigns
        /// To distinguish promo code from campaign voucher code
        /// </summary>
        public string CustomCampaignVouchersMetaData { get; set; }

        /// <summary>
        /// Additional metadata
        /// </summary>
        public Dictionary<string, object> Metadata { get; set; }

        /// <summary>
        /// Memo code to add to booking
        /// </summary>
        public BookingMemoSettings BookingMemos { get; set; }

        /// <summary>
        /// Voucher types settings
        /// </summary>
        public VoucherTypeSettings Types { get; set; }

        /// <summary>
        /// Gift cards reason codes
        /// </summary>
        public VoucherReasonSettings GiftCards { get; set; }

        /// <summary>
        /// Promo vouchers reason codes
        /// </summary>
        public VoucherReasonSettings PromoVouchers { get; set; }

        /// <summary>
        /// Settings to check if booking is eligible for being credit
        /// </summary>
        public BookingIsEligibleForBeingCreditedSettings BookingIsEligibleForBeingCredited { get; set; }

        /// <summary>
        /// One-time discount settings
        /// </summary>
        public VoucherDiscountSettings Discounts { get; set; }

        /// <summary>
        /// Whether API should validate customer by email and update sourceId for existing customer in voucherify system
        /// </summary>
        public bool AutomaticCustomerIdUpdateEnabled { get; set; }

        /// <summary>
        /// Default depoist per person if booking doesn't have deposit info
        /// </summary>
        public decimal DefaultDepositPerPerson { get; set; }

        /// <summary>
        /// Voucher source names
        /// </summary>
        public VoucherifySource Source { get; set; }

        /// <summary>
        /// Voucher action names
        /// </summary>
        public VoucherifyAction Action { get; set; }
    }

    public class VoucherifySource
    {
        public string BulkTool { get; set; }
        public string Web { get; set; }
        public string CallCentre { get; set; }
    }

    public class VoucherifyAction
    {
        public string UndoCredit { get; set; }

        public string Spend { get; set; }

        /// <summary>
        /// Credit and refund action name for vouchers metadata
        /// </summary>
        public string CreditAndRefund { get; set; }

        /// <summary>
        /// Partial refund action name for vouchers metadata
        /// </summary>
        public string PartialRefund { get; set; }
    }

    /// <summary>
    /// Discount Voucher settings
    /// </summary>
    public class VoucherDiscountSettings
    {
        /// <summary>
        /// Campaign Metadata key for atcom code 
        /// </summary>
        public string MetadataKey { get; set; }
    }

    public class BookingMemoSettings
    {
        public MemoSettings Cred { get; set; }
        public MemoSettings MovedToCredit { get; set; }
        public MemoSettings MovedToCreditAndCash { get; set; }
        public MemoSettings CacheRefund25Percents { get; set; }
        public MemoSettings CacheAndCreditRefund25Percents { get; set; }
        public MemoSettings CreditRefund25Percents { get; set; }
        public MemoSettings CreditRefund50Percents { get; set; }
    }
    
    /// <summary>
    /// Booking memo codes settings, used for adding memos to bookings in different scenarios, for example when converting to credit or doing cash refunds
    /// </summary>
    public class BookingsMemosSettings
    {
        /// <summary>
        /// Memo code for cash refund
        /// </summary>
        public MemoSettings Cash { get; set; }
        /// <summary>
        /// Memo code for retained OTUC when converting to credit
        /// </summary>
        public MemoSettings RetainedOtuc { get; set; }
        /// <summary>
        /// Memo code for issued OTUC when converting to credit
        /// </summary>
        public MemoSettings IssuedOtuc { get; set; }
        
        /// <summary>
        /// Failed cancellation memo code, used when cancellation failed to store amount of failure in memos for monitoring and analytics
        /// </summary>
        public MemoSettings FailedCancellation { get; set; }
    }

    public class MemoSettings
    {
        public string Code { get; set; }
        public string Description { get; set; }
        public static implicit operator BookingMemo(MemoSettings settings) => new(settings);
    }

    public class BookingIsEligibleForBeingCreditedSettings : BaseBookingIsEligibleForBeingCreditedSettings
    {
        /// <summary>
        /// Whether conversion is enabled or not
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// Booking statuses available for cancellation
        /// </summary>
        public List<string> BookingStatuses { get; set; }
    }


    public class BaseBookingIsEligibleForBeingCreditedSettings
    {
        /// <summary>
        /// Refund days for special rules
        /// </summary>
        public RefundDaysSettings RefundDays { get; set; }

        /// <summary>
        /// Allow fully paid bookings to be converted
        /// </summary>
        public bool AllowFullyPaidToBeConverted { get; set; }

        /// <summary>
        /// Allow partially paid bookings to be converted
        /// </summary>
        public bool AllowPartiallyPaidToBeConverted { get; set; }

        /// <summary>
        /// Allow deposit only bookings to be converted
        /// </summary>
        public bool AllowDepositOnlyToBeConverted { get; set; }

        /// <summary>
        /// Whether allow partial refunds for bookings
        /// </summary>
        public bool AllowPartialRefunds { get; set; }
    }

    public class DateRangeSettings
    {
        public DateTimeOffset From { get; set; }
        public DateTimeOffset To { get; set; }
    }


    /// <summary>
    /// Settings for voucher types
    /// </summary>
    public class VoucherTypeSettings
    {
        /// <summary>
        /// Refund voucher type
        /// </summary>
        public string Refund { get; set; }
        /// <summary>
        /// Incentive voucher type
        /// </summary>
        public string Incentive { get; set; }
        /// <summary>
        /// Goodwill voucher type
        /// </summary>
        public string Goodwill { get; set; }
        /// <summary>
        /// Gift card voucher type
        /// </summary>
        public string GiftCard { get; set; }
        /// <summary>
        /// One time use voucher type
        /// </summary>
        public string OneTimeUse { get; set; }
    }

    public class VoucherReasonSettings
    {
        public List<string> Types { get; set; }
    }

    public class PricePromiseSettings
    {
        public string Subject { get; set; }
        public string BodyTemplate { get; set; }
        public CloudFrontSettings CloudFront { get; set; }
    }

    public class CloudFrontSettings
    {
        public string KeyPairId { get; set; }
        /// <summary>
        /// Base64 encoded private key
        /// </summary>
        public string PrivateKey { get; set; }
        public string BaseUrl { get; set; }
        public int ExpirationDays { get; set; }
    }

    public class RefundDaysSettings
    {
        /// <summary>
        /// Number of days before departure to apply special refund rules.
        /// </summary>
        public int SpecialRulesIfLessThan { get; set; }

        /// <summary>
        /// Get only credit if departure less than value
        /// </summary>
        public int CreditOnlyIfLessThan { get; set; }

        /// <summary>
        /// No refund & credit if departure less than value
        /// </summary>
        public int DisabledIfLessThan { get; set; }
    }

    /// <summary>
    /// Additional settings for NLog
    /// </summary>
    public class LoggingSettings
    {
        /// <summary>
        /// List of strings whose matches with urls to disable logging of the response
        /// </summary>
        public List<string> DisableLogByMatchUrls { get; set; }

        /// <summary>
        /// Cookie key to enable response logging
        /// </summary>
        public string ForceEnableLogCookieKey { get; set; }

        /// <summary>
        /// Cookie value to enable response logging
        /// </summary>
        public string ForceEnableLogCookieValue { get; set; }

        /// <summary>
        /// Placeholder for disabled logging value
        /// </summary>
        public string PlaceholderValue { get; set; }

        /// <summary>
        /// Log number of calls and time taken for each endpoint to provide aggregated stats
        /// </summary>
        public bool LogEndpointStats { get; set; }

        /// <summary>
        /// RequestHeaders that will be logged, UNREDACTED, by the HttpLoggingMiddleware
        /// </summary>
        public List<string> AllowedRequestHeaders { get; init; } = [];
    }

    /// <summary>
    /// Change fees
    /// </summary>
    public class ChargesMemoSettings
    {
        /// <summary>
        /// Change fees
        /// </summary>
        public MemoSettings AmendmentFees { get; set; }
    }

    public enum ExternalHotelProviders
    {
        [EnumMember(Value = "DI")]
        DI,
        [EnumMember(Value = "HBG")]
        HBG
    }
}