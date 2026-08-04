using System;
using Sitecore.Pipelines;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public static class IsValidItem
    {
        public static bool RunPipeline(IsValidItemArgs args)
        {
            var settingsPipeline = CorePipelineFactory.GetPipeline(Constants.Pipelines.ResolvePathToItem.IsValidItem, string.Empty);

            settingsPipeline.Run(args);
            return args.Result;
        }
    }
}