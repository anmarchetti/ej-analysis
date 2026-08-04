using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Services
{
    [Service(typeof(IPushCloneCoordinatorService), Lifetime = Lifetime.Singleton)]
    public class DelegatedAreaCoordinatorService : IPushCloneCoordinatorService
    {
        private readonly IDelegatedAreaService delegatedAreaService;
        private readonly BaseTemplateManager templateManager;

        public DelegatedAreaCoordinatorService(BaseTemplateManager templateManager, IDelegatedAreaService delegatedAreaService)
        {
            this.templateManager = templateManager;
            this.delegatedAreaService = delegatedAreaService;
        }

        /// <inheritdoc/>
        public bool ShouldProcess(Item clone) => delegatedAreaService.CheckForDelegatedArea(clone) && IsPage(clone);

        /// <inheritdoc/>
        public bool IsPage(Item item)
        {
            if (item == null)
            {
                return false;
            }

            var template = templateManager.GetTemplate(item);
            return template != null && template.InheritsFrom(new TemplateID(Templates.BasePage.ID));
        }
    }
}
