using System.Collections.Generic;

namespace easyJet.Feature.MediaCenter.Services
{
    public interface ITopicsService
    {
        /// <summary>
        /// Get all avaliable topics from topics data folder.
        /// </summary>
        /// <returns>Topics.</returns>
        IEnumerable<string> GetTopics();
    }
}
