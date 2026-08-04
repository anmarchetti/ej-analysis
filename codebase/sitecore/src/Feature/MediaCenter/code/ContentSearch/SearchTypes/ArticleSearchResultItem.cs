using System;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch;

namespace easyJet.Feature.MediaCenter.ContentSearch.SearchTypes
{
    public class ArticleSearchResultItem : BaseSearchResultItem
    {
        [IndexField("title")]
        public string Title { get; set; }

        [IndexField("topcontent")]
        public string TopContent { get; set; }

        [IndexField("bottomcontent")]
        public string BottomContent { get; set; }

        [IndexField("image_url")]
        public string Image { get; set; }

        [IndexField("shortdescription")]
        public string ShortDescription { get; set; }

        [IndexField("article_url")]
        public string ArticleUrl { get; set; }

        [IndexField("publicationdate")]
        public DateTime PublicationDate { get; set; }

        [IndexField("topics")]
        public string[] Topics { get; set; }

        [IndexField("istoparticle")]
        public bool IsTopArticle { get; set; }
    }
}