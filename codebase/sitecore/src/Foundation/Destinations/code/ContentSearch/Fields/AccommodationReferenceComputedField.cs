using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public abstract class AccommodationReferenceComputedField : AccommodationComputedField
    {
        protected internal virtual object ComputeReference(Item indexableItem, KeyValuePair<ID, ID> referenceTemplateId, string referenceTypeFieldName)
        {
            var items = indexableItem.GetAccommodationReferences(referenceTemplateId).ToList();
            if (!items.Any())
            {
                return null;
            }

            var result = new List<string>();
            foreach (var item in items)
            {
                var type = item.GetTargetItem(referenceTypeFieldName);
                if (IsValid(type, item))
                {
                    result.Add(JsonConvert.SerializeObject(MapReference(type, item), new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore }));
                }
            }

            return result;
        }

        protected internal abstract object MapReference(Item referenceTypeItem, Item referenceItem);

        /// <summary>
        /// Get item's (<paramref name="referenceItem"/>) icon url, if empty - get icon from type (<paramref name="referenceTypeItem"/>).
        /// </summary>
        /// <param name="referenceTypeItem">Item's type.</param>
        /// <param name="referenceItem">Item.</param>
        /// <returns>Icon Url.</returns>
        protected string GetIcon(Item referenceTypeItem, Item referenceItem)
        {
            return GetImageUrl(referenceTypeItem, referenceItem, Constants.Fields.AccommodationReferenceItem.Icon);
        }

        /// <summary>
        /// Return field value.
        /// </summary>
        /// <param name="referenceTypeItem">Reference item.</param>
        /// <param name="referenceItem">Item.</param>
        /// <param name="fieldName">Field to return.</param>
        /// <returns>Field value.</returns>
        protected string GetFieldValue(Item referenceTypeItem, Item referenceItem, string fieldName)
        {
            var itemFieldValue = referenceItem.Fields[fieldName]?.Value;

            // Get item's field value, if empty - get field value from type
            return !string.IsNullOrWhiteSpace(itemFieldValue) ? itemFieldValue :
                referenceTypeItem.Fields[fieldName]?.Value;
        }

        /// <summary>
        /// Get item's (<paramref name="referenceItem"/>) image url, if empty - get image from type (<paramref name="referenceTypeItem"/>).
        /// </summary>
        /// <param name="referenceTypeItem">Item's type.</param>
        /// <param name="referenceItem">Item.</param>
        /// <returns>Image Url.</returns>
        protected string GetImage(Item referenceTypeItem, Item referenceItem)
        {
            return GetImageUrl(referenceTypeItem, referenceItem, Constants.Fields.AccommodationReferenceItem.Image);
        }

        /// <summary>
        /// Check if the reference type item item and reference item is valid.
        /// </summary>
        /// <param name="referenceTypeItem">Reference Type Item.</param>
        /// <param name="referenceItem">Reference Item.</param>
        /// <returns>True if item is valid, otherwise - false.</returns>
        protected virtual bool IsValid(Item referenceTypeItem, Item referenceItem)
        {
            return referenceTypeItem != null && referenceItem != null;
        }

        /// <summary>
        /// Get item's (<paramref name="referenceItem"/>) image url, if empty - get image from type (<paramref name="referenceTypeItem"/>).
        /// </summary>
        /// <param name="referenceTypeItem">Item's type.</param>
        /// <param name="referenceItem">Item.</param>
        /// <param name="fieldName">Item's field name.</param>
        /// <returns>Image Url.</returns>
        private string GetImageUrl(Item referenceTypeItem, Item referenceItem, string fieldName)
        {
            return referenceItem.GetMediaUrl(fieldName) ??
                    referenceTypeItem.GetMediaUrl(fieldName);
        }
    }
}