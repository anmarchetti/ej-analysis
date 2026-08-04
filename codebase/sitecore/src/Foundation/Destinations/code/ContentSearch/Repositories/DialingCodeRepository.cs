using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    [Service(typeof(IDialingCodeRepository), Lifetime = Lifetime.Singleton)]
    public class DialingCodeRepository : IDialingCodeRepository
    {
        /// <inheritdoc/>
        public IEnumerable<Item> GetAllDialingCodeItems()
        {
            return Sitecore.Context.Database.SelectSingleItem($"{Sitecore.Context.Site.RootPath}" +
                $"/*[@@templateid = '{Templates.Data.Id}']" +
                $"/*[@@templateid = '{Constants.TemplateIds.DialingCodesFolder}']")?
                .Children.Where(child => child.TemplateID == Constants.TemplateIds.DialingCode)
                .OrderBy(dialingCodeItem => dialingCodeItem.Name);
        }
    }
}