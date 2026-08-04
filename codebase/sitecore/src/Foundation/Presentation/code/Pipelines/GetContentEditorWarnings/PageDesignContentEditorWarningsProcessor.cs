using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Pipelines.GetContentEditorWarnings;

namespace easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings
{
    [Service]
    public class PageDesignContentEditorWarningsProcessor : BaseContentEditorWarningProcessor
    {
        private readonly IFieldUtilsService fieldUtilsService;

        public PageDesignContentEditorWarningsProcessor(IFieldUtilsService fieldUtils, IPresentationLogger pLogger)
        {
            fieldUtilsService = fieldUtils;
            Logger = pLogger;
        }

        protected IPresentationLogger Logger { get; }

        protected override ID[] MatchingTemplateIds => new[] { Constants.TemplateIds.PageDesign };

        protected override void ProcessWarning(Item contextItem, GetContentEditorWarningsArgs arguments)
        {
            var field = contextItem.Fields[Constants.Fields.PageDesign.ExperienceContextProviders];
            if (field == null || string.IsNullOrEmpty(field.Value))
            {
                return;
            }

            var providerItems = fieldUtilsService.GetMultilistTargetItems(field.ID, contextItem);
            if (providerItems == null || providerItems.Length == 0)
            {
                return;
            }

            AddNotification("Assigned Experience Context Providers:", providerItems, arguments);
        }
    }
}
