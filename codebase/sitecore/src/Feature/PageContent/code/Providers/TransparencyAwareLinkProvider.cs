using System;
using System.Collections.Generic;
using easyJet.Feature.PageContent.Pipelines.Arguments;
using easyJet.Feature.PageContent.Providers.Arguments;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Links;
using Sitecore.Links.UrlBuilders;
using Sitecore.Pipelines;

namespace easyJet.Feature.PageContent.Providers
{
    public class TransparencyAwareLinkProvider : LinkProvider
    {
        private const string LimitName = "TransParencyAwareLinkProvider.Limit";

        public TransparencyAwareLinkProvider(BaseFactory factory)
            : base(factory)
        {
        }

        public override string GetItemUrl(Item item, ItemUrlBuilderOptions options)
        {
            var args = new LinkProviderArgs
            {
                BaseCall = base.GetItemUrl,
                Item = item,
                BuilderOptions = options,
                ApplySiteResolving = true,
            };

            var url = GetItemUrlImpl(args);

            return url;
        }

        private static string GetItemUrlImpl(LinkProviderArgs args)
        {
            var item = args.Item;
            var builderOptions = args.BuilderOptions;

            var sitesToIgnore = new List<string>()
            {
                "admin",
                "publisher",
                "shell",
                "scheduler",
                "service"
            };

            if (Settings.Rendering.SiteResolving && Context.Site != null && !sitesToIgnore.Contains(Context.Site.Name) && Sitecore.Context.PageMode.IsNormal)
            {
                builderOptions.SiteResolving = Settings.Rendering.SiteResolving;
            }

            // Workaround - Sitecore resolves site in preview mode?!
            if (Context.Site != null && Context.PageMode.IsPreview)
            {
                builderOptions.SiteResolving = false;
            }

            var baseResult = args.BaseCall(item, builderOptions);

            if (item == null)
            {
                return baseResult;
            }

            using (var recursionLimit = new RecursionLimit(Constants.Pipelines.GetItemUrl, 5))
            {
                if (recursionLimit.Exceeded)
                {
                    throw new InvalidOperationException($"{Constants.Pipelines.GetItemUrl} detected a recursion with item '{item.Paths.FullPath}'");
                }

                var pipelineArgs = new GetItemUrlPipelineArgs() { Item = item, Options = builderOptions, Url = baseResult };

                CorePipeline.Run(Constants.Pipelines.GetItemUrl, pipelineArgs);

                return pipelineArgs.Url ?? baseResult;
            }
        }
    }
}