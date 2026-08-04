using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.Tracker.Models.Personalize;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Feature.Tracker.Services.Personalize
{
    [Service(typeof(IPersonalizationContext), Lifetime = Lifetime.Scoped)]
    public class PersonalizationContext : IPersonalizationContext
    {
        private readonly IDictionary<string, string> renderingMapping = new Dictionary<string, string>();
        private readonly IDictionary<string, PersonalizeResult> experiences = new Dictionary<string, PersonalizeResult>();

        public IEnumerable<Personalization> GetAllPersonalizations()
        {
            return renderingMapping.Select(rendering =>
                new Personalization
                {
                    UniqueId = rendering.Key,
                    FriendlyId = rendering.Value,
                    SelectionAttr = experiences[rendering.Value].SelectionAttribute,
                    Ctas = experiences[rendering.Value].Ctas,
                });
        }

        public void AddOrUpdatePersonalization(string key, PersonalizeResult value)
        {
            if (experiences.ContainsKey(key))
            {
                experiences[key] = value;
                return;
            }

            experiences.Add(key, value);
        }

        public bool TryGetPersonalization(string key, out PersonalizeResult value) => experiences.TryGetValue(key, out value);

        public void AddOrUpdateRenderingMapping(string key, string value)
        {
            if (renderingMapping.ContainsKey(key))
            {
                renderingMapping[key] = value;
                return;
            }

            renderingMapping.Add(key, value);
        }
    }
}
