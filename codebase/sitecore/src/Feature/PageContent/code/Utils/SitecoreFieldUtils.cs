using easyJet.Feature.PageContent.Models;
using Newtonsoft.Json.Linq;

namespace easyJet.Feature.PageContent.Utils
{
    public static class SitecoreFieldUtils
    {
        public static JObject BuildSitecoreField<T>(T value)
        {
            var field = new SitecoreField<T>(value);
            return JObject.FromObject(field);
        }
    }
}
