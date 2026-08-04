using System.Linq;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Voucherify.Pipelines.SaveUI
{
    public class PromotionRedemptionValidationProcessor
    {
        /// <summary>
        /// Called on SaveUI Pipeline execution.
        /// Checks if promotion's redemption has been changed after it was copied to voucherify.
        /// </summary>
        /// <param name="args">SaveArgs arguments.</param>
        public void Process(SaveArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            Assert.IsNotNull(args.Items, nameof(args.Items));

            foreach (var saveItem in args.Items)
            {
                var database = Context.ContentDatabase ?? Context.Database;
                Item item = database.GetItem(saveItem.ID, saveItem.Language);

                if (IsPromotionInVoucherify(item) && IsRedemptionFieldChanged(item, saveItem))
                {
                    if (args.HasSheerUI)
                    {
                        SheerResponse.Alert("You can't change redemption value after promotion has been copied to voucherify.");
                    }

                    args.AbortPipeline();
                    return;
                }
            }
        }

        /// <summary>
        /// Checks if promotion's redemption has been changed.
        /// </summary>
        /// <param name="item">Promotion Item.</param>
        /// <returns>Boolean value.</returns>
        private bool IsRedemptionFieldChanged(Item item, SaveArgs.SaveItem saveItem)
        {
            var saveRedemptionField = saveItem?.Fields?.FirstOrDefault(x => x.ID.Equals(Templates.Promotion.FieldsIds.Redemption));
            if (saveRedemptionField == null)
            {
                return false;
            }

            return item.Fields[Templates.Promotion.Fields.Redemption].Value != saveRedemptionField.Value;
        }

        /// <summary>
        /// Check if Promotion item is copied to voucherify.
        /// </summary>
        /// <param name="item">Promotion item.</param>
        /// <returns>Boolean value.</returns>
        private bool IsPromotionInVoucherify(Item item)
        {
            return item != null
                && item.TemplateID.Equals(Templates.PromotionCodeConfiguration.Id)
                && MainUtil.GetBool(item.Fields[Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify].Value, false);
        }
    }
}