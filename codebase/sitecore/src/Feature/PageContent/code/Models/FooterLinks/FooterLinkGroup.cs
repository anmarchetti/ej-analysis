using System.Collections.Generic;

namespace easyJet.Feature.PageContent.Models.FooterLinks
{
    public class FooterLinkGroup
    {
        public string Title { get; set; }

        public IList<FooterLink> Links { get; set; }
    }
}
