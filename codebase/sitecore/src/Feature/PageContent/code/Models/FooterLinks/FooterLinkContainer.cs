using System.Collections.Generic;

namespace easyJet.Feature.PageContent.Models.FooterLinks
{
    public class FooterLinkContainer
    {
        public string DesktopTitle { get; set; }

        public string MobileTitle { get; set; }

        public IList<FooterLinkGroup> Groups { get; set; }
    }
}
