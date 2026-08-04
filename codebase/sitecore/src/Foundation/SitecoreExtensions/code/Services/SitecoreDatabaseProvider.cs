using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Sites;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IDatabaseProvider), Lifetime = Lifetime.Singleton)]
    public class SitecoreDatabaseProvider : IDatabaseProvider
    {
        public bool HasLanguageVersion(Item item, Language language, DatabaseType? type = null)
        {
            var db = type != null ? GetDatabase(DatabaseType.Context) : item.Database;
            var obj = db.GetItem(item.ID, language);
            return obj != null && obj.Versions.GetVersionNumbers().Length != 0;
        }

        public HashSet<ID> GetExistingItemIds(HashSet<ID> itemId, DatabaseType type = DatabaseType.Context)
        {
            return itemId.Where(i => Exists(i, type)).ToHashSet();
        }

        public Item GetItem(ID itemId, DatabaseType type = DatabaseType.Context)
        {
            return GetDatabase(type).GetItem(itemId);
        }

        public Item GetItem(ID itemId, Language language, DatabaseType type = DatabaseType.Context)
        {
            return GetDatabase(type).GetItem(itemId, language);
        }

        public Item GetItem(string path, DatabaseType type = DatabaseType.Context)
        {
            return GetDatabase(type).GetItem(path);
        }

        public Item GetItem(string path, Language language, DatabaseType type = DatabaseType.Context)
        {
            return GetDatabase(type).GetItem(path, language);
        }

        public Item GetItem(ItemUri uri)
        {
            return uri == null ? null : Factory.GetDatabase(uri.DatabaseName).GetItem(uri.ItemID, uri.Language, uri.Version);
        }

        public Item GetItem(ItemUri uri, Language language)
        {
            return uri == null ? null : Factory.GetDatabase(uri.DatabaseName).GetItem(uri.ItemID, language, uri.Version);
        }

        public Item SelectSingleItem(string query, DatabaseType type = DatabaseType.Context)
        {
            return GetDatabase(type).SelectSingleItem(query);
        }

        public Item[] SelectItems(string query, DatabaseType type = DatabaseType.Context)
        {
            return GetDatabase(type).SelectItems(query);
        }

        public Database GetDatabase(DatabaseType type)
        {
            switch (type)
            {
                case DatabaseType.Content:
                    return Context.ContentDatabase;
                case DatabaseType.Context:
                    return Context.Database;
                case DatabaseType.Master:
                    return Database.GetDatabase("master");
                case DatabaseType.Web:
                    return Database.GetDatabase("web");
                default:
                    throw new DatabaseNotFoundException(type);
            }
        }

        public SiteContext GetSiteContext(Item item)
        {
            return item?.GetSiteContext();
        }

        private bool Exists(ID itemId, DatabaseType type = DatabaseType.Context)
        {
            return GetItem(itemId, type) != null;
        }
    }
}