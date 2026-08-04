using System;
using System.Runtime.Serialization;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Data.Validators;
using static easyJet.Foundation.Voucherify.Templates;

namespace easyJet.Foundation.Voucherify.Validator
{
    [Serializable]
    public class PromotionEarliestDateValidator : StandardValidator
    {
        public override string Name => "Promotion Start Date Validator";

        protected string ErrorText => "Date in earliest date field must be greater than the date in the promotion start date field";

        public PromotionEarliestDateValidator()
            : base()
        {
        }

        public PromotionEarliestDateValidator(SerializationInfo info, StreamingContext context)
            : base(info, context)
        {
        }

        protected override ValidatorResult Evaluate()
        {
            Item item = GetItem();
            if (item == null)
            {
                return ValidatorResult.Valid;
            }

            if (item.Publishing.NeverPublish)
            {
                return ValidatorResult.Valid;
            }

            string startDateFieldValue = item[PromoPage.Fields.StartDate];
            if (startDateFieldValue == null)
            {
                return ValidatorResult.Valid;
            }

            string earliestDateFieldValue = item[PromoPage.Fields.EarliestDate];
            if (earliestDateFieldValue == null)
            {
                Text = GetText(ErrorText);
                return GetFailedResult(ValidatorResult.Error);
            }

            DateTime earliestDate = DateUtil.IsoDateToDateTime(earliestDateFieldValue);
            DateTime startDate = DateUtil.IsoDateToDateTime(startDateFieldValue);

            if (startDate > earliestDate)
            {
                Text = GetText(ErrorText);
                return GetFailedResult(ValidatorResult.Error);
            }

            return ValidatorResult.Valid;
        }

        protected override ValidatorResult GetMaxValidatorResult() => GetFailedResult(ValidatorResult.Error);
    }
}
