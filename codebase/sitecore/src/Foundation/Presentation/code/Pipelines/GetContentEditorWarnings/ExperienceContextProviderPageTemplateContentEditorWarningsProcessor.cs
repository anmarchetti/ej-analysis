using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings
{
    [Service]
    public class ExperienceContextProviderPageTemplateContentEditorWarningsProcessor : BaseExperienceContextProviderContentEditorWarningsProcessor
    {
        public ExperienceContextProviderPageTemplateContentEditorWarningsProcessor(IFieldUtilsService pFieldUtils, IDatabaseProvider pDatabaseProvider, IPresentationLogger pLogger)
            : base(pFieldUtils, pDatabaseProvider, pLogger)
        {
        }

        protected override ID[] MatchingTemplateIds => new[] { Constants.TemplateIds.ExperienceContextProviderPageTemplate };

        protected override bool IsRuleItem => true;

        protected override ID GetProviderId(Item contextItem)
        {
            var parentProvider = GetParentProvider(contextItem);
            return parentProvider?.ID ?? ID.Null;
        }

        protected override bool TryGetPageId(Item contextItem, out ID pageId)
        {
            pageId = ID.Null;

            var templateField = contextItem.Fields[Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate];
            if (templateField == null || string.IsNullOrEmpty(templateField.Value))
            {
                return false;
            }

            if (!ID.TryParse(templateField.Value, out pageId))
            {
                return false;
            }

            return true;
        }
    }
}
