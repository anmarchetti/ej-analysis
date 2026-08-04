using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using Sitecore.Data;
using Sitecore.Data.ItemResolvers;
using Sitecore.Data.Items;
using Sitecore.Data.Managers;
using Sitecore.Globalization;
using Sitecore.SecurityModel;
using Sitecore.Sites;
using Sitecore.Web;

[assembly:InternalsVisibleTo("easyJet.Feature.PageContent.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class StandardItemResolver : ResolveItemProcessor
    {
        internal ItemPathResolver PathResolver;

        public override void Process(ResolveItemArgs args)
        {
            PathResolver = GetResolver();

            if (args.Item != null)
            {
                return;
            }

            if (args?.Site?.DisplayMode == DisplayMode.Preview && TryGetItemFromQueryItemUri(args, out var item))
            {
                args.Item = item;
                return;
            }

            using (new SecurityDisabler())
            {
                var roots = GetRoots(args);
                var pathParts = args.Path.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);

                foreach (var root in roots)
                {
                    if (pathParts.FirstOrDefault() == "sitecore"
                        && root.Name == "sitecore")
                    {
                        pathParts = pathParts.Skip(1).ToArray();
                    }

                    var result = ResolvePathToItemProcessor.ResolveItem(root, pathParts, args);
                    if (result.Item == null)
                    {
                        continue;
                    }

                    args.Item = result.Item;
                    break;
                }
            }

            if (args.Item == null)
            {
                var siteName = args.Site?.Name ?? string.Empty;
                if ((args.Site?.EnablePreview ?? true) || siteName == "shell")
                {
                    args.Item = ResolveFullPath(args);
                }
            }
        }

        public virtual List<Item> GetRoots(ResolveItemArgs args)
        {
            var roots = new List<Item>();
            if (args?.Database == null)
            {
                return roots;
            }

            if (args.Path.StartsWith("/sitecore") && args.Site.EnablePreview)
            {
                roots.Add(GetRootItem(args));
            }
            else
            {
                var home = GetSiteHome(args.Site, args.Database, args.Language);
                if (home != null)
                {
                    roots.Add(home);
                }

                var root = GetSiteRoot(args.Site, args.Database, args.Language);
                if (root != null && roots.All(r => r.ID != root.ID))
                {
                    roots.Add(root);
                }
            }

            return roots;
        }

        internal virtual bool TryGetItemFromQueryItemUri(ResolveItemArgs args, out Item item)
        {
            item = null;
            var queryDict = WebUtil.ParseQueryString(args.Url.Query);
            if (!queryDict.ContainsKey("uri"))
            {
                return false;
            }

            var itemUriString = queryDict["uri"];
            itemUriString = System.Web.HttpUtility.UrlDecode(itemUriString);
            if (!ItemUri.IsItemUri(itemUriString))
            {
                return false;
            }

            var itemUri = ItemUri.Parse(itemUriString);
            var result = DatabaseGetItemWrapper(itemUri);

            item = result;
            return true;
        }

        internal virtual Item DatabaseGetItemWrapper(ItemUri uri)
        {
            return Database.GetItem(uri);
        }

        internal virtual Item GetRootItem(ResolveItemArgs args)
        {
            return args.Database.GetRootItem();
        }

        internal virtual Item GetSiteRoot(SiteContext site, Database db, Language language)
        {
            return ItemManager.GetItem(site.RootPath, language, Sitecore.Data.Version.Latest, db, SecurityCheck.Disable);
        }

        internal virtual Item GetSiteHome(SiteContext site, Database db, Language language)
        {
            return ItemManager.GetItem(site.StartPath, language, Sitecore.Data.Version.Latest, db, SecurityCheck.Disable);
        }

        internal virtual Item ResolveFullPath(ResolveItemArgs args)
        {
            var itemPath = args.Path;
            if (string.IsNullOrEmpty(itemPath) || (itemPath[0] != '/') || args.Database == null)
            {
                return null;
            }

            var index = itemPath.IndexOf('/', 1);
            if (index < 0)
            {
                return null;
            }

            var pathPart = itemPath.Substring(0, index);
            var root = GetItemByItemManager(pathPart, args.Language, args.Database);
            if (root == null)
            {
                return null;
            }

            var path = itemPath.Substring(index);
            var item2 = PathResolver.ResolveItem(path, root);
            if ((item2 == null) && (args.Path.Length > index))
            {
                path = args.Path.Substring(index);
                item2 = PathResolver.ResolveItem(path, root);
            }

            args.Log("StandardItemResolver.ResolveFullPath resolved to: " + item2?.Uri);
            return item2;
        }

        internal virtual Item GetItemByItemManager(string path, Language lang, Database db)
        {
            return ItemManager.GetItem(path, lang, Sitecore.Data.Version.Latest, db, SecurityCheck.Disable);
        }

        protected internal virtual ItemPathResolver GetResolver()
        {
            return new ContentItemPathResolver();
        }
    }
}