using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.JavaScriptServices.ViewEngine.LayoutService.Pipelines.GetLayoutServiceContext;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;

namespace easyJet.Foundation.Presentation.Pipelines.GetLayoutServiceContext
{
    public class ExtendContextDataProcessor : JssGetLayoutServiceContextProcessor
    {
        private static readonly string SegmentForExcluding = Sitecore.Configuration.Settings.GetSetting("Foundation.Presentation.ParentPagesUrlSegmentForExcluding");

        public ExtendContextDataProcessor(IConfigurationResolver configurationResolver)
            : base(configurationResolver)
        {
        }

        /// <summary>
        /// Adds page url and parent pages to context.
        /// </summary>
        /// <param name="args">GetLayoutServiceContextArgs.</param>
        /// <param name="application">AppConfiguration.</param>
        protected override void DoProcess(GetLayoutServiceContextArgs args, AppConfiguration application)
        {
            if (args.RenderedItem != null)
            {
                args.ContextData.Add("url", args.RenderedItem.GetItemUrl());
                args.ContextData.Add("parentPages", GetParentPages(args.RenderedItem, SegmentForExcluding));
            }
        }

        /// <summary>
        /// Collects item and item's parent pages which inherit from _BasePage.
        /// </summary>
        /// <param name="item">The Item.</param>
        /// <param name="segmentForExcluding">Segment for excluding from url.</param>
        /// <param name="pages">Collection of pages.</param>
        /// <returns>Collection of Key-Value Pairs where key is Page Name and value id Page Url.</returns>
        private Stack<KeyValuePair<string, string>> GetParentPages(Item item, string segmentForExcluding, Stack<KeyValuePair<string, string>> pages = null)
        {
            pages = pages ?? new Stack<KeyValuePair<string, string>>();

            if (item == null || Sitecore.Context.Site.StartPath.Equals(item.Paths.Path, System.StringComparison.InvariantCultureIgnoreCase))
            {
                return pages;
            }

            if (item.HasBaseTemplate(new TemplateID(Constants.TemplateIds.BasePage)))
            {
                var name = string.IsNullOrWhiteSpace(item[Constants.Fields.BaseName.Name]) ? item.Name : item[Constants.Fields.BaseName.Name];
                pages.Push(new KeyValuePair<string, string>(name, ExcludeUrlSegment(item.GetItemUrl(), segmentForExcluding)));
            }

            return GetParentPages(item.Parent, segmentForExcluding, pages);
        }

        /// <summary>
        /// Exclude segment by first matching and name from url.
        /// </summary>
        /// <param name="url">Url.</param>
        /// <param name="segment">url segment.</param>
        /// <returns>Url without excluded segment.</returns>
        private string ExcludeUrlSegment(string url, string segment)
        {
            var urlSegments = url.Split('/').Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
            for (int i = 0; i < urlSegments.Count; i++)
            {
                if (urlSegments[i] == segment)
                {
                    urlSegments = urlSegments.Skip(i + 1).ToList();
                    break;
                }
            }

            return urlSegments.Any() ? $"/{string.Join("/", urlSegments)}" : url;
        }
    }
}