namespace easyJet.Holidays.Api.Domain.Settings
{
    public class MarketingSettings
    {
        public CsatLinkSettings CsatLink { get; set; }
        public bool TradeBookingsEnabled { get; set; }

        /// <summary>
        /// Unsubscribed link with encrypted email
        /// </summary>
        public string UnsubscribeLink { get; set; }

        /// <summary>
        /// Used to encrypt emails sended to Feefo
        /// </summary>
        public string EncryptionPassword { get; set; }

        /// <summary>
        /// Used to encrypt emails sended to Feefo
        /// </summary>
        public string EncryptionSalt { get; set; }

        public Dictionary<string, string> LanguageMap { get; set; }
    }

    public class CsatLinkSettings
    {
        public string Host { get; set; }
        public int SatisfactionScore { get; set; }
        public MarketingTransferTypesSettings TransferTypes { get; set; }
        public string Language { get; set; }
        public string AirCarrier { get; set; }
        public string DevelopmentCycle { get; set; }
        public string BookingTypeDirect { get; set; }
        public string BookingTypeExternalAgency { get; set; }
        public string BookingTypeWebsite { get; set; }
    }

    public class MarketingTransferTypesSettings
    {
        /// <summary>
        /// Shared transfer codes
        /// </summary>
        public IEnumerable<string> Shared { get; set; }

        /// <summary>
        /// Private transfers codes
        /// </summary>
        public IEnumerable<string> Private { get; set; }

        /// <summary>
        /// No shared transfer item codes
        /// </summary>
        public IEnumerable<string> NoShared { get; set; }

        /// <summary>
        /// No private transfer item codes
        /// </summary>
        public IEnumerable<string> NoPrivate { get; set; }


    }
}