using System.Collections.Generic;
using easyJet.Feature.Tracker.Models.Personalize;

namespace easyJet.Feature.Tracker.Services.Personalize
{
    public interface IPersonalizationContext
    {
        IEnumerable<Personalization> GetAllPersonalizations();

        void AddOrUpdatePersonalization(string key, PersonalizeResult value);

        bool TryGetPersonalization(string key, out PersonalizeResult value);

        void AddOrUpdateRenderingMapping(string key, string value);
    }
}
