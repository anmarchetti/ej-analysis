using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;

namespace easyJet.Holidays.Api.Domain.Services.Extras
{
    /// <summary>
    /// Transfers service
    /// </summary>
    public class ExtrasService : IExtrasService
    {
        private IItemSearchService _itemSearchService;
        private readonly ITransferService _transferService;
        private readonly IMetricsService _metricsService;
        private readonly IOtelAnalyticsService _otelAnalyticsService;


        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="itemSearchService"></param>
        /// <param name="transferService"></param>
        /// <param name="metricsService"></param>
        /// <param name="otelAnalyticsService"></param>
        public ExtrasService(
            IItemSearchService itemSearchService,
            ITransferService transferService,
            IMetricsService metricsService,
            IOtelAnalyticsService otelAnalyticsService)
        {
            _itemSearchService = itemSearchService;
            _transferService = transferService;
            _metricsService = metricsService;
            _otelAnalyticsService = otelAnalyticsService;
        }

        /// <inheritdoc />
        public async Task<OfferExtras> Get(Offer offer)
        {
            var extras = await _itemSearchService.GetExtras(offer);
            extras.Transfers = await _transferService.GetAll(offer, extras.Transfers);

            if (offer != null)
            {
                await TrackExpensiveNoTransferCases(extras, offer);
            }

            return extras;
        }

        /// <summary>
        /// Tracks scenarios where NO_TRANSFER is more expensive than other transfer options.
        /// </summary>
        /// <param name="extras">List of extras.</param>
        /// <param name="offer"></param>
        private async Task TrackExpensiveNoTransferCases(OfferExtras extras,Offer offer)
        {
            var noTransferOption = extras.Transfers.FirstOrDefault(t => t.Type == TransferItemType.NoTransfer);
            if (noTransferOption == null) return;

            var cheapestOption = extras.Transfers.Where(t => t.Type != TransferItemType.NoTransfer).OrderBy(t => t.Price).FirstOrDefault();
            if (cheapestOption != null && noTransferOption.Price > cheapestOption.Price)
            {
                // Increment the counter
                _metricsService.IncrementCounter(MetricConstants.WebPaidSelfTransferTotal, 1,
                    new KeyValuePair<string, object>("airport_code", offer.Transport.Routes.FirstOrDefault()?.ArrPt));
                await _otelAnalyticsService.TrackExpensiveNoTransferAsync(offer);
            }
        }
    }
}
