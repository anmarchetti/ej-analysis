using System;
using System.Web;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Pipelines;
using Sitecore.Sites;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class ResolveItemArgs : PipelineArgs
    {
        private SiteContext site;
        private Database database;

        public ResolveItemArgs(string path)
        {
            var builder = HttpContext.Current != null ? new UriBuilder(HttpContext.Current.Request.Url) : new UriBuilder("http://localhost");
            builder.Path = path;
            builder.Query = string.Empty;
            Url = builder.Uri;
        }

        public ResolveItemSettings Settings { get; set; }

        public Uri Url { get; }

        public string Path => Url.LocalPath;

        public SiteContext Site
        {
            get
            {
                if (site == null)
                {
                    return Context.Site;
                }

                return site;
            }

            set => site = value;
        }

        private Language language;

        public Language Language
        {
            get => language ?? Language.Parse(Site.Language);
            set => language = value;
        }

        public Item Item { get; set; }

        public void Log(string msg) => Sitecore.Diagnostics.Log.Debug($"easyJet.ResolveItem {msg}");

        public Database Database
        {
            get
            {
                if (database == null)
                {
                    return Context.Database ?? Site.Database;
                }

                return database;
            }

            set => database = value;
        }
    }
}