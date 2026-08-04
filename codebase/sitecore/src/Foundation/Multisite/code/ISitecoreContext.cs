using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Sites;

namespace easyJet.Foundation.Multisite
{
    public interface ISitecoreContext
    {
        /// <summary>
        /// Gets or sets current context item.
        /// </summary>
        Item Item { get; set; }

        /// <summary>
        /// Gets or sets current context database.
        /// </summary>
        Database Database { get; set; }

        /// <summary>
        /// Gets or sets content database. Usually this is the Master database.
        /// </summary>
        Database ContentDatabase { get; set; }

        /// <summary>
        /// Gets or sets Site.
        /// </summary>
        SiteContext Site { get; set; }

        /// <summary>
        /// Gets or sets Site.
        /// </summary>
        Language Language { get; set; }
    }
}