using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Voucherify.Pipelines.SaveUI
{
    public class DoNotTranslateValidationProcessor
    {
        private readonly IList<string> websites = new List<string>();

        /// <summary>
        /// Called on SaveUI Pipeline execution.
        /// Executes Process method which show a pop-up message which says: If this page is only for UK market, please ensure "do not translate" is selected in the page configuration fields. If this page is for other languages only, please ensure the English version is unpublishable.
        /// </summary>
        /// <param name="args">SaveArgs arguments.</param>
        public void Process(SaveArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            Assert.IsNotNull(args.Items, nameof(args.Items));

            foreach (var saveItem in args.Items)
            {
                var database = Context.ContentDatabase ?? Context.Database;
                Item obj = database.GetItem(saveItem.ID, saveItem.Language);

                if (obj == null)
                {
                    continue;
                }

                var siteCotext = obj.GetSiteContext();
                if (siteCotext == null)
                {
                    continue;
                }

                bool isSupportedWebsite = websites.Contains(siteCotext.Name);

                if (!isSupportedWebsite)
                {
                    continue;
                }

                bool isSupportedTemplate =
                    obj.TemplateID.Equals(Templates.PromoPage.Id) ||
                    obj.TemplateID.Equals(easyJet.Foundation.Destinations.Constants.TemplateIds.ReoccurringPromoPage) ||
                    obj.TemplateID.Equals(easyJet.Foundation.Destinations.Constants.TemplateIds.HolidayTypePage) ||
                    obj.TemplateID.Equals(easyJet.Foundation.Destinations.Constants.TemplateIds.GenericPage);

                if (!isSupportedTemplate)
                {
                    continue;
                }

                bool isSupportedLanguage = saveItem.Language.Name == "en";

                if (!isSupportedLanguage || !args.HasSheerUI)
                {
                    continue;
                }

                SheerResponse.Alert("If this page is only for UK market, please ensure \"do not translate\" is selected in the page configuration fields. If this page is for other languages only, please ensure the English version is unpublishable.");
            }
        }

        /// <summary>
        /// Initialize websites list from configuration.
        /// </summary>
        /// <param name="website">website</param>
        public void AddWebsite(string website)
        {
            websites.Add(website);
        }
    }
}