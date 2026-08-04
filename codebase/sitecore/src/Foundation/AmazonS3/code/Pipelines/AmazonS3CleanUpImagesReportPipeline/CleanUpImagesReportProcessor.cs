using System;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Sitecore.Security.Accounts;

namespace easyJet.Foundation.AmazonS3.Pipelines.AmazonS3CleanUpImagesReportPipeline
{
    public class CleanUpImagesReportProcessor
    {
        private readonly IAmazonS3Logger logger;
        private readonly IUserCreationService userCreationService;

        /// <summary>
        /// Initializes a new instance of the <see cref="CleanUpImagesReportProcessor"/> class.
        /// Constructor is used to set logger.
        /// </summary>
        /// <param name="logger">Logger is used to create logs.</param>
        public CleanUpImagesReportProcessor(IAmazonS3Logger logger, IUserCreationService userCreationService)
        {
            this.logger = logger;
            this.userCreationService = userCreationService;
        }

        /// <summary>
        /// Delete images report children items which data creation exceeds AmazonS3.ImageReportLifeSpanInDays.
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
                    var imageReportLifeSpanInDays = Settings.GetIntSetting("AmazonS3.ImageReportLifeSpanInDays", 30);

                    logger.Info("Image Report cleanup was started.", this);

                    foreach (Item itemChild in args.ProcessorItem.InnerItem.GetChildren())
                    {
                        if ((DateTime.Now - itemChild.Created).Days < imageReportLifeSpanInDays)
                        {
                            continue;
                        }

                        itemChild.Recycle();
                        logger.Debug($"{itemChild.Name} is deleted.", this);
                    }

                    logger.Info("Image Report cleanup was finished.", this);
                }
            }
            catch (Exception e)
            {
                logger.Error(nameof(CleanUpImagesReportProcessor), e, this);
                args.AbortPipeline();
            }
        }
    }
}