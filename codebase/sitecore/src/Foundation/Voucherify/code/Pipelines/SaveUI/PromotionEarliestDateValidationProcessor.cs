using System.Linq;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Data.Validators;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.Save;
using Sitecore.Web.UI.Sheer;
using static easyJet.Foundation.Voucherify.Templates;

namespace easyJet.Foundation.Voucherify.Pipelines.SaveUI
{
    public class PromotionEarliestDateValidationProcessor
    {
        /// <summary>
        /// Called on SaveUI Pipeline execution.
        /// Executes Process method which check if date in earliest date field is greater than the date in the promotion start date field.
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

                if (obj == null || !obj.TemplateID.Equals(Templates.PromoPage.Id))
                {
                    continue;
                }

                var isMonthOnlyPageField = saveItem.Fields.FirstOrDefault(x => x.ID == Templates.PromoPage.Fields.IsMonthOnlyPageId);

                if (isMonthOnlyPageField == null)
                {
                    continue;
                }

                bool isMonthOnlyPage = MainUtil.GetBool(isMonthOnlyPageField.Value, false);

                if (isMonthOnlyPage && args.HasSheerUI)
                {
                    var validatorItem = database.GetItem(PromoPage.Validation.EarliestDateRule);
                    var validator = ValidatorManager.BuildValidator(validatorItem, obj);

                    validator.Validate(new ValidatorOptions(false));

                    if (!validator.IsValid)
                    {
                        SheerResponse.Alert($"{validator.Text}");
                    }
                }
            }
        }
    }
}