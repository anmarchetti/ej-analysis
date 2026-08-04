using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Models;
using easyJet.Foundation.BeCause.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Pipelines;
using Sitecore.Security.Accounts;

namespace easyJet.Foundation.BeCause.Pipelines.SyncEcoCertificatesPipeline
{
    public class SyncEcoCertificatesProcessor
    {
        private readonly IBeCauseLogger logger;
        private readonly ICertificationSynchronisationService certificationSynchronisationService;
        private readonly ISettingsService settingsService;
        private readonly IUserCreationService userCreationService;

        public SyncEcoCertificatesProcessor(
            IBeCauseLogger logger,
            ICertificationSynchronisationService certificationSynchronisationService,
            ISettingsService settingsService,
            IUserCreationService userCreationService)
        {
            this.logger = logger;
            this.certificationSynchronisationService = certificationSynchronisationService;
            this.settingsService = settingsService;
            this.userCreationService = userCreationService;
        }

        public void Process(PipelineArgs args)
        {
            var settings = settingsService.GetSettings();
            if (settings == null || !settings.IsEnabled)
            {
                logger.Warn($"{nameof(SyncEcoCertificatesProcessor)} - BeCause feature is disabled", this);
                return;
            }

            using (new UserSwitcher(userCreationService.GetOrCreateNonAnonymousUser(GetType().Name)))
            {
                var result = certificationSynchronisationService.Synchronize(string.Empty);
                var processedItems = result?.ToList() ?? new List<CertificationSynchronisationResult>();
                logger.Info($"{nameof(SyncEcoCertificatesProcessor)} - certification synchronisation completed", this);

                if (processedItems.Count > 0)
                {
                    var message = certificationSynchronisationService.GetFinalStatusMessage(processedItems);
                    logger.Info(message, this);
                }
            }
        }
    }
}
