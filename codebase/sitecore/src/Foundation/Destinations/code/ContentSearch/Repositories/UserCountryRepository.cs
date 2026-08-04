using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    [Service(typeof(IUserCountryRepository), Lifetime = Lifetime.Singleton)]
    public class UserCountryRepository : IUserCountryRepository
    {
        /// <inheritdoc/>
        public IEnumerable<Item> GetAllUserCountryItems()
        {
            return Sitecore.Context.Database.SelectSingleItem($"{Sitecore.Context.Site.RootPath}" +
                $"/*[@@templateid='{Templates.Data.Id}']" +
                $"/*[@@templateid='{Constants.TemplateIds.UserCountriesFolder}']")?
                .Children.Where(child => child.TemplateID == Constants.TemplateIds.UserCountry).OrderBy(countryItem => countryItem.Name);
        }
    }
}