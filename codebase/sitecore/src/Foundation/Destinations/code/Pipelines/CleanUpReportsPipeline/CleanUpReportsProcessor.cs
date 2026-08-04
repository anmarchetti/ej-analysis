using System;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Security.Accounts;

namespace easyJet.Foundation.Destinations.Pipelines.CleanUpReportsPipeline
{
    public class CleanUpReportsProcessor
    {
        private readonly IDestinationsLogger logger;
        private readonly IUserCreationService userCreationService;

        /// <summary>
        /// Initializes a new instance of the <see cref="CleanUpReportsProcessor"/> class.
        /// Constructor is used to set logger.
        /// </summary>
        /// <param name="logger">Logger is used to create logs.</param>
        /// <param name="userCreationService">service used to get user</param>
        public CleanUpReportsProcessor(IDestinationsLogger logger, IUserCreationService userCreationService)
        {
            this.logger = logger;
            this.userCreationService = userCreationService;
        }

        /// <summary>
        /// Delete reports children items which data creation exceeds Destinations.ReportLifeSpanInDays.
        /// </summary>
        /// <param name="args">Arguments that contain item which children to delete.</param>
        public void Process(PipelineArgs args)
        {
            if (args.ProcessorItem == null)
            {
                return;
            }

            try
            {
                using (new UserSwitcher(userCreationService.GetOrCreateNonAnonymousUser(GetType().Name)))
                {
                    var reportLifeSpanInDays = Settings.GetIntSetting("Destinations.ReportLifeSpanInDays", 30);

                    logger.Info($"{args.ProcessorItem.Name} Report cleanup was started.", this);

                    foreach (Item itemChild in args.ProcessorItem.InnerItem.GetChildren())
                    {
                        if ((DateTime.Now - itemChild.Created).Days < reportLifeSpanInDays)
                        {
                            continue;
                        }

                        itemChild.Recycle();
                        logger.Debug($"{itemChild.Name} is deleted.", this);
                    }

                    logger.Info($"{args.ProcessorItem.Name} Report cleanup was finished.", this);
                }
            }
            catch (Exception e)
            {
                logger.Error(nameof(CleanUpReportsProcessor), e, this);
                args.AbortPipeline();
            }
        }
    }
}