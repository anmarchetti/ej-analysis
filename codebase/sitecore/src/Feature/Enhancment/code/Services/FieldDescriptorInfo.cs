using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    /// Data transfer object for field descriptor information.
    /// </summary>
    public class FieldDescriptorInfo
    {
        /// <summary>
        /// Gets or sets the field name.
        /// </summary>
        public string FieldName { get; set; }

        /// <summary>
        /// Gets or sets the field value.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether this contains the standard value.
        /// </summary>
        public bool ContainsStandardValue { get; set; }

        /// <summary>
        /// Gets or sets the context item for the field descriptor.
        /// </summary>
        public Item ContextItem { get; set; }
    }
}