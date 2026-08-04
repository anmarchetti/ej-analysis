using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings
{
    [Service]
    public class ExperienceContextProviderPageContentEditorWarningsProcessor : BaseExperienceContextProviderContentEditorWarningsProcessor
    {
        private readonly IPageTemplateResolverService pageTemplateResolver;

        public ExperienceContextProviderPageContentEditorWarningsProcessor(
            IFieldUtilsService pFieldUtils,
            IDatabaseProvider pDatabaseProvider,
            IPresentationLogger pLogger,
            IPageTemplateResolverService pPageTemplateResolver)
            : base(pFieldUtils, pDatabaseProvider, pLogger)
        {
            pageTemplateResolver = pPageTemplateResolver;
        }

        protected override ID[] MatchingTemplateIds => new[] { Constants.TemplateIds.ExperienceContextProviderPage };

        protected override bool IsRuleItem => true;

        protected override ID GetProviderId(Item contextItem)
        {
            var parentProvider = GetParentProvider(contextItem);
            return parentProvider?.ID ?? ID.Null;
        }

        protected override bool TryGetPageId(Item contextItem, out ID pageId)
        {
            pageId = ID.Null;

            var pageField = contextItem.Fields[Constants.Fields.ExperienceContextProviderPage.Page];
            if (pageField == null || string.IsNullOrEmpty(pageField.Value))
            {
                return false;
            }

            if (!ID.TryParse(pageField.Value, out var pageItemId))
            {
                return false;
            }

            var templateId = pageTemplateResolver.ResolveTemplateId(pageItemId, DatabaseType.Content);
            if (ID.IsNullOrEmpty(templateId))
            {
                return false;
            }

            pageId = templateId;
            return true;
        }
    }
}