using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Data.Validators;

namespace easyJet.Foundation.Destinations.Validators
{
    [Serializable]
    public class DestinationsCarouselDestinationsValidator : StandardValidator
    {
        public override string Name => "Destinations Carousel Destinations Validator";

        protected static string ErrorText => "The \"{0}\" field contains items that are not selected in the Destination field of the promo page: {1}";

        public DestinationsCarouselDestinationsValidator()
            : base()
        {
        }

        protected DestinationsCarouselDestinationsValidator(SerializationInfo info, StreamingContext context)
            : base(info, context)
        {
        }

        protected override ValidatorResult Evaluate()
        {
            var item = GetItem();
            string fieldValue = GetControlValidationValue();

            if (item == null || string.IsNullOrWhiteSpace(fieldValue))
            {
                return ValidatorResult.Valid;
            }

            var promoPage = item.GetAncestorByBaseTemplateId(Constants.TemplateIds.PromoPage);

            if (promoPage == null)
            {
                return ValidatorResult.Valid;
            }

            var promoPageDestinationIds = new HashSet<ID>(FieldUtils.GetMultilistTargetIds(Constants.Fields.PromoPage.Destination, promoPage) ?? Enumerable.Empty<ID>());

            var invalidItemNames = ID.ParseArray(fieldValue)
                .Select(selectedId => new { Id = selectedId, Item = item.Database?.GetItem(selectedId) })
                .Where(selected => selected.Item == null || !IsInTree(selected.Item, promoPageDestinationIds))
                .Select(selected => selected.Item?.Name ?? selected.Id.ToString())
                .ToList();

            if (!invalidItemNames.Any())
            {
                return ValidatorResult.Valid;
            }

            Text = GetText(ErrorText, GetFieldName(), string.Join(", ", invalidItemNames));
            return GetFailedResult(ValidatorResult.CriticalError);
        }

        protected override ValidatorResult GetMaxValidatorResult() => GetFailedResult(ValidatorResult.CriticalError);

        // The base GetFieldDisplayName is not virtual and falls back to Translate.Text,
        // which requires the Sitecore service locator that is not available in unit tests.
        protected virtual string GetFieldName() => GetFieldDisplayName();

        private static bool IsInTree(Item item, IEnumerable<ID> roots)
        {
            return roots.Any(rootId =>
                item.ID == rootId ||
                item.Paths.LongID.IndexOf(rootId.ToString(), StringComparison.OrdinalIgnoreCase) >= 0);
        }
    }
}
