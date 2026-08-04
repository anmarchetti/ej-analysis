using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using PresentationConstants = easyJet.Foundation.Presentation.Constants;

namespace easyJet.Feature.SitecoreEnhancment.Commands
{
    public class ResolveAllowedRenderingsCommand
        : BaseCommand
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IRenderingIdExtractionService renderingIdExtractionService;
        private readonly ISheerUiService sheerUiService;
        private readonly ISitecoreUIService sitecoreUiService;

        public ResolveAllowedRenderingsCommand(
            IDatabaseProvider pDatabaseProvider,
            ISheerUiService pSheerUiService,
            ISitecoreUIService pSitecoreUiService,
            IRenderingIdExtractionService pRenderingIdExtractionService)
        {
            databaseProvider = pDatabaseProvider;
            sheerUiService = pSheerUiService;
            sitecoreUiService = pSitecoreUiService;
            renderingIdExtractionService = pRenderingIdExtractionService;
        }

        protected override bool IsCommandContextValid(CommandContext context)
        {
            var item = GetContextItem(context);
            return item != null &&
                   (item.TemplateID == PresentationConstants.TemplateIds.ExperienceContextProviderPage ||
                    item.TemplateID == PresentationConstants.TemplateIds.ExperienceContextProviderPageTemplate);
        }

        protected override void ExecuteJob(ClientPipelineArgs args)
        {
            if (!ID.TryParse(args.Parameters["id"], out var id))
            {
                sheerUiService.Alert("SourceId not set.");
                return;
            }

            if (!Language.TryParse(args.Parameters["language"], out var language))
            {
                sheerUiService.Alert("SourceLanguage not set.");
                return;
            }

            var item = databaseProvider.GetItem(id, language, DatabaseType.Master);
            if (item == null)
            {
                sheerUiService.Alert("No context item found.");
                return;
            }

            if (item.TemplateID == PresentationConstants.TemplateIds.ExperienceContextProviderPageTemplate)
            {
                ExecuteJobCore(
                    item,
                    args,
                    PresentationConstants.Fields.ExperienceContextProviderPageTemplate.PageTemplate,
                    PresentationConstants.Fields.ExperienceContextProviderPageTemplate.AllowedRenderings,
                    "The 'Page Template' field is empty. Please select a template in the 'Page Template' field before clicking 'Resolve Allowed Renderings'.",
                    "The 'Page Template' field does not contain a valid template ID. Please select a valid template.",
                    renderingIdExtractionService.ExtractFromTemplateId);
            }
            else
            {
                ExecuteJobCore(
                    item,
                    args,
                    PresentationConstants.Fields.ExperienceContextProviderPage.Page,
                    PresentationConstants.Fields.ExperienceContextProviderPage.AllowedRenderings,
                    "The 'Page' field is empty. Please select a page in the 'Page' field before clicking 'Resolve Allowed Renderings'.",
                    "The 'Page' field does not contain a valid item ID. Please select a valid page.",
                    renderingIdExtractionService.ExtractFromItemId);
            }
        }

        protected virtual void WriteAllowedRenderings(Item item, HashSet<ID> renderingIds, ID allowedRenderingsFieldId)
        {
            var pipeSeparated = string.Join("|", databaseProvider.GetExistingItemIds(renderingIds, DatabaseType.Master).Select(id => id.ToString()));

            using (new EditContext(item))
            {
                item.Fields[allowedRenderingsFieldId].Value = pipeSeparated;
            }
        }

        private static Item GetContextItem(CommandContext context)
            => context?.Items?.FirstOrDefault();

        private void ExecuteJobCore(
            Item item,
            ClientPipelineArgs args,
            ID sourceFieldId,
            ID allowedRenderingsFieldId,
            string emptyFieldAlert,
            string invalidIdAlert,
            Func<ID, HashSet<ID>> extractRenderingIds)
        {
            var fieldValue = item.Fields[sourceFieldId]?.Value;
            if (string.IsNullOrWhiteSpace(fieldValue))
            {
                sheerUiService.Alert(emptyFieldAlert);
                return;
            }

            if (!ID.TryParse(fieldValue, out var fieldId))
            {
                sheerUiService.Alert(invalidIdAlert);
                return;
            }

            var renderingIds = extractRenderingIds(fieldId);
            WriteAllowedRenderings(item, renderingIds, allowedRenderingsFieldId);

            var allowedRenderingsValue = item.Fields[allowedRenderingsFieldId]?.Value ?? string.Empty;
            var count = string.IsNullOrEmpty(allowedRenderingsValue)
                ? 0
                : allowedRenderingsValue.Split('|').Count(s => ID.IsID(s));

            sitecoreUiService.ClientPage_SendMessage(this, $"item:load(id={args.Parameters["id"]})");
            sheerUiService.Alert($"Resolved {count} rendering(s) and saved them to 'Allowed Renderings'.");
        }
    }
}
