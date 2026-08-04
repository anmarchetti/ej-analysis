using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Abstractions;
using Sitecore.Configuration;

namespace easyJet.Feature.SitecoreEnhancment.Workbox
{
    [Service(typeof(IWorkboxConfigurationRepository), Lifetime = Lifetime.Singleton)]
    public class WorkboxConfigurationRepository : IWorkboxConfigurationRepository
    {
        private readonly BaseSettings settingsService;

        public WorkboxConfigurationRepository(BaseSettings settings)
        {
            settingsService = settings;
        }

        public WorkboxDictionary GetWorkboxDictionaryConfig()
        {
            var workboxDictionaryXpath = settingsService.GetSetting(Constants.Workbox.WorkboxDictionaryXpathSettingsName);
            if (string.IsNullOrEmpty(workboxDictionaryXpath))
            {
                return null;
            }

            var xmlNode = Factory.GetConfigNode(workboxDictionaryXpath);
            if (xmlNode == null)
            {
                return null;
            }

            return Factory.CreateObject(xmlNode, false) as WorkboxDictionary;
        }
    }
}