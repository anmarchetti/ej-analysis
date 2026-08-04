using System;
using System.Runtime.CompilerServices;
using Sitecore.Diagnostics;

[assembly: InternalsVisibleTo("easyJet.Feature.PageContent.Tests")]

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class StandardPathToItemResolver : ResolvePathToItemProcessor
    {
        public override void Process(ResolvePathToItemArgs args)
        {
            if (args.RootItem == null)
            {
                LogWrapper($"{nameof(StandardPathToItemResolver)} {nameof(ResolvePathToItemArgs.RootItem)} is null");
                LogWrapper($"{nameof(StandardPathToItemResolver)} context: {args.ResolveItemArgs?.Item?.Uri} Path:{string.Join(", ", args.PathParts ?? Array.Empty<string>())}");
                return;
            }

            foreach (var child in GetMatchingChildren(args.RootItem, args.CurrentPathPart))
            {
                var resolvedItem = ContinueResolving(args, child, 1);
                if (resolvedItem.Item != null)
                {
                    args.Result = resolvedItem;
                    args.AbortPipeline();
                }
            }
        }

        internal virtual void LogWrapper(string msg)
        {
            Log.Debug(msg);
        }
    }
}