namespace easyJet.Holidays.Api.Domain.Monitoring
{
    /// <summary>
    /// Metrics Initializer
    /// </summary>
    public class MetricsInitializer
    {
        private readonly IMetricsService _metricsService;

        /// <summary>
        /// Metrics Initializer constructor
        /// </summary>
        /// <param name="metricsService"></param>
        public MetricsInitializer(IMetricsService metricsService)
        {
            _metricsService = metricsService;
        }

        /// <summary>
        /// Register Metrics for Otel
        /// </summary>
        public void RegisterMetrics()
        {
            _metricsService.RegisterCounter(MetricConstants.WebPackageAvailabilityCheckTotal, "Tracks the total availability checks performed");
            _metricsService.RegisterCounter(MetricConstants.WebPaidSelfTransferTotal, "Tracks the total number of self-transfer scenarios requiring additional payment.");
            _metricsService.RegisterCounter(MetricConstants.WebHotelsNotInCmsTotal, "Tracks the total number of hotels not available in the CMS.");
            _metricsService.RegisterCounter(MetricConstants.WebNewBookingTotal, "Tracks the total number of new bookings made on the web, with labels for hotel type and source.");
            _metricsService.RegisterCounter(MetricConstants.WebAmendBookingTotal, "Tracks the total number of booking amendments made on the web, with labels for market, hotel type and amendment type.");
            _metricsService.RegisterCounter(MetricConstants.WebPromoCodeValidationTotal, "Tracks the total number of promo code validations with status (success/failure) and promo code labels.");
            _metricsService.RegisterHistogram(MetricConstants.WebTotalPriceHistogram, "Tracks the distribution of total prices for bookings.");
            _metricsService.RegisterHistogram(MetricConstants.WebPaymentAmountHistogram, "Tracks the distribution of amounts paid for bookings.");
            _metricsService.RegisterCounter(MetricConstants.WebPriceJumpSearchDetailsTotal, "Tracks the difference in prices between Search Results and Hotel Details pages");
            _metricsService.RegisterCounter(MetricConstants.WebSearchTypeDiscrepancyNoOffers, "Tracks cases where type3 search shows offers but type6 returns none, indicating cache/availability discrepancies");

            // Cancellation counters
            _metricsService.RegisterCounter(CancellationMetricConstants.AttemptTotal, "Total cancellation attempts");
            _metricsService.RegisterCounter(CancellationMetricConstants.SuccessTotal, "Successful cancellations");
            _metricsService.RegisterCounter(CancellationMetricConstants.FailureTotal, "Failed cancellations with error details");
            _metricsService.RegisterCounter(CancellationMetricConstants.SummaryAttemptTotal, "Cancellation summary requests");
            _metricsService.RegisterCounter(CancellationMetricConstants.RetryTotal, "Retry count per booking when AddFailedCancellationMemo is called");
            _metricsService.RegisterCounter(CancellationMetricConstants.RollbackTotal, "Rollback operations");
            _metricsService.RegisterCounter(CancellationMetricConstants.BookingBlockedTotal, "Booking blocked due to failed cancellations");
            _metricsService.RegisterCounter(CancellationMetricConstants.TransferDetailsRequestTotal, "Transfer detail lookups");
            _metricsService.RegisterCounter(CancellationMetricConstants.MemoAddedTotal, "Memos added broken down by type");

            // Cancellation histograms
            _metricsService.RegisterHistogram(CancellationMetricConstants.BookingValueHistogram, "Cancelled booking value");
            _metricsService.RegisterHistogram(CancellationMetricConstants.RefundTotalHistogram, "Total refund amount");
            _metricsService.RegisterHistogram(CancellationMetricConstants.RefundCashHistogram, "Cash refund amount");
            _metricsService.RegisterHistogram(CancellationMetricConstants.RefundCreditHistogram, "Credit refund amount");
            _metricsService.RegisterHistogram(CancellationMetricConstants.RefundOtucHistogram, "OTUC refund amount");
            _metricsService.RegisterHistogram(CancellationMetricConstants.RefundOtucKeptHistogram, "OTUC kept/retained amount");
            _metricsService.RegisterHistogram(CancellationMetricConstants.FeeTotalHistogram, "Total cancellation fee");
            _metricsService.RegisterHistogram(CancellationMetricConstants.FeeCancelHistogram, "Cancel fee amount only");
            _metricsService.RegisterHistogram(CancellationMetricConstants.FeeAmendmentHistogram, "Amendment fee amount only");
        }
    }
}