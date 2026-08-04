namespace easyJet.Holidays.Api.Domain.Interfaces.Notification
{
    public interface INotificationRepository
    {
        /// <summary>
        /// Send notification to specified topic
        /// </summary>
        /// <param name="topic"></param>
        /// <param name="message"></param>
        /// <returns></returns>
        Task<string> Send(string topic, string subject, string message);
    }
}
