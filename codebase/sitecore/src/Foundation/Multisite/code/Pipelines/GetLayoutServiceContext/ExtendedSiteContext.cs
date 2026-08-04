using easyJet.Foundation.Publishing;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.DependencyInjection;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Sitecore.Sites;

namespace easyJet.Foundation.Multisite.Pipelines.GetLayoutServiceContext
{
    public class ExtendedSiteContext : IGetLayoutServiceContextProcessor
    {
        public const string SiteKey = "site";
        public const string PageStateKey = "pageState";
        public const string PublishDiagnosticKey = "publishDiagnostic";

        private readonly IItemSiteResolver itemSiteResolver;
        private readonly IMultiSiteContext multiSiteContext;

        public ExtendedSiteContext(IItemSiteResolver itemSiteResolver, IMultiSiteContext multiSiteContext)
        {
            this.itemSiteResolver = itemSiteResolver;
            this.multiSiteContext = multiSiteContext;
        }

        public void Process(GetLayoutServiceContextArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            if (args.ContextData.ContainsKey(SiteKey) || Context.Site == null || Context.Item == null)
            {
                return;
            }

            var site = Context.Site.SiteInfo?.Name ?? itemSiteResolver.ResolveSite(Context.Item)?.Name;
            args.ContextData.Add(SiteKey, new { name = site });
            args.ContextData.Add(PageStateKey, Context.Site.DisplayMode.ToString().ToLowerInvariant());

            // https://easyjet.atlassian.net/browse/WP-206 Investigate caching/publishing issues
            var settingsFolder = multiSiteContext.GetSettingsItem(Context.Item);
            var diagnosticItem = settingsFolder?.FirstChildHasTemplate(Templates.PublishDiagnostic.Id);
            if (diagnosticItem != null)
            {
                args.ContextData.Add(PublishDiagnosticKey, new
                {
                    field = diagnosticItem[Templates.PublishDiagnostic.Fields.Field],
                    revision = diagnosticItem.Statistics.Revision,
                    server = System.Environment.MachineName,
                    sharedField = diagnosticItem[Templates.PublishDiagnostic.Fields.SharedField],
                    sharedUnversionedField = diagnosticItem[Templates.PublishDiagnostic.Fields.SharedUnversionedField],
                    unversionedField = diagnosticItem[Templates.PublishDiagnostic.Fields.UnversionedField],
                    updated = diagnosticItem.Statistics.Updated.ToString("o")
                });
            }
        }
    }
}
