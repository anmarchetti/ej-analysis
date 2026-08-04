using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Sites;

namespace easyJet.Foundation.Multisite
{
    [Service(typeof(ISitecoreContext), Lifetime = Lifetime.Singleton)]
    public class SitecoreContext : ISitecoreContext
    {
        /// <inheritdoc/>
        public Item Item
        {
            get => Context.Item;
            set => Context.Item = value;
        }

        /// <inheritdoc/>
        public Database Database
        {
            get => Context.Database;
            set => Context.Database = value;
        }

        /// <inheritdoc/>
        public Database ContentDatabase
        {
            get => Context.ContentDatabase ?? Factory.GetDatabase("master");
            set => Context.ContentDatabase = value;
        }

        /// <inheritdoc/>
        public SiteContext Site
        {
            get => Context.Site;
            set => Context.Site = value;
        }

        /// <inheritdoc/>
        public Language Language
        {
            get => Context.Language;
            set => Context.Language = value;
        }
    }
}