using System;
using System.Collections.Generic;

namespace easyJet.Feature.MediaCenter.ContentSearch.Queries
{
    public class ArticlesQueryArgs
    {
        public ArticlesQueryArgs(int take, int page, int offset, DateTime startDate, DateTime endDate, string query, IEnumerable<string> topics)
        {
            Take = take;
            Page = page;
            Offset = offset;
            StartDate = startDate;
            EndDate = endDate;
            Query = query;
            Topics = topics;
        }

        private DateTime endDate;

        public int Take { get; set; }

        public int Page { get; set; }

        public int Offset { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate
        {
            get
            {
                return endDate;
            }

            set
            {
                endDate = value == DateTime.MinValue ? DateTime.MaxValue : value;
            }
        }

        public string Query { get; set; }

        public IEnumerable<string> Topics { get; set; }
    }
}