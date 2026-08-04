using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Sites;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    // [ExcludeFromCodeCoverage]
    public interface IDatabaseProvider
    {
        bool HasLanguageVersion(Item item, Language language, DatabaseType? type = null);

        HashSet<ID> GetExistingItemIds(HashSet<ID> itemId, DatabaseType type = DatabaseType.Context);

        Item GetItem(ID itemId, DatabaseType type = DatabaseType.Context);

        Item GetItem(ID itemId, Language language, DatabaseType type = DatabaseType.Context);

        Item GetItem(string path, DatabaseType type = DatabaseType.Context);

        Item GetItem(string path, Language language, DatabaseType type = DatabaseType.Context);

        Item GetItem(ItemUri uri);

        Item GetItem(ItemUri uri, Language language);

        Item SelectSingleItem(string query, DatabaseType type = DatabaseType.Context);

        Item[] SelectItems(string query, DatabaseType type = DatabaseType.Context);

        Database GetDatabase(DatabaseType type);

        SiteContext GetSiteContext(Item item);
    }
}