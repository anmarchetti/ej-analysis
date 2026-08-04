namespace easyJet.Holidays.Api.Domain.Data.MediaCenter
{
    /// <summary>
    /// Class representing articles response model.
    /// </summary>
    public class ArticlesResponse
    {
        /// <summary>
        /// number of founded articles, e.g. 2
        /// </summary>
        public int Total { get; set; }

        /// <summary>
        /// founded articles data, e.g. [{"url": "", "image": ""},...]
        /// </summary>
        public Article[] Articles { get; set; }

        /// <summary>
        /// founded topics data, e.g. [{"name": "", "count": ""},...]
        /// </summary>
        public TopicsFilter[] TopicsFilter { get; set; }
    }
}
