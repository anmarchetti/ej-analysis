using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SitecoreExtensions.Services
{
    /// <summary>
    /// Adapter wrapping the static FieldUtils class to provide injectable dependency for DI.
    /// </summary>
    [Service(typeof(IFieldUtilsService))]
    public class FieldUtilsService : IFieldUtilsService
    {
        /// <inheritdoc />
        public ID[] GetMultilistTargetIds(ID fieldId, Item item)
        {
            return FieldUtils.GetMultilistTargetIds(fieldId, item);
        }

        public ID[] GetMultilistTargetIds(string fieldName, Item item)
        {
            return FieldUtils.GetMultilistTargetIds(fieldName, item);
        }

        /// <inheritdoc />
        public Item[] GetMultilistTargetItems(ID fieldId, Item item)
        {
            return FieldUtils.GetMultilistTargetItems(fieldId, item);
        }

        public Item[] GetMultilistTargetItems(string fieldName, Item item)
        {
            return FieldUtils.GetMultilistTargetItems(fieldName, item);
        }

        /// <inheritdoc />
        public string GetLayoutFieldValue(Field field)
        {
            return LayoutField.GetFieldValue(field);
        }
    }
}
