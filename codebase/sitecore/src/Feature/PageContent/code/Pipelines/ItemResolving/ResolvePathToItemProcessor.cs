using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using Sitecore;
using Sitecore.Collections;
using Sitecore.Data.Items;
using Sitecore.Pipelines;

[assembly: InternalsVisibleTo("easyJet.Feature.PageContent.Tests")]

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public abstract class ResolvePathToItemProcessor : CoreProcessor
    {
        public static ResolveItemResult ResolveItem(Item root, string[] pathParts, ResolveItemArgs resolveItemArgs = null, int pathIndex = 0)
        {
            var args = new ResolvePathToItemArgs(root, pathParts, resolveItemArgs, resolveItemArgs?.Settings ?? new ResolveItemSettings(), pathIndex);
            return RunPipeline(args);
        }

        public abstract void Process(ResolvePathToItemArgs args);

        public virtual string EncodeName(string displayName)
        {
            return MainUtil.EncodeName(displayName);
        }

        protected internal virtual ResolveItemResult ContinueResolving(ResolvePathToItemArgs args, Item newRoot, int consumedPartsCount)
        {
            var index = args.PathIndex + consumedPartsCount;
            var newArgs = new ResolvePathToItemArgs(newRoot, args.PathParts, args.ResolveItemArgs, args.Settings, index);
            return RunPipeline(newArgs);
        }

        protected internal virtual ChildList GetChildren(Item parent)
        {
            return parent.GetChildren(ChildListOptions.IgnoreSecurity | ChildListOptions.SkipSorting | ChildListOptions.AllowReuse);
        }

        protected internal virtual List<Item> GetMatchingChildren(Item parent, string pathPart)
        {
            var children = parent.GetChildren(ChildListOptions.IgnoreSecurity | ChildListOptions.SkipSorting);

            var lowerChildName = pathPart.ToLowerInvariant();
            var result = children.Where(item =>
                item.Key == lowerChildName ||
                item.DisplayName.ToLowerInvariant() == lowerChildName ||
                EncodeName(item.DisplayName.ToLowerInvariant()) == lowerChildName)
                .ToList();
            return result;
        }

        private static ResolveItemResult RunPipeline(ResolvePathToItemArgs args)
        {
            if (args.PathIndex >= args.PathParts.Length)
            {
                var runner = new CreateResolveItemResult();
                var result = runner.RunPipeline(new CreateResolveItemResultArgs(args.RootItem, args.Settings));
                return result;
            }

            var resolvePathToItemPipeline = CorePipelineFactory.GetPipeline(Constants.Pipelines.ResolvePathToItem.Name, string.Empty);

            resolvePathToItemPipeline.Run(args);
            return args.Result;
        }
    }
}