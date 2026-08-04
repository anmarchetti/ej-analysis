using System;
using System.Linq;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Publishing;
using Sitecore.SecurityModel;

namespace EasyJet.Foundation.SitecoreExtensions.Publishing
{
    public static class PublishingManager
    {
        /// <summary>
        /// Publish Item.
        /// </summary>
        /// <param name="item">Sitecore's item.</param>
        /// <param name="publishRelatedItems">Should publish related items.</param>
        /// <param name="deep">Should publish children.</param>
        /// <param name="smart">Should do smart publish.</param>
        /// <param name="targets">Target databases.</param>
        /// <param name="languages">Languages.</param>
        public static void PublishItem(Item item, bool publishRelatedItems = false, bool deep = true, bool smart = true, Database[] targets = null, Language[] languages = null)
        {
            var sourceDb = Factory.GetDatabase("master");
            targets = targets ?? GetPublishingTargetDatabaseNames(sourceDb);
            languages = languages ?? sourceDb.Languages;

            using (new SecurityDisabler())
            {
                foreach (var language in languages)
                {
                    PublishItemWithOptions(item, targets, language, publishRelatedItems, deep, smart, sourceDb);
                }
            }
        }

        private static void PublishItemWithOptions(Item item, Database[] targetDbs, Language language, bool publishRelatedItems = false, bool deep = true, bool smart = true, Database sourceDb = null)
        {
            sourceDb = sourceDb ?? Database.GetDatabase("master");
            var mode = smart ? PublishMode.Smart : PublishMode.Full;
            foreach (var targetDb in targetDbs)
            {
                var publishOptions = new PublishOptions(sourceDb, targetDb, mode, language, DateTime.Now)
                {
                    RootItem = item,
                    Deep = deep,
                    PublishRelatedItems = publishRelatedItems
                };

                PublishManager.Publish(new PublishOptions[] { publishOptions });
            }
        }

        private static Database[] GetPublishingTargetDatabaseNames(Database sourceDb)
        {
            return PublishManager.GetPublishingTargets(sourceDb)
                .Select(x => x["Target database"])
                .Select(Factory.GetDatabase).ToArray();
        }
    }
}