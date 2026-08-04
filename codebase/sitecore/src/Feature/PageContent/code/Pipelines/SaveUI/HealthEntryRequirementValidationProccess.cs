using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.PageContent.Models.Validation;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Feature.PageContent.Pipelines.SaveUI
{
    public class HealthEntryRequirementValidationProccess
    {
        /// <summary>
        /// Called on SaveUI Pipeline execution.
        /// Executes Process method which check if health/entry requirements block is valid.
        /// If any health/entry requirements block has in selected airports same airpots as in the save item airports field,
        /// then show error with health/entry requirements block name which contains the intersected airport.
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
                if (item != null && item.TemplateID.Equals(Constants.TemplateIds.HealthEntryRequirementsBlock))
                {
                    var validationResult = GetValidationResult(item, saveItem);
                    if (args.HasSheerUI && validationResult != null)
                    {
                        SheerResponse.Alert($"The {validationResult.AirportName} airport is currently added to \"{validationResult.HealthEntryRequirementBlockName}\" Health/Entry requirement block");
                        args.AbortPipeline();
                    }
                }
            }
        }

        /// <summary>
        /// Check that selected airports ids unique for each health/entry requirement block.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="saveItem">Save item.</param>
        /// <returns>Name of first health/entry requirement block and name of the first airport which has intersects with save item.</returns>
        private HealthEntryValidationResult GetValidationResult(Item item, SaveArgs.SaveItem saveItem)
        {
            HealthEntryValidationResult result = null;
            var healthEntryRequirementBlocks = GetAllHealthEntryRequirementBlock(item);

            var airportsField = saveItem.Fields?.FirstOrDefault(x => x.ID.Equals(Constants.FieldIds.HealthEntryRequirementsBlock.Airports));
            if (!string.IsNullOrWhiteSpace(airportsField?.Value))
            {
                var airportIds = airportsField.Value.Separate();
                string airportId = string.Empty;

                // Getting health/entry requirement block which contains airport the same is in the save item and also getting first intersected airport id.
                var healthEntryRequirementBlock = healthEntryRequirementBlocks.FirstOrDefault(x =>
                {
                    var intersects = x.AirportIds.Intersect(airportIds);
                    airportId = intersects.FirstOrDefault();
                    return intersects.Any();
                });

                if (healthEntryRequirementBlock != null && !string.IsNullOrWhiteSpace(airportId))
                {
                    var airportItem = item.Database.GetItem(new ID(airportId));
                    result = new HealthEntryValidationResult()
                    {
                        AirportName = airportItem.Name,
                        HealthEntryRequirementBlockName = healthEntryRequirementBlock.Name
                    };
                }
            }

            return result;
        }

        /// <summary>
        /// Getting collection of health/entry requirements blocks.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Grouped collection of airport ids by health/entry requirement block name.</returns>
        private IEnumerable<HealthEntryRequirementBlock> GetAllHealthEntryRequirementBlock(Item item)
        {
            var healthEntryRequirementBlocks = item
                .Parent
                .GetChildren()
                .Where(x => x.TemplateID.Equals(Constants.TemplateIds.HealthEntryRequirementsBlock) && !x.ID.Equals(item.ID))
                .Select(x => new HealthEntryRequirementBlock(x));

            return healthEntryRequirementBlocks;
        }
    }
}