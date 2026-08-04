namespace easyJet.Holidays.Api.Domain.Settings
{
    public class AwsSettings
    {
        public AwsSettingsSecretsManager SecretsManager { get; set; }
        public AwsSettingsStorage Storage { get; set; }
        public AwsSettingsS3 S3 { get; set; }
        public AwsSettingsSNS SNS { get; set; }
        public AwsSettingsSES SES { get; set; }
        public string ServiceURL { get; set; }
        public AwsRoutes Routes { get; set; }
        public AwsUserData UserData { get; set; }
        public long PricePromiseFileSizeMB { get; set; }
        public int PricePromiseMaxFiles { get; set; }
        public AwsSettingsErrata Errata { get; set; }
        public AwsSettingsTTL TTL { get; set; }
        /// <summary>
        /// STS settings
        /// </summary>
        public AwsSecurityTokenService STS { get; set; }
    }

    public class AwsSettingsErrata
    {
        public int ChunkSize { get; set; }
        /// <summary>
        /// Delay in milliseconds between batch write chunks during bulk sync
        /// to reduce DynamoDB throttling. 0 disables pacing.
        /// </summary>
        public int ChunkDelayMs { get; set; }
        public int ExpiresDays { get; set; }
        public Dictionary<string, string[]> LanguageMap { get; set; }

        public static Dictionary<string, string[]> ParseLanguageMap(string languageMapString)
        {
            if (languageMapString == null)
                return new Dictionary<string, string[]>();

            return languageMapString.Split(';')
                .Select(entry => entry.Split(':'))
                .ToDictionary(entry => entry[0], entry => entry[1].Split(','));
        }
    }

    public class AwsRoutes
    {
        public AwsRoutesTables Tables { get; set; }
    }

    public class AwsUserData
    {
        public string DefaultGroupping { get; set; }
    }

    public class AwsRoutesTables
    {
        public string To { get; set; }
        public string From { get; set; }
        public string Dates { get; set; }
        public string Version { get; set; }
    }

    public class AwsSettingsSecretsManager
    {
        public string ServiceUrl { get; set; }
        public string[] Secrets { get; set; }
    }

    public class AwsSettingsStorage
    {
        public AwsSettingsStorageClient Client { get; set; }
        public AwsSettingsStorageTables Tables { get; set; }
    }

    public class AwsSettingsStorageClient
    {
        public string Region { get; set; }
        public string ServiceUrl { get; set; }
    }

    public class AwsSettingsStorageTables
    {
        public string Counters { get; set; }
        public string Users { get; set; }
        public string BookingTransactions { get; set; }
        public string PriceChanges { get; set; }
        public string ShortList { get; set; }
        public string Credits { get; set; }
        public string LivePrice { get; set; }
        public string PricePromise { get; set; }
        public string ErrataInfo { get; set; }
        public string FlightErrataInfo { get; set; }
        public string RequestedPrice { get; set; }
        public string FreeNights { get; set; }

        /// <summary>
        /// BoardUpgrade 
        /// </summary>
        public string BoardUpgrade { get; set; }

        /// <summary>
        /// OfferDiscount
        /// </summary>
        public string OfferDiscount { get; set; }

        /// <summary>
        /// Single-use promo codes.
        /// </summary>
        public string SingleUsePromoCodes { get; set; }

        public string FaqUsersResponses { get; set; }
        public string MarketingPreferencesUnsubscribe { get; set; }
        public string MarketingPreferences { get; set; }
        public string MarketingPreferencesScreened { get; set; }
        public string Tokens { get; set; }
        public string Feedbacks { get; set; }
        public string BookingSessions { get; set; }
        public string FlightSeatPlan { get; set; }
        public string TradeAgentFeedback { get; set; }
        public string GroupBookings { get; set; }
        public string FlightExtraCache { get; set; }
        public string Weather { get; set; }
        public string TripAdvisorCache { get; set; }
        public string SearchPodValidation { get; set; }

        /// <summary>
        /// Amend cache DynamoDb table name.
        /// </summary>
        public string AmendCache { get; set; }
        /// <summary>
        /// PointsOfInterest 
        /// </summary>
        public string PointsOfInterest { get; init; } = string.Empty;

        /// <summary>
        /// Gets or sets the cheapest month.
        /// </summary>
        public string CheapestMonth { get; set; }
    }

    public class AwsSettingsTTL
    {
        public int BookingSessions { get; set; }
        public int FlightSeatPlan { get; set; }
        public int FlightExtraCacheInSec { get; set; }
        public int TripAdvisorCache { get; set; }

        /// <summary>
        /// Time-to-life value amend cache DynamoDb table items.
        /// </summary>
        public int AmendCache { get; set; }
    }

    public class AwsSettingsS3
    {
        public AwsSettingsStorageClient Client { get; set; }
        public AwsSettingsS3Buckets Buckets { get; set; }
    }

    public class AwsSettingsS3Buckets
    {
        public string PricePromise { get; set; }
        public string TradeAgentFeedbackAttachments { get; set; }

        /// <summary>
        /// Tourist Tax Rules bucket name.
        /// </summary>
        public string TouristTaxRules { get; set; }
    }

    public class AwsSettingsSNS
    {
        public AwsSettingsStorageClient Client { get; set; }
        public AwsSettingsSNSTopics Topics { get; set; }
    }

    public class AwsSettingsSNSTopics
    {
        public string PricePromise { get; set; }
        public string LeaseFlightsNotifications { get; set; }
        public string TradeAgentFeedback { get; set; }
        public string GroupBookings { get; set; }
    }

    /// <summary>
    /// SES settings
    /// </summary>
    public class AwsSettingsSES
    {
        public AwsSettingsStorageClient Client { get; set; }
        
        /// <summary>
        /// ARN of the SES identity to send emails from.
        /// </summary>
        public string FromEmailAddressIdentityArn { get; set; }
    }

    /// <summary>
    /// AWS Security Token Service (STS) settings.
    /// </summary>
    public class AwsSecurityTokenService
    {
        /// <summary>
        /// AWS STS client settings.
        /// </summary>
        public AwsSettingsStorageClient Client { get; set; }

        /// <summary>
        /// Role settings used by Apollo integration.
        /// </summary>
        public ApolloAwsSettings Apollo { get; set; }

        /// <summary>
        /// Refresh skew in seconds used before temporary credentials expire.
        /// </summary>
        public int CredentialRefreshBeforeExpirySeconds { get; set; }
    }

    /// <summary>
    /// Role settings used by Apollo integration.
    /// </summary>
    public class ApolloAwsSettings
    {
        /// <summary>
        /// Logical service name used by Apollo integration.
        /// </summary>
        public string Service { get; set; }

        /// <summary>
        /// IAM role ARN to assume for Apollo calls.
        /// </summary>
        public string RoleArn { get; set; }

        /// <summary>
        /// STS session name passed in AssumeRole request.
        /// </summary>
        public string RoleSessionName { get; set; }
    }
}
