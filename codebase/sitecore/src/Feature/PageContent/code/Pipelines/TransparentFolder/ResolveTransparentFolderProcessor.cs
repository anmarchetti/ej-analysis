using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Feature.PageContent.Extensions;
using easyJet.Feature.PageContent.Pipelines.ItemResolving;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;

[assembly: InternalsVisibleTo("easyJet.Feature.PageContent.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.PageContent.Pipelines.TransparentFolder
{
    public class ResolveTransparentFolderProcessor : ResolvePathToItemProcessor
    {
        public override void Process(ResolvePathToItemArgs args)
        {
            if (Context.Language == null || args.Result.Item != null)
            {
                return;
            }

            var transparentFolders = GetTransparentFolders(args.RootItem);
            var db = args?.RootItem?.Database;

            args.Result =
                transparentFolders
                    .Select(dataUri => db?.GetItem(dataUri))
                    .Where(i => i != null)
                    .Select(transparentFolder => ContinueResolving(args, transparentFolder, 0))
                    .FirstOrDefault(result => result.Item != null)
                ?? ResolveItemResult.NoItemFound;
        }

        internal virtual List<DataUri> GetTransparentFolders(Item parent)
        {
            var items = GetChildren(parent).Where(c => c.IsTransparentItem());
            var itemUris = items.Select(i => i.Uri.ToDataUri()).ToList();
            return itemUris;
        }
    }
}