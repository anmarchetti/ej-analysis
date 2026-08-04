using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Workbox;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    [Service(typeof(IConfigurationService), Lifetime = Lifetime.Singleton)]
    public class ConfigurationService : IConfigurationService
    {
        private readonly ISitecoreEnhancmentLogger logger;
        private readonly IWorkboxConfigurationRepository configurationRepository;

        public ConfigurationService(ISitecoreEnhancmentLogger logger, IWorkboxConfigurationRepository workboxConfigurationRepository)
        {
            this.logger = logger;
            configurationRepository = workboxConfigurationRepository;
        }

        public Dictionary<string, string> GetWorkboxDictionary()
        {
            var config = configurationRepository.GetWorkboxDictionaryConfig();
            var dictionary = new Dictionary<string, string>();

            if (config == null)
            {
                return dictionary;
            }

            foreach (var kvp in config.Entries)
            {
                if (dictionary.ContainsKey(kvp.Key))
                {
                    logger.Warn($"Workbox dictionary already contains key:{kvp.Key} with value:{kvp.Value}", this);
                }
                else
                {
                    dictionary.Add(kvp.Key, kvp.Value);
                }
            }

            return dictionary;
        }
    }
}