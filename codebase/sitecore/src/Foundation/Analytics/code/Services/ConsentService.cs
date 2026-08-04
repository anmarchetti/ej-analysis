using System.Linq;
using System.Web;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite;
using Sitecore.Abstractions;

namespace easyJet.Foundation.Analytics.Services
{
    /// <summary>
    /// The consent service.
    /// </summary>
    [Service(typeof(IConsentService), Lifetime = Lifetime.Singleton)]
    public class ConsentService : IConsentService
    {
        private readonly IAnalyticsLogger logger;
        private readonly BaseSettings settings;
        private readonly IMultiSiteContext context;

        /// <summary>
        /// Initializes a new instance of the <see cref="ConsentService"/> class.
        /// </summary>
        /// <param name="logger">
        /// The logger.
        /// </param>
        /// <param name="settings">
        /// Sitecore setting instance.
        /// </param>
        public ConsentService(BaseSettings settings, IMultiSiteContext context, IAnalyticsLogger logger)
        {
            this.settings = settings;
            this.logger = logger;
            this.context = context;
        }

        /// <inheritdoc/>
        public bool IsPersonalizationConsentGiven()
        {
            var cookieName = settings.GetSetting("Foundation.Analytics.PerformancePersonalisationConsentCookie");

            var marketingCookie = HttpContext.Current?.Request.Cookies.Get(cookieName);

            logger.Debug($"Cookie '{cookieName}' value is '{marketingCookie?.Value}'", this);

            return !string.IsNullOrWhiteSpace(marketingCookie?.Value) && marketingCookie.Value.Equals(Constants.Common.NumericTrueValue);
        }

        /// <inheritdoc/>
        public bool IsPersonalizationEnabled()
        {
            var analyticSetting = context.SettingsItem?.Children?.FirstOrDefault(x => x.TemplateID == Constants.Templates.AnalyticSettings.ID);
            if (analyticSetting == null)
            {
                return true;
            }

            return analyticSetting[Constants.Templates.AnalyticSettings.Fields.EnablePersonalization] == Constants.Common.NumericTrueValue;
        }
    }
}