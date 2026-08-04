namespace easyJet.Holidays.Api.Domain.Data.MediaCenter
{
    /// <summary>
    /// Data model for Article.
    /// </summary>
    public class Article
    {
        /// <summary>
        /// article title, e.g. Ecological cars
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// aricle url, e.g. /sitecore/content/easyjet/holidays/home/media-center/content-hub/ecological cars
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// image url, e.g. /-/media/3c779e7b0a154999acfb57dd314c6788.ashx"
        /// </summary>
        public string Image { get; set; }

        /// <summary>
        /// article short description, e.g. article about ecological cars
        /// </summary>
        public string ShortDescription { get; set; }

        /// <summary>
        /// article publication date, e.g. 2020-03-08
        /// </summary>
        public string PublicationDate { get; set; }

        /// <summary>
        /// article topics, e.g. ["Environment",...]
        /// </summary>
        public string[] Topics { get; set; }
    }
}
