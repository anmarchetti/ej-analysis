namespace easyJet.Holidays.Api.Domain.Settings
{
    public class FeefoApiSettings
    {
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string EndPointEnterSaleRemotely { get; set; }

        public string EndPointReviewsSummaryService { get; set; }

        /// <summary>
        /// Query params that are always added to reviews summary request
        /// </summary>
        public string ReviewsSummaryServiceQueryParams { get; set; }

        public string EndPointReviewsService { get; set; }

        /// <summary>
        /// Query params that are always added to reviews request
        /// </summary>
        public string ReviewsServiceQueryParams { get; set; }

        public string EndPointAuthentication { get; set; }
        public string MerchantIdentifier { get; set; }
    }
}
