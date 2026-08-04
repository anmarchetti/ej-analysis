using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;
using easyJet.Foundation.SitecoreExtensions.Helper;
using easyJet.Foundation.SitecoreExtensions.Services;
using Microsoft.Extensions.DependencyInjection;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.DependencyInjection;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.Resources;
using Sitecore.Shell.Applications.ContentEditor;
using Sitecore.Text;
using Sitecore.Web.UI.HtmlControls;
using Sitecore.Web.UI.Sheer;
using Sitecore.Web.UI.WebControls;
using Control = Sitecore.Web.UI.HtmlControls.Control;

namespace easyJet.Feature.SitecoreEnhancment.Fields
{
    [ExcludeFromCodeCoverage]
    public sealed class OrderedList : Control, IContentField
    {
        private readonly IOrderedListItemsManager orderedListItemsManager;

        private Listbox itemsBox;

        /// <summary>
        /// Gets or sets the listbox control that holds the items to be ordered.
        /// </summary>
        public Listbox ItemsBox
        {
            get
            {
                var id = GetViewStateString("ID");
                return itemsBox ?? (itemsBox = FindControl(id + "_itemsBox") as Listbox);
            }

            set
            {
                itemsBox = value;
            }
        }

        /// <summary>
        /// Gets or sets the context item.
        /// this field is automatically populated by sitecore.
        /// </summary>
        public string ItemId { get; set; }

        public bool ReadOnly { get; set; }

        public string ItemLanguage { get; set; }

        /// <summary>
        /// Gets or sets the template field source
        /// this field is automatically populated by sitecore on first load.
        /// </summary>
        public string Source { get; set; }

        public string DatabaseName
        {
            get
            {
                return GetViewStateString("DatabaseName");
            }

            set
            {
                Assert.ArgumentNotNull(value, "value");
                SetViewStateString("DatabaseName", value);
            }
        }

        public OrderedList()
        {
            orderedListItemsManager = ServiceLocator.ServiceProvider.GetService<IOrderedListItemsManager>();
            Class = "scContentControl scContentControlTreelist";
            Background = "white";
            Activation = true;
            ReadOnly = false;
        }

        #region IContentField Implementation

        /// <summary>
        /// this method is called on control load by sitecore.
        /// </summary>
        /// <param name="value">The value stored at the control at load.</param>
        public void SetValue(string value)
        {
            Value = value;
        }

        /// <summary>
        /// this method is called upon sitecore save.
        /// </summary>
        /// <returns>The composed string that represents the current state of the items box.</returns>
        public string GetValue()
        {
            // get the current state of the items box, after reordering
            var itemIds = ItemsBox.Items.Select(i => i.Value);

            // compose it to a string
            return ItemIdParser.Compose(itemIds);
        }

        #endregion

        protected override void OnLoad(EventArgs args)
        {
            Assert.ArgumentNotNull(args, "args");
            if (!Sitecore.Context.ClientPage.IsEvent)
            {
                SetViewStateString("ID", ID);
                ServerProperties["DataSource"] = DataSource;
                GetControlAttributes();

                // create the GRID and add it to controls
                var gridPanel = CreateGrid();
                Controls.Add(gridPanel);

                // create the ITEMS BOX and add it to the grid
                var itemsBox = CreateItemsBox();
                gridPanel.Controls.Add(itemsBox);
                gridPanel.SetExtensibleProperty(itemsBox, "VAlign", "top");
                gridPanel.SetExtensibleProperty(itemsBox, "Height", "100%");

                // create the ARROWS and add them to the grid
                var arrows = CreateArrows();
                gridPanel.Controls.Add(arrows);
                gridPanel.SetExtensibleProperty(arrows, "Width", "30");
                gridPanel.SetExtensibleProperty(arrows, "Align", "center");
                gridPanel.SetExtensibleProperty(arrows, "VAlign", "top");
                gridPanel.SetExtensibleProperty(arrows, "rowspan", "2");

                // create the HELP BOX and add it to the grid
                var helpBox = CreateHelpBox();
                gridPanel.Controls.Add(helpBox);

                // sync source items with the one already existed at the source
                SyncControlAndSourceItems();

                // fill the items box with the synched and existing items
                FillItemsBox();
            }

            base.OnLoad(args);
        }

        /// <summary>
        /// Tells sitecore that changes have been made.
        /// </summary>
        private static void SetModified()
        {
            Sitecore.Context.ClientPage.Modified = true;
        }

        /// <summary>
        /// Creates the grid that holds all the other controls and is responsible for their layout.
        /// </summary>
        /// <returns>The newly create grid.</returns>
        private GridPanel CreateGrid()
        {
            var gridPanel = new GridPanel { Fixed = true, Columns = 2 };

            foreach (string key in Attributes.Keys)
            {
                gridPanel.Attributes.Add(key, Attributes[key]);
            }

            gridPanel.Style["margin"] = "0px 0px 4px 0px";

            return gridPanel;
        }

        /// <summary>
        /// Creates the items box that holds all the items to be sorted.
        /// </summary>
        /// <returns>The newly created list box.</returns>
        private Listbox CreateItemsBox()
        {
            ItemsBox = new Listbox { ID = ID + "_itemsBox", Size = "10", Disabled = ReadOnly };

            // fill the help box with the selected item
            ItemsBox.Attributes["onchange"] = "javascript:document.getElementById('" + ID + "_help').innerHTML=this.selectedIndex>=0?this.options[this.selectedIndex].value:''";
            ItemsBox.Attributes["class"] = "scContentControlMultilistBox";
            return ItemsBox;
        }

        /// <summary>
        /// Creates the sorting arrows and the go-to button.
        /// </summary>
        /// <returns>The newly created buttons.</returns>
        private LiteralControl CreateArrows()
        {
            return new LiteralControl(
                new ImageBuilder
                {
                    Src = "Applications/16x16/navigate_up2.png",
                    ID = ID + "_first",
                    Width = 16,
                    Height = 16,
                    Margin = UIUtil.IsIE() ? "2px" : "2px 0px 2px 2px",
                    OnClick = Sitecore.Context.ClientPage.GetClientEvent(ID + ".First")
                }

                + "<br/>" + new ImageBuilder
                {
                    Src = "Applications/16x16/nav_up_blue.png",
                    ID = ID + "_up",
                    Width = 16,
                    Height = 16,
                    Margin = "2px",
                    OnClick = Sitecore.Context.ClientPage.GetClientEvent(ID + ".Up")
                }

                + "<br/>" + new ImageBuilder
                {
                    Src = "Applications/16x16/nav_down_blue.png",
                    ID = ID + "_down",
                    Width = 16,
                    Height = 16,
                    Margin = "2px",
                    OnClick = Sitecore.Context.ClientPage.GetClientEvent(ID + ".Down")
                }

                + "<br/>" + new ImageBuilder
                {
                    Src = "Applications/16x16/navigate_down2.png",
                    ID = ID + "_last",
                    Width = 16,
                    Height = 16,
                    Margin = UIUtil.IsIE() ? "2px" : "2px 0px 2px 2px",
                    OnClick = Sitecore.Context.ClientPage.GetClientEvent(ID + ".Last")
                }

                + "<br/>" + new ImageBuilder
                {
                    Src = "Core2/16x16/go.png",
                    ID = ID + "_goto",
                    Width = 16,
                    Height = 16,
                    Margin = UIUtil.IsIE() ? "2px" : "2px 0px 2px 2px",
                    OnClick = Sitecore.Context.ClientPage.GetClientEvent(ID + ".Goto")
                });
        }

        /// <summary>
        /// Creates a help box that displays the selected item id.
        /// </summary>
        /// <returns>the newly created help box.</returns>
        private LiteralControl CreateHelpBox()
        {
            return new LiteralControl("<div style=\"border:1px solid #999999;font:8pt tahoma;padding:2px;margin:4px 0px 4px 0px;height:14px\" id=\"" + ID + "_help\"></div>");
        }

        #region Events

        /// <summary>
        /// Moves the selected item to the top.
        /// </summary>
        private void First()
        {
            while (Up())
            {
            }
        }

        /// <summary>
        /// Moves the selected item one row higher.
        /// </summary>
        /// <returns>Whether a row change has occured.</returns>
        private bool Up()
        {
            if (Disabled)
            {
                return false;
            }

            var selectedItem = ItemsBox.SelectedItem;
            if (selectedItem == null || !selectedItem.Selected)
            {
                return false;
            }

            var num = ItemsBox.Controls.IndexOf(selectedItem);
            if (num == 0)
            {
                return false;
            }

            var str = string.Format("$('{0}').style.position = ($('{0}').style.position == 'relative' ? 'static' : 'relative')", ItemsBox.ID);
            SheerResponse.Eval("scForm.browser.swapNode(scForm.browser.getControl('" + selectedItem.ID + "'), scForm.browser.getControl('" + selectedItem.ID + "').previousSibling);" + str);

            ItemsBox.Controls.Remove(selectedItem);
            ItemsBox.Controls.AddAt(num - 1, selectedItem);

            SetModified();
            return true;
        }

        /// <summary>
        /// Moves the seleced item one row lower.
        /// </summary>
        /// <returns>Whether a row change has occured.</returns>
        private bool Down()
        {
            if (Disabled)
            {
                return false;
            }

            var selectedItem = ItemsBox.SelectedItem;
            if (selectedItem == null || !selectedItem.Selected)
            {
                return false;
            }

            var loc = ItemsBox.Controls.IndexOf(selectedItem);
            if (loc == ItemsBox.Controls.Count - 1)
            {
                return false;
            }

            ItemsBox.Controls.Remove(selectedItem);
            ItemsBox.Controls.AddAt(loc + 1, selectedItem);

            var str = string.Format("$('{0}').style.position = ($('{0}').style.position == 'relative' ? 'static' : 'relative')", ItemsBox.ID);
            SheerResponse.Eval("scForm.browser.swapNode(scForm.browser.getControl('" + selectedItem.ID + "'), scForm.browser.getControl('" + selectedItem.ID + "').nextSibling);" + str);

            SetModified();
            return true;
        }

        /// <summary>
        /// Moves the selected item to the bottom.
        /// </summary>
        private void Last()
        {
            while (Down())
            {
            }
        }

        /// <summary>
        /// Opens a new content editor with the selected item highlighted.
        /// </summary>
        private void Goto()
        {
            var listItem = ItemsBox.SelectedItem;
            if (listItem == null)
            {
                return;
            }

            if (!Sitecore.Data.ID.TryParse(listItem.Value, out ID itemId))
            {
                return;
            }

            var item = Sitecore.Context.ContentDatabase.GetItem(itemId);
            if (item == null)
            {
                return;
            }

            var parameters = new UrlString();
            parameters.Add("id", item.ID.ToString());
            parameters.Add("fo", item.ID.ToString());
            Sitecore.Shell.Framework.Windows.RunApplication("Content Editor", parameters.ToString());
        }

        #endregion

        #region Methods

        /// <summary>
        /// Synching the values from the control and from the source.
        /// </summary>
        private void SyncControlAndSourceItems()
        {
            var item = GetDb().GetItem(Sitecore.Data.ID.Parse(ItemId), GetCurrentItemLanguage());
            var unifiedItemsList = orderedListItemsManager.GetOrderedItemIds(Value, Source, item);
            SetValue(ItemIdParser.Compose(unifiedItemsList));
            SetModified();
        }

        private Language GetCurrentItemLanguage()
        {
            if (!string.IsNullOrEmpty(ItemLanguage) && Language.TryParse(ItemLanguage, out Language currentLang))
            {
                return currentLang;
            }

            return Sitecore.Context.Language;
        }

        /// <summary>
        /// Populating the items box (list control) with the synched values.
        /// </summary>
        private void FillItemsBox()
        {
            var db = GetDb();
            var language = GetCurrentItemLanguage();
            foreach (var id in ItemIdParser.Parse(Value))
            {
                var listItem = new ListItem { ID = GetUniqueID("I"), Selected = false };
                ItemsBox.Controls.Add(listItem);
                listItem.Value = id.ToString();
                var item = db.GetItem(id, language);

                listItem.Header = GetHeader(item);
                listItem.ToolTip = item.Paths.FullPath;
            }

            SheerResponse.Refresh(ItemsBox);
        }

        private string GetHeader(Item item)
        {
            var splitSource = Source.Split('?');
            if (splitSource.Length <= 1)
            {
                return item.Paths.ContentPath;
            }

            var parameters = HttpUtility.ParseQueryString(splitSource[1]);
            if (!parameters.AllKeys.Contains("header"))
            {
                return item.Paths.ContentPath;
            }

            switch (parameters["header"].ToLower())
            {
                case "displayname":
                    return item.DisplayName;
                case "name":
                    return item.Name;
                case "template":
                    var template = parameters["template"];
                    if (string.IsNullOrEmpty(template))
                    {
                        return item.Paths.ContentPath;
                    }

                    return ApplyHeaderTemplate(item, template);
                default:
                    return item.Paths.ContentPath;
            }
        }

        private string ApplyHeaderTemplate(Item item, string template)
        {
            var regex = new Regex("\\{ancestor\\((\\d*)\\)\\}");
            var header = template;
            if (regex.IsMatch(template))
            {
                var ancestores = item.Axes.GetAncestors();
                if (int.TryParse(regex.Match(template).Groups[1].Value, out var index))
                {
                    index = ancestores.Length - index;
                    var name = ancestores[index]?.DisplayName;
                    if (!string.IsNullOrEmpty(name))
                    {
                        header = regex.Replace(template, name);
                    }
                }
            }

            return header.Replace("{name}", item.DisplayName);
        }

        private Database GetDb()
        {
            return (string.IsNullOrEmpty(DatabaseName) ? Sitecore.Context.ContentDatabase : Factory.GetDatabase(DatabaseName)) ?? Sitecore.Context.ContentDatabase;
        }
        #endregion
    }
}