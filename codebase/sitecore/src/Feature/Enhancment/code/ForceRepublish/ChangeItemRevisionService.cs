using System;
using System.Collections.Generic;
using System.Globalization;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.ForceRepublish
{
    [Service(typeof(IChangeItemRevisionService), Lifetime = Lifetime.Transient)]
    public class ChangeItemRevisionService : IChangeItemRevisionService
    {
        private readonly IDatabaseProvider databaseProvider;

        private readonly ISitecoreEnhancmentLogger logger;

        public ChangeItemRevisionService(IDatabaseProvider databaseProvider, ISitecoreEnhancmentLogger logger)
        {
            this.databaseProvider = databaseProvider;
            this.logger = logger;
        }

        public void ChangeItemRevision(Item item)
        {
            var itemInWebDatabase = databaseProvider.GetItem(item.ID, item.Language, DatabaseType.Web);
            if (itemInWebDatabase == null)
            {
                logger.Debug($"{nameof(ChangeItemRevisionService)}.{nameof(ChangeItemRevision)}: Item not found in the web database: {item.Paths.Path}, lang:{item.Language}!", this);
                return;
            }

            try
            {
                itemInWebDatabase.Editing.BeginEdit();
                itemInWebDatabase[Sitecore.FieldIDs.Revision] = Guid.NewGuid().ToString("D", CultureInfo.InvariantCulture);
                itemInWebDatabase.Editing.EndEdit(false, false);
            }
            catch (Exception exception)
            {
                Context.Job?.Status?.Messages.Add($"Error while changing the Revision for item: {item.Paths.Path}, lang:{item.Language}!");
                logger.Error($"{nameof(ChangeItemRevisionService)}.{nameof(ChangeItemRevision)}", exception, this);
            }
        }

        public void ChangeItemRevision(List<Item> items)
        {
            foreach (var item in items)
            {
                ChangeItemRevision(item);
            }
        }
    }
}