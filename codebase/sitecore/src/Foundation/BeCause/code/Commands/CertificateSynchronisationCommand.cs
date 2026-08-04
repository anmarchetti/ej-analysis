using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Models;
using easyJet.Foundation.BeCause.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.BeCause.Commands
{
    [ExcludeFromCodeCoverage]
    public class CertificateSynchronisationCommand : BaseProgressReportingContextMenuCommand<CertificationSynchronisationResult>
    {
        private readonly ICertificationSynchronisationService certificationSynchronisationService;

        private readonly ISettingsService settingsService;

        public CertificateSynchronisationCommand(
            IDatabaseProvider databaseProvider,
            IBeCauseLogger logger,
            ICertificationSynchronisationService certificationSynchronisationService,
            ISettingsService settingsService,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.certificationSynchronisationService = certificationSynchronisationService;
            this.settingsService = settingsService;
        }

        protected override string CommandTitle => "Eco Certificate Synchronization";

        protected override HashSet<ID> AllowedTemplates => new HashSet<ID>()
        {
            Constants.TemplateIds.Destinations
        };

        protected override bool IsCommandContextValid(CommandContext context)
            => settingsService.GetSettings().IsEnabled && base.IsCommandContextValid(context);

        protected override IEnumerable<CertificationSynchronisationResult> ProcessItems(Item contextItem, ClientPipelineArgs args)
            => certificationSynchronisationService.Synchronize(contextItem.Paths.Path);

        protected override string GetFinalStatusMessage(List<CertificationSynchronisationResult> processedItems)
        {
            return certificationSynchronisationService.GetFinalStatusMessage(processedItems).Replace(Environment.NewLine, "<br>");
        }

        protected override string GetStatusMessage(CertificationSynchronisationResult item)
        {
            if (item.Operation.Equals(SynchronizationOperation.UiMessage))
            {
                return item.Message;
            }

            var sb = new StringBuilder();

            var ancestors = item.Hotel.Axes.GetAncestors();
            var country = ancestors.SingleOrDefault(i => i.TemplateID.Equals(Constants.TemplateIds.Country))?.Name;
            var region = ancestors.SingleOrDefault(i => i.TemplateID.Equals(Constants.TemplateIds.Region) || i.TemplateID.Equals(Constants.TemplateIds.RegionCity))?.Name;
            var resort = ancestors.SingleOrDefault(i => i.TemplateID.Equals(Constants.TemplateIds.Resort))?.Name;

            sb.Append($"{country}/{region}/{resort}/{item.Hotel.Name}<br>");
            switch (item.Operation)
            {
                case SynchronizationOperation.CertificateAdded:
                    sb.Append("certificate added");
                    break;
                case SynchronizationOperation.CertificateRemoved:
                    sb.Append("certificate removed");
                    break;
                case SynchronizationOperation.Error:
                    sb.Append(item.Message);
                    break;
                case SynchronizationOperation.Untouched:
                    sb.Append("has not been touched!");
                    break;
            }

            return sb.ToString();
        }
    }
}
