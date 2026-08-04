using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Pipelines.GetContentEditorWarnings;

namespace easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings
{
    /// <summary>
    /// Shows an informational Content Editor warning on a content page listing the page design(s) resolved for it:
    /// the standard (no-ecp) design and, when present, one link per Experience Context Provider — all resolved
    /// through <see cref="IPageDesignRepository"/> so the warning mirrors live rendering exactly.
    /// </summary>
    [Service]
    public class AssignedPageDesignContentEditorWarningsProcessor : BaseContentEditorWarningProcessor
    {
        private readonly IPageDesignRepository pageDesignRepository;

        public AssignedPageDesignContentEditorWarningsProcessor(IPageDesignRepository pPageDesignRepository)
        {
            pageDesignRepository = pPageDesignRepository;
        }

        protected override ID[] MatchingTemplateIds => Array.Empty<ID>();

        protected override bool IsMatch(Item item) => item.HasBaseTemplate(new TemplateID(Constants.TemplateIds.BasePage));

        protected override void ProcessWarning(Item contextItem, GetContentEditorWarningsArgs arguments)
        {
            var matches = pageDesignRepository.GetMatchingPageDesigns(contextItem);
            if (matches.Count == 0)
            {
                return;
            }

            var standard = matches.FirstOrDefault(match => !match.HasExperienceContextProvider);
            var providerMatches = matches.Where(match => match.HasExperienceContextProvider).ToList();

            if (providerMatches.Count == 0)
            {
                if (standard != null)
                {
                    AddNotification("Assigned Page Designs:", new[] { standard.PageDesign }, arguments);
                }

                return;
            }

            var options = new List<Pair<string, Item>>();
            if (standard != null)
            {
                options.Add(new Pair<string, Item>($"{standard.PageDesign.DisplayName}", standard.PageDesign));
            }

            foreach (var providerMatch in providerMatches)
            {
                var label = $" {providerMatch.PageDesign.DisplayName}{FormatProviderPostFix(contextItem.Database, providerMatch.ExperienceContextProviderId)}";
                options.Add(new Pair<string, Item>(label, providerMatch.PageDesign));
            }

            AddNotification("Assigned Page Designs:", options, arguments);
        }

        private static string FormatProviderPostFix(Database database, ID providerId)
        {
            var identifier = database.GetItem(providerId)?.Fields[Constants.Fields.ExperienceContextProvider.Identifier]?.Value;
            return string.IsNullOrWhiteSpace(identifier) ? string.Empty : $"  ->  {identifier}";
        }
    }
}
