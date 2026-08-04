using System;
using Amazon;
using Amazon.SQS;
using easyJet.Feature.ScrappingTrigger.Logging;
using easyJet.Feature.ScrappingTrigger.Settings;
using easyJet.Foundation.AmazonSecurityToken.Services;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Feature.ScrappingTrigger.Services
{
    [Service(typeof(IScrapingTriggerClientService), Lifetime = Lifetime.Transient)]
    public class ScrapingTriggerClientService : IScrapingTriggerClientService
    {
        private readonly ITemporaryCredentialsService temporaryCredentialsService;
        private readonly IScrappingTriggerLogger logger;
        private readonly ScrapingTriggerSettings settings;

        public ScrapingTriggerClientService(IScrapingTriggerSettingsService settingsService, ITemporaryCredentialsService temporaryCredentialsService, IScrappingTriggerLogger logger)
        {
            this.temporaryCredentialsService = temporaryCredentialsService;
            this.logger = logger;
            settings = settingsService.GetSettings();
        }

        public IAmazonSQS GetClient()
        {
            try
            {
                if (settings == null)
                {
                    logger.Warn($"{nameof(GetClient)} - {nameof(settings)} are null!", this);
                    return null;
                }

                if (!Arn.TryParse(settings.QueueArn, out var queueArn))
                {
                    logger.Warn($"{nameof(GetClient)} - {nameof(settings.QueueArn)} is not a valid ARN!", this);
                    return null;
                }

                var region = RegionEndpoint.GetBySystemName(queueArn.Region);
                var credentials = temporaryCredentialsService.GetCredentials(settings.ProfileArn, region, settings.SessionDuration, settings.SessionName);
                if (credentials == null)
                {
                    logger.Error($"{nameof(GetClient)} credentials are null", this);
                    return null;
                }

                var config = string.IsNullOrEmpty(settings.VpcEndpoint)
                    ? new AmazonSQSConfig { RegionEndpoint = region }
                    : new AmazonSQSConfig { ServiceURL = settings.VpcEndpoint };

                return new AmazonSQSClient(credentials, config);
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(GetClient)}", ex, this);
                return null;
            }
        }
    }
}