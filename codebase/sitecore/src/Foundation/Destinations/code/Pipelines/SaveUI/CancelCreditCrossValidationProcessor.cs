using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Destinations.Pipelines.SaveUI
{
    public class CancelCreditCrossValidationProcessor
    {
        private readonly IDatabaseProvider databaseProvider;

        public CancelCreditCrossValidationProcessor(IDatabaseProvider databaseProvider)
        {
            this.databaseProvider = databaseProvider;
        }

        /// <summary>
        /// Called on SaveUI Pipeline execution.
        /// Executes Process method which check if cancel and credit rule is valid.
        /// If any cancel and credit rule or credit only rule has in selected destination airports same as well in save item destination airports field, then show error with cancel and credit rule name which contains this destination airport.
        /// </summary>
        /// <param name="args">SaveArgs arguments.</param>
        public void Process(SaveArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            Assert.IsNotNull(args.Items, nameof(args.Items));

            var saveItem = args.Items.FirstOrDefault();
            if (saveItem != null)
            {
                var database = databaseProvider.GetDatabase(DatabaseType.Content);
                var item = database.GetItem(saveItem.ID, saveItem.Language);
                if (item != null && IsCancelCreditRule(item))
                {
                    var validationResult = GetValidationResult(item, saveItem);
                    if (args.HasSheerUI && validationResult != null)
                    {
                        Alert($"{validationResult.AirportName} airport is currently added to \"{validationResult.CancelAndCreditRuleName}\" {validationResult.CancelAndCreditFolderName}");
                        args.AbortPipeline();
                    }
                }
            }
        }

        internal virtual void Alert(string message)
        {
            SheerResponse.Alert(message);
        }

        /// <summary>
        /// Check that selected airports ids unique for each cancel and credit rule.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="saveItem">Save item.</param>
        /// <returns>Name of first cancel and credit rule and name of the first airport which has intersects with save item.</returns>
        private CancelAndCreditValidationResult GetValidationResult(Item item, SaveArgs.SaveItem saveItem)
        {
            CancelAndCreditValidationResult result = null;
            var cancelCreditRules = GetCancelCreditRulesAirportsIds(item);

            var destinationAirportsField = saveItem.Fields?.FirstOrDefault(x => x.ID.Equals(Constants.FieldsIds.CancelCreditSetting.DestinationAirportsId));
            if (!string.IsNullOrWhiteSpace(destinationAirportsField?.Value))
            {
                var airportIds = destinationAirportsField.Value.Separate();
                string airportId = string.Empty;

                // Getting cancel and credit rule which contains airport is same in save item and also getting first intersected airport id.
                var cancelAndCreditRule = cancelCreditRules.FirstOrDefault(x =>
                {
                    var intersects = x.AirportsIds.Intersect(airportIds);
                    airportId = intersects.FirstOrDefault();
                    return intersects.Any();
                });

                if (cancelAndCreditRule != null && !string.IsNullOrWhiteSpace(airportId))
                {
                    var airportItem = item.Database.GetItem(new ID(airportId));
                    result = new CancelAndCreditValidationResult()
                    {
                        AirportName = airportItem.Name,
                        CancelAndCreditRuleName = cancelAndCreditRule.Name,
                        CancelAndCreditFolderName = cancelAndCreditRule.ParentName
                    };
                }
            }

            return result;
        }

        /// <summary>
        /// Getting collection of cancel and credit rules.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Grouped collection of airport ids by cancel and credit rule name.</returns>
        private IEnumerable<CancelAndCreditRule> GetCancelCreditRulesAirportsIds(Item item)
        {
            var cancelAndCreditRules = item
                .Parent
                .GetChildren()
                .Where(x => IsCancelCreditRule(x) && !x.ID.Equals(item.ID))
                .Select(x => new CancelAndCreditRule(x));

            return cancelAndCreditRules;
        }

        /// <summary>
        /// Checks if item is cancel and credit rule or credit only rule.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns><see langword="True"/> if item is cancel and credit rule or credit only rule.</returns>
        private bool IsCancelCreditRule(Item item)
        {
            return item.TemplateID.Equals(Constants.TemplateIds.CancelCreditRule) || item.TemplateID.Equals(Constants.TemplateIds.CreditOnlyRule);
        }
    }
}