using System;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.XConnect.Common.Facets.Email
{
    [Serializable]
    public class Email
    {
        [PIISensitive]
        public string Id { get; set; }

        [PIISensitive]
        public string Body { get; set; }

        public string SentDate { get; set; }

        public string Subject { get; set; }
    }
}