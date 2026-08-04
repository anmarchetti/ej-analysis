using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.UI;
using System.Web.UI.WebControls;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SiteModes.Models.Domain;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.SecurityModel;
using Sitecore.sitecore.admin;

namespace easyJet.Foundation.SiteModes.sitecore.admin
{
    /// <summary>
    /// Class to render Crisis page.
    /// </summary>
    public partial class Crisis : AdminPage
    {
        private const string MasterDatabaseName = "master";
        private const string WebDatabaseName = "web";

        protected override void OnInit(EventArgs args)
        {
            Assert.ArgumentNotNull(args, "arguments");

            var roleName = Settings.GetSetting("SiteModes.CrisisRoleName");

            if (!string.IsNullOrEmpty(roleName) && User.IsInRole(roleName))
            {
                return;
            }

            CheckSecurity(true);
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            var database = GetDatabase(MasterDatabaseName);
            var noMarketingModeSettingsItem = GetNoMarketingModeSettingsItem(database);
            var noMarketingModeSettings = new NoMarketingModeSettings(noMarketingModeSettingsItem);

            HeaderTag.InnerText = noMarketingModeSettings.Title;
            Page.Header.Title = noMarketingModeSettings.Title;

            StagingTitle.InnerText = noMarketingModeSettings.StagingTitle;
            LiveTitle.InnerText = noMarketingModeSettings.LiveTitle;

            PublishToStagingButton.Text = noMarketingModeSettings.StagingButtonText;
            PublishToLiveButton.Text = noMarketingModeSettings.PublishToLiveButtonText;

            SelectingLanguageTitle.InnerHtml = noMarketingModeSettings.SelectingLanguageTitle;
            SelectingLanguageDescription.InnerHtml = noMarketingModeSettings.SelectingLanguageDescription;

            ConfirmChangesCheckBox.Text = noMarketingModeSettings.ConfirmChangesCheckBoxText;

            StagingDescription.InnerText = noMarketingModeSettings.StagingDescription;

            LiveDescription.InnerText = noMarketingModeSettings.LiveDescription;

            SelectedLanguagesStatusTextStaging.InnerText = noMarketingModeSettings.SelectedLanguagesStatusText;
            SelectedLanguagesStatusTextLive.InnerText = noMarketingModeSettings.SelectedLanguagesStatusText;

            var homePagePath = Settings.GetSetting("SiteModes.HomePagePath");

            if (!IsPostBack)
            {
                LanguagesCheckers.DataSource = GetLanguageVersionStates(noMarketingModeSettingsItem, database);
                LanguagesCheckers.DataBind();
            }

            StagingLinks.DataSource = GetVersionedItemLinks(MasterDatabaseName, homePagePath);
            StagingLinks.DataBind();

            LiveLinks.DataSource = GetVersionedItemLinks(WebDatabaseName, homePagePath);
            LiveLinks.DataBind();
        }

        /// <summary>
        /// Publish languages to database which publish button has appropriate database name.
        /// </summary>
        /// <param name="sender">Sender object.</param>
        /// <param name="e">EventArgs object.</param>
        protected void PublishToDatabase(object sender, EventArgs e)
        {
            Database database = null;

            var dbName = ((Button)sender).CommandArgument;

            if (dbName == MasterDatabaseName)
            {
                database = GetDatabase(MasterDatabaseName);

                ConfirmChangesCheckBox.Enabled = true;
            }
            else if (dbName == WebDatabaseName)
            {
                database = GetDatabase(WebDatabaseName);

                ConfirmChangesCheckBox.Enabled = false;
                ConfirmChangesCheckBox.Checked = false;
            }

            if (database != null)
            {
                var noMarketingModeSettingsItem = GetNoMarketingModeSettingsItem(database);

                for (int i = 0; i < LanguagesCheckers.Items.Count; i++)
                {
                    RepeaterItem languageChecker = LanguagesCheckers.Items[i];

                    CheckBox chk = (CheckBox)languageChecker.FindControl("LanguageCheckbox");

                    Item languageVersionedItem = database.GetItem(noMarketingModeSettingsItem.ID, Language.Parse(chk.Attributes["value"]));
                    ChangeNoMarketingModeIsSetCheckbox(languageVersionedItem, chk.Checked);
                }
            }

            Page_Load(sender, e);
        }

        /// <summary>
        /// Bind data to checkbox.
        /// </summary>
        /// <param name="sender">Sender object.</param>
        /// <param name="e">RepeaterItemEventArgs object.</param>
        protected void BindCheckboxData(object sender, RepeaterItemEventArgs e)
        {
            RepeaterItem item = e.Item;

            var modelItem = CastRepeaterItem<LanguageVersionState>(item);

            if (modelItem == null)
            {
                return;
            }

            var checkBox = (CheckBox)item.FindControl("LanguageCheckbox");
            checkBox.Text = modelItem.FullLanguageName;
            checkBox.Attributes["value"] = modelItem.IsoLanguageCode;
        }

        /// <summary>
        /// Bind data to hyper link.
        /// </summary>
        /// <param name="sender">Sender object.</param>
        /// <param name="e">RepeaterItemEventArgs object.</param>
        protected void BindHyperLinkData(object sender, RepeaterItemEventArgs e)
        {
            RepeaterItem item = e.Item;

            var modelItem = CastRepeaterItem<Link>(item);

            if (modelItem == null)
            {
                return;
            }

            var hyperLink = (HyperLink)item.FindControl("Link");
            hyperLink.Text = modelItem.UrlText;
            hyperLink.NavigateUrl = modelItem.Url;
            hyperLink.Target = "_blank";
        }

        /// <summary>
        /// Cast repeater item.
        /// </summary>
        /// <typeparam name="T">Class to cast by.</typeparam>
        /// <param name="item">Repeater item.</param>
        /// <returns>Casted item.</returns>
        private T CastRepeaterItem<T>(RepeaterItem item)
        {
            if (item.ItemType != ListItemType.Item && item.ItemType != ListItemType.AlternatingItem)
            {
                return default(T);
            }

            return (T)item.DataItem;
        }

        /// <summary>
        /// Get language version states.
        /// </summary>
        /// <returns>Return language version states.</returns>
        private IEnumerable<LanguageVersionState> GetLanguageVersionStates(Item noMarketingModeSettingsItem, Database database)
        {
            if (noMarketingModeSettingsItem != null)
            {
                var languageVersionStates = new List<LanguageVersionState>();

                foreach (Language language in noMarketingModeSettingsItem.Languages)
                {
                    Item languageVersionedItem = database.GetItem(noMarketingModeSettingsItem.ID, language);

                    if (languageVersionedItem.Versions.Count > 0)
                    {
                        languageVersionStates.Add(new LanguageVersionState(languageVersionedItem));
                    }
                }

                return languageVersionStates;
            }

            return Enumerable.Empty<LanguageVersionState>();
        }

        /// <summary>
        /// Get versioned item links.
        /// </summary>
        /// <param name="databaseName">Database name.</param>
        /// <param name="itemPath">Item path.</param>
        /// <returns>Collection of Links.</returns>
        private IEnumerable<Link> GetVersionedItemLinks(string databaseName, string itemPath)
        {
            var database = GetDatabase(databaseName);
            var noMarketingModeSettingsItem = GetNoMarketingModeSettingsItem(database);
            var liveSiteUrl = Settings.GetSetting("SiteModes.LiveSiteUrl");

            if (noMarketingModeSettingsItem != null)
            {
                var linksToItem = new List<Link>();

                foreach (Language language in noMarketingModeSettingsItem.Languages)
                {
                    Item languageVersionedItem = database.GetItem(noMarketingModeSettingsItem.ID, language);

                    if (languageVersionedItem.Versions.Count > 0)
                    {
                        CheckboxField field = languageVersionedItem.Fields[Constants.Fields.NoMarketingModeSettings.NoMarketingModeIsSet];
                        if (field != null && field.Checked)
                        {
                            var item = database.GetItem(itemPath, language);

                            if (item.Versions.Count > 0)
                            {
                                if (databaseName == MasterDatabaseName)
                                {
                                    linksToItem.Add(new Link(item.GetPagePreviewUrl(), language.CultureInfo.EnglishName));
                                }
                                else if (databaseName == WebDatabaseName)
                                {
                                    linksToItem.Add(new Link(liveSiteUrl.Replace("{language}", language.Name), language.CultureInfo.EnglishName));
                                }
                            }
                        }
                    }
                }

                return linksToItem;
            }

            return Enumerable.Empty<Link>();
        }

        /// <summary>
        /// Set new value to ChangeNoMarketingModeIsSet.
        /// </summary>
        /// <param name="item">Item to change value.</param>
        /// <param name="languageChecked">Language version.</param>
        private void ChangeNoMarketingModeIsSetCheckbox(Item item, bool languageChecked)
        {
            using (new SecurityDisabler())
            {
                item.Editing.BeginEdit();
                item[Constants.Fields.NoMarketingModeSettings.NoMarketingModeIsSet] = languageChecked ? Constants.Common.CheckboxTrueValue
                    : Constants.Common.CheckboxFalseValue;
                item.Editing.EndEdit();
            }
        }

        /// <summary>
        /// Return sitecore database by database name.
        /// </summary>
        /// <param name="databaseName">Database name.</param>
        /// <returns>Sitecore database name.</returns>
        private Database GetDatabase(string databaseName)
        {
            return Factory.GetDatabase(databaseName);
        }

        /// <summary>
        /// Get NoMarketingModeSettings item.
        /// </summary>
        /// <param name="database">Sitecore database object.</param>
        /// <returns>Return NoMarketingModeSettings item.</returns>
        private Item GetNoMarketingModeSettingsItem(Database database)
        {
            var noMarketingModeSettingsItem = database.GetItem(Settings.GetSetting("SiteModes.NoMarketingModeSettings"));

            return noMarketingModeSettingsItem;
        }
    }
}