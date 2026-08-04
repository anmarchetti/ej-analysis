using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    [Service(typeof(IFilterPillsRepository), Lifetime = Lifetime.Singleton)]
    public class RecommendedFiltersRepository : IFilterPillsRepository
    {
        /// <inheritdoc/>
        public Item GetFilterPillsItem()
        {
            return Sitecore.Context.Database.SelectSingleItem($"{Sitecore.Context.Site.RootPath}" +
                $"/*[@@templateid='{Templates.Data.Id}']" +
                $"/*[@@templateid='{Constants.TemplateIds.FilterPillsFolder}']");
        }

        /// <inheritdoc/>
        public Item GetRecommendedFiltersItem()
        {
            return Sitecore.Context.Database.SelectSingleItem($"{Sitecore.Context.Site.RootPath}" +
                $"/*[@@templateid='{Templates.Data.Id}']" +
                $"/*[@@templateid='{Constants.TemplateIds.RecommendedFiltersFolder}']");
        }
    }
}
