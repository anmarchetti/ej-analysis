namespace easyJet.Holidays.Api.Domain.Monitoring
{
    /// <summary>
    /// Metric constants
    /// </summary>
    public static class MetricConstants
    {
        /// <summary>
        /// The OpenTelemetry metrics namespace used for telemetry and monitoring.
        /// </summary>
        public static readonly string OpenTelemetryMetrics = "OpenTelemetry";

        /// <summary>
        /// The counter name for tracking the total number of web package availability checks.
        /// </summary>
        public static readonly string WebPackageAvailabilityCheckTotal = "ejh.web.package_availability_check.count";

        /// <summary>
        /// The counter name for tracking the total number of web hotels not available in the CMS.
        /// </summary>
        public static readonly string WebHotelsNotInCmsTotal = "ejh.web.hotels_not_in_cms.count";

        /// <summary>
        /// The counter name for tracking the total number of web paid self-transfers.
        /// </summary>
        public static readonly string WebPaidSelfTransferTotal = "ejh.web.paid_self_transfer.count";

        /// <summary>
        /// The counter name for tracking the total number of new bookings made on the web.
        /// </summary>
        public static readonly string WebNewBookingTotal = "ejh.web.new_booking.count";

        /// <summary>
        /// The counter name for tracking the total number of booking amendments made on the web.
        /// </summary>
        public static readonly string WebAmendBookingTotal = "ejh.web.amend_booking.count";

        /// <summary>
        /// The counter name for tracking promo code validations (success/failure).
        /// Use with 'status' dimension: 'success' or 'failure'.
        /// </summary>
        public static readonly string WebPromoCodeValidationTotal = "ejh.web.promo_code_validation.count";

        /// <summary>
        /// The histogram name for tracking the distribution of payment amounts.
        /// </summary>
        public static readonly string WebPaymentAmountHistogram = "ejh.web.payment_amount";

        /// <summary>
        /// The histogram name for tracking the distribution of total prices.
        /// </summary>
        public static readonly string WebTotalPriceHistogram = "ejh.web.total_price";

        /// <summary>
        /// The counter name for tracking price differences between Search Results and Hotel Details pages.
        /// </summary>
        public const string WebPriceJumpSearchDetailsTotal = "ejh.web.price_jump_sr_details.count";

        /// <summary>
        /// Tracks discrepancies between type3 (Search Results) and type6 (Hotel Details) search results.
        /// Specifically identifies cases where type3 cache shows available offers,
        /// but type6 search returns no offers, leading to availability popup on Hotel Details page.
        /// Triggered when SearchPrice != 0 (indicate that in was navigated now from bookmarks or saved links)
        /// but Offers.Count == 0 in type6 response.
        /// No additional tags are included in this metric.
        /// </summary>
        public const string WebSearchTypeDiscrepancyNoOffers = "ejh.web.search_type_discrepancy_no_offers.count";

        /// <summary>
        /// The status metric value representing a failure.
        /// </summary>
        public static readonly string FailureMetricStatus = "failure";

        /// <summary>
        /// The status metric value representing a success.
        /// </summary>
        public static readonly string SuccessMetricStatus = "success";

        /// <summary>
        /// Default value for unknown labels.
        /// </summary>
        public const string UnknownLabel = "unknown";
    
        /// <summary>
        /// Error originated from Sitecore CMS promotion validation.
        /// </summary>
        public const string Sitecore = "SITECORE";

        /// <summary>
        /// Error originated from Voucherify service.
        /// </summary>
        public const string Voucherify = "VOUCHERIFY";

        /// <summary>
        /// Error originated from ATCOM booking validation.
        /// </summary>
        public const string Atcom = "ATCOM";

        /// <summary>
        /// Error source is unknown (non-ApiException errors).
        /// </summary>
        public const string Unknown = "UNKNOWN";


    }

    /// <summary>
    /// Cancellation metric names.
    /// </summary>
    public static class CancellationMetricConstants
    {
        // Counters

        /// <summary>Total cancellation attempts.</summary>
        public const string AttemptTotal = "ejh.web.cancellation_attempt.count";

        /// <summary>Successful cancellations.</summary>
        public const string SuccessTotal = "ejh.web.cancellation_success.count";

        /// <summary>Failed cancellations with error details.</summary>
        public const string FailureTotal = "ejh.web.cancellation_failure.count";

        /// <summary>Cancellation summary requests.</summary>
        public const string SummaryAttemptTotal = "ejh.web.cancellation_summary_attempt.count";

        /// <summary>Retry count - incremented when AddFailedCancellationMemo is called.</summary>
        public const string RetryTotal = "ejh.web.cancellation_retry.count";

        /// <summary>Rollback operations.</summary>
        public const string RollbackTotal = "ejh.web.cancellation_rollback.count";

        /// <summary>Booking blocked due to failed cancellations.</summary>
        public const string BookingBlockedTotal = "ejh.web.cancellation_booking_blocked.count";

        /// <summary>Transfer detail lookups.</summary>
        public const string TransferDetailsRequestTotal = "ejh.web.transfer_details_request.count";

        /// <summary>Amount of added memos broken down by type.</summary>
        public const string MemoAddedTotal = "ejh.web.cancellation_memo_added.count";

        // Histograms

        /// <summary>Cancelled booking value.</summary>
        public const string BookingValueHistogram = "ejh.web.cancellation_booking_value";

        /// <summary>Total refund amount.</summary>
        public const string RefundTotalHistogram = "ejh.web.cancellation_refund_total";

        /// <summary>Cash refund amount.</summary>
        public const string RefundCashHistogram = "ejh.web.cancellation_refund_cash";

        /// <summary>Credit refund amount.</summary>
        public const string RefundCreditHistogram = "ejh.web.cancellation_refund_credit";

        /// <summary>OTUC refund amount.</summary>
        public const string RefundOtucHistogram = "ejh.web.cancellation_refund_otuc";

        /// <summary>OTUC kept/retained amount.</summary>
        public const string RefundOtucKeptHistogram = "ejh.web.cancellation_refund_otuc_kept";

        /// <summary>Total cancellation fee.</summary>
        public const string FeeTotalHistogram = "ejh.web.cancellation_fee_total";

        /// <summary>Cancel fee amount only.</summary>
        public const string FeeCancelHistogram = "ejh.web.cancellation_fee_cancel";

        /// <summary>Amendment fee amount only.</summary>
        public const string FeeAmendmentHistogram = "ejh.web.cancellation_fee_amendment";
    }
}
