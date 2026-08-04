using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Web.UI;
using easyJet.Feature.SitecoreEnhancment.Logging;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.ContentSearch.Utilities;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.DependencyInjection;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.Resources;
using Sitecore.Shell.Applications.ContentEditor;
using Sitecore.Web.UI.HtmlControls;
using Sitecore.Web.UI.HtmlControls.Data;
using Sitecore.Web.UI.Sheer;
using Sitecore.Web.UI.WebControls;

namespace easyJet.Feature.SitecoreEnhancment.Fields
{
    [ExcludeFromCodeCoverage]
    public class TreeListWithSearch : TreeList
    {
        private const string FieldIdParam = "fld";
        private const string DuplicationMessage = "You cannot select the same item twice.";
        private readonly ISitecoreEnhancmentLogger logger;
        private Listbox listBox;

        public TreeListWithSearch()
        {
            logger = (ISitecoreEnhancmentLogger)ServiceLocator.ServiceProvider.GetService(typeof(ISitecoreEnhancmentLogger));
        }

        protected override void DoRender(HtmlTextWriter output)
        {
            var controlParams = GetParams(ControlAttributes);
            var fieldId = controlParams[FieldIdParam];

            var bucket = new TreeListBucket()
            {
                ID = ID,
                ItemID = ItemID,
                Source = Source,
                FieldId = fieldId
            };
            bucket.RenderSearchControls(output);
            base.DoRender(output);
            bucket.RenderTreelistScript(output, $"{ID}_all_conatiner", $"{ID}_unselected_items");
        }

        /// <summary>
        /// Load all tree list controls.
        /// </summary>
        /// <param name="args">Sitecore event args.</param>
        protected override void OnLoad(EventArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            base.OnLoad(args);
            if (!Sitecore.Context.ClientPage.IsEvent)
            {
                Controls.Clear();
                SetProperties();
                Border border1 = new Border();
                Controls.Add(border1);
                GetControlAttributes();
                foreach (string key in Attributes.Keys)
                {
                    border1.Attributes.Add(key, Attributes[key]);
                }

                border1.Attributes["id"] = ID;

                Border deselectAllContainer = new Border();
                deselectAllContainer.Class = "scContentButtons";
                deselectAllContainer.Controls.Add(new System.Web.UI.WebControls.LinkButton()
                {
                    ID = $"deselectall{ClientID}",
                    Text = $"{Translate.Text("Deselect All")}",
                    CssClass = "scContentButton",
                    OnClientClick = Sitecore.Context.ClientPage.GetClientEvent($"{ID}.DeselectAll")
                });
                border1.Controls.Add(deselectAllContainer);

                Border border2 = new Border();
                border2.Class = "scTreeListHalfPart";
                Border border3 = border2;
                border1.Controls.Add(border3);
                Border border4 = new Border();
                border3.Controls.Add(border4);
                SetViewStateString("ID", ID);
                ControlCollection controls1 = border4.Controls;
                Literal literal1 = new Literal("All");
                literal1.Class = "scContentControlMultilistCaption";
                controls1.Add(literal1);

                Listbox multilistEx = new Listbox();
                multilistEx.ID = $"{ID}_unselected_items";
                multilistEx.DblClick = $"{ID}.AddFromSearchResults";
                multilistEx.Style["width"] = "100%";
                multilistEx.Style["height"] = "92%";
                multilistEx.Size = "10";
                multilistEx.Attributes["class"] = "scContentControlMultilistBox scFlexContentWithoutFlexie";
                multilistEx.TrackModified = true;
                multilistEx.EnableViewState = true;
                multilistEx.Visible = false;
                border4.Controls.Add(multilistEx);

                Scrollbox scrollbox1 = new Scrollbox();
                scrollbox1.ID = $"{ID}_all_conatiner";
                scrollbox1.Class = "scScrollbox scContentControlTree";
                Scrollbox scrollbox2 = scrollbox1;
                scrollbox2.Visible = true;

                border4.Controls.Add(scrollbox2);

                TreeviewEx treeviewEx1 = new TreeviewEx();
                treeviewEx1.ID = $"{ID}_all";
                treeviewEx1.DblClick = $"{ID}.Add";
                treeviewEx1.AllowDragging = false;
                treeviewEx1.Visible = true;

                TreeviewEx treeviewEx2 = treeviewEx1;
                scrollbox2.Controls.Add(treeviewEx2);
                Border border5 = new Border();
                border5.Class = "scContentControlNavigation";
                Border border6 = border5;
                border3.Controls.Add(border6);

                var btnRightForSearhResults = new ImageBuilder()
                {
                    Src = "Office/16x16/navigate_right.png",
                    Class = "scNavButton",
                    ID = $"{ID}_right_search_results",
                    Style = "display: none",
                    OnClick = Sitecore.Context.ClientPage.GetClientEvent($"{ID}.AddFromSearchResults")
                };

                var literalControl1 = new LiteralControl(new ImageBuilder()
                {
                    Src = "Office/16x16/navigate_right.png",
                    Class = "scNavButton",
                    ID = $"{ID}_right_treelist",
                    OnClick = Sitecore.Context.ClientPage.GetClientEvent($"{ID}.Add")
                }.ToString() + btnRightForSearhResults.ToString() + new ImageBuilder()
                {
                    Src = "Office/16x16/navigate_left.png",
                    Class = "scNavButton",
                    ID = $"{ID}_left",
                    OnClick = Sitecore.Context.ClientPage.GetClientEvent($"{ID}.Remove")
                });
                border6.Controls.Add(literalControl1);
                Border border7 = new Border();
                border7.Class = "scTreeListHalfPart";
                Border border8 = border7;
                border1.Controls.Add(border8);
                Border border9 = new Border();
                border9.Class = "scFlexColumnContainerWithoutFlexie";
                Border border10 = border9;
                border8.Controls.Add(border10);
                ControlCollection controls2 = border10.Controls;
                Literal literal2 = new Literal("Selected");
                literal2.Class = "scContentControlMultilistCaption";
                controls2.Add(literal2);
                Border border11 = new Border();
                border11.Class = "scContentControlSelectedList";
                Border border12 = border11;
                border10.Controls.Add(border12);
                Listbox listbox = new Listbox();
                border12.Controls.Add(listbox);
                listBox = listbox;
                listbox.ID = $"{ID}_selected";
                listbox.DblClick = ID + ".Remove";
                listbox.Style["width"] = "100%";
                listbox.Size = "10";
                listbox.Attributes["onchange"] = $"javascript:document.getElementById('{ID}_help').innerHTML=selectedIndex>=0?options[selectedIndex].innerHTML:''";
                listbox.Attributes["class"] = "scContentControlMultilistBox scFlexContentWithoutFlexie";
                listBox.TrackModified = false;
                treeviewEx2.Enabled = !ReadOnly;
                listbox.Disabled = ReadOnly;
                border10.Controls.Add(new LiteralControl($"<div class='scContentControlTreeListHelp' id=\"{ID}_help\"></div>"));
                Border border13 = new Border();
                border13.Class = "scContentControlNavigation";
                Border border14 = border13;
                border8.Controls.Add(border14);
                LiteralControl literalControl2 = new LiteralControl(new ImageBuilder()
                {
                    Src = "Office/16x16/navigate_up.png",
                    Class = "scNavButton",
                    ID = $"{ID}_up",
                    OnClick = Sitecore.Context.ClientPage.GetClientEvent($"{ID}.Up")
                }.ToString() + (object)new ImageBuilder()
                {
                    Src = "Office/16x16/navigate_down.png",
                    Class = "scNavButton",
                    ID = $"{ID}_down",
                    OnClick = Sitecore.Context.ClientPage.GetClientEvent($"{ID}.Down")
                });
                border14.Controls.Add(literalControl2);
                DataContext dataContext = new DataContext();
                border1.Controls.Add(dataContext);
                dataContext.ID = GetUniqueID("D");
                dataContext.Filter = FormTemplateFilterForDisplay();
                treeviewEx2.DataContext = dataContext.ID;
                treeviewEx2.DisplayFieldName = DisplayFieldName;
                dataContext.DataViewName = "Master";
                if (!string.IsNullOrEmpty(DatabaseName))
                {
                    dataContext.Parameters = $"databasename={DatabaseName}";
                }

                dataContext.Root = DataSource;
                dataContext.Language = Language.Parse(ItemLanguage);
                treeviewEx2.ShowRoot = true;
                RestoreState();
            }
        }

        /// <summary>
        /// Deselect all selected items.
        /// </summary>
        protected void DeselectAll()
        {
            if (Disabled)
            {
                return;
            }

            string viewStateString = GetViewStateString("ID");
            Listbox control2 = FindControl($"{viewStateString}_selected") as Listbox;
            Assert.IsNotNull(control2, typeof(Listbox));
            control2.Controls.Clear();
            SheerResponse.Refresh(control2);
            TreeListWithSearch.SetModified();
        }

        /// <summary>
        /// Add data to selected from search results.
        /// </summary>
        protected void AddFromSearchResults()
        {
            if (Disabled)
            {
                return;
            }

            string viewStateString = GetViewStateString("ID");
            Listbox control1 = FindControl($"{viewStateString}_unselected_items") as Listbox;
            Listbox control2 = FindControl($"{viewStateString}_selected") as Listbox;
            Assert.IsNotNull(control2, typeof(Listbox));
            Item selectionItem = null;
            var selectedItemId = control1?.Value;
            if (!string.IsNullOrEmpty(selectedItemId))
            {
                selectionItem = Sitecore.Context.ContentDatabase.GetItem(new ID(selectedItemId), Language.Parse(ItemLanguage), Sitecore.Data.Version.Latest);
            }

            if (selectionItem == null)
            {
                SheerResponse.Alert("Select an item in search results");
            }
            else
            {
                if (IsDeniedMultipleSelection(selectionItem, control2))
                {
                    SheerResponse.Alert(DuplicationMessage);
                }
                else
                {
                    if (HasExcludeTemplateForSelection(selectionItem))
                    {
                        return;
                    }

                    if (IsDeniedMultipleSelection(selectionItem, control2))
                    {
                        SheerResponse.Alert(DuplicationMessage);
                    }
                    else
                    {
                        if (!HasIncludeTemplateForSelection(selectionItem))
                        {
                            return;
                        }

                        SheerResponse.Eval($"scForm.browser.getControl('{viewStateString}_selected').selectedIndex=-1");
                        ListItem listItem = new ListItem();
                        listItem.ID = GetUniqueID("L");
                        Sitecore.Context.ClientPage.AddControl(control2, listItem);
                        listItem.Header = GetHeaderValue(selectionItem);
                        listItem.Value = $"{listItem.ID}|{selectionItem.ID}";
                        SheerResponse.Refresh(control2);
                        TreeListWithSearch.SetModified();
                    }
                }
            }
        }

        /// <summary>
        ///   Determines whether an item is based on a template from <paramref name="templateList" />.
        /// </summary>
        /// <param name="item">The item.</param>
        /// <param name="templateList">The template list - a set of comma-separated template names.</param>
        /// <returns>
        ///   <c>true</c> if item is based on a template, which name is mentioned in <paramref name="templateList" />; otherwise, <c>false</c>.
        /// </returns>
        /// <contract>
        ///   <requires name="item" condition="none" />
        ///   <requires name="templateList" condition="not null" />
        /// </contract>
        private static bool HasItemTemplate(Item item, string templateList)
        {
            Assert.ArgumentNotNull(templateList, nameof(templateList));

            return (item == null || templateList.Any()) && templateList
                .Split(',')
                .Select(x => x.Trim().ToLowerInvariant())
                .Contains(item.TemplateName.Trim().ToLowerInvariant());
        }

        /// <summary>
        /// Determines whether this instance denies multiple selection.
        /// </summary>
        /// <param name="item">The item.</param>
        /// <param name="listbox">The <c>listbox</c>.</param>
        /// <returns>
        /// <c>true</c> if this instance denies multiple selection; otherwise, <c>false</c>.
        /// </returns>
        private bool IsDeniedMultipleSelection(Item item, Listbox listbox)
        {
            Assert.ArgumentNotNull(listbox, nameof(listbox));
            if (item == null)
            {
                return true;
            }

            if (AllowMultipleSelection)
            {
                return false;
            }

            return listbox.Controls
                .Cast<Sitecore.Web.UI.HtmlControls.Control>()
                .Select(x => x.Value.Split('|'))
                // Element of array with index 1 is id of sitecore item.
                .Any(x => x.Length >= 2 && x[1] == item.ID.ToString());
        }

        /// <summary>
        ///   Determines whether an item is based on a template that is mentioned in <see cref="P:Sitecore.Shell.Applications.ContentEditor.TreeList.ExcludeTemplatesForSelection" />.
        /// </summary>
        /// <param name="item">The item.</param>
        /// <returns>
        ///   <c>true</c> if item is based on a template that is mentioned in <see cref="P:Sitecore.Shell.Applications.ContentEditor.TreeList.ExcludeTemplatesForSelection" />; otherwise, <c>false</c>.
        /// </returns>
        /// <contract>
        ///   <requires name="item" condition="none" />
        /// </contract>
        private bool HasExcludeTemplateForSelection(Item item)
        {
            return item == null || HasItemTemplate(item, ExcludeTemplatesForSelection);
        }

        /// <summary>
        ///  Determines whether [has include template for selection] [the specified item].
        /// </summary>
        /// <param name="item">The item.</param>
        /// <returns>
        ///   <c>true</c> if [has include template for selection] [the specified item]; otherwise, <c>false</c>.
        /// </returns>
        /// <contract>
        ///   <requires name="item" condition="not null" />
        /// </contract>
        private bool HasIncludeTemplateForSelection(Item item)
        {
            Assert.ArgumentNotNull(item, nameof(item));
            return IncludeTemplatesForSelection.Length == 0 || TreeListWithSearch.HasItemTemplate(item, IncludeTemplatesForSelection);
        }

        /// <summary>
        /// Restores the state.
        /// </summary>
        private void RestoreState()
        {
            string[] paths = Value.Split('|');
            if (paths.Length == 0)
            {
                return;
            }

            var database = Sitecore.Context.ContentDatabase ?? Factory.GetDatabase(DatabaseName);

            for (int index = 0; index < paths.Length; ++index)
            {
                var path = paths[index];
                if (!string.IsNullOrEmpty(path))
                {
                    var listItem = new ListItem();
                    listItem.ID = GetUniqueID("I");
                    listBox.Controls.Add(listItem);
                    listItem.Value = $"{listItem.ID}|{path}";
                    var item = database.GetItem(path, Language.Parse(ItemLanguage));
                    listItem.Header = item == null ? $"{path} {Translate.Text("[Item not found]")}" : GetHeaderValue(item);
                }
            }

            SheerResponse.Refresh(listBox);
        }

        /// <summary>
        /// Sets the properties.
        /// </summary>
        private void SetProperties()
        {
            string source = StringUtil.GetString(Source);
            if (source.StartsWith("query:"))
            {
                if (Sitecore.Context.ContentDatabase == null || ItemID == null)
                {
                    return;
                }

                var current = Sitecore.Context.ContentDatabase.GetItem(ItemID);

                if (current == null)
                {
                    return;
                }

                Item item = null;
                try
                {
                    item = LookupSources.GetItems(current, source).FirstOrDefault();
                }
                catch (Exception ex)
                {
                    logger.Error("Treelist field failed to execute query.", ex, this);
                }

                if (item == null)
                {
                    return;
                }

                DataSource = item.Paths.FullPath;
            }
            else if (Sitecore.Data.ID.IsID(source))
            {
                DataSource = Source;
            }
            else if (Source != null && !source.Trim().StartsWith("/", StringComparison.OrdinalIgnoreCase))
            {
                ExcludeTemplatesForSelection = ExtractParameterFromSource("ExcludeTemplatesForSelection");
                IncludeTemplatesForSelection = ExtractParameterFromSource("IncludeTemplatesForSelection");
                IncludeTemplatesForDisplay = ExtractParameterFromSource("IncludeTemplatesForDisplay");
                ExcludeTemplatesForDisplay = ExtractParameterFromSource("ExcludeTemplatesForDisplay");
                ExcludeItemsForDisplay = ExtractParameterFromSource("ExcludeItemsForDisplay");
                IncludeItemsForDisplay = ExtractParameterFromSource("IncludeItemsForDisplay");
                AllowMultipleSelection = string.Compare(ExtractParameterFromSource("AllowMultipleSelection").ToLowerInvariant(), "yes", StringComparison.InvariantCultureIgnoreCase) == 0;
                DataSource = ExtractParameterFromSource("DataSource").ToLowerInvariant();
                DatabaseName = ExtractParameterFromSource("databasename").ToLowerInvariant();
            }
            else
            {
                DataSource = Source;
            }
        }

        /// <summary>
        /// Get query params from string.
        /// </summary>
        /// <returns>Query params.</returns>
        private Dictionary<string, string> GetParams(string source)
        {
            return source
               .Replace("&amp;", "&")
               .Split(new string[] { "&" }, StringSplitOptions.RemoveEmptyEntries)
               .Select(x => x.Split('='))
               .GroupBy(x => x.FirstOrDefault())
               .ToDictionary(x => x.Key, x =>
               {
                   var value = x.FirstOrDefault();
                   // Element with index 0 is parameter name, element with index 1 is parameter value.
                   return value.Length > 1 ? value[1] : null;
               });
        }

        /// <summary>
        /// Extracting parameter by name from source.
        /// </summary>
        /// <param name="parameterName">Parameter name.</param>
        /// <returns>Extracted parameter.</returns>
        private string ExtractParameterFromSource(string parameterName)
        {
            return StringUtil.ExtractParameter(parameterName, Source).Trim();
        }
    }
}