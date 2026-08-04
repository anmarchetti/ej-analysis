using System;
using System.Collections.Generic;
using System.Linq;
using Amazon.SQS.Model;
using easyJet.Feature.ScrappingTrigger.Logging;
using easyJet.Feature.ScrappingTrigger.Settings;
using easyJet.Foundation.AmazonSqs.Logging;
using easyJet.Foundation.AmazonSqs.Services;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Feature.ScrappingTrigger.Services
{
    [Service(typeof(IScrapingTriggerService), Lifetime = Lifetime.Transient)]
    public class ScrapingTriggerService : IScrapingTriggerService
    {
        private readonly IAmazonSqsService amazonSqsService;
        private readonly IAmazonSqsLogger amazonSqsLogger;
        private readonly bool overrideSqsService;
        private readonly IScrappingTriggerLogger logger;
        private readonly IScrapingTriggerClientService clientService;
        private readonly ScrapingTriggerSettings settings;

        public ScrapingTriggerService(
            IScrappingTriggerLogger logger,
            IScrapingTriggerSettingsService settingsService,
            IScrapingTriggerClientService clientService,
            IAmazonSqsService amazonSqsService,
            IAmazonSqsLogger amazonSqsLogger,
            bool overrideSqsService = true)
        {
            this.logger = logger;
            this.clientService = clientService;
            this.amazonSqsService = amazonSqsService;
            this.amazonSqsLogger = amazonSqsLogger;
            this.overrideSqsService = overrideSqsService;
            settings = settingsService.GetSettings();
        }

        public SendMessageBatchResponse EnQueue(Dictionary<Guid, string> messages)
        {
            try
            {
                var client = clientService.GetClient();
                if (client == null)
                {
                    logger.Error($"{nameof(EnQueue)} > {nameof(client)} is null.", this);
                    return null;
                }

                if (messages == null || !messages.Any())
                {
                    return null;
                }

                var sqsService = overrideSqsService
                    ? new AmazonSqsService(client, amazonSqsLogger)
                    : amazonSqsService;

                var queueUrl = sqsService.GetQueueUrl(settings.QueueArn);
                if (string.IsNullOrEmpty(queueUrl))
                {
                    logger.Error($"{nameof(EnQueue)} > {nameof(queueUrl)} is null or empty.", this);
                    return null;
                }

                var request = new SendMessageBatchRequest
                {
                    QueueUrl = queueUrl,
                    Entries = messages.Select(message => new SendMessageBatchRequestEntry { MessageBody = message.Value, Id = message.Key.ToString("N") }).ToList()
                };

                return sqsService.SendMessageBatch(request);
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(EnQueue)}", ex, this);
                return null;
            }
        }
    }
}
