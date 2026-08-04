namespace easyJet.Holidays.Api.Domain.Settings
{
    /// <summary>
    /// Voucherify(<see href="https://docs.voucherify.io/reference"/>) Api settings
    /// 
    /// </summary>
    public class VoucherifySettings
    {
        public string Host { get; set; }
        public string ApplicationId { get; set; }
        public string SecretKey { get; set; }
        public int TimeoutMilliSeconds { get; set; }

        public string ReasonNotFound { get; set; }

        public string ReasonExceeded { get; set; }

        /// <summary>
        /// Page size to get all vouchers and redemptions. Max allowed by API is 100
        /// </summary>
        public int PageSize { get; set; }

        public VoucherifyApiSettings Api { get; set; }

        /// <summary>
        /// Redemptions retry policy
        /// </summary>
        public RetryPolicySettings RollbackRetryPolicy { get; set; }

        /// <summary>
        /// Show used or expired from last 2 years
        /// </summary>
        public int ShowExpiredAndUsedVouchersInYears { get; set; } = 2;
    }

    public class VoucherifyApiSettings
    {
        public string Voucher { get; set; }
        public string Vouchers { get; set; }
        public string VoucherPublish { get; set; }
        public string Customers { get; set; }
        public string Customer { get; set; }
        public string Redemptions { get; set; }
        public string ProcessRedemption { get; set; }
        public string ValidateRedemption { get; set; }
        public string RollBackRedemption { get; set; }
        public string AddGiftBalance { get; set; }
    }
}