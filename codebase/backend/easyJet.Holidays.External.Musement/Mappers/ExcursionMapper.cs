using easyJet.Holidays.Api.Domain.Data.Excursions;
using easyJet.Holidays.External.Musement.Models;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.External.Musement.Mappers
{
    /// <summary>
    /// Excursion models mapper
    /// </summary>
    public static partial class ExcursionMapper
    {
        private const string MusementHostRegexPattern = @"https:\/\/www.musement.com\/[a-z-]*";
        private const string MusementSandboxHostRegexPattern = @"https:\/\/.sbox.musement.com\/[a-z-]*";

        /// <summary>
        /// Map cms response to endpoint response
        /// </summary>
        /// <param name="responseBodyList"></param>
        /// <param name="whiteLabelLink"></param>
        /// <param name="hostReplacement"></param>
        /// <param name="currencyCode"></param>
        /// <returns></returns>
        public static ExcursionsResponse MapExcursionResponse(IEnumerable<SearchActivitiesResponseBody> responseBodyList, string whiteLabelLink, string hostReplacement, string currencyCode)
        {
            return new ExcursionsResponse
            {
                ExcursionsLink = ReplaceUrlHost(whiteLabelLink, hostReplacement),
                Excursions = responseBodyList.Select(x => new Excursion
                {
                    Title = x.Title,
                    CoverImageUrl = x.CoverImageUrl,
                    Description = x.Description,
                    Url = ReplaceUrlHost(x.Url, hostReplacement, currencyCode),
                    FreeCancellation = x.FreeCancellation,
                    LikelyToSellOut = x.LikelyToSellOut,
                    RetailPrice = new Price
                    {
                        Currency = x.RetailPrice.Currency,
                        Value = x.RetailPrice.Value
                    },
                    ReviewsNumber = x.ReviewsNumber,
                    ReviewsAvg = x.ReviewsAvg,
                    ReviewsAggregatedInfo = new ReviewsInfo
                    {
                        One = x.ReviewsAggregatedInfo.One,
                        Two = x.ReviewsAggregatedInfo.Two,
                        Three = x.ReviewsAggregatedInfo.Three,
                        Four = x.ReviewsAggregatedInfo.Four,
                        Five = x.ReviewsAggregatedInfo.Five,
                    }
                })
            };
        }

        private static string ReplaceUrlHost(string url, string hostReplacement, string currency = null)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return url;
            }

            url = MusementHostRegex().Replace(url, hostReplacement);
            url = MusementSnadboxHostRegex().Replace(url, hostReplacement);

            if (!string.IsNullOrEmpty(currency))
            {
                url = $"{url}?currency={currency}";
            }

            return url;
        }

        [GeneratedRegex(MusementHostRegexPattern)]
        private static partial Regex MusementHostRegex();
        
        [GeneratedRegex(MusementSandboxHostRegexPattern)]
        private static partial Regex MusementSnadboxHostRegex();
    }
}
