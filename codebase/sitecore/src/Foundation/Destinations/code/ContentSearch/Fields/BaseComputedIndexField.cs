using Sitecore.ContentSearch;
using Sitecore.ContentSearch.ComputedFields;
using Sitecore.Diagnostics;
using Sitecore.Globalization;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public abstract class BaseComputedIndexField : IComputedIndexField
    {
        public string FieldName { get; set; }

        public string ReturnType { get; set; }

        /// <summary>
        /// Adds field with computed value to Item's document
        /// if field is valid for current item.
        /// </summary>
        /// <param name="indexable">Search Indexable item.</param>
        /// <returns>Field Value.</returns>
        public object ComputeFieldValue(IIndexable indexable)
        {
            Assert.ArgumentNotNull(indexable, nameof(indexable));

            if (!(indexable is SitecoreIndexableItem item))
            {
                Log.Warn($"{this} : unsupported IIndexable type : {indexable.GetType()}", this);
                return null;
            }

            using (new LanguageSwitcher(indexable.Culture.Name))
            {
                return IsValid(item) ? ComputeField(item) : null;
            }
        }

        /// <summary>
        /// Checks if field is valid for current item.
        /// </summary>
        /// <param name="indexableItem">Search Indexable item.</param>
        /// <returns>True or False.</returns>
        protected internal virtual bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return true;
        }

        /// <summary>
        /// Builds Computed Field Value.
        /// </summary>
        /// <param name="indexableItem">Search Indexable item.</param>
        /// <returns>Field Value.</returns>
        protected internal abstract object ComputeField(SitecoreIndexableItem indexableItem);
    }
}