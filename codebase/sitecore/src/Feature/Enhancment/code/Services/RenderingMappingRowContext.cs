using System.Collections.Generic;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    /// <summary>
    /// Context data required to build a rendering mapping row.
    /// </summary>
    public class RenderingMappingRowContext
    {
        /// <summary>
        /// Gets or sets the unique row identifier.
        /// </summary>
        public string RowId { get; set; }

        /// <summary>
        /// Gets or sets the key rendering ID.
        /// </summary>
        public string KeyId { get; set; }

        /// <summary>
        /// Gets or sets the value rendering ID.
        /// </summary>
        public string ValueId { get; set; }

        /// <summary>
        /// Gets or sets the key display name.
        /// </summary>
        public string KeyName { get; set; }

        /// <summary>
        /// Gets or sets the value display name.
        /// </summary>
        public string ValueName { get; set; }

        /// <summary>
        /// Gets or sets the key icon URL.
        /// </summary>
        public string KeyIconUrl { get; set; }

        /// <summary>
        /// Gets or sets the value icon URL.
        /// </summary>
        public string ValueIconUrl { get; set; }

        /// <summary>
        /// Gets or sets the key component name.
        /// </summary>
        public string KeyComponentName { get; set; }

        /// <summary>
        /// Gets or sets the value component name.
        /// </summary>
        public string ValueComponentName { get; set; }

        /// <summary>
        /// Gets or sets the key type name.
        /// </summary>
        public string KeyTypeName { get; set; }

        /// <summary>
        /// Gets or sets the value type name.
        /// </summary>
        public string ValueTypeName { get; set; }

        /// <summary>
        /// Gets or sets the parameters string.
        /// </summary>
        public string Parameters { get; set; }

        /// <summary>
        /// Gets or sets the key dropdown HTML.
        /// </summary>
        public string KeyDropdownHtml { get; set; }

        /// <summary>
        /// Gets or sets the value dropdown HTML.
        /// </summary>
        public string ValueDropdownHtml { get; set; }

        /// <summary>
        /// Gets or sets the client event JavaScript.
        /// </summary>
        public string ClientEvent { get; set; }

        /// <summary>
        /// Gets or sets the standard parameters list.
        /// </summary>
        public List<KeyValuePair<string, string>> StandardParams { get; set; } = new List<KeyValuePair<string, string>>();

        /// <summary>
        /// Gets or sets the custom parameters list.
        /// </summary>
        public List<KeyValuePair<string, string>> CustomParams { get; set; } = new List<KeyValuePair<string, string>>();

        /// <summary>
        /// Gets or sets the list of standard field names available for the rendering (used by client-side classification).
        /// </summary>
        public List<string> StandardFieldNames { get; set; } = new List<string>();

        /// <summary>
        /// Gets or sets the optional rendering instance UID filter value (empty string = no filter).
        /// </summary>
        public string Uid { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the HTML for the UID dropdown control.
        /// </summary>
        public string UidDropdownHtml { get; set; } = string.Empty;
    }
}
