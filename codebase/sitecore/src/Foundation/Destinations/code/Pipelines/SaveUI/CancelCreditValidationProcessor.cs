using System;
using System.Collections.Generic;
using System.Linq;
using Sitecore;
using Sitecore.Data;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Destinations.Pipelines.SaveUI
{
    [Obsolete("Checks if still need. Cannot find in <saveUI> proccessors.")]
    public class CancelCreditValidationProcessor
    {
        /// <summary>
        /// Called on SaveUI Pipeline execution.
        /// Executes Process method which check that cancel and credit rule item is valid.
        /// </summary>
        /// <param name="args">SaveArgs arguments.</param>
        public void Process(SaveArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            Assert.IsNotNull(args.Items, nameof(args.Items));
            var saveItem = args.Items.FirstOrDefault();
            if (saveItem != null)
            {
                var database = Context.ContentDatabase ?? Context.Database;
                var item = database.GetItem(saveItem.ID, saveItem.Language);
                if (item != null && item.TemplateID.Equals(Constants.TemplateIds.CancelCreditRule) && !IsItemValid(saveItem.Fields))
                {
                    if (args.HasSheerUI)
                    {
                        SheerResponse.Alert("At least one of these fields: \"Allow Deposit Only To Be Converted\", \"Allow Fully Paid To Be Converted\", \"Allow Partially Paid To Be Converted\" should be selected.");
                    }

                    args.AbortPipeline();
                    return;
                }
            }
        }

        /// <summary>
        /// Check that save field id equal one of fields ids from condition.
        /// </summary>
        /// <param name="fieldId">Field id.</param>
        /// <returns>True if field id equal one of fields ids else false.</returns>
        private bool IsAllowField(ID fieldId)
        {
            return fieldId.Equals(Constants.FieldsIds.CancelCreditSetting.AllowDepositOnlyToBeConvertedId) ||
                   fieldId.Equals(Constants.FieldsIds.CancelCreditSetting.AllowFullyPaidToBeConvertedId) ||
                   fieldId.Equals(Constants.FieldsIds.CancelCreditSetting.AllowPartiallyPaidToBeConvertedId);
        }

        /// <summary>
        /// Check that item contains allow fields, and one of these fields don't empty.
        /// </summary>
        /// <param name="saveFields">Save fileds.</param>
        /// <returns>True if fields id exist in item and one of these fields don't empty.</returns>
        private bool IsItemValid(SaveArgs.SaveField[] saveFields)
        {
            foreach (var saveField in saveFields)
            {
                var isChecked = MainUtil.GetBool(saveField.Value, false);
                if (IsAllowField(saveField.ID) && isChecked)
                {
                    return true;
                }
            }

            return false;
        }
    }
}