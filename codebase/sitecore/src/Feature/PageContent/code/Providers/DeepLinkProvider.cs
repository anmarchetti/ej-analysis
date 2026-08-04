using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.PageContent.Extensions;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.Links.UrlBuilders;

namespace easyJet.Feature.PageContent.Providers
{
    public class DeepLinkProvider : TransparencyAwareLinkProvider
    {
        public DeepLinkProvider(BaseFactory factory)
           : base(factory)
        {
        }

        /// <inheritdoc/>
        public override string GetItemUrl(Item item, ItemUrlBuilderOptions options)
        {
            var parameters = new Dictionary<string, string>();

            if (item.TemplateID.Equals(Constants.TemplateIds.FaqItem))
            {
                parameters.Add(Constants.QueryParameters.DeepLink.HelpCategory, item.Parent.Fields[Constants.Fields.DeepLinkItem.NavigationParameter].Value);
                parameters.Add(Constants.QueryParameters.DeepLink.HelpQuestion, item.Fields[Constants.Fields.DeepLinkItem.NavigationParameter].Value);
            }
            else if (item.TemplateID.Equals(Constants.TemplateIds.FaqCategory))
            {
                parameters.Add(Constants.QueryParameters.DeepLink.HelpCategory, item.Fields[Constants.Fields.DeepLinkItem.NavigationParameter].Value);
            }
            else if (item.TemplateID.Equals(Constants.TemplateIds.QuestionAndAnswer))
            {
                parameters.Add(Constants.QueryParameters.DeepLink.HelpQuestion, item.Fields[Constants.Fields.DeepLinkItem.NavigationParameter].Value);
            }
            else if (item.TemplateID.Equals(easyJet.Foundation.Destinations.Constants.TemplateIds.HolidayTypeFolderPage) && item.IsTransparentItem())
            {
                var pageUrl = base.GetItemUrl(item, options);
                return string.Concat(pageUrl, item.DisplayName.Replace(" ", "-"));
            }

            if (parameters.Any())
            {
                var pageItem = item.GetParentOfTemplate(Constants.TemplateIds.BasePage);
                var pageUrl = base.GetItemUrl(pageItem, options);
                return $"{pageUrl}?{string.Join("&", parameters.Select(x => $"{x.Key}={x.Value}"))}";
            }

            return base.GetItemUrl(item, options);
        }
    }
}