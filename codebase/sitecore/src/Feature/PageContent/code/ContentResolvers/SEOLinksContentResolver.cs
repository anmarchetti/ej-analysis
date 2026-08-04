using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.PageContent.Models;
using easyJet.Feature.PageContent.Utils;
using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Models;
using Newtonsoft.Json.Linq;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class SEOLinksContentResolver : RenderingContentsResolver
    {
        private BaseLinkManager LinkManager { get; }

        public SEOLinksContentResolver(BaseLinkManager linkManager)
        {
            LinkManager = linkManager;
        }

        internal virtual IEnumerable<Item> GetItems(Item item, string fieldName)
        {
            return item.GetItems(fieldName);
        }

        internal virtual Item GetTargetItem(Item item, string fieldName)
        {
            return item.GetTargetItem(fieldName);
        }

        internal virtual Link GetLinkField(Item item, string fieldName)
        {
            return new Link(item.Fields[fieldName]);
        }

        protected override JArray ProcessItems(IEnumerable<Item> items, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            JArray jArray = new JArray();
            foreach (Item item in items)
            {
                var tabItem = ResolveTabItem(item);
                JObject value = ResolveTabContent(tabItem);
                jArray.Add(value);
            }

            return jArray;
        }

        private Item ResolveTabItem(Item item)
        {
            var useMasterData = MainUtil.GetBool(item[Constants.Fields.SEOLinks.UseMasterData], false);
            return useMasterData ? GetTargetItem(item, Constants.Fields.SEOLinks.MasterTabData) : item;
        }

        private JObject ResolveTabContent(Item item)
        {
            JObject result = new JObject()
            {
                [Constants.Fields.SEOLinks.Title] = SitecoreFieldUtils.BuildSitecoreField(item[Constants.Fields.SEOLinks.Title]),
            };

            var links = GetItems(item, Constants.Fields.SEOLinks.Links)
                .Where(x => x.HasBaseTemplate(new TemplateID(Constants.TemplateIds.BasePage)) || x.TemplateID == Constants.TemplateIds.NavigationLink)
                .Select(x => ResolveLink(x))
                .OrderBy(x => x.Name);

            result[Constants.Fields.SEOLinks.Links] = JArray.FromObject(links);
            return result;
        }

        private CompressedLink ResolveLink(Item item)
        {
            if (item.HasBaseTemplate(new TemplateID(Constants.TemplateIds.BasePage)))
            {
                return new CompressedLink()
                {
                    Id = item.ID.ToString(),
                    Url = LinkManager.GetItemUrl(item),
                    Name = item[Foundation.Destinations.Constants.Fields.DatasourceItem.Name]
                };
            }

            if (item.TemplateID == Constants.TemplateIds.NavigationLink)
            {
                var linkField = GetLinkField(item, Constants.Fields.NavigationLink.Link);
                return new CompressedLink()
                {
                    Id = item.ID.ToString(),
                    Url = linkField.Url,
                    Name = linkField.Text
                };
            }

            return null;
        }
    }
}