using Amazon.SimpleNotificationService.Model;

namespace easyJet.Holidays.Api.Domain.Interfaces.SNS
{
    public interface ISnsService
    {
        /// <summary>
        /// Send message to topic
        /// </summary>
        /// <param name="message">message</param>
        /// <param name="subject">subject</param>
        /// <param name="messageGroupId">group id of the message, used for fifo queues only</param>
        /// <param name="messageAttributes">Message Attributes</param>
        /// <returns></returns>
        Task SendMessage(string message, string subject = null, string messageGroupId = null, Dictionary<string, MessageAttributeValue> messageAttributes = null);

    }
}
