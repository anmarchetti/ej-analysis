using System.Collections.Generic;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    public interface IConfigurationService
    {
        Dictionary<string, string> GetWorkboxDictionary();
    }
}