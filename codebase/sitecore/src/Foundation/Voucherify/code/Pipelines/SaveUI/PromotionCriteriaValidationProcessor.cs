using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Voucherify.Models.Domain;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Voucherify.Pipelines.SaveUI
{
    public class PromotionCriteriaValidationProcessor
    {
        private readonly ID[] budgetMutuallyExclusiveFields = new ID[]
            {
                Templates.Promotion.FieldsIds.Budget,
                Templates.Promotion.FieldsIds.PerPersonBudget
            };

        /// <summary>
        /// Called on SaveUI Pipeline execution.
        /// Executes Process method which check if Promotion Criteria is valid.
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
                ID[] mutuallyExclusiveFields = null;
                if (obj != null && obj.TemplateID.Equals(Templates.Promotion.Id) &&
                    (!IsItemValid(saveItem.Fields) || TryGetMutuallyExclusiveFields(saveItem.Fields, budgetMutuallyExclusiveFields, out mutuallyExclusiveFields)))
                {
                    if (args.HasSheerUI)
                    {
                        // If another fields are valid and mutually exclusive fields are not null then return message with these fields.
                        if (mutuallyExclusiveFields != null)
                        {
                            var message = string.Join(", ", mutuallyExclusiveFields.Select(x => $"\"{obj.Fields[x].DisplayName}\""));
                            SheerResponse.Alert($"{message} are mutually exclusive.");
                        }
                        else
                        {
                            SheerResponse.Alert("At least one promotion criteria should be set.");
                        }
                    }

                    args.AbortPipeline();
                    return;
                }
            }
        }

        /// <summary>
        /// Check that field is in promotion criteria.
        /// </summary>
        /// <param name="fieldId">Field id.</param>
        /// <returns>True if field is promotion criteria.</returns>
        private bool IsPromotionCriteria(ID fieldId)
        {
            return fieldId.Equals(Templates.Promotion.FieldsIds.Global) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.Airport) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.Destination) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.NumberOfAdults) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.NumberOfChildren) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.NumberOfInfants) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.Board) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.HolidayType) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.HolidayTheme) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.DepartureDateFrom) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.DepartureDateTo) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.Budget) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.PerPersonBudget) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.Duration) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.MinimumDuration) ||
                   fieldId.Equals(Templates.Promotion.FieldsIds.MaximumDuration);
        }

        /// <summary>
        /// Try get mutually exclusive fields, if mutually exclusive fields exist then return true and first pair of these fields.
        /// </summary>
        /// <param name="saveFields">Save fields.</param>
        /// <param name="mutuallyExclusiveFields">Mutually exclusive fields ids.</param>
        /// <param name="result">Mutually exclusive fields result.</param>
        /// <returns>True if mutually exclusive fields are exist else false.</returns>
        private bool TryGetMutuallyExclusiveFields(SaveArgs.SaveField[] saveFields, ID[] mutuallyExclusiveFields, out ID[] result)
        {
            var fields = saveFields
                .Where(x => mutuallyExclusiveFields.Contains(x.ID) && !string.IsNullOrEmpty(x.Value))
                .Select(x => x.ID)
                .ToArray();

            // If length greater or equal 2 this mean that collection has mutually exclusive fields.
            result = fields.Length >= 2 ? fields : null;

            return result != null;
        }

        private bool IsItemValid(SaveArgs.SaveField[] saveFields)
        {
            bool isValid = false;
            foreach (var saveField in saveFields)
            {
                if (IsPromotionCriteria(saveField.ID) && !string.IsNullOrWhiteSpace(saveField.Value))
                {
                    isValid = true;
                }
            }

            return isValid;
        }
    }
}