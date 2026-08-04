namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Mapping the configuration of Payment Methods settings
    /// </summary>
    public class PaymentMethodsSettings
    {
        /// <summary>
        /// ApplePay Settings
        /// </summary>
        public ApplePaySettings ApplePay { get; set; }

    }

    /// <summary>
    /// Mapping the configuration of ApplePay settings
    /// </summary>
    public class ApplePaySettings
    {
        /// <summary>
        /// Api settings
        /// </summary>
        public ApplePayApiSettings Api { get; set; }
        
        /// <summary>
        /// DisplayName on ApplePay payment sheet
        /// </summary>
        public string DisplayName { get; set; }
        
        /// <summary>
        /// ApplePay Merchant Validator Proxy Host
        /// </summary>
        public string ApplePayMerchantValidatorProxyHost { get; set; }
        
        /// <summary>
        /// Merchant Validation Path
        /// </summary>
        public string MerchantValidationPath { get; set; }
    }

    /// <summary>
    /// ApplePay Api Settings
    /// </summary>
    public class ApplePayApiSettings
    {
        /// <summary>
        /// Api requests timeout milliseconds
        /// </summary>
        public int TimeoutMilliSeconds { get; set; }
    }

}