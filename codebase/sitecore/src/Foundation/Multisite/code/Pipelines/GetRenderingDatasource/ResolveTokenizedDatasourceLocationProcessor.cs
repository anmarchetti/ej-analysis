using System;
using System.Linq;
using easyJet.Foundation.Multisite.Extensions;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.GetRenderingDatasource;
using Sitecore.Text;

namespace easyJet.Foundation.Multisite.Pipelines.GetRenderingDatasource
{
    public class ResolveTokenizedDatasourceLocationProcessor
    {
        private const string DatasourceLocation = "Datasource Location";

        public void Process(GetRenderingDatasourceArgs args)
        {
            Assert.IsNotNull(args, nameof(args));

            foreach (var query in new ListString(args.RenderingItem[DatasourceLocation]))
            {
                if (query.Contains("$"))
                {
                    ResolveTokenizedQuery(args, query);
                }
            }
        }

        private void ResolveTokenizedQuery(GetRenderingDatasourceArgs args, string query)
        {
            var database = args.ContentDatabase ?? Sitecore.Context.Database;

            var contextItem = database.GetItem(args.ContextItemPath);
            if (contextItem != null)
            {
                var location = TokenResolver.Resolve(contextItem, query);
                if (!string.IsNullOrEmpty(location))
                {
                    var workingQuery = location.ToWorkingQuery();

                    var roots = query.StartsWith("./", StringComparison.InvariantCulture)
                        ? contextItem.Axes.SelectItems(workingQuery)
                        : database.SelectItems(workingQuery.WithoutQueryKeyword());

                    foreach (var root in roots)
                    {
                        if (args.DatasourceRoots.All(x => x.ID != root.ID))
                        {
                            args.DatasourceRoots.Add(root);
                        }
                    }
                }
            }
        }
    }
}