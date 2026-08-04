using System.Collections.Generic;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Models
{
    public class SitemapSection
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="SitemapSection"/> class.
        /// </summary>
        /// <param name="item">Sitecore sitemap section item.</param>
        public SitemapSection(Item item)
        {
            if (item == null)
            {
                return;
            }

            SectionId = item.ID;
            Title = item[Constants.Fields.SitemapBase.Title];
            IsGroupedAlphabetically = MainUtil.GetBool(item[Constants.Fields.SitemapBase.IsGroupedAlphabetically], false);
        }

        /// <summary>
        /// Gets or sets section id.
        /// </summary>
        public ID SectionId { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether sitemap section is grouped alphabetically.
        /// </summary>
        public bool IsGroupedAlphabetically { get; set; }

        /// <summary>
        /// Gets or sets sitemap title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets sitemap pages.
        /// </summary>
        public IEnumerable<SitemapItem> Pages { get; set; }

        /// <summary>
        /// Gets or sets grouped pages. When set, the FE renders an accordion instead of a flat list.
        /// </summary>
        public IEnumerable<SitemapGroup> GroupedPages { get; set; }
    }
}