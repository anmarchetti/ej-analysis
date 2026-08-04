using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.Shell.Applications.ContentEditor;
using Sitecore.Text;
using Sitecore.Web;
using Sitecore.Web.UI.HtmlControls;
using Sitecore.Web.UI.HtmlControls.Data;
using Sitecore.Web.UI.WebControls;

namespace easyJet.Feature.SitecoreEnhancment.Fields
{
    [ExcludeFromCodeCoverage]
    public class MultiRootTreeListEx : TreeList
    {
        /// <summary>
        /// Create Multi Root TreelistEx field.
        /// </summary>
        /// <param name="args">Event args.</param>
        protected override void OnLoad(EventArgs args)
        {
            Assert.ArgumentNotNull(args, "args");

            ModifySource();

            base.OnLoad(args);

            if (!Sitecore.Context.ClientPage.IsEvent)
            {
                var existingTreeView = (TreeviewEx)WebUtil.FindControlOfType(this, typeof(TreeviewEx));
                var treeviewParent = existingTreeView.Parent;

                existingTreeView.Parent.Controls.Clear();

                var dataContext = (DataContext)WebUtil.FindControlOfType(this, typeof(DataContext));
                var dataContextParent = dataContext.Parent;

                dataContextParent.Controls.Remove(dataContext);

                var multiRootTreeView = new MultiRootTreeview();
                multiRootTreeView.ID = existingTreeView.ID;
                multiRootTreeView.DblClick = existingTreeView.DblClick;
                multiRootTreeView.Enabled = existingTreeView.Enabled;
                multiRootTreeView.DisplayFieldName = existingTreeView.DisplayFieldName;

                var dataContexts = ParseDataContexts(dataContext);

                multiRootTreeView.DataContext = string.Join("|", dataContexts.Select(x => x.ID));
                foreach (var context in dataContexts)
                {
                    dataContextParent.Controls.Add(context);
                }

                treeviewParent.Controls.Add(multiRootTreeView);
            }
        }

        /// <summary>
        /// Modifies source to replace query.
        /// </summary>
        protected virtual void ModifySource()
        {
            if (!Sitecore.Context.ClientPage.IsEvent)
            {
                string source = StringUtil.GetString(Source);

                if (!string.IsNullOrWhiteSpace(source) && source.StartsWith("query:") && !(Sitecore.Context.ContentDatabase == null || ItemID == null))
                {
                    Item sourceItem = Sitecore.Context.ContentDatabase.GetItem(ItemID);

                    if (sourceItem == null)
                    {
                        return;
                    }

                    IEnumerable<Item> itemsFromQuery = null;
                    string query = source;

                    if (source.Contains('&'))
                    {
                        query = source.Substring(0, source.IndexOf('&'));
                    }

                    try
                    {
                        itemsFromQuery = LookupSources.GetItems(sourceItem, query);
                    }
                    catch (Exception ex)
                    {
                        Log.Error("Treelist field failed to execute query.", ex, (object)this);
                    }

                    if (itemsFromQuery != null)
                    {
                        string pipedDataSource = string.Join("|", itemsFromQuery.Select(item => item.Paths.FullPath));

                        if (source.Contains('&'))
                        {
                            Source = "Datasource=" + source.Replace(query, pipedDataSource);
                        }
                        else
                        {
                            Source = "Datasource=" + pipedDataSource;
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Parses multiple source roots into discrete data context controls (e.g. 'dataSource=/sitecore/content|/sitecore/media library').
        /// </summary>
        /// <param name="originalDataContext">Original data context.</param>
        /// <returns>Collection of data contexts.</returns>
        protected virtual DataContext[] ParseDataContexts(DataContext originalDataContext)
        {
            return new ListString(DataSource).Select(x => CreateDataContext(originalDataContext, x)).ToArray();
        }

        /// <summary>
        /// Creates a DataContext control for a given Sitecore path data source.
        /// </summary>
        /// <param name="baseDataContext">Base data context.</param>
        /// <param name="dataSource">Datasource to use for search.</param>
        /// <returns>Data context.</returns>
        protected virtual DataContext CreateDataContext(DataContext baseDataContext, string dataSource)
        {
            DataContext dataContext = new DataContext();
            dataContext.ID = GetUniqueID("D");
            dataContext.Filter = baseDataContext.Filter;
            dataContext.DataViewName = "Master";
            if (!string.IsNullOrEmpty(DatabaseName))
            {
                dataContext.Parameters = "databasename=" + DatabaseName;
            }

            dataContext.Root = dataSource;
            dataContext.Language = Language.Parse(ItemLanguage);

            return dataContext;
        }
    }
}