using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Feature.PageContent.Extensions;
using easyJet.Feature.PageContent.Pipelines.Arguments;
using Sitecore.Data.Items;
using Sitecore.Pipelines;

[assembly:InternalsVisibleTo("easyJet.Feature.PageContent.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.PageContent.Pipelines.TransparentFolder
{
    public class RemoveTransparentFolderFromUrlProcessor : CoreProcessor
    {
        public virtual void Process(GetItemUrlPipelineArgs args)
        {
            if (string.IsNullOrEmpty(args?.Url))
            {
                return;
            }

            var url = args.Url;
            if (url.StartsWith("//") || url.StartsWith("://"))
            {
                var dots = url.StartsWith(":") ? ":" : string.Empty;
                var trimmedPath = url.TrimStart(':');
                var newPath = RemoveTransparentFoldersFromPath(trimmedPath, args.Item);
                args.Url = $"{dots}//{newPath}";
            }
            else if (url.StartsWith("/"))
            {
                var newUrl = RemoveTransparentFoldersFromPath(url, args.Item);
                var prefixNewUrl = newUrl.FirstOrDefault() == '/' ? string.Empty : "/";
                args.Url = prefixNewUrl + newUrl;
            }
            else
            {
                var urlBuilder = new UriBuilder(url);
                var path = urlBuilder.Path;
                var newPath = RemoveTransparentFoldersFromPath(path, args.Item);

                if (newPath.Length == path.Length)
                {
                    return;
                }

                if (urlBuilder.Uri.IsDefaultPort)
                {
                    urlBuilder.Port = -1;
                }

                urlBuilder.Path = newPath;
                args.Url = urlBuilder.ToString();
            }
        }

        internal virtual string RemoveTransparentFoldersFromPath(string path, Item item)
        {
            var newParts = new Stack<string>();
            var parts = path.TrimStart('/').Split('/');

            foreach (var p in parts.Reverse())
            {
                if (item == null)
                {
                    break;
                }

                if (!item.IsTransparentItem())
                {
                    newParts.Push(p);
                }

                item = item.Parent;
            }

            if (newParts.Count == parts.Length)
            {
                return path;
            }

            return string.Join("/", newParts);
        }
    }
}