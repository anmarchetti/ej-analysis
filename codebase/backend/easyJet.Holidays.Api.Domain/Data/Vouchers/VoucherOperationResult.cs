namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    /// <summary>
    /// Store Voucher operation result
    /// </summary>
    public class VoucherOperationResult
    {
        /// <summary>
        /// If result was successed
        /// </summary>
        public bool IsSuccess { get; set; }

        /// <summary>
        /// Operation code
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Operation original response
        /// </summary>
        public object Response { get; set; }

        /// <summary>
        /// Customer who fires operation 
        /// </summary>
        public string CustomerID { get; set; }

        /// <summary>
        /// Operation exception
        /// </summary>
        public Exception InnerException { get; set; }

        /// <summary>
        /// Voucher reason code
        /// </summary>
        public string ReasonCode { get; set; }

        /// <summary>
        /// Amount of money
        /// </summary>
        public decimal Amount { get; set; }
    }
}
