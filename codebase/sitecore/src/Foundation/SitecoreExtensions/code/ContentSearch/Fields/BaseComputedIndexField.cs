using System.Runtime.CompilerServices;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.ComputedFields;
using Sitecore.Diagnostics;

[assembly: InternalsVisibleTo("easyJet.Feature.MediaCenter.Tests")]

namespace easyJet.Foundation.SitecoreExtensions.ContentSearch.Fields
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

            return IsValid(item) ? ComputeField(item) : null;
        }

        /// <summary>
        /// Checks if field is valid for current item.
        /// </summary>
        /// <param name="indexableItem">Search Indexable item.</param>
        /// <returns>True or False.</returns>
        protected internal abstract bool IsValid(SitecoreIndexableItem indexableItem);

        /// <summary>
        /// Builds Computed Field Value.
        /// </summary>
        /// <param name="indexableItem">Search Indexable item.</param>
        /// <returns>Field Value.</returns>
        protected internal abstract object ComputeField(SitecoreIndexableItem indexableItem);
    }
}