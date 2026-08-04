namespace easyJet.Feature.MediaCenter.Models.Domain
{
    public class Article
    {
        public Article(string title, string url, string image, string shortDescription, string publicationDate, string[] topics)
        {
            Title = title;
            Url = url;
            Image = image;
            ShortDescription = shortDescription;
            PublicationDate = publicationDate;
            Topics = topics;
        }

        public string Title { get; set; }

        public string Url { get; set; }

        public string Image { get; set; }

        public string ShortDescription { get; set; }

        public string PublicationDate { get; set; }

        public string[] Topics { get; set; }
    }
}