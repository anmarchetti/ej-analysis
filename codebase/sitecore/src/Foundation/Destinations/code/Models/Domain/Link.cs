using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class Link
    {
        // Constructor for JSON deserialize.
        public Link()
        {
        }

        public Link(LinkField field, string siteName)
        {
            Anchor = field.Anchor;
            LinkType = field.LinkType;
            Text = GetLinkText(field);
            Target = field.Target;
            Url = field.TargetItem?.GetItemUrl(siteName) ?? field.Url;
        }

        public string Anchor { get; set; }

        public string LinkType { get; set; }

        public string Text { get; set; }

        public string Target { get; set; }

        public string Url { get; set; }

        private string GetLinkText(LinkField field)
        {
            string text = string.Empty;
            if (!string.IsNullOrWhiteSpace(field.Text))
            {
                text = field.Text;
            }
            else if (!string.IsNullOrWhiteSpace(field.TargetItem?.Fields[Constants.Fields.DatasourceItem.Name]?.Value))
            {
                text = field.TargetItem.Fields[Constants.Fields.DatasourceItem.Name].Value;
            }
            else if (!string.IsNullOrEmpty(field.TargetItem?.Name))
            {
                text = field.TargetItem.Name;
            }

            return text;
        }
    }
}