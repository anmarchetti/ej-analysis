using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Configuration;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Feature.PageContent.Pipelines.SaveUI
{
    // TODO: Remove this functionality when default validation will returned.
    public class HolidaysUnderPillsValidationProcess
    {
        private readonly int allowedPillsCount = Settings.GetIntSetting("PageContent.AllowedHolidayUnderPillsCount", 6);

        /// <summary>
        /// Called on SaveUI Pipeline execution.
        /// Executes Process method which checks if holiday under pills less allowed count.
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
                if (item != null && item.TemplateID.Equals(Constants.TemplateIds.HolidaysUnderFolder))
                {
                    if (args.HasSheerUI && !IsHolidayUnderPillsCountValid(saveItem.Fields))
                    {
                        SheerResponse.Alert($"Invalid count of holiday under pills, pills count should be less or equal {allowedPillsCount}");
                        args.AbortPipeline();
                        return;
                    }
                }
            }
        }

        /// <summary>
        /// Validate the holiday under pills count.
        /// </summary>
        /// <param name="saveFields">The save item fields.</param>
        /// <returns><see langword="True" /> if the count of under pills is allowed.</returns>
        private bool IsHolidayUnderPillsCountValid(SaveArgs.SaveField[] saveFields)
        {
            foreach (var saveField in saveFields)
            {
                if (saveField.ID.Equals(Constants.FieldIds.HolidaysUnderFolder.Pills) &&
                    !string.IsNullOrEmpty(saveField.Value) &&
                    saveField.Value.Split('|').Length > allowedPillsCount)
                {
                    return false;
                }
            }

            return true;
        }
    }
}