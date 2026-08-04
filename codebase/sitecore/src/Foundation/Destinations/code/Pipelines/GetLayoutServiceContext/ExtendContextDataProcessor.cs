using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.JavaScriptServices.ViewEngine.LayoutService.Pipelines.GetLayoutServiceContext;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;

namespace easyJet.Foundation.Destinations.Pipelines.GetLayoutServiceContext
{
    public class ExtendContextDataProcessor : JssGetLayoutServiceContextProcessor
    {
        public ExtendContextDataProcessor(IConfigurationResolver configurationResolver)
            : base(configurationResolver)
        {
        }

        protected override void DoProcess(GetLayoutServiceContextArgs args, AppConfiguration application)
        {
            args.ContextData.Add("baseTemplates", args.RenderedItem?.Template.BaseTemplates.Select(x => x.ID));
            var destinationsParentItems = new List<Item>();

            // Include parents info for destinations (Country, Virtual Region, Location, Virtual Resort, Resort, Hotel)
            if (args.RenderedItem != null && (args.RenderedItem.IsDestinationItem() || args.RenderedItem.IsVirtualDestinationItem(VirtualDestinationTypes.Region | VirtualDestinationTypes.Resort)))
            {
                var destinationParents = GetParents(args.RenderedItem, out destinationsParentItems);
                args.ContextData.Add("parents", destinationParents);
            }

            // Include links to the item in other languages
            var languageToBuildUrlsForHreflangs = Sitecore.Configuration.Settings.GetSetting("Destinations.LanguagesToBuildUrlsForHreflangs", string.Empty);
            args.ContextData.Add("pageUrls", GetPageUrls(args.RenderedItem, languageToBuildUrlsForHreflangs.Split(','), destinationsParentItems));
        }

        private IEnumerable<BaseDestinationItem> GetParents(Item item, out List<Item> destinationsParentItems)
        {
            destinationsParentItems = new List<Item>();
            var parents = new List<BaseDestinationItem>();
            var parent = item.Parent;
            while (parent.IsDestinationItem() || parent.IsVirtualDestinationItem(VirtualDestinationTypes.Region | VirtualDestinationTypes.Resort))
            {
                parents.Add(new BaseDestinationItem()
                {
                    Code = parent[Constants.Fields.DatasourceItem.Code],
                    Name = parent[Constants.Fields.DatasourceItem.Name],
                    ItemName = parent.Name,
                    Type = DestinationsMapper.MapRegionTemplateId(parent.TemplateID.ToString())
                });
                destinationsParentItems.Add(parent);
                parent = parent.Parent;
            }

            return parents;
        }

        private Dictionary<string, string> GetPageUrls(Item item, string[] languages, List<Item> destinationsParentItems)
        {
            if (item == null || !languages.Any())
            {
                return null;
            }

            var pageUrls = new Dictionary<string, string>();
            foreach (var language in item.Languages.Where(x => languages.Contains(x.Name) && x.Name != Sitecore.Context.Language.Name))
            {
                var langItem = item.Database.GetItem(item.ID, language);
                if (langItem == null)
                {
                    continue;
                }

                if (langItem.Versions.Count > 0)
                {
                    if (langItem.IsDestinationItem())
                    {
                        var allParentsHaveVersion = true;
                        foreach (var parentItem in destinationsParentItems)
                        {
                            var langParentItem = item.Database.GetItem(parentItem.ID, language);

                            if (langParentItem == null || langParentItem.Versions.Count == 0)
                            {
                                allParentsHaveVersion = false;
                                break;
                            }
                        }

                        if (allParentsHaveVersion)
                        {
                            pageUrls.Add(language.Name, langItem.GetItemUrl());
                        }
                    }
                    else
                    {
                        pageUrls.Add(language.Name, langItem.GetItemUrl());
                    }
                }
            }

            return pageUrls;
        }
    }
}