namespace easyJet.Holidays.Api.Domain.Data.MediaCenter
{
    /// <summary>
    /// Data model for TopicsFilter.
    /// </summary>
    public class TopicsFilter
    {
        /// <summary>
        /// Topic name, e.g. Environment
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Number of articles with topic, e.g. 3
        /// </summary>
        public int Count { get; set; }
    }
}
