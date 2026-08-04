using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;
using easyJet.Holidays.Api.Domain.Interfaces.SNS;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.AWS.Services.SNS
{
    public class SnsService : ISnsService
    {
        private readonly AmazonSimpleNotificationServiceClient _snsClient;
        private readonly SnsSettings _snsSettings;
        private readonly ILogger<ISnsService> _logger;
        private readonly bool _serviceDisabled;

        public SnsService(SnsSettings snsSettings, ILogger<ISnsService> logger)
        {
            _snsSettings = snsSettings;
            _logger = logger;

            if (string.IsNullOrEmpty(snsSettings?.SnsServiceUrl) || string.IsNullOrEmpty(snsSettings?.AwsRegion))
            {
                _serviceDisabled = true;
                _logger.LogInformation("SNS Service disabled");
            }
            else
            {
                _snsClient = new AmazonSimpleNotificationServiceClient(new AmazonSimpleNotificationServiceConfig
                {
                    ServiceURL = snsSettings.SnsServiceUrl,
                    AuthenticationRegion = snsSettings.AwsRegion
                });

                _serviceDisabled = false;
            }
        }

        /// <summary>
        /// Send message to AWS SNS topic
        /// </summary>
        /// <param name="message">Message content</param>
        /// <param name="subject">Message subject</param>
        /// <param name="messageGroupId">Message group ID (FIFO topics only)</param>
        /// <param name="messageAttributes"></param>
        public async Task SendMessage(
            string message,
            string subject = null,
            string messageGroupId = null,
            Dictionary<string, MessageAttributeValue> messageAttributes = null)
        {
            if (_serviceDisabled) return;

            try
            {
                var request = new PublishRequest
                {
                    TopicArn          = _snsSettings.TopicArn,
                    Subject           = subject,
                    Message           = message,
                    MessageGroupId    = messageGroupId,
                    MessageAttributes = messageAttributes ?? new Dictionary<string, MessageAttributeValue>()
                };

                await _snsClient.PublishAsync(request);
            }
            catch (AmazonSimpleNotificationServiceException)
            {
                _logger.LogError("Failed to send message to aws sns");
                throw;
            }
        }
    }
}
