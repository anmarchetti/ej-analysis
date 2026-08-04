using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Pipelines;
using Sitecore.Security.Accounts;

namespace easyJet.Foundation.BeCause.Pipelines.PushHotelDataPipeline
{
    public class PushHotelDataProcessor
    {
        private readonly IBeCauseLogger logger;
        private readonly IDataPushService dataPushService;
        private readonly IUserCreationService userCreationService;

        public PushHotelDataProcessor(IBeCauseLogger logger, IDataPushService dataPushService, IUserCreationService userCreationService)
        {
            this.logger = logger;
            this.dataPushService = dataPushService;
            this.userCreationService = userCreationService;
        }

        public void Process(PipelineArgs args)
        {
            using (new UserSwitcher(userCreationService.GetOrCreateNonAnonymousUser(GetType().Name)))
            {
                logger.Debug($"{nameof(PushHotelDataProcessor)} starting hotel data push for BeCause", this);
                var (isFaulted, message) = dataPushService.PushHotelData();
                if (isFaulted)
                {
                    logger.Warn($"{nameof(PushHotelDataProcessor)} executed with errors: message:{message}", this);
                }
                else
                {
                    logger.Info($"{nameof(PushHotelDataProcessor)} executed without errors", this);
                }
            }
        }
    }
}
