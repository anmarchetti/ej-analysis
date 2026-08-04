using System.Collections.Specialized;
using System.Diagnostics.CodeAnalysis;
using System.Web.UI;
using System.Web.UI.WebControls;
using Sitecore;
using Sitecore.Buckets.FieldTypes;
using Sitecore.Buckets.Util;
using Sitecore.ContentSearch.Utilities;
using Sitecore.Data.Items;
using Sitecore.DependencyInjection;
using Sitecore.Globalization;
using Sitecore.Resources;
using Sitecore.Web.UI.HtmlControls;
using Control = Sitecore.Web.UI.HtmlControls.Control;

namespace easyJet.Feature.SitecoreEnhancment.Fields
{
    [ExcludeFromCodeCoverage]
    public class TreeListBucket : BucketList
    {
        private readonly NameValueCollection filters = new NameValueCollection();
        private readonly SourceFilterBuilderFactory filterBuilderFactory;

        public TreeListBucket()
        {
            filterBuilderFactory = (SourceFilterBuilderFactory)ServiceLocator.ServiceProvider.GetService(typeof(SourceFilterBuilderFactory));
            Filter = string.Empty;
        }

        public string FieldId { get; set; }

        /// <summary>
        /// Render search controls for bucket.
        /// </summary>
        /// <param name="output">Html text writer.</param>
        public void RenderSearchControls(HtmlTextWriter output)
        {
            if (!BucketConfigurationSettings.ItemBucketsEnabled())
            {
                output.Write("The field cannot be displayed because the Item Buckets feature is disabled.");
            }
            else
            {
                RenderStartLocationInput(output);
                BuildFilter();
                ServerProperties["ID"] = ID;
                RenderControls(output);
            }
        }

        /// <summary>Renders the supporting JavaScript.</summary>
        /// <param name="output">The writer.</param>
        /// <param name="allId">All container id.</param>
        /// <param name="unselectedId">Unselected container id.</param>
        public void RenderTreelistScript(HtmlTextWriter output, string allId, string unselectedId)
        {
            var scriptParameters = $"{{{ScriptParameters}, allId: '{allId}', unselectedId: '{unselectedId}'}}";
            var scriptSource = "<script>(function() {" +
                    "var script = document.createElement('script');" +
                    "script.src = '/sitecore/shell/Controls/TreeListBucket/InitTreelist.js';" +
                    "script.type = 'text/javascript';" +
                    "script.async = false;" +
                    $"script.onload = () => {{ initTreelist({scriptParameters})}};" +
                    $"document.getElementById('search{ClientID}').parentElement.appendChild(script);}})()" +
                "</script>";
            output.Write(scriptSource);
        }

        protected override string ScriptParameters
        {
            get
            {
                return $"id: '{ID}', " +
                    $"clientId: '{ClientID}', " +
                    $"pageNumber : '{PageNumber}', " +
                    $"searchHandlerUrl : '/sitecore/shell/Applications/Buckets/Services/Search.ashx', " +
                    $"filter: '{Filter}', " +
                    $"databaseUrlParameter: '{SearchHelper.GetDatabaseUrlParameter("&")}', " +
                    $"typeToSearchString: '{TypeHereToSearch}', " +
                    $"of: '{Of}', " +
                    $"enableSetStartLocation: '{EnableSetNewStartLocation}'";
            }
        }

        protected void RenderControls(HtmlTextWriter output)
        {
            Controls.Clear();
            Border border = new Border
            {
                ID = $"search{ClientID}",
                Class = "scMultilistNav search-controls-container"
            };
            Controls.Add(border);

            var input = new Edit
            {
                ID = $"filterBox{ClientID}",
                Enabled = Sitecore.Context.ContentDatabase.GetItem(ItemID).Access.CanWrite(),
                Class = "scIgnoreModified bucketSearch inactive filter-box"
            };
            border.Controls.Add(input);

            var prev = new LinkButton()
            {
                ID = $"prev{ClientID}",
                CssClass = "hovertext",
                Text = $"{Images.GetImage("Office/16x16/arrow_left.png", 16, 16, "absmiddle")}{Translate.Text("Prev")}"
            };
            border.Controls.Add(prev);

            var next = new LinkButton
            {
                ID = $"next{ClientID}",
                CssClass = "hovertext",
                Text = $"{Translate.Text("Next")}{Images.GetImage("Office/16x16/arrow_right.png", 16, 16, "absmiddle")}"
            };
            border.Controls.Add(next);

            var refresh = new LinkButton
            {
                ID = $"refresh{ClientID}",
                CssClass = "hovertext",
                Text = $"{Translate.Text("Refresh")}{Images.GetImage("Office/16x16/refresh.png", 16, 16, "absmiddle")}"
            };
            border.Controls.Add(refresh);

            var go = new LinkButton
            {
                ID = $"goto{ClientID}",
                CssClass = "hovertext",
                Text = $"{Translate.Text("Go to item")}{Images.GetImage("Office/16x16/magnifying_glass.png", 16, 16, "absmiddle")}"
            };
            border.Controls.Add(go);

            var pagesContainer = new WebControl(HtmlTextWriterTag.Span);
            border.Controls.Add(pagesContainer);

            var pages = new WebControl(HtmlTextWriterTag.Strong);
            pagesContainer.Controls.Add(pages);
            pages.Controls.Add(new LiteralControl() { Text = $"{Translate.Text("Page number")}: " });

            var currentPage = new WebControl(HtmlTextWriterTag.Span);
            pagesContainer.Controls.Add(currentPage);
            currentPage.ID = $"pageNumber{ClientID}";

            foreach (Control control in Controls)
            {
                control.RenderControl(output);
            }
        }

        protected override void BuildFilter()
        {
            Item obj = Sitecore.Context.ContentDatabase.GetItem(ItemID);
            SourceFilterBuilder sourceFilterBuilder = filterBuilderFactory.CreateSourceFilterBuilder(obj, FieldId, Source);
            bool.TryParse(sourceFilterBuilder.SourceParts["EnableSetNewStartLocation"], out bool enableSetNewStartLocation);
            sourceFilterBuilder.BuildLocationPart("Datasource", "StartSearchLocation", ItemIDs.RootID.ToString());
            sourceFilterBuilder.BuildFilterPart("Filter");
            sourceFilterBuilder.BuildPart("FullTextQuery", "text", true, false);
            sourceFilterBuilder.BuildPart("Language", "language", true, false);
            sourceFilterBuilder.BuildPart("SortField", "sort", false, false);
            sourceFilterBuilder.BuildPart("TemplateFilter", "template", true, true);
            filters.Add(sourceFilterBuilder.GetResult());
            ExtractPageSize(sourceFilterBuilder.SourceParts, obj);
            filters.Add("+_latestversion", "true");

            Filter = sourceFilterBuilder.JoinParts("&", "=", filters);
        }
    }
}