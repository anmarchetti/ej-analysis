using System;
using Sitecore.Data.Fields;
using Sitecore.LayoutService.Serialization;
using Sitecore.Links;
using Sitecore.Links.UrlBuilders;
using Sitecore.Sites;

namespace easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers
{
    public class GeneralLinkFieldSerializer : Sitecore.LayoutService.Serialization.FieldSerializers.GeneralLinkFieldSerializer
    {
        public GeneralLinkFieldSerializer(IFieldRenderer fieldRenderer)
            : base(fieldRenderer)
        {
        }

        protected override string GetLinkUrl(LinkField field)
        {
            Sitecore.Data.Items.Item targetItem = field.TargetItem;
            if (targetItem == null || field.IsMediaLink)
            {
                return field.GetFriendlyUrl();
            }

            var site = Sitecore.Context.Site;
            ItemUrlBuilderOptions urlBuilderOptions = LinkManager.GetDefaultUrlBuilderOptions();
            if (IsAlwaysIncludeServerUrl(site) && !targetItem.Paths.Path.StartsWith(site.RootPath))
            {
                urlBuilderOptions.AlwaysIncludeServerUrl = true;
            }

            return LinkManager.GetItemUrl(targetItem, urlBuilderOptions);
        }

        /// <summary>
        /// Checks if site has setting that always include server URL.
        /// </summary>
        /// <param name="site">Site context.</param>
        /// <returns>true if always include server URL; otherwise, false.</returns>
        private bool IsAlwaysIncludeServerUrl(SiteContext site)
        {
            return string.Equals(site.Properties.Get("alwaysIncludeServerUrl"), "true", StringComparison.OrdinalIgnoreCase);
        }
    }
}