using System;
using System.Collections.Generic;

namespace easyJet.Feature.MediaCenter.Models.Requests
{
    public class ArticlesByTopicsRequest
    {
        public int Take { get; set; }

        public int Page { get; set; }

        public int Offset { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public string Query { get; set; }

        public IEnumerable<string> Topics { get; set; }
    }
}