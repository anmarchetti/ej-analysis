using System.Collections.Generic;
using easyJet.Feature.MediaCenter.Models.Domain;

namespace easyJet.Feature.MediaCenter.Models.Responses
{
    public class ArticlesResponse
    {
        public ArticlesResponse(int total, IEnumerable<Article> articles, IEnumerable<Topic> topics)
        {
            Total = total;
            Articles = articles;
            TopicsFilter = topics;
        }

        public int Total { get; set; }

        public IEnumerable<Article> Articles { get; set; }

        public IEnumerable<Topic> TopicsFilter { get; set; }
    }
}