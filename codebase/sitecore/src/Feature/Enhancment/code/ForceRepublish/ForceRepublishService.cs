using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Feature.SitecoreEnhancment.ForceRepublish
{
    [Service(typeof(IForceRepublishService), Lifetime = Lifetime.Transient)]
    public class ForceRepublishService : IForceRepublishService
    {
        private readonly IChangeItemRevisionService changeItemRevisionService;

        private readonly IDatabaseProvider databaseProvider;

        private readonly IPublishManagerService publishManagerService;

        private readonly ISitecoreEnhancmentLogger logger;

        public ForceRepublishService(IPublishManagerService publishManagerService, IDatabaseProvider databaseProvider, IChangeItemRevisionService changeItemRevisionService, ISitecoreEnhancmentLogger logger)
        {
            this.publishManagerService = publishManagerService;
            this.databaseProvider = databaseProvider;
            this.changeItemRevisionService = changeItemRevisionService;
            this.logger = logger;
        }

        public IEnumerable<Item> ForceRepublish(
            Item currentItem,
            PublishMode publishMode = PublishMode.SingleItem,
            PublishLanguage publishLanguage = PublishLanguage.CurrentLanguage)
        {
            try
            {
                return ExecuteForDescendants(currentItem, publishMode, publishLanguage);
            }
            finally
            {
                var deep = publishMode == PublishMode.SubTree;
                var allLanguages = publishLanguage == PublishLanguage.AllLanguages;
                PublishChanges(currentItem, deep, allLanguages);
            }
        }

        private Item GetItemInLanguage(ID itemId, Language language)
        {
            return databaseProvider.GetItem(itemId, language, DatabaseType.Master);
        }

        private IEnumerable<Item> ExecuteForDescendants(Item currentItem, PublishMode publishMode, PublishLanguage publishLanguage)
        {
            var languages = publishLanguage == PublishLanguage.CurrentLanguage
                ? new[] { currentItem.Language }
                : currentItem.Languages;

            foreach (var language in languages)
            {
                var languageItem = GetItemInLanguage(currentItem.ID, language);
                changeItemRevisionService.ChangeItemRevision(languageItem);
                yield return languageItem;
            }

            if (publishMode != PublishMode.SingleItem)
            {
                foreach (Item child in currentItem.Children)
                {
                    foreach (var item in ExecuteForDescendants(child, publishMode, publishLanguage))
                    {
                        yield return item;
                    }
                }
            }
        }

        private void PublishChanges(Item contextItem, bool deep, bool allLanguages)
        {
            try
            {
                var db = databaseProvider.GetDatabase(DatabaseType.Web);
                var databases = new[] { db };
                var languages = allLanguages
                    ? db.Languages
                    : new[] { contextItem.Language };
                publishManagerService.PublishItem(contextItem, databases, languages, deep, false, false);
            }
            catch (Exception exception)
            {
                logger.Error($"{nameof(ForceRepublishService)}.{nameof(PublishChanges)}", exception, this);
            }
        }
    }
}