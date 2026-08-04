using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;

namespace easyJet.Feature.MediaCenter.Services
{
    [Service(typeof(ITopicsService), Lifetime = Lifetime.Singleton)]
    public class TopicsService : ITopicsService
    {
        private readonly IHtmlCacheRepository cache;

        public TopicsService(IHtmlCacheRepository cache)
        {
            this.cache = cache;
        }

        /// <inheritdoc/>
        public IEnumerable<string> GetTopics()
        {
            string cacheKey = "MediaCenter.Cache.Topics";

            var data = cache.GetItem<IEnumerable<string>>(cacheKey);

            if (data != null)
            {
                return data;
            }

            var topics = Sitecore.Context.Database.SelectItems($"{Sitecore.Context.Site.RootPath}/Data/*[@@templateId='{Constants.TemplateIds.TopicsFolder}']/*[@@templateId='{Constants.TemplateIds.Topic}']")
                .Select(x => x[Constants.Fields.TopicItem.Name]);

            if (topics.Any())
            {
                cache.StoreItem(cacheKey, topics);
            }

            return topics;
        }
    }
}