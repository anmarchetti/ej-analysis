using Sitecore.Analytics;

namespace easyJet.Foundation.Optimizely.Factory
{
    using easyJet.Foundation.DependencyInjection;
    using easyJet.Foundation.DependencyInjection.Attributes;
    using easyJet.Foundation.SitecoreExtensions.Services;
    using OptimizelySDK;
    using OptimizelySDK.Entity;
    using Sitecore.Configuration;

    /// <inheritdoc />
    [Service(typeof(IOptimizelyUserContextFactory), Lifetime = Lifetime.Transient)]
    public class OptimizelyUserContextFactory : IOptimizelyUserContextFactory
    {
        private static readonly string CookieName = Settings.GetSetting(Constants.OptimizelySettings.UserContextCookieName);
        private readonly IHttpContextAccessor httpContextAccessor;

        /// <summary>
        /// Initializes a new instance of the <see cref="OptimizelyUserContextFactory"/> class.
        /// </summary>
        /// <param name="httpContextAccessor">httpContextAccessor.</param>
        public OptimizelyUserContextFactory(IHttpContextAccessor httpContextAccessor)
        {
            this.httpContextAccessor = httpContextAccessor;
        }

        /// <inheritdoc/>
        public string GetUserId()
        {
            // Prefer end user cookie value, else xDB contact when available, else anonymous cookie, else GUID
            var endUserCookieValue = httpContextAccessor.GetRequestCookieValue(CookieName);

            if (!string.IsNullOrEmpty(endUserCookieValue))
            {
                return endUserCookieValue;
            }

            var contactId = Tracker.Current?.Contact?.ContactId.ToString("N");
            if (!string.IsNullOrEmpty(contactId))
            {
                return contactId;
            }

            return null;
        }

        /// <inheritdoc/>
        public UserAttributes GetAttributes()
        {
            var attrs = new UserAttributes
            {
                ["site"] = Sitecore.Context.Site?.Name ?? "unknown",
                ["language"] = Sitecore.Context.Language?.Name ?? "en",
            };
            return attrs;
        }

        /// <inheritdoc/>
        public bool TryCreateUserContext(IOptimizely client, out OptimizelyUserContext context, out string userId)
        {
            context = null;
            userId = null;

            // Allow bypass in Experience Editor: we still need layout to load.
            if (Sitecore.Context.PageMode.IsExperienceEditor)
            {
                return false;
            }

            var id = GetUserId();

            if (string.IsNullOrEmpty(id))
            {
                // No cookies accepted, No tracking enabled => decisioning and personalization disabled
                return false;
            }

            userId = id;
            context = client.CreateUserContext(id, GetAttributes());
            return true;
        }
    }
}