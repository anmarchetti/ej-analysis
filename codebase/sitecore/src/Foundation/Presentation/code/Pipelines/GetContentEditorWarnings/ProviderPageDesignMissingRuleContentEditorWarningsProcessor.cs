using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Pipelines.GetContentEditorWarnings;

namespace easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings
{
    /// <summary>
    /// Warns, in the Content Editor, when a page matches a provider-bound page design (by template and RootItem)
    /// but the bound Experience Context Provider has no page rule for either the page's template or the page itself.
    /// This is a pure configuration check (does a matching rule exist?), independent of runtime activation — the
    /// provider design can never activate for such a page, so the binding is silently dead and almost certainly a
    /// mis-configuration.
    /// </summary>
    [Service]
    public class ProviderPageDesignMissingRuleContentEditorWarningsProcessor : BaseContentEditorWarningProcessor
    {
        private readonly IPageDesignRepository pageDesignRepository;
        private readonly IFieldUtilsService fieldUtilsService;

        public ProviderPageDesignMissingRuleContentEditorWarningsProcessor(
            IPageDesignRepository pPageDesignRepository,
            IFieldUtilsService pFieldUtilsService)
        {
            pageDesignRepository = pPageDesignRepository;
            fieldUtilsService = pFieldUtilsService;
        }

        protected override ID[] MatchingTemplateIds => Array.Empty<ID>();

        protected override bool IsMatch(Item item) => item.HasBaseTemplate(new TemplateID(Constants.TemplateIds.BasePage));

        protected override void ProcessWarning(Item contextItem, GetContentEditorWarningsArgs arguments)
        {
            var providerMatches = pageDesignRepository.GetMatchingPageDesigns(contextItem)
                .Where(match => match.HasExperienceContextProvider);

            var unconfigured = new List<Pair<string, Item>>();
            foreach (var match in providerMatches)
            {
                var providerItem = contextItem.Database.GetItem(match.ExperienceContextProviderId);
                if (providerItem == null)
                {
                    continue;
                }

                var identifier = providerItem.Fields[Constants.Fields.ExperienceContextProvider.Identifier]?.Value;
                if (string.IsNullOrWhiteSpace(identifier))
                {
                    continue;
                }

                if (!ProviderHasRuleForPage(providerItem, contextItem))
                {
                    var label =
                        $"{match.PageDesign.DisplayName}  ->  {identifier}  (provider has no page rule for this template or item; design will not activate)";
                    unconfigured.Add(new Pair<string, Item>(label, providerItem));
                }
            }

            AddWarning("Provider page design without matching provider configuration:", unconfigured, arguments);
        }

        /// <summary>
        /// Pure configuration check: does the provider reference a page rule (in its Pages field) that targets this
        /// page item, or a page-template rule that targets this page's template? Read from the item's own database,
        /// so it reflects the authored configuration regardless of the (request-bound) runtime activation state.
        /// </summary>
        private bool ProviderHasRuleForPage(Item provider, Item contextItem)
        {
            var ruleItems = fieldUtilsService.GetMultilistTargetItems(Constants.Fields.ExperienceContextProvider.Pages, provider);
            if (ruleItems == null)
            {
                return false;
            }

            foreach (var rule in ruleItems.Where(r => r != null))
            {
                if (rule.TemplateID == Constants.TemplateIds.ExperienceContextProviderPage
                    && ID.TryParse(rule[Constants.Fields.ExperienceContextProviderPage.Page], out var pageId)
                    && pageId.Equals(contextItem.ID))
                {
                    return true;
                }

                if (rule.TemplateID == Constants.TemplateIds.ExperienceContextProviderPageTemplate
                    && ID.TryParse(rule[Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate], out var templateId)
                    && templateId.Equals(contextItem.TemplateID))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
