using System;
using System.Linq;
using easyJet.Feature.Bundles.Logging;
using easyJet.Foundation.SitecoreExtensions.Helper;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;

using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Feature.Bundles.ContentResolvers
{
    public class BundlesContentResolver : RenderingContentsResolver
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IBundlesLogger bundlesLogger;

        public BundlesContentResolver(IDatabaseProvider databaseProvider, IBundlesLogger bundlesLogger)
        {
            this.databaseProvider = databaseProvider;
            this.bundlesLogger = bundlesLogger;
        }

        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            bundlesLogger.Info("BundlesContentResolver: Starting ResolveContents", this);

            var contextItem = rendering.Item;
            bundlesLogger.Info($"BundlesContentResolver: Context item - {contextItem?.Paths.FullPath}", this);

            var datasourcePath = rendering.DataSource;
            if (string.IsNullOrWhiteSpace(datasourcePath))
            {
                bundlesLogger.Warn("BundlesContentResolver: No datasource configured", this);
                return new { items = Array.Empty<object>() };
            }

            var datasourceItem = contextItem.Database.GetItem(datasourcePath);
            if (datasourceItem == null)
            {
                bundlesLogger.Warn($"BundlesContentResolver: Datasource item not found at '{datasourcePath}'", this);
                return new { items = Array.Empty<object>() };
            }

            bundlesLogger.Info($"BundlesContentResolver: Datasource item - {datasourceItem.Paths.FullPath}", this);

            var bundleGroups = datasourceItem
                .Axes
                .GetDescendants()
                .Where(i =>
                    i.TemplateID.Equals(Constants.TemplateIds.BundleGroup) &&
                    databaseProvider.HasLanguageVersion(i, contextItem.Language))
                .ToList();

            bundlesLogger.Info($"BundlesContentResolver: Found {bundleGroups.Count} bundle group(s)", this);

            if (!bundleGroups.Any())
            {
                bundlesLogger.Warn("BundlesContentResolver: No bundle groups found", this);
                return new { items = Array.Empty<object>() };
            }

            var bundlesData = bundleGroups.Select(item =>
            {
                var promoCode = item[Constants.FieldNames.BundleGroup.Promocode];
                var bundles = ItemFieldsHelper.GetFieldValue(
                    item.Fields[Constants.FieldNames.BundleGroup.Bundles],
                    true,
                    true);

                return new
                {
                    promoCode,
                    bundles
                };
            });

            return new
            {
                items = bundlesData
            };
        }
    }
}
