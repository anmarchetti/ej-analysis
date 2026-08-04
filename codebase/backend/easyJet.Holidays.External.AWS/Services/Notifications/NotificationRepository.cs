using Amazon.SimpleNotificationService.Model;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Notification;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.AWS.Services.Notifications
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly AwsClient _awsClient;
        private readonly ILogger<NotificationRepository> _logger;

        public NotificationRepository(AwsClient awsClient, ILogger<NotificationRepository> logger)
        {
            _awsClient = awsClient;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<string> Send(string topic, string subject, string message)
        {
            try
            {
                var request = new PublishRequest(topic, message, subject);
                using (var snsClient = _awsClient.GetSNSClient())
                {
                    var result = await snsClient.PublishAsync(request);
                    return result.MessageId;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot publish price promise item");
                throw new ApiException(ApiExceptionCodes.PricePromiseCantSendNotification, null, ex);
            }
        }
    }
}
