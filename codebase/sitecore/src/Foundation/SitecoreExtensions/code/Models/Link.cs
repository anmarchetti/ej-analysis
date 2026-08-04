using System.Diagnostics.CodeAnalysis;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.SitecoreExtensions.Models
{
    [ExcludeFromCodeCoverage]
    public class Link
    {
        public Link()
        {
        }

        public Link(LinkField field)
        {
            Anchor = field.Anchor;
            LinkType = field.LinkType;
            Text = field.Text;
            Target = field.Target;
            Url = field.GetFriendlyUrl();
        }

        public string Anchor { get; set; }

        public string LinkType { get; set; }

        public string Text { get; set; }

        public string Target { get; set; }

        public string Url { get; set; }
    }
}