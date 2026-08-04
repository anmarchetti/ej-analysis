using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Web.Security.AntiXss;
using System.Web.UI.HtmlControls;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.Shell.Applications.ContentManager.Galleries;
using Sitecore.Web;
using Sitecore.Web.UI.HtmlControls;
using Sitecore.Web.UI.Sheer;
using Sitecore.Web.UI.XmlControls;

namespace easyJet.Feature.SitecoreEnhancment.ContentManager
{
    /// <summary>
    /// Version Names gallery.
    /// </summary>
    public class GalleryVersionNamesForm : GalleryForm
    {
        private const string VersionOptionControl = "Gallery.Versions.Option";
        private const string VersionNameRulesSettingsPath = "VersionNames.SettingsPath";
        private const string RulesOrderedListFieldName = "Rules";
        private const string RuleTemplatesFieldName = "Templates";
        private const string RuleFieldReferencesFieldName = "Fields";
#pragma warning disable S2933 // Assigned by Sitecore Sheer UI control binding
        private Scrollbox versions = null;
#pragma warning restore S2933

        /// <inheritdoc/>
        public override void HandleMessage(Message message)
        {
            Assert.ArgumentNotNull(message, nameof(message));
            if (message.Name != "event:click")
            {
                InvokeGallery(message);
            }
        }

        /// <inheritdoc/>
        protected override void OnLoad(EventArgs e)
        {
            Assert.ArgumentNotNull(e, nameof(e));
            base.OnLoad(e);
            Assert.IsNotNull(versions, nameof(versions));
            LoadGalleryItems();
        }

        protected virtual void InvokeGallery(Message message) => Invoke(message, closeGallery: true);

        protected virtual void LoadGalleryItems()
        {
            if (IsClientPageEvent())
            {
                return;
            }

            var currentItem = GetCurrentItemFromRequest();
            if (currentItem != null)
            {
                if (currentItem.IsFallback)
                {
                    AddFallbackInfo(currentItem);
                }
                else
                {
                    RenderVersionOptions(currentItem);
                }
            }
        }

        protected virtual bool IsClientPageEvent() => Context.ClientPage.IsEvent;

        protected virtual Item GetCurrentItemFromRequest() => GetCurrentItem();

        protected virtual XmlControl CreateVersionOptionControl() => ControlFactory.GetControl(VersionOptionControl) as XmlControl;

        protected virtual CultureInfo GetUserCulture() => Context.User.Profile.Culture;

        protected virtual void AddControl(System.Web.UI.Control control) => Context.ClientPage.AddControl(versions, control);

        private static Item GetCurrentItem()
        {
            var databaseName = WebUtil.GetQueryString("db");
            var itemId = WebUtil.GetQueryString("id");
            var language = Language.Parse(WebUtil.GetQueryString("la"));
            var version = Sitecore.Data.Version.Parse(WebUtil.GetQueryString("vs"));
            var database = Factory.GetDatabase(databaseName);
            Assert.IsNotNull(database, databaseName);
            return database.Items[itemId, language, version];
        }

        private static IReadOnlyList<(HashSet<ID> TemplateIds, IReadOnlyList<ID> FieldIds)> GetTitleRules(Database database)
        {
            Assert.ArgumentNotNull(database, nameof(database));

            var rulesPath = Settings.GetSetting(VersionNameRulesSettingsPath);
            if (string.IsNullOrWhiteSpace(rulesPath))
            {
                return Array.Empty<(HashSet<ID> TemplateIds, IReadOnlyList<ID> FieldIds)>();
            }

            var rulesRoot = database.GetItem(rulesPath);
            if (rulesRoot == null)
            {
                return Array.Empty<(HashSet<ID> TemplateIds, IReadOnlyList<ID> FieldIds)>();
            }

            var rules = new List<(HashSet<ID> TemplateIds, IReadOnlyList<ID> FieldIds)>();
            foreach (var rule in GetOrderedRules(rulesRoot))
            {
                var fieldReferencesRawValue = rule[RuleFieldReferencesFieldName];
                var fieldIds = string.IsNullOrWhiteSpace(fieldReferencesRawValue)
                    ? new List<ID>()
                    : fieldReferencesRawValue
                        .Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries)
                        .Select(ParseTemplateId)
                        .Where(fieldId => fieldId != ID.Null)
                        .ToList();

                if (fieldIds.Count == 0)
                {
                    continue;
                }

                var templateValues = rule[RuleTemplatesFieldName];
                var templates = string.IsNullOrWhiteSpace(templateValues)
                    ? new HashSet<ID>()
                    : new HashSet<ID>(
                        templateValues
                            .Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries)
                            .Select(ParseTemplateId)
                            .Where(templateId => templateId != ID.Null));

                rules.Add((templates, fieldIds));
            }

            return rules;
        }

        private static IEnumerable<Item> GetOrderedRules(Item rulesRoot)
        {
            Assert.ArgumentNotNull(rulesRoot, nameof(rulesRoot));

            var rulesOrderRawValue = rulesRoot.Fields[RulesOrderedListFieldName]?.Value ?? string.Empty;

            return rulesOrderRawValue
                .Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(ParseTemplateId)
                .Where(ruleId => ruleId != ID.Null)
                .Select(ruleId => rulesRoot.Database.GetItem(ruleId))
                .Where(rule => rule != null);
        }

        private static IReadOnlyList<ID> ResolveTitleFieldIds(ID templateId, IReadOnlyList<(HashSet<ID> TemplateIds, IReadOnlyList<ID> FieldIds)> rules)
        {
            if (rules == null || rules.Count == 0)
            {
                return Array.Empty<ID>();
            }

            foreach (var rule in rules)
            {
                var appliesToAllTemplates = rule.TemplateIds.Count == 0;
                if (appliesToAllTemplates || rule.TemplateIds.Contains(templateId))
                {
                    return rule.FieldIds;
                }
            }

            return Array.Empty<ID>();
        }

        private static string GetTitleFromField(Item item, ID fieldId)
        {
            Assert.ArgumentNotNull(item, nameof(item));
            if (ID.IsNullOrEmpty(fieldId))
            {
                return null;
            }

            var field = item.Fields[fieldId];
            if (field == null || string.IsNullOrWhiteSpace(field.Value))
            {
                return field?.Value;
            }

            ID[] referencedItemIds = null;
            if (!field.Value.Contains("|"))
            {
                ReferenceField referenceField = field;
                if (referenceField != null && !ID.IsNullOrEmpty(referenceField.TargetID))
                {
                    referencedItemIds = new[] { referenceField.TargetID };
                }
            }

            if (referencedItemIds == null)
            {
                MultilistField multiField = field;
                if (multiField != null)
                {
                    referencedItemIds = multiField.TargetIDs;
                }
            }

            if (referencedItemIds == null || referencedItemIds.Length == 0)
            {
                return field.Value;
            }

            var referencedItemNames = referencedItemIds
                .Select(item.Database.GetItem)
                .Where(referencedItem => referencedItem != null)
                .Select(referencedItem => referencedItem.Name)
                .ToArray();

            if (referencedItemNames.Length == 0)
            {
                return field.Value;
            }

            return string.Join(", ", referencedItemNames);
        }

        private static ID ParseTemplateId(string rawTemplateId)
        {
            if (ID.TryParse(rawTemplateId, out var parsedId))
            {
                return parsedId;
            }

            return ID.Null;
        }

        private static string ResolveTitle(Item item, IReadOnlyList<ID> titleFieldIds)
        {
            Assert.ArgumentNotNull(item, nameof(item));

            if (titleFieldIds != null)
            {
                foreach (var titleFieldId in titleFieldIds)
                {
                    var title = GetTitleFromField(item, titleFieldId);
                    if (!string.IsNullOrWhiteSpace(title))
                    {
                        return title;
                    }
                }
            }

            return Translate.Text("[Not set]");
        }

        private static string ResolveModifiedAt(Item item, CultureInfo culture)
        {
            Assert.ArgumentNotNull(item, nameof(item));
            Assert.ArgumentNotNull(culture, nameof(culture));

            if (item.Statistics.Updated == DateTime.MinValue)
            {
                return Translate.Text("[Not set]");
            }

            return DateUtil.FormatShortDateTime(DateUtil.ToServerTime(item.Statistics.Updated), culture);
        }

        private static string ResolveUpdatedBy(Item item)
        {
            Assert.ArgumentNotNull(item, nameof(item));
            if (string.IsNullOrWhiteSpace(item.Statistics.UpdatedBy))
            {
                return "-";
            }

            return item.Statistics.UpdatedBy;
        }

        private static string BuildVersionText(int versionNumber, int currentVersionNumber)
        {
            var versionText = $"{versionNumber}.";
            if (versionNumber != currentVersionNumber)
            {
                return $"<div class=\"versionNum\">{versionText}</div>";
            }

            return $"<div class=\"versionNumSelected\">{versionText}</div>";
        }

        private static string BuildHeader(string title, string modifiedAt, string updatedBy)
        {
            var encodedTitle = AntiXssEncoder.HtmlEncode(title, useNamedEntities: true);
            return Translate.Text(
                "<b title=\"{0}\"><span title=\"{0}\">{0}</span></b><br/>Modified <b>{1}</b> by <b>{2}</b>.",
                encodedTitle,
                modifiedAt,
                AntiXssEncoder.HtmlEncode(updatedBy, useNamedEntities: true));
        }

        private void AddFallbackInfo(Item currentItem)
        {
            var fallbackInfo = new HtmlGenericControl("div")
            {
                InnerText = Translate.Text("No version exists in the current language. You see a fallback version from '{0}' language.", currentItem.OriginalLanguage),
            };

            fallbackInfo.Attributes["class"] = "versionNumSelected";
            AddControl(fallbackInfo);
        }

        private void RenderVersionOptions(Item currentItem)
        {
            var titleRules = GetTitleRules(currentItem.Database);
            var titleFieldIds = ResolveTitleFieldIds(currentItem.TemplateID, titleRules);
            var itemVersions = currentItem.Versions.GetVersions();
            for (var index = itemVersions.Length - 1; index >= 0; index--)
            {
                var item = itemVersions[index];
                var xmlControl = CreateVersionOptionControl();
                Assert.IsNotNull(xmlControl, typeof(XmlControl), "Xml Control \"{0}\" not found", VersionOptionControl);
                AddControl(xmlControl);

                var culture = GetUserCulture();
                var modifiedAt = ResolveModifiedAt(item, culture);
                var updatedBy = ResolveUpdatedBy(item);
                var title = ResolveTitle(item, titleFieldIds);
                var versionText = BuildVersionText(item.Version.Number, currentItem.Version.Number);

                xmlControl["Number"] = versionText;
                xmlControl["Header"] = BuildHeader(title, modifiedAt, updatedBy);
                xmlControl["Click"] = $"item:load(id={currentItem.ID},language={currentItem.Language},version={item.Version.Number})";
            }
        }
    }
}