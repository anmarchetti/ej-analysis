using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings
{
    [Service]
    public class ExperienceContextProviderContentEditorWarningsProcessor : BaseExperienceContextProviderContentEditorWarningsProcessor
    {
        public ExperienceContextProviderContentEditorWarningsProcessor(IFieldUtilsService pFieldUtils, IDatabaseProvider pDatabaseProvider, IPresentationLogger pLogger)
            : base(pFieldUtils, pDatabaseProvider, pLogger)
        {
        }

        protected override ID[] MatchingTemplateIds => new[] { Constants.TemplateIds.ExperienceContextProvider };

        protected override ID GetProviderId(Item contextItem) => contextItem.ID;
    }
}