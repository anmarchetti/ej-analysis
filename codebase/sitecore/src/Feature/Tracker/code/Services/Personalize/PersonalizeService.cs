using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using easyJet.Feature.Tracker.Logging;
using easyJet.Feature.Tracker.Models.Personalize;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Newtonsoft.Json;
using Sitecore.Configuration;
using IHttpContextAccessor = easyJet.Foundation.SitecoreExtensions.Services.IHttpContextAccessor;

namespace easyJet.Feature.Tracker.Services.Personalize
{
    [Service(typeof(IPersonalizeService), Lifetime = Lifetime.Transient)]
    public class PersonalizeService : IPersonalizeService
    {
        private const string AuthenticationCookieName = "ejHolidaysUserId";
        private const string BidCookieFormat = "bid_{0}";
        private const string AnalyticsSettingPath = "/sitecore/content/EasyJet/Holidays/Settings/Analytic Settings";
        private const string AnalyticsTimeoutSettingName = "SitecorePersonalizeTimeout";
        private static readonly string ClientKey = Settings.GetSetting("Personalize.ClientKey");
        private static readonly string PersonalizeEndpoint = Settings.GetSetting("Personalize.Endpoint");
        private readonly IMarketSettingsService marketSettingsService;
        private readonly IHttpClientProvider httpClientProvider;
        private readonly ICustomCacheRepository cachingRepository;
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly ITrackerLogger trackerLogger;

        public PersonalizeService(
            IMarketSettingsService marketSettingsService,
            IHttpClientProvider httpClientProvider,
            ICustomCacheRepository cachingRepository,
            IHttpContextAccessor httpContextAccessor,
            IDatabaseProvider databaseProvider,
            ITrackerLogger trackerLogger)
        {
            this.marketSettingsService = marketSettingsService;
            this.cachingRepository = cachingRepository;
            this.httpContextAccessor = httpContextAccessor;
            this.trackerLogger = trackerLogger;
            var settings = databaseProvider.GetItem(AnalyticsSettingPath);
            var timeOut = settings?.GetInteger(AnalyticsTimeoutSettingName) ?? 400;
            this.httpClientProvider = httpClientProvider;
            this.httpClientProvider.SetTimeoutMilliseconds(timeOut);
        }

        public async Task<PersonalizeResult> GetPersonalizedExperience(string experienceName, int cacheTime)
        {
            var httpContext = httpContextAccessor.GetCurrent();

            if (TryGetPersonalizationFromParameters(httpContext.Request.Url.Query, experienceName, out var attributeName))
            {
                return new PersonalizeResult { SelectionAttribute = attributeName };
            }

            var userBid = GetUserBid();

            if (userBid == null || string.IsNullOrEmpty(userBid))
            {
                return new PersonalizeResult();
            }

            var cacheKey = $"{experienceName}-{userBid}";
            var value = cachingRepository.GetItem<PersonalizeResult>(cacheKey);

            if (value != null)
            {
                trackerLogger.Debug($"User bid: {userBid}. Experience name: {experienceName}. Cache value: {value}.", this);
                return value;
            }

            var personalizeRequest = GetPersonalizeRequest(experienceName, userBid);
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, PersonalizeEndpoint)
            {
                Content = new StringContent(JsonConvert.SerializeObject(personalizeRequest), Encoding.UTF8, "application/json"),
            };

            try
            {
                var response = await httpClientProvider.SendAsync(requestMessage).ConfigureAwait(false);
                var result = new PersonalizeResult();
                trackerLogger.Debug($"Result code: {response.StatusCode}.", this);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                    var resultResponse = JsonConvert.DeserializeObject<PersonalizeResult>(content);

                    // if experience is in preview mode don't show it to user.
                    result = resultResponse.IsPreview ? result : resultResponse;
                }

                trackerLogger.Debug($"User Bid: {userBid}. Experience name {experienceName}. Request result value: {result.SelectionAttribute}.", this);
                cachingRepository.StoreItem(cacheKey, result, cacheTime);

                return result;
            }
            catch (TimeoutException exception)
            {
                trackerLogger.Error($"[PersonalizeTimeOutException] Error with experiment:{experienceName} for user: {userBid}", exception, this);
            }
            catch (Exception exception)
            {
                trackerLogger.Error($"Error with experiment:{experienceName} for user: {userBid}", exception, this);
            }

            var defaultResult = new PersonalizeResult();
            cachingRepository.StoreItem(cacheKey, defaultResult, 1);
            return defaultResult;
        }

        private static bool TryGetPersonalizationFromParameters(string query, string experienceName, out string attributeName)
        {
            attributeName = null;
            if (string.IsNullOrEmpty(query))
            {
                return false;
            }

            var queryParams = HttpUtility.ParseQueryString(query);
            var experienceId = queryParams["experienceId"];
            if (!string.IsNullOrEmpty(experienceId) && experienceId.Equals(experienceName, StringComparison.OrdinalIgnoreCase))
            {
                var selectionAttribute = queryParams["selectionAttr"];
                attributeName = selectionAttribute ?? string.Empty;
                return !string.IsNullOrEmpty(attributeName);
            }

            return false;
        }

        private bool TryMarketingChannelExperience(out string campaignName)
        {
            campaignName = string.Empty;
            var httpContext = httpContextAccessor.GetCurrent();
            var query = httpContext.Request.Url.Query;

            var queryParams = HttpUtility.ParseQueryString(query);
            campaignName = queryParams["utm_campaign"];

            if (!string.IsNullOrEmpty(campaignName))
            {
                return true;
            }

            return false;
        }

        private string GetUserBid()
        {
            var bidCookie = string.Format(BidCookieFormat, ClientKey);
            var userBid = httpContextAccessor.GetRequestCookieValue(bidCookie);
            return userBid;
        }

        private PersonalizeRequest GetPersonalizeRequest(string experienceName, string bid)
        {
            var market = marketSettingsService.GetCurrentMarket();
            var currency = market?.Currency?.Code;
            var language = market?.Code;
            var request = new PersonalizeRequest
            {
                BrowserId = bid,
                ClientKey = ClientKey,
                Channel = "WEB",
                Language = language,
                CurrencyCode = currency,
                FriendlyId = experienceName,
                PointOfSale = "default",
            };

            // add custom parameter to SC personalize request.
            var isLoggedIn = httpContextAccessor.GetRequestCookieValue(AuthenticationCookieName);
            request.CustomParameters.Add("isLoggedIn", !string.IsNullOrEmpty(isLoggedIn));

            // add custom parameter for Marketing Channel personalisation
            if (TryMarketingChannelExperience(out var campaignName))
            {
                request.CustomParameters.Add("marketingChannelCampaignName", campaignName);
            }

            return request;
        }
    }
}
