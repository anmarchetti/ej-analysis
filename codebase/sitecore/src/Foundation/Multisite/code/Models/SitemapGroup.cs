using System.Collections.Generic;

namespace easyJet.Foundation.Multisite.Models
{
    public class SitemapGroup
    {
        public string Id { get; set; }

        public string Title { get; set; }

        public IEnumerable<SitemapItem> Pages { get; set; }
    }
}
