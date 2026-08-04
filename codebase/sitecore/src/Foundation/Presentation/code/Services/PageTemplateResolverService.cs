using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;

namespace easyJet.Foundation.Presentation.Services
{
    /// <inheritdoc/>
    [Service(typeof(IPageTemplateResolverService), Lifetime = Lifetime.Singleton)]
    public class PageTemplateResolverService : IPageTemplateResolverService
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IPresentationLogger logger;

        public PageTemplateResolverService(IDatabaseProvider pDatabaseProvider, IPresentationLogger pLogger)
        {
            databaseProvider = pDatabaseProvider;
            logger = pLogger;
        }

        /// <inheritdoc/>
        public ID ResolveTemplateId(ID pageItemId, DatabaseType databaseType)
        {
            if (ID.IsNullOrEmpty(pageItemId))
            {
                return ID.Null;
            }

            var db = databaseProvider.GetDatabase(databaseType);
            if (db == null)
            {
                return ID.Null;
            }

            var item = db.GetItem(pageItemId);
            if (item == null)
            {
                logger.Warn($"[{nameof(PageTemplateResolverService)}] Item not found for id '{pageItemId}'.", GetType());
                return ID.Null;
            }

            return item.TemplateID;
        }
    }
}
