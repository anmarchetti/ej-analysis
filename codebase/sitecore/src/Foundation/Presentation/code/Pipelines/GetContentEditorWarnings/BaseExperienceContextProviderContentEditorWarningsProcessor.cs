using System;
using System.Linq;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.JavaScriptServices.Core.Extensions;
using Sitecore.Pipelines.GetContentEditorWarnings;

namespace easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings
{
    public abstract class BaseExperienceContextProviderContentEditorWarningsProcessor : BaseContentEditorWarningProcessor
    {
        private readonly IFieldUtilsService fieldUtilsService;

        protected BaseExperienceContextProviderContentEditorWarningsProcessor(IFieldUtilsService fieldUtils, IDatabaseProvider pDatabaseProvider, IPresentationLogger pLogger)
        {
            DatabaseProvider = pDatabaseProvider;
            Logger = pLogger;
            fieldUtilsService = fieldUtils;
        }

        protected IPresentationLogger Logger { get; }

        private IDatabaseProvider DatabaseProvider { get; }

        protected static Item GetParentProvider(Item contextItem)
        {
            var parentProvider = contextItem.GetAncestorOrSelfOfTemplate(Constants.TemplateIds.ExperienceContextProvider);
            if (parentProvider == null || parentProvider.TemplateID != Constants.TemplateIds.ExperienceContextProvider)
            {
                return null;
            }

            return parentProvider;
        }

        protected abstract ID GetProviderId(Item contextItem);

        /// <summary>
        /// Gets a value indicating whether when <c>true</c>, the processor also warns about broken wiring of the context item as a provider rule
        /// (not selected in the provider's Pages field, or the provider not being active). Only meaningful for the
        /// rule items (page / page-template), not for the provider item itself; defaults to <c>false</c>.
        /// </summary>
        protected virtual bool IsRuleItem => false;

        protected virtual bool TryGetPageId(Item contextItem, out ID pageId)
        {
            pageId = ID.Null;
            return false;
        }

        protected override void ProcessWarning(Item contextItem, GetContentEditorWarningsArgs arguments)
        {
            var providerId = GetProviderId(contextItem);
            if (ID.IsNullOrEmpty(providerId))
            {
                return;
            }

            if (IsRuleItem)
            {
                var provider = contextItem.Database.GetItem(providerId);
                WarnIfRuleNotSelectedInProvider(contextItem, provider, arguments);
                WarnIfProviderNotActive(contextItem, provider, arguments);
            }

            var designs = TryGetPageId(contextItem, out var pageId)
                ? GetAssignedPageDesigns(providerId, pageId)
                : GetAssignedPageDesigns(providerId);

            AddNotification(designs, arguments);
        }

        protected Item[] GetAssignedPageDesigns(ID providerId)
        => GetAllPageDesigns()
                .Where(design => fieldUtilsService.GetMultilistTargetIds(Constants.Fields.PageDesign.ExperienceContextProviders, design).Contains(providerId)).ToArray();

        protected void AddNotification(Item[] items, GetContentEditorWarningsArgs arguments)
            => AddNotification("Assigned Page Designs:", items, arguments);

        /// <summary>
        /// Warns when the rule item is not selected in its parent provider's Pages field. The provider only reads
        /// rules referenced by that field, so an unreferenced rule is dead configuration and is silently ignored.
        /// </summary>
        private void WarnIfRuleNotSelectedInProvider(Item ruleItem, Item provider, GetContentEditorWarningsArgs arguments)
        {
            if (provider == null)
            {
                return;
            }

            var selectedRuleIds = fieldUtilsService.GetMultilistTargetIds(Constants.Fields.ExperienceContextProvider.Pages, provider);
            if (selectedRuleIds != null && selectedRuleIds.Contains(ruleItem.ID))
            {
                return;
            }

            AddWarning(
                "This rule is not selected in the provider's Pages field and will be ignored:",
                new[] { new Pair<string, Item>($"Add \"{ruleItem.DisplayName}\" to \"{provider.DisplayName}\".Pages", provider) },
                arguments);
        }

        /// <summary>
        /// Warns when the parent provider is not listed in the ECP settings' Active Providers field. An inactive
        /// provider is never evaluated at render time, so none of its rules (including this one) take effect.
        /// </summary>
        private void WarnIfProviderNotActive(Item ruleItem, Item provider, GetContentEditorWarningsArgs arguments)
        {
            if (provider == null)
            {
                return;
            }

            var settingsRoot = ruleItem.Database.GetItem(Constants.ItemIds.ExperienceContextProvidersSettingsRoot);
            if (settingsRoot == null)
            {
                return;
            }

            var activeProviderIds = fieldUtilsService.GetMultilistTargetIds(Constants.Fields.ExperienceContextProviders.ActiveProviders, settingsRoot);
            if (activeProviderIds != null && activeProviderIds.Contains(provider.ID))
            {
                return;
            }

            AddWarning(
                "The parent provider is not configured in Active Providers and will be ignored:",
                new[] { new Pair<string, Item>($"Add \"{provider.DisplayName}\" to Active Providers", settingsRoot) },
                arguments);
        }

        private Item[] GetAssignedPageDesigns(ID providerId, ID pageId)
        {
            return GetAssignedPageDesigns(providerId)
                .Where(design => fieldUtilsService.GetMultilistTargetIds(Constants.Fields.PageDesign.PageTemplates, design).Contains(pageId)).ToArray();
        }

        private Item[] GetAllPageDesigns()
        {
            var database = DatabaseProvider.GetDatabase(DatabaseType.Content)
                           ?? DatabaseProvider.GetDatabase(DatabaseType.Master);
            var designsRoot = database?.GetItem(Constants.ItemIds.PageDesignsRoot);
            if (designsRoot == null)
            {
                return Array.Empty<Item>();
            }

            return designsRoot.Axes.GetDescendants();
        }
    }
}