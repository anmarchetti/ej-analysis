using System;

namespace easyJet.Foundation.Multisite.ContentSearch.Queries
{
    public class PublishableItemQueryArgs
    {
        public string RootPath { get; set; }

        public TimeSpan PublishableTimeRange { get; set; }
    }
}