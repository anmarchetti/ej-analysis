using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Feature.PageContent.Pipelines.SaveUI
{
    public class PeriodDrivenPageValidationProcessor
    {
        /// <summary>
        /// Called on SaveUI Pipeline execution.
        /// Executes Process method which checks if period driven page is valid.
        /// </summary>
        /// <param name="args">SaveArgs arguments.</param>
        public void Process(SaveArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            Assert.IsNotNull(args.Items, nameof(args.Items));

            var saveItem = args.Items.FirstOrDefault();
            if (saveItem != null)
            {
                var database = SiteExtensions.GetContentDatabase();
                var item = database.GetItem(saveItem.ID, saveItem.Language);
                if (item != null && item.TemplateID.Equals(Constants.TemplateIds.PeriodDrivenPromoPage))
                {
                    if (args.HasSheerUI && !IsPromoPageIsValid(saveItem.Fields))
                    {
                        SheerResponse.Alert($"The start date or end date field can not be empty.");
                        args.AbortPipeline();
                        return;
                    }
                }
            }
        }

        /// <summary>
        /// Validate the period driven promo page.
        /// </summary>
        /// <param name="saveFields">The save item fields.</param>
        /// <returns><see langword="True" /> if the period driven promo page is valid.</returns>
        private bool IsPromoPageIsValid(SaveArgs.SaveField[] saveFields)
        {
            foreach (var saveField in saveFields)
            {
                if (IsAllowField(saveField.ID) && string.IsNullOrEmpty(saveField.Value))
                {
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Checks that save field id is equal to one of fields ids from the condition.
        /// </summary>
        /// <param name="fieldId">The field id.</param>
        /// <returns><see langword="True" /> if the field id equal one of fields ids.</returns>
        private bool IsAllowField(ID fieldId)
        {
            return fieldId.Equals(Constants.FieldIds.PromoPage.StartDate) ||
                   fieldId.Equals(Constants.FieldIds.PromoPage.EndDate);
        }
    }
}