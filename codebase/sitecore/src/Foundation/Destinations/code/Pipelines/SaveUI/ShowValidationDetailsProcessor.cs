using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;

namespace easyJet.Foundation.Destinations.Pipelines.SaveUI
{
    public class ShowValidationDetailsProcessor
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IList<ID> templateIds = new List<ID>();

        public ShowValidationDetailsProcessor(IDatabaseProvider databaseProvider)
        {
            this.databaseProvider = databaseProvider;
        }

        /// <summary>
        /// Called on SaveUI Pipeline execution, before the built-in Sitecore.Pipelines.Save.Validators processor.
        /// For items based on one of the configured templates it enables the "showvalidationdetails" flag
        /// read by the built-in processor, so its "Some of the fields in this item contain critical/fatal errors."
        /// dialogs also include the message of the failing validator. Items based on other templates keep
        /// the generic dialog text.
        /// </summary>
        /// <param name="args">SaveArgs arguments.</param>
        public void Process(SaveArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            Assert.IsNotNull(args.Items, nameof(args.Items));

            if (!args.HasSheerUI || !args.Items.Any(IsSupportedTemplate))
            {
                return;
            }

            args.CustomData["showvalidationdetails"] = "1";
        }

        /// <summary>
        /// Initialize supported template ids list from configuration.
        /// </summary>
        /// <param name="templateId">Template id.</param>
        public void AddTemplate(string templateId)
        {
            if (ID.TryParse(templateId, out var id))
            {
                templateIds.Add(id);
            }
        }

        private bool IsSupportedTemplate(SaveArgs.SaveItem saveItem)
        {
            var item = databaseProvider.GetDatabase(DatabaseType.Content)?.GetItem(saveItem.ID, saveItem.Language);
            return item != null && templateIds.Contains(item.TemplateID);
        }
    }
}
