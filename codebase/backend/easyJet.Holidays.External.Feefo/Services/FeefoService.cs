using easyJet.Holidays.Api.Domain.Data.Feefo;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Feefo.Interfaces;
using easyJet.Holidays.External.Feefo.Models.DTO;
using easyJet.Holidays.External.Feefo.Models.EnterSale;
using easyJet.Holidays.External.Feefo.Models.Review;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Web;

[assembly: InternalsVisibleTo("easyJet.Holidays.External.Feefo.Tests")]
[assembly: InternalsVisibleTo("easyJet.Holidays.External.AWS.SendEmailsToFeefo.Tests")]
namespace easyJet.Holidays.External.Feefo.Services
{
    /// <inheritdoc cref="IFeefoService"/>
    public class FeefoService : IFeefoService
    {
        private readonly IApiService _apiService;
        private readonly ILogger<FeefoService> _logger;
        private readonly IOptions<FeefoApiSettings> _feefoApiSettings;

        // form data keys
        internal const string _merchantIdentifier = "merchantidentifier";
        internal const string _description = "description";
        internal const string _email = "email";
        internal const string _name = "name";
        internal const string _orderRef = "orderref";
        internal const string _amount = "amount";
        internal const string _currency = "currency";
        internal const string _productsearchcode = "productsearchcode";
        internal const string _customerRef = "customerref";

        // tag keys
        internal const string _date = "date";
        internal const string _category = "category";
        internal const string _destinationcountry = "destinationcountry";
        internal const string _destinationregion = "destinationregion";
        internal const string _resort = "resort";
        internal const string _hotel = "hotel";
        internal const string _numberOfPassengers = "numberofpassengers";
        internal const string _packageType = "packagetype";
        internal const string _unsubscribeLink = "unsubscribelink";

        private const string FeefoDateTimeFormat = "dd-MM-yyyy";
        private const string FeefoFilterDateTimeFormat = "yyyy-MM-dd";
        private const int MaxReviewsPerRequest = 100;

        /// <summary>
        /// default ctor
        /// </summary>
        /// <param name="apiService"></param>
        /// <param name="feefoApiSettings"></param>
        /// <param name="logger"></param>
        public FeefoService([FromKeyedServices(Constants.ServiceKey)] IApiService apiService, IOptions<FeefoApiSettings> feefoApiSettings, ILogger<FeefoService> logger)
        {
            _apiService = apiService;
            _logger = logger;
            _feefoApiSettings = feefoApiSettings;
        }

        public async Task<bool> SendData(FeefoEnterSale feefoEnterSale)
        {
            try
            {
                var formData = GetFormData(feefoEnterSale);
                var messageRequest = new FeefoEnterSaleRequest
                {
                    Endpoint = new Uri(_feefoApiSettings.Value.EndPointEnterSaleRemotely),
                    PayloadFormData = formData
                };

                var response = await _apiService.GetResponseContentAsync<FeefoEnterSaleRequest, FeefoEnterSaleResponse>(messageRequest);
                _logger.LogInformation(response?.PayloadString);
                return true;
            }
            catch (Exception exception)

            {
                _logger.LogError(exception, "Failed to send data to sale feefo API");
                return false;
            }
        }

        public async Task<List<Review>> GetServiceReviews(FeefoReviewsSearchRequest feefoReviewsSearchRequest)
        {
            try
            {
                var reviews = new List<Review>();

                var chunks = SplitIntoBuckets(feefoReviewsSearchRequest.Count, MaxReviewsPerRequest);

                var pagesCount = chunks.Count;
                for (var i = 0; i < pagesCount; i++)
                {
                    var chunk = chunks[i];
                    var page = i + 1;
                    var request = MapReviewsRequest(feefoReviewsSearchRequest, chunk, page);

                    request.AddQueryString(_feefoApiSettings.Value.ReviewsServiceQueryParams);
                    request.SetQueryString();

                    var response = await _apiService
                        .GetResponseContentAsync<FeefoDetailReviewsRequest, FeefoDetailReviewsServiceResponse>(request);

                    reviews.AddRange(response.Payload?.Body?.Reviews?.Select(MapRating).Where(review => review != null)
                        .ToList() ?? new List<Review>());

                    if (response.Payload?.Body?.Summary?.Meta?.Pages <= pagesCount)
                        break;
                }

                return reviews;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to get Reviews from Feefo");
                throw;
            }
        }

        public async Task<ReviewSummary> GetServiceReviewsSummary()
        {
            try
            {
                var request = new FeefoReviewsSummaryRequest()
                {
                    Endpoint = new Uri(_feefoApiSettings.Value.EndPointReviewsSummaryService),
                    MerchantIdentifier = _feefoApiSettings.Value.MerchantIdentifier,
                };

                request.AddQueryString(_feefoApiSettings.Value.ReviewsSummaryServiceQueryParams);
                request.SetQueryString();
                var response = await _apiService
                        .GetResponseContentAsync<FeefoReviewsSummaryRequest, FeefoReviewsSummaryResponse>(request);

                return new ReviewSummary()
                {
                    AverageRating = response.Payload?.Body?.Rating?.Rating ?? 0,
                    Count = response.Payload?.Body?.Meta?.Count ?? 0
                };

            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to get Review Summary from Feefo");
                throw;
            }
        }

        public async Task<ReviewsAndSummary> GetServiceReviewsAndSummary(FeefoReviewsSearchRequest feefoReviewsSearchRequest)
        {
            try
            {
                var reviewsTask = GetServiceReviews(feefoReviewsSearchRequest);
                var summaryTask = GetServiceReviewsSummary();

                await Task.WhenAll(reviewsTask, summaryTask);

                return new ReviewsAndSummary()
                {
                    Reviews = reviewsTask.Result,
                    Summary = summaryTask.Result
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to get Reviews and Summary from Feefo");
                throw;
            }
        }

        internal static List<int> SplitIntoBuckets(int amount, int maxPerGroup)
        {
            var amountGroups = Math.Ceiling(amount / (decimal)maxPerGroup);

            var results = new List<int>();
            for (var i = 0; i < amountGroups; i++)
            {
                results.Add(Math.Min(maxPerGroup, amount));
                amount -= Math.Min(maxPerGroup, amount);
            }
            return results;
        }

        internal string GetFormData(FeefoEnterSale feefoEnterSale)
        {
            var dictionary = new Dictionary<string, string>();
            AddToDictionaryIfNotNullOrEmpty(dictionary, _merchantIdentifier, feefoEnterSale.MerchantIdentifier);
            AddToDictionaryIfNotNullOrEmpty(dictionary, _productsearchcode, feefoEnterSale.ProductSearchCode);
            AddToDictionaryIfNotNullOrEmpty(dictionary, _description, feefoEnterSale.Description);
            AddToDictionaryIfNotNullOrEmpty(dictionary, _email, feefoEnterSale.Email);
            AddToDictionaryIfNotNullOrEmpty(dictionary, _name, feefoEnterSale.Name);
            AddToDictionaryIfNotNullOrEmpty(dictionary, _orderRef, feefoEnterSale.OrderReference);
            AddToDictionaryIfNotNullOrEmpty(dictionary, _currency, feefoEnterSale.Currency);
            AddToDictionaryIfNotNullOrEmpty(dictionary, _customerRef, feefoEnterSale.CustomerReference);

            if (feefoEnterSale.Amount.HasValue)
                dictionary.Add(_amount, feefoEnterSale.Amount.Value.ToString(CultureInfo.InvariantCulture));

            var data = string.Join("&",
                dictionary.Select(valuePair => $"{HttpUtility.UrlEncode(valuePair.Key)}={HttpUtility.UrlEncode(valuePair.Value)}"));

            var tagsDictionary = GetTags(feefoEnterSale);
            string ret;

            if (tagsDictionary != null && tagsDictionary.Count > 0)
            {
                ret = $"{data}&tags=[{JoinTags(tagsDictionary)}]";
            }
            else
            {
                ret = data;
            }
            _logger.LogDebug(ret);

            return ret;
        }

        internal Dictionary<string, string> GetTags(FeefoEnterSale feefoEnterSale)
        {
            var tagsDictionary = new Dictionary<string, string>();
            AddToDictionaryIfNotNullOrEmpty(tagsDictionary, _category, feefoEnterSale.HotelTheme);
            AddToDictionaryIfNotNullOrEmpty(tagsDictionary, _destinationcountry, feefoEnterSale.DestinationCountryName);
            AddToDictionaryIfNotNullOrEmpty(tagsDictionary, _destinationregion, feefoEnterSale.DestinationRegionName);
            AddToDictionaryIfNotNullOrEmpty(tagsDictionary, _resort, feefoEnterSale.ResortName);
            AddToDictionaryIfNotNullOrEmpty(tagsDictionary, _hotel, feefoEnterSale.HotelName);
            AddToDictionaryIfNotNullOrEmpty(tagsDictionary, _unsubscribeLink, feefoEnterSale.UnsubscribeLink);

            if (feefoEnterSale.Date.HasValue)
            {
                tagsDictionary.Add(_date, feefoEnterSale.Date.Value.ToString(FeefoDateTimeFormat));
            }

            if (feefoEnterSale.NumberOfPassengers != default)
            {
                tagsDictionary.Add(_numberOfPassengers, feefoEnterSale.NumberOfPassengers.ToString());
            }

            if (!string.IsNullOrEmpty(feefoEnterSale.PackageType))
            {
                tagsDictionary.Add(_packageType, feefoEnterSale.PackageType);
            }

            return tagsDictionary;
        }

        internal void PopulateFilterData(FeefoReviewsSearchRequest feefoReviewsSearchRequest, FeefoDetailReviewsRequest request)
        {
            if (feefoReviewsSearchRequest.CreatedDateTime != null)
                request.DateTime = feefoReviewsSearchRequest.CreatedDateTime.Value.ToString(FeefoFilterDateTimeFormat);

            if (feefoReviewsSearchRequest.UpdatedDateTime != null)
                request.UpdatedDateTime = feefoReviewsSearchRequest.UpdatedDateTime.Value.ToString(FeefoFilterDateTimeFormat);

            if (feefoReviewsSearchRequest.UpdatedSince != null)
                request.SinceUpdatedPeriod = ConvertPeriod(feefoReviewsSearchRequest.UpdatedSince.Value);

            if (feefoReviewsSearchRequest.Sort != null)
                request.Sort = ConvertSort(feefoReviewsSearchRequest.Sort.Value);

            if (feefoReviewsSearchRequest.Rating != null && feefoReviewsSearchRequest.Rating.Any())
                request.Rating = string.Join(",", feefoReviewsSearchRequest.Rating.Select(i => i.ToString(CultureInfo.InvariantCulture)).ToList());

            var tagsString = GetSearchTags(feefoReviewsSearchRequest);
            if (!string.IsNullOrEmpty(tagsString))
                request.Tags = tagsString;
        }

        internal string ConvertSort(FeefoRequestSort sort)
        {
            switch (sort)
            {
                case FeefoRequestSort.UpdatedDate:
                default:
                    return "updated_date";
            }
        }

        internal string ConvertPeriod(FeefoRequestPeriod createdSince)
        {
            // https://support.feefo.com/support/solutions/articles/8000079020-api-integration#A-summary-of-the-review-information

            return createdSince switch
            {
                FeefoRequestPeriod.Day => "24_hours",
                FeefoRequestPeriod.Week => "week",
                FeefoRequestPeriod.Month => "month",
                FeefoRequestPeriod.Year => "year",
                FeefoRequestPeriod.All => "all",
                _ => "year",
            };
        }

        internal string GetSearchTags(FeefoReviewsSearchRequest feefoReviewsSearchRequest)
        {
            var tags = new Dictionary<string, string>();
            AddToDictionaryIfNotNullOrEmpty(tags, "category", feefoReviewsSearchRequest.TagCategory);
            AddToDictionaryIfNotNullOrEmpty(tags, "destinationcountry", feefoReviewsSearchRequest.TagDestinationCountry);
            AddToDictionaryIfNotNullOrEmpty(tags, "destinationregion", feefoReviewsSearchRequest.TagDestinationRegion);
            AddToDictionaryIfNotNullOrEmpty(tags, "hotel", feefoReviewsSearchRequest.TagHotel);
            AddToDictionaryIfNotNullOrEmpty(tags, "packagetype", feefoReviewsSearchRequest.TagPackageType);
            AddToDictionaryIfNotNullOrEmpty(tags, "resort", feefoReviewsSearchRequest.TagResort);

            if (feefoReviewsSearchRequest.TagNumberOfPassengers != null)
                tags.Add("numberofpassengers", feefoReviewsSearchRequest.TagNumberOfPassengers.Value.ToString(CultureInfo.InvariantCulture));

            if (feefoReviewsSearchRequest.TagDate != null)
                tags.Add("date", feefoReviewsSearchRequest.TagDate.Value.ToString(FeefoDateTimeFormat));

            return string.Join(",", tags.Select(valuePair => $"{valuePair.Key}:{valuePair.Value}"));
        }

        private Review MapRating(ResponseReview responseReview)
        {
            if (responseReview?.Service == null)
                return null;

            return new Review
            {
                Rating = responseReview.Service.Rating.Rating,
                Date = responseReview.Service.CreatedAt,
                Text = responseReview.Service.Review,
                Title = responseReview.Service.Title,
                CustomerName = responseReview?.Customer?.DisplayName
            };
        }


        private static void AddToDictionaryIfNotNullOrEmpty(Dictionary<string, string> dictionary, string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
                dictionary.Add(key, value);
        }

        private static string JoinTags(Dictionary<string, string> tagsDictionary)
        {
            return string.Join(",", tagsDictionary.Select(
                                valuePair =>
                                valuePair.Value.Contains(',') ?
                                $"[{HttpUtility.UrlEncode(valuePair.Key)}={HttpUtility.UrlEncode(valuePair.Value)}]" :
                                $"{HttpUtility.UrlEncode(valuePair.Key)}={HttpUtility.UrlEncode(valuePair.Value)}"
                            ));
        }

        private FeefoDetailReviewsRequest MapReviewsRequest(FeefoReviewsSearchRequest feefoReviewsSearchRequest, int chunk, int page)
        {
            var request = GetBaseFeefoDetailReviewsRequest(chunk, page);
            PopulateFilterData(feefoReviewsSearchRequest, request);

            return request;
        }

        private FeefoDetailReviewsRequest GetBaseFeefoDetailReviewsRequest(int chunk, int page)
        {
            var request = new FeefoDetailReviewsRequest()
            {
                Endpoint = new Uri(_feefoApiSettings.Value.EndPointReviewsService),
                MerchantIdentifier = _feefoApiSettings.Value.MerchantIdentifier,
                PageSize = chunk.ToString(CultureInfo.InvariantCulture),
                Page = page.ToString(CultureInfo.InvariantCulture),
            };
            return request;
        }
    }
}
