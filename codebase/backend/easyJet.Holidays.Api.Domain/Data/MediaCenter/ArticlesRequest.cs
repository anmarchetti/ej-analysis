namespace easyJet.Holidays.Api.Domain.Data.MediaCenter
{
    /// <summary>
    /// Class representing articles request model.
    /// </summary>
    public class ArticlesRequest
    {
        /// <summary>
        /// number of articles to take, e.g. 2
        /// </summary>
        public int Take { get; set; }

        /// <summary>
        /// page number, e.g. 2
        /// </summary>
        public int Page { get; set; }

        /// <summary>
        /// offset number, e.g. -1, 0, 2
        /// </summary>
        public int Offset { get; set; }

        /// <summary>
        /// start date of range to take article by publication date from within range, e.g. 10/10/2000
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// end date of range to take article by publication date from within range, e.g. 10/10/2000
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// query parameter
        /// </summary>
        public string Query { get; set; }

        /// <summary>
        /// topics to search articles by, e.g. ["Environment", "Nature"]
        /// </summary>
        public string[] Topics { get; set; }
    }
}


