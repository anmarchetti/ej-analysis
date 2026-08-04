using System.Runtime.CompilerServices;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Logger;
using EasyJet.Foundation.SitecoreExtensions.Publishing;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.Security.Accounts;

[assembly: InternalsVisibleTo("easyJet.Foundation.TripAdvisor.Tests")]
[assembly: InternalsVisibleTo("easyJet.Foundation.HotelBeds.Tests")]

namespace easyJet.Foundation.Destinations.Pipelines.Synchronize
{
    /// <summary>
    /// Represents base functionality for Sync Processors.
    /// </summary>
    public abstract class BaseSyncProcessor
    {
        protected virtual bool SmartPublish => false;

        private readonly ILogger logger;
        private readonly IUserCreationService userCreationService;

        protected BaseSyncProcessor(ILogger logger, IUserCreationService userCreationService)
        {
            this.logger = logger;
            this.userCreationService = userCreationService;
        }

        /// <summary>
        /// Called on Pipeline execution.
        /// Executes ProcessSync method for derived class and provides common functionality.
        /// </summary>
        /// <param name="args">Destination Pipeline Arguments.</param>
        public void Process(DestinationPipelineArgs args)
        {
            try
            {
                if (!Settings.GetBoolSetting("Destinations.IsAutoSyncEnabled", false))
                {
                    logger.Warn("AutoSync is disabled", this);
                    return;
                }

                using (new UserSwitcher(userCreationService.GetOrCreateNonAnonymousUser(GetType().Name)))
                {
                    ProcessSync(args);

                    if (IsAutoPublishEnabled())
                    {
                        if (args.Parent != null)
                        {
                            logger.Debug($"Start publishing {args.Parent.Name} ({args.Parent.ID}) with subitems", this);
                            PublishingManager.PublishItem(args.Parent, smart: SmartPublish, languages: new[] { args.Parent.Language });
                            logger.Debug($"{args.Parent.Name} ({args.Parent.ID}) with subitems was published", this);
                        }

                        if (args.Items != null)
                        {
                            foreach (var item in args.Items)
                            {
                                logger.Debug($"Start publishing {item.Name} ({item.ID})", this);
                                PublishingManager.PublishItem(item);
                                logger.Debug($"{item.Name} ({item.ID}) was published", this);
                            }
                        }
                    }
                    else
                    {
                        logger.Warn("AutoPublish is disabled", this);
                    }
                }
            }
            catch (System.Exception exc)
            {
                logger.Error(exc.Message, exc, this);
            }
        }

        /// <summary>
        /// Execute Processor functionality.
        /// </summary>
        /// <param name="args">Destination Pipeline Arguments.</param>
        protected internal abstract void ProcessSync(DestinationPipelineArgs args);

        /// <summary>
        /// Is auto publish enabled.
        /// </summary>
        /// <returns><see langword="True"/> auto publish is enabled.</returns>
        protected virtual bool IsAutoPublishEnabled()
        {
            return Settings.GetBoolSetting("Destinations.AutoPublishEnabled", false);
        }
    }
}